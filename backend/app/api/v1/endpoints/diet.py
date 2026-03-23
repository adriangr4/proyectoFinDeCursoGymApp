import unicodedata
from firebase_admin import firestore as firebase_firestore
from starlette.concurrency import run_in_threadpool
from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Any
from app.api.deps import get_current_user
from app.schemas.user import User
from app.schemas.diet import DietPlan, DietPlanCreate, FoodItem
from app.core.config import settings
import uuid
from datetime import datetime

router = APIRouter()

# Firestore collection reference
def get_diets_ref():
    return firebase_firestore.client().collection('diets')

def normalize(text: str) -> str:
    """Lowercase and remove accents for flexible search."""
    nfkd = unicodedata.normalize('NFD', text.lower())
    return ''.join(c for c in nfkd if not unicodedata.combining(c))

@router.get("/search", response_model=List[FoodItem])
async def search_food(
    q: str = Query(..., min_length=2),
    page: int = 1
):
    """
    Search for food in the local Firestore 'foods' database.
    Falls back to a generic item if nothing is found.
    """
    def _search():
        db = firebase_firestore.client()
        q_normalized = normalize(q)
        
        # Firestore doesn't support full-text search, so we:
        # 1. Try exact prefix match on search_name field
        # 2. Also fetch all and filter in-memory (collection is small ~100-200 items)
        results = []
        
        all_foods = db.collection('foods').stream()
        for doc in all_foods:
            data = doc.to_dict()
            food_name_norm = normalize(data.get('name', ''))
            # Match if query appears anywhere in the food name
            if q_normalized in food_name_norm:
                results.append(data)
        
        # Sort by relevance: exact starts-with first, then contains
        results.sort(key=lambda x: (0 if normalize(x['name']).startswith(q_normalized) else 1, x['name']))
        
        # Pagination
        page_size = 20
        start = (page - 1) * page_size
        return results[start:start + page_size]
    
    foods = await run_in_threadpool(_search)
    
    if not foods:
        # Return a single generic item so UI doesn't show empty
        return [FoodItem(
            name=f"{q.capitalize()} (Genérico)",
            brand="Sin marca",
            calories=100,
            protein=5,
            carbs=10,
            fat=2,
            image_url="",
            barcode="",
            quantity=100,
            serving_size="100g"
        )]
    
    return [
        FoodItem(
            name=f.get('name', 'Alimento'),
            brand=f.get('category', ''),
            calories=f.get('calories', 0),
            protein=f.get('protein', 0),
            carbs=f.get('carbs', 0),
            fat=f.get('fat', 0),
            image_url=f.get('image_url', ''),
            barcode=f.get('id', ''),
            quantity=f.get('quantity', 100),
            serving_size=f.get('serving_size', '100g')
        )
        for f in foods
    ]


@router.post("/", response_model=DietPlan)
async def create_diet_plan(
    plan: DietPlanCreate,
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Create a new diet plan for the user.
    """
    try:
        print(f"DEBUG: Creating diet plan for user {current_user.id}", flush=True)
        # print(f"DEBUG: Payload: {plan.model_dump_json()}", flush=True) # Pydantic v2
        print(f"DEBUG: Payload: {plan.dict()}", flush=True) 

        plan_data = plan.dict()
        plan_id = str(uuid.uuid4())
        
        new_plan = {
            "id": plan_id,
            "user_id": current_user.id,
            "created_at": datetime.utcnow(),
            **plan_data
        }
        
        # Ensure dates/timestamps are serialized if needed or Firestore handles them (it does)
        get_diets_ref().document(plan_id).set(new_plan)
        print(f"DEBUG: Diet plan {plan_id} created successfully", flush=True)
        return new_plan
    except Exception as e:
        print(f"ERROR: Failed to create diet plan: {repr(e)}", flush=True)
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to create diet plan: {str(e)}")

@router.get("/{diet_id}", response_model=DietPlan)
async def get_diet_plan(
    diet_id: str,
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Get diet plan by ID.
    """
    doc = get_diets_ref().document(diet_id).get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Diet plan not found")
    
    data = doc.to_dict()
    # Optional: Check ownership. For now, we return it.
    
    return data

@router.get("/", response_model=List[DietPlan])
async def get_my_diet_plans(
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Get all diet plans for the current user.
    """
    try:
        docs = get_diets_ref()\
            .where("user_id", "==", current_user.id)\
            .order_by("created_at", direction=firestore.Query.DESCENDING)\
            .stream()
        return [doc.to_dict() for doc in docs]
    except Exception as e:
        print(f"WARN: Sorted diet query failed (likely missing index). Falling back to unsorted. Error: {e}")
        docs = get_diets_ref().where("user_id", "==", current_user.id).stream()
        return [doc.to_dict() for doc in docs]

@router.delete("/{diet_id}", response_model=dict)
async def delete_diet_plan(
    diet_id: str,
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Delete a diet plan by ID.
    """
    doc_ref = get_diets_ref().document(diet_id)
    doc = doc_ref.get()
    
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Diet plan not found")
        
    data = doc.to_dict()
    # Check ownership
    if data.get("user_id") != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
        
    # Delete doc
    doc_ref.delete()
    return {"status": "success", "message": "Diet plan deleted"}
