from fastapi import APIRouter, Depends, HTTPException, Body
from typing import Any
from app.api.deps import get_current_user
from app.schemas.user import User
from app.schemas.nutrition import NutritionLogCreate, DailyNutritionStats, NutritionLogBase
from firebase_admin import firestore
from datetime import datetime

router = APIRouter()

def get_nutrition_ref(user_id: str, date_str: str):
    return firestore.client().collection('users').document(user_id).collection('nutrition_logs').document(date_str)

@router.get("/today", response_model=DailyNutritionStats)
async def get_today_nutrition(
    current_user: User = Depends(get_current_user)
) -> Any:
    print(f"DEBUG: get_today_nutrition called for user {current_user.id}")
    """
    Get nutrition stats for today.
    """
    date_str = datetime.now().strftime("%Y-%m-%d")
    doc_ref = get_nutrition_ref(current_user.id, date_str)
    doc = doc_ref.get()
    
    # Get user goal (default 2000 if not set)
    user_goal = current_user.daily_calorie_goal if hasattr(current_user, 'daily_calorie_goal') and current_user.daily_calorie_goal else 2000

    if not doc.exists:
        return DailyNutritionStats(date=date_str, goal_calories=user_goal)
    
    data = doc.to_dict()
    return DailyNutritionStats(goal_calories=user_goal, **data)

@router.post("/log", response_model=DailyNutritionStats)
async def log_food(
    log: NutritionLogCreate,
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Log a food item consumed today.
    """
    date_str = datetime.now().strftime("%Y-%m-%d")
    doc_ref = get_nutrition_ref(current_user.id, date_str)
    doc = doc_ref.get()

    user_goal = current_user.daily_calorie_goal if hasattr(current_user, 'daily_calorie_goal') and current_user.daily_calorie_goal else 2000
    
    new_log = log.dict()
    
    if not doc.exists:
        data = {
            "date": date_str,
            "total_calories": log.calories,
            "total_protein": log.protein,
            "total_carbs": log.carbs,
            "total_fat": log.fat,
            "logs": [new_log]
        }
        doc_ref.set(data)
    else:
        current_data = doc.to_dict()
        data = {
            "total_calories": current_data.get("total_calories", 0) + log.calories,
            "total_protein": current_data.get("total_protein", 0) + log.protein,
            "total_carbs": current_data.get("total_carbs", 0) + log.carbs,
            "total_fat": current_data.get("total_fat", 0) + log.fat,
            "logs": firestore.ArrayUnion([new_log])
        }
        doc_ref.update(data)
        # Merge for return - BUT don't use the ArrayUnion object for the response list
        # current_data has the OLD logs. We just want to append the new one for the response.
        current_data.update({
            "total_calories": data["total_calories"],
            "total_protein": data["total_protein"],
            "total_carbs": data["total_carbs"],
            "total_fat": data["total_fat"]
        })
        # Safely construct logs list for response
        existing_logs = current_data.get("logs", [])
        if isinstance(existing_logs, list):
             current_data["logs"] = existing_logs + [new_log]
        else:
             # Fallback if somehow it's verified as something else, though it should be list from to_dict
             current_data["logs"] = [new_log]
        
        data = current_data

    return DailyNutritionStats(goal_calories=user_goal, **data)

@router.post("/goal")
async def update_calorie_goal(
    goal: int = Body(..., embed=True),
    current_user: User = Depends(get_current_user)
):
    """
    Update the user's daily calorie goal.
    """
    firestore.client().collection('users').document(current_user.id).update({"daily_calorie_goal": goal})
    return {"status": "success", "goal": goal}
