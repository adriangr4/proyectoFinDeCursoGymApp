from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class FoodItem(BaseModel):
    name: str
    brand: Optional[str] = None
    calories: float
    protein: float
    carbs: float
    fat: float
    image_url: Optional[str] = None
    barcode: Optional[str] = None
    quantity: float = 100 # grams usually
    serving_size: Optional[str] = "100g"

    class Config:
        extra = "ignore"

class Meal(BaseModel):
    name: str # "Breakfast", "Lunch", "Dinner", "Snack"
    foods: List[FoodItem] = []
    total_calories: float = 0
    total_protein: float = 0
    total_carbs: float = 0
    total_fat: float = 0

class DayPlan(BaseModel):
    day: str # "Monday", "Tuesday", etc.
    meals: List[Meal] = []
    total_calories: float = 0
    total_protein: float = 0
    total_carbs: float = 0
    total_fat: float = 0

class DietPlanBase(BaseModel):
    name: str
    description: Optional[str] = None
    image_url: Optional[str] = None
    daily_calories_target: int
    meals: List[Meal] = [] # Kept for backward compatibility or single-day plans
    weekly_plan: List[DayPlan] = [] # New weekly schedule

class DietPlanCreate(DietPlanBase):
    pass

class DietPlan(DietPlanBase):
    id: str
    user_id: str
    created_at: datetime
    
    class Config:
        from_attributes = True
