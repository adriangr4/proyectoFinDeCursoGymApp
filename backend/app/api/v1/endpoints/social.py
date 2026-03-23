from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from fastapi.encoders import jsonable_encoder
from google.cloud import firestore
import uuid

from app.db.session import get_db
from app.services.diet import diet as diet_crud
from app.services.routine import routine as routine_crud
from app.api import deps
from app.schemas.diet_social import Post as PostSchema, PostCreate, Rating as RatingSchema, RatingCreate, Comment, CommentCreate
from app.schemas.user import PublicUserProfile
from datetime import datetime
import pytz

router = APIRouter()

# ─────────────────────────────────────────
# FEED
# ─────────────────────────────────────────

@router.get("/feed", response_model=List[PostSchema])
def get_social_feed(
    db: firestore.Client = Depends(get_db),
    skip: int = 0,
    limit: int = 50,
    filter: str = 'global',
    current_user: Any = Depends(deps.get_current_active_user)
):
    try:
        posts_ref = db.collection("posts")
        target_creator_ids = None
        if filter == 'friends':
            user_id = current_user.id
            follows_a = db.collection("follows").where(filter=firestore.FieldFilter("follower_id", "==", user_id)).stream()
            following_ids = {d.to_dict().get("following_id") for d in follows_a}
            
            follows_b = db.collection("follows").where(filter=firestore.FieldFilter("following_id", "==", user_id)).stream()
            follower_ids = {d.to_dict().get("follower_id") for d in follows_b}
            
            mutuals = following_ids.intersection(follower_ids)
            target_creator_ids = list(mutuals)
            
            if not target_creator_ids:
                return []

        docs = posts_ref.order_by("created_at", direction=firestore.Query.DESCENDING).limit(limit * 3).stream()  # fetch more to filter in memory
        results = []
        for doc in docs:
            data = doc.to_dict()
            if target_creator_ids is not None:
                if data.get("creator_id") not in target_creator_ids:
                    continue
            results.append(PostSchema(id=doc.id, **data))
            if len(results) >= limit:
                break
        return results
    except Exception as e:
        print(f"WARN: Failed to fetch social feed. Error: {e}")
        try:
            posts_ref = db.collection("posts")
            docs = posts_ref.limit(limit * 3).stream()
            results = []
            for doc in docs:
                data = doc.to_dict()
                if target_creator_ids is not None and data.get("creator_id") not in target_creator_ids:
                    continue
                results.append(PostSchema(id=doc.id, **data))
                if len(results) >= limit: break
            results.sort(key=lambda x: x.created_at, reverse=True)
            return results
        except Exception as fallback_e:
            raise HTTPException(status_code=500, detail=f"Feed error: {fallback_e}")


# ─────────────────────────────────────────
# SHARE
# ─────────────────────────────────────────

@router.post("/share", response_model=PostSchema)
def share_content(
    *,
    db: firestore.Client = Depends(get_db),
    post_in: PostCreate,
    current_user: Any = Depends(deps.get_current_active_user),
):
    """Shares a user's routine or diet to the community feed."""
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
    data['comment_count'] = 0

    doc_ref = db.collection("posts").document()
    doc_ref.set(data)

    return PostSchema(id=doc_ref.id, **data)


# ─────────────────────────────────────────
# LIKES
# ─────────────────────────────────────────

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
        # Notify
        creator_id = data.get("creator_id")
        if creator_id and creator_id != current_user.id:
            db.collection("notifications").add({
                "user_id": creator_id,
                "actor_id": current_user.id,
                "actor_name": current_user.username,
                "actor_avatar": getattr(current_user, 'profile_picture', None),
                "type": "like",
                "content_id": post_id,
                "message": f"{current_user.username} le ha dado like a tu publicación.",
                "read": False,
                "created_at": datetime.now(pytz.utc)
            })

    post_ref.update({"likes": likes})
    return {"success": True, "likes": likes}


# ─────────────────────────────────────────
# RATINGS
# ─────────────────────────────────────────

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

    data = doc.to_dict()

    # Check if user already rated this post (prevent double-voting)
    existing_rating = db.collection("content_ratings")\
        .where(filter=firestore.FieldFilter("rater_id", "==", current_user.id))\
        .where(filter=firestore.FieldFilter("post_id", "==", post_id))\
        .limit(1)\
        .stream()
    if any(True for _ in existing_rating):
        raise HTTPException(status_code=409, detail="already_rated")

    new_sum = data.get("rating_sum", 0) + rating_in.score
    new_count = data.get("rating_count", 0) + 1

    post_ref.update({
        "rating_sum": new_sum,
        "rating_count": new_count
    })

    # Save individual rating record (includes post_id for lookup)
    rating_data = rating_in.model_dump()
    rating_data['rater_id'] = current_user.id
    rating_data['post_id'] = post_id
    rating_data['created_at'] = datetime.now(pytz.utc)
    db.collection("content_ratings").add(rating_data)

    # Update creator's aggregate rating stats
    creator_id = data.get("creator_id")
    content_type = data.get("content_type")
    if creator_id and content_type in ("routine", "diet"):
        user_ref = db.collection("users").document(creator_id)
        sum_field = f"{content_type}_rating_sum"
        count_field = f"{content_type}_rating_count"
        user_doc = user_ref.get()
        if user_doc.exists:
            user_data = user_doc.to_dict()
            user_ref.update({
                sum_field: user_data.get(sum_field, 0) + rating_in.score,
                count_field: user_data.get(count_field, 0) + 1
            })

    return {"success": True, "rating_sum": new_sum, "rating_count": new_count}


# ─────────────────────────────────────────
# IMPORT (rating-gated)
# ─────────────────────────────────────────

@router.post("/import")
def import_content(
    post_id: str,
    content_type: str,
    content_id: str,
    db: firestore.Client = Depends(get_db),
    current_user: Any = Depends(deps.get_current_active_user),
):
    """Clones a routine or diet to the current user's library.
    Requires the user to have rated the post first.
    """
    # ── Rating gate ──
    existing = db.collection("content_ratings")\
        .where(filter=firestore.FieldFilter("rater_id", "==", current_user.id))\
        .where(filter=firestore.FieldFilter("post_id", "==", post_id))\
        .limit(1)\
        .stream()
    if not any(True for _ in existing):
        raise HTTPException(status_code=403, detail="rating_required")

    try:
        if content_type == "routine":
            print(f"INFO: Starting routine import for content_id={content_id} by user={current_user.id}")
            original = routine_crud.get(db=db, id=content_id)
            if not original:
                print(f"ERROR: Routine {content_id} not found in DB")
                raise HTTPException(status_code=404, detail="Original routine not found")

            # Use jsonable_encoder to ensure proper serialization (avoids datetime/Pydantic issues)
            clone_data = jsonable_encoder(original)
            
            # Strip fields that should not be copied
            for field in ["id", "exercises", "average_rating", "rating_count"]:
                clone_data.pop(field, None)
            
            clone_data["name"] = f"{clone_data.get('name', 'Routine')} (Importada)"
            clone_data["creator_id"] = current_user.id
            clone_data["is_public"] = False
            clone_data["created_at"] = datetime.now(pytz.utc).isoformat()
            clone_data["average_rating"] = 0.0
            clone_data["rating_count"] = 0

            print(f"INFO: Creating cloned routine with data keys: {list(clone_data.keys())}")
            new_routine = routine_crud.create(db=db, obj_in=clone_data)
            print(f"INFO: New routine created with id={new_routine.id}")

            # Exercises are stored in the ROOT 'routine_exercises' collection
            exercises_stream = db.collection("routine_exercises").where(
                filter=firestore.FieldFilter("routine_id", "==", content_id)
            ).stream()

            new_batch = db.batch()
            new_r_exercises_ref = db.collection("routine_exercises")

            count = 0
            for ex in exercises_stream:
                ex_data = ex.to_dict()
                ex_data["routine_id"] = new_routine.id
                new_ex_ref = new_r_exercises_ref.document()
                new_batch.set(new_ex_ref, ex_data)
                count += 1

            if count > 0:
                new_batch.commit()
            print(f"INFO: Imported routine '{new_routine.id}' with {count} exercises")

            creator_id = original.creator_id
            if creator_id and creator_id != current_user.id:
                db.collection("notifications").add({
                    "user_id": creator_id,
                    "actor_id": current_user.id,
                    "actor_name": current_user.username,
                    "actor_avatar": getattr(current_user, 'profile_picture', None),
                    "type": "import",
                    "content_id": new_routine.id,
                    "message": f"{current_user.username} ha importado tu rutina.",
                    "read": False,
                    "created_at": datetime.now(pytz.utc)
                })

            return {"success": True, "new_id": new_routine.id, "type": "routine", "exercise_count": count}

        elif content_type == "diet":
            original = diet_crud.get(db=db, id=content_id)
            if not original:
                raise HTTPException(status_code=404, detail="Original diet not found")

            clone_data = original.model_dump() if hasattr(original, 'model_dump') else dict(original)
            if "id" in clone_data: del clone_data["id"]
            clone_data["name"] = f"{clone_data.get('name', 'Diet')} (Importada)"
            clone_data["user_id"] = current_user.id
            clone_data["creator_id"] = current_user.id
            clone_data["is_public"] = False
            clone_data["created_at"] = datetime.now(pytz.utc)

            new_diet = diet_crud.create(db=db, obj_in=clone_data)

            creator_id = getattr(original, 'creator_id', getattr(original, 'user_id', None))
            if creator_id and creator_id != current_user.id:
                db.collection("notifications").add({
                    "user_id": creator_id,
                    "actor_id": current_user.id,
                    "actor_name": current_user.username,
                    "actor_avatar": getattr(current_user, 'profile_picture', None),
                    "type": "import",
                    "content_id": new_diet.id,
                    "message": f"{current_user.username} ha importado tu dieta.",
                    "read": False,
                    "created_at": datetime.now(pytz.utc)
                })

            return {"success": True, "new_id": new_diet.id, "type": "diet"}

        else:
            raise HTTPException(status_code=400, detail="Invalid content type")

    except HTTPException:
        raise
    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"ERROR during import: {type(e).__name__}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to import content: {type(e).__name__}: {str(e)}")


# ─────────────────────────────────────────
# PREVIEW (content details before import)
# ─────────────────────────────────────────

@router.get("/preview/{content_type}/{content_id}")
def preview_content(
    content_type: str,
    content_id: str,
    db: firestore.Client = Depends(get_db),
    current_user: Any = Depends(deps.get_current_active_user),
):
    """Returns detailed content (exercises/meals) so user can preview before importing."""
    if content_type == "routine":
        routine_doc = db.collection("routines").document(content_id).get()
        if not routine_doc.exists:
            raise HTTPException(status_code=404, detail="Routine not found")
        routine_data = routine_doc.to_dict()
        routine_data["id"] = content_id

        # Fetch exercises from root collection
        exs_stream = db.collection("routine_exercises").where(
            filter=firestore.FieldFilter("routine_id", "==", content_id)
        ).stream()

        exercises = []
        for doc in exs_stream:
            ex_data = doc.to_dict()
            ex_data["id"] = doc.id
            # Enrich with exercise details
            if "exercise_id" in ex_data:
                ex_doc = db.collection("exercises").document(ex_data["exercise_id"]).get()
                if ex_doc.exists:
                    ex_data["exercise"] = {"id": ex_doc.id, **ex_doc.to_dict()}
            exercises.append(ex_data)

        routine_data["exercises"] = exercises
        return routine_data

    elif content_type == "diet":
        diet_doc = db.collection("diets").document(content_id).get()
        if not diet_doc.exists:
            raise HTTPException(status_code=404, detail="Diet not found")
        diet_data = diet_doc.to_dict()
        diet_data["id"] = content_id
        return diet_data

    else:
        raise HTTPException(status_code=400, detail="Invalid content type")


@router.get("/posts/{post_id}/comments", response_model=List[Comment])
def get_comments(
    post_id: str,
    db: firestore.Client = Depends(get_db),
    current_user: Any = Depends(deps.get_current_active_user),
):
    post_ref = db.collection("posts").document(post_id)
    if not post_ref.get().exists:
        raise HTTPException(status_code=404, detail="Post not found")

    docs = db.collection("posts").document(post_id).collection("comments")\
        .order_by("created_at", direction=firestore.Query.ASCENDING)\
        .stream()

    results = []
    for doc in docs:
        data = doc.to_dict()
        results.append(Comment(id=doc.id, **data))
    return results


@router.post("/posts/{post_id}/comments", response_model=Comment)
def add_comment(
    post_id: str,
    comment_in: CommentCreate,
    db: firestore.Client = Depends(get_db),
    current_user: Any = Depends(deps.get_current_active_user),
):
    post_ref = db.collection("posts").document(post_id)
    post_doc = post_ref.get()
    if not post_doc.exists:
        raise HTTPException(status_code=404, detail="Post not found")
    post_data = post_doc.to_dict()

    comment_data = {
        "post_id": post_id,
        "author_id": current_user.id,
        "author_name": current_user.username,
        "author_avatar": getattr(current_user, 'profile_picture', None),
        "text": comment_in.text,
        "created_at": datetime.now(pytz.utc),
    }

    doc_ref = db.collection("posts").document(post_id).collection("comments").document()
    doc_ref.set(comment_data)

    # Increment comment_count on the post
    post_ref.update({"comment_count": firestore.Increment(1)})

    creator_id = post_data.get("creator_id")
    if creator_id and creator_id != current_user.id:
        db.collection("notifications").add({
            "user_id": creator_id,
            "actor_id": current_user.id,
            "actor_name": current_user.username,
            "actor_avatar": getattr(current_user, 'profile_picture', None),
            "type": "comment",
            "content_id": post_id,
            "message": f"{current_user.username} ha comentado tu publicación.",
            "read": False,
            "created_at": datetime.now(pytz.utc)
        })

    return Comment(id=doc_ref.id, **comment_data)


# ─────────────────────────────────────────
# PUBLIC PROFILE & FOLLOW
# ─────────────────────────────────────────

@router.get("/users/{user_id}/public", response_model=PublicUserProfile)
def get_public_profile(
    user_id: str,
    db: firestore.Client = Depends(get_db),
    current_user: Any = Depends(deps.get_current_active_user),
):
    user_doc = db.collection("users").document(user_id).get()
    if not user_doc.exists:
        raise HTTPException(status_code=404, detail="User not found")

    user_data = user_doc.to_dict()

    # Calculate avg ratings from user fields
    r_sum = user_data.get("routine_rating_sum", 0)
    r_count = user_data.get("routine_rating_count", 0)
    d_sum = user_data.get("diet_rating_sum", 0)
    d_count = user_data.get("diet_rating_count", 0)

    routine_avg = round(r_sum / r_count, 2) if r_count > 0 else 0.0
    diet_avg = round(d_sum / d_count, 2) if d_count > 0 else 0.0

    # Count followers
    followers_docs = db.collection("follows")\
        .where(filter=firestore.FieldFilter("following_id", "==", user_id))\
        .stream()
    followers_count = sum(1 for _ in followers_docs)

    # Count following
    following_docs = db.collection("follows")\
        .where(filter=firestore.FieldFilter("follower_id", "==", user_id))\
        .stream()
    following_count = sum(1 for _ in following_docs)

    # Is current user following this user?
    is_following_docs = db.collection("follows")\
        .where(filter=firestore.FieldFilter("follower_id", "==", current_user.id))\
        .where(filter=firestore.FieldFilter("following_id", "==", user_id))\
        .limit(1)\
        .stream()
    is_following = any(True for _ in is_following_docs)

    return PublicUserProfile(
        id=user_id,
        username=user_data.get("username", ""),
        profile_picture=user_data.get("profile_picture"),
        followers_count=followers_count,
        following_count=following_count,
        routine_avg_rating=routine_avg,
        diet_avg_rating=diet_avg,
        is_following=is_following,
    )


@router.get("/users/{user_id}/posts", response_model=List[PostSchema])
def get_user_posts(
    user_id: str,
    db: firestore.Client = Depends(get_db),
    current_user: Any = Depends(deps.get_current_active_user),
):
    """Get all public posts from a specific user."""
    docs = db.collection("posts")\
        .where(filter=firestore.FieldFilter("creator_id", "==", user_id))\
        .stream()

    results = []
    for doc in docs:
        data = doc.to_dict()
        results.append(PostSchema(id=doc.id, **data))

    results.sort(key=lambda x: x.created_at, reverse=True)
    return results


@router.post("/users/{user_id}/follow")
def follow_user(
    user_id: str,
    db: firestore.Client = Depends(get_db),
    current_user: Any = Depends(deps.get_current_active_user),
):
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot follow yourself")

    # Idempotent: check if already following
    existing = db.collection("follows")\
        .where(filter=firestore.FieldFilter("follower_id", "==", current_user.id))\
        .where(filter=firestore.FieldFilter("following_id", "==", user_id))\
        .limit(1)\
        .stream()
    if any(True for _ in existing):
        return {"success": True, "action": "already_following"}

    db.collection("follows").add({
        "follower_id": current_user.id,
        "following_id": user_id,
        "created_at": datetime.now(pytz.utc),
    })

    db.collection("notifications").add({
        "user_id": user_id,
        "actor_id": current_user.id,
        "actor_name": current_user.username,
        "actor_avatar": getattr(current_user, 'profile_picture', None),
        "type": "follow",
        "content_id": None,
        "message": f"{current_user.username} ha empezado a seguirte.",
        "read": False,
        "created_at": datetime.now(pytz.utc)
    })
    return {"success": True, "action": "followed"}


@router.delete("/users/{user_id}/follow")
def unfollow_user(
    user_id: str,
    db: firestore.Client = Depends(get_db),
    current_user: Any = Depends(deps.get_current_active_user),
):
    docs = db.collection("follows")\
        .where(filter=firestore.FieldFilter("follower_id", "==", current_user.id))\
        .where(filter=firestore.FieldFilter("following_id", "==", user_id))\
        .stream()

    deleted = 0
    for doc in docs:
        doc.reference.delete()
        deleted += 1

    return {"success": True, "action": "unfollowed", "deleted": deleted}

# ─────────────────────────────────────────
# MODERATION (Delete Posts/Comments)
# ─────────────────────────────────────────

@router.delete("/posts/{post_id}")
def delete_post(
    post_id: str,
    db: firestore.Client = Depends(get_db),
    current_user: Any = Depends(deps.get_current_active_user),
):
    post_ref = db.collection("posts").document(post_id)
    doc = post_ref.get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Post not found")
    data = doc.to_dict()
    
    # Allow creator or admin
    if data.get("creator_id") != current_user.id and not getattr(current_user, 'is_admin', False):
        raise HTTPException(status_code=403, detail="Not authorized to delete this post")
        
    post_ref.delete()
    
    comments = post_ref.collection("comments").stream()
    for c in comments:
        c.reference.delete()
        
    return {"success": True}

@router.delete("/posts/{post_id}/comments/{comment_id}")
def delete_comment(
    post_id: str,
    comment_id: str,
    db: firestore.Client = Depends(get_db),
    current_user: Any = Depends(deps.get_current_active_user),
):
    comment_ref = db.collection("posts").document(post_id).collection("comments").document(comment_id)
    doc = comment_ref.get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Comment not found")
    data = doc.to_dict()
    
    post_doc = db.collection("posts").document(post_id).get()
    post_creator = post_doc.to_dict().get("creator_id") if post_doc.exists else None
    
    # Allow comment author, post creator, or admin
    if data.get("author_id") != current_user.id and post_creator != current_user.id and not getattr(current_user, 'is_admin', False):
        raise HTTPException(status_code=403, detail="Not authorized to delete this comment")
        
    comment_ref.delete()
    
    if post_doc.exists:
        db.collection("posts").document(post_id).update({"comment_count": firestore.Increment(-1)})
        
    return {"success": True}

