from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from app.schemas.exercise import Exercise

# Shared properties
class RoutineBase(BaseModel):
    name: str
    description: Optional[str] = None
    is_public: bool = False

class RoutineCreate(RoutineBase):
    weekly_plan: Optional[List[dict]] = []

class RoutineUpdate(RoutineBase):
    name: Optional[str] = None

# Nested object for Routine details
class RoutineExerciseDetail(BaseModel):
    exercise_id: str
    day_of_week: Optional[int] = None
    order_index: Optional[int] = None
    target_sets: Optional[int] = None
    target_reps_min: Optional[int] = None
    target_reps_max: Optional[int] = None
    
    # We might want to embed the full exercise data here for easy display
    exercise: Optional[Exercise] = None

    class Config:
        from_attributes = True

class RoutineInDBBase(RoutineBase):
    id: str
    creator_id: str
    average_rating: float = 0.0
    rating_count: int = 0
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class Routine(RoutineInDBBase):
    exercises: List[RoutineExerciseDetail] = []
