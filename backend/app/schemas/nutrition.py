from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class NutritionLogBase(BaseModel):
    calories: int
    protein: float = 0
    carbs: float = 0
    fat: float = 0
    food_name: str
    meal_type: str = "snack" # breakfast, lunch, dinner, snack

class NutritionLogCreate(NutritionLogBase):
    pass

class DailyNutritionStats(BaseModel):
    date: str # YYYY-MM-DD
    total_calories: int = 0
    total_protein: float = 0
    total_carbs: float = 0
    total_fat: float = 0
    goal_calories: int = 2000
    logs: List[NutritionLogBase] = []
