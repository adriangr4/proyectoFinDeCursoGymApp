from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from google.cloud import firestore
import uuid

from app.db.session import get_db
from app.services.diet import diet as diet_crud
from app.services.routine import routine as routine_crud
from app.api import deps
from app.schemas.diet_social import Post as PostSchema, PostCreate, Rating as RatingSchema, RatingCreate
from datetime import datetime
import pytz

router = APIRouter()

# --- POSTS (FEED) ---
@router.get("/feed", response_model=List[PostSchema])
def get_social_feed(
    db: firestore.Client = Depends(get_db),
    skip: int = 0,
    limit: int = 50,
    current_user: Any = Depends(deps.get_current_active_user)
):
    try:
        posts_ref = db.collection("posts")
        docs = posts_ref.order_by("created_at", direction=firestore.Query.DESCENDING).limit(limit).stream()
        
        results = []
        for doc in docs:
            data = doc.to_dict()
            results.append(PostSchema(id=doc.id, **data))
            
        return results
    except Exception as e:
        print(f"WARN: Failed to fetch social feed. Error: {e}")
        # Fallback to unsorted if index is missing
        try:
            posts_ref = db.collection("posts")
            docs = posts_ref.limit(limit).stream()
            results = []
            for doc in docs:
                data = doc.to_dict()
                results.append(PostSchema(id=doc.id, **data))
            # Sort manually
            results.sort(key=lambda x: x.created_at, reverse=True)
            return results
        except Exception as fallback_e:
            raise HTTPException(status_code=500, detail=f"Feed error: {fallback_e}")

@router.post("/share", response_model=PostSchema)
def share_content(
    *,
    db: firestore.Client = Depends(get_db),
    post_in: PostCreate,
    current_user: Any = Depends(deps.get_current_active_user),
):
    """Shares a user's routine or diet to the community feed."""
    
    # Verify ownership of the content before sharing
    content_id = post_in.content_id
    if post_in.content_type == "routine":
        content = routine_crud.get(db=db, id=content_id)
        if not content or content.creator_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not authorized to share this routine")
    elif post_in.content_type == "diet":
        content = diet_crud.get(db=db, id=content_id)
        if not content or (hasattr(content, 'user_id') and content.user_id != current_user.id) and (hasattr(content, 'creator_id') and content.creator_id != current_user.id):
             raise HTTPException(status_code=403, detail="Not authorized to share this diet")
    else:
        raise HTTPException(status_code=400, detail="Invalid content type")

    data = post_in.model_dump()
    data['created_at'] = datetime.now(pytz.utc)
    
    # Store in posts collection
    doc_ref = db.collection("posts").document()
    doc_ref.set(data)
    
    return PostSchema(id=doc_ref.id, **data)

@router.post("/posts/{post_id}/like")
def toggle_like(
    post_id: str,
    db: firestore.Client = Depends(get_db),
    current_user: Any = Depends(deps.get_current_active_user),
):
    post_ref = db.collection("posts").document(post_id)
    doc = post_ref.get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Post not found")
        
    data = doc.to_dict()
    likes = data.get("likes", [])
    
    if current_user.id in likes:
        likes.remove(current_user.id)
    else:
        likes.append(current_user.id)
        
    post_ref.update({"likes": likes})
    return {"success": True, "likes": likes}

@router.post("/posts/{post_id}/rate")
def rate_post(
    post_id: str,
    rating_in: RatingCreate,
    db: firestore.Client = Depends(get_db),
    current_user: Any = Depends(deps.get_current_active_user),
):
    post_ref = db.collection("posts").document(post_id)
    doc = post_ref.get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Post not found")
        
    # Strictly for MVP: Simple increment. A robust system would track individual user ratings to prevent multi-voting.
    data = doc.to_dict()
    new_sum = data.get("rating_sum", 0) + rating_in.score
    new_count = data.get("rating_count", 0) + 1
    
    post_ref.update({
        "rating_sum": new_sum,
        "rating_count": new_count
    })
    
    # Also save the individual rating record
    rating_data = rating_in.model_dump()
    rating_data['rater_id'] = current_user.id
    rating_data['created_at'] = datetime.now(pytz.utc)
    db.collection("content_ratings").add(rating_data)
    
    return {"success": True, "rating_sum": new_sum, "rating_count": new_count}

@router.post("/import")
def import_content(
    content_type: str,
    content_id: str,
    db: firestore.Client = Depends(get_db),
    current_user: Any = Depends(deps.get_current_active_user),
):
    """Clones a routine or diet (and nested items) to the current user's library."""
    try:
        if content_type == "routine":
            # 1. Fetch original routine
            original = routine_crud.get(db=db, id=content_id)
            if not original:
                raise HTTPException(status_code=404, detail="Original routine not found")
                
            # 2. Duplicate routine body
            clone_data = original.model_dump() if hasattr(original, 'model_dump') else dict(original)
            if "id" in clone_data: del clone_data["id"]
            clone_data["name"] = f"{clone_data.get('name', 'Routine')} (Imported)"
            clone_data["creator_id"] = current_user.id
            clone_data["is_public"] = False
            clone_data["created_at"] = datetime.now(pytz.utc)
            
            new_routine = routine_crud.create(db=db, obj_in=clone_data)
            
            # 3. Duplicate nested exercises
            exercises_ref = db.collection("routines").document(content_id).collection("routine_exercises")
            exercises = exercises_ref.stream()
            
            new_batch = db.batch()
            new_r_ref = db.collection("routines").document(new_routine.id)
            
            count = 0
            for ex in exercises:
                ex_data = ex.to_dict()
                new_ex_ref = new_r_ref.collection("routine_exercises").document()
                new_batch.set(new_ex_ref, ex_data)
                count += 1
                
            if count > 0:
                new_batch.commit()
                
            return {"success": True, "new_id": new_routine.id, "type": "routine"}
            
        elif content_type == "diet":
             # 1. Fetch original diet
            original = diet_crud.get(db=db, id=content_id)
            if not original:
                raise HTTPException(status_code=404, detail="Original diet not found")
                
            # 2. Duplicate diet body
            clone_data = original.model_dump() if hasattr(original, 'model_dump') else dict(original)
            if "id" in clone_data: del clone_data["id"]
            clone_data["name"] = f"{clone_data.get('name', 'Diet')} (Imported)"
            clone_data["user_id"] = current_user.id # Diets use user_id currently
            clone_data["creator_id"] = current_user.id
            clone_data["is_public"] = False
            clone_data["created_at"] = datetime.now(pytz.utc)
            
            new_diet = diet_crud.create(db=db, obj_in=clone_data)
            return {"success": True, "new_id": new_diet.id, "type": "diet"}
            
        else:
             raise HTTPException(status_code=400, detail="Invalid content type")
             
    except Exception as e:
        print(f"Error during import: {e}")
        raise HTTPException(status_code=500, detail="Failed to import content")
