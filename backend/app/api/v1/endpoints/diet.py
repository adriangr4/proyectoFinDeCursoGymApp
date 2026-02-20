import requests
from starlette.concurrency import run_in_threadpool
from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Any
from app.api.deps import get_current_user
from app.schemas.user import User
from app.schemas.diet import DietPlan, DietPlanCreate, FoodItem
from app.core.config import settings
from firebase_admin import firestore
import uuid
from datetime import datetime

router = APIRouter()

# Firestore collection reference
def get_diets_ref():
    return firestore.client().collection('diets')

@router.get("/search", response_model=List[FoodItem])
async def search_food(
    q: str = Query(..., min_length=2),
    page: int = 1
):
    """
    Search for food in OpenFoodFacts API (proxy).
    """
    # Use 'es' subdomain for better reliability and localization
    url = "https://es.openfoodfacts.org/cgi/search.pl"
    params = {
        "search_terms": q,
        "search_simple": 1,
        "action": "process",
        "json": 1,
        "page": page,
        "page_size": 20,
        "fields": "product_name,brands,image_url,nutriments,code,serving_size"
    }
    
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
    }
    
    
    try:
        def fetch():
            return requests.get(url, params=params, headers=headers, timeout=20.0)
            
        response = await run_in_threadpool(fetch)
        response.raise_for_status()
        data = response.json()
        
        results = []
        for product in data.get('products', []):
            # Extract nutriments (default to 100g)
            nutriments = product.get('nutriments', {})
            
            # Skip items without basic calorie info
            if 'energy-kcal_100g' not in nutriments and 'energy-kcal' not in nutriments:
                continue

            item = FoodItem(
                name=product.get('product_name', 'Unknown'),
                brand=product.get('brands', ''),
                calories=nutriments.get('energy-kcal_100g', nutriments.get('energy-kcal', 0)),
                protein=nutriments.get('proteins_100g', 0),
                carbs=nutriments.get('carbohydrates_100g', 0),
                fat=nutriments.get('fat_100g', 0),
                image_url=product.get('image_url', ''),
                barcode=product.get('code', ''),
                quantity=100, # default reference 100g
                serving_size=product.get('serving_size', '100g')
            )
            results.append(item)
            
        return results
    except Exception as e:
        print(f"Error fetching from OpenFoodFacts: {repr(e)}")
        raise HTTPException(status_code=502, detail="Error searching external food database")

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
