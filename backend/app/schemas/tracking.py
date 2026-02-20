from pydantic import BaseModel
from typing import Optional, List
from datetime import date, datetime

class ScheduledWorkoutBase(BaseModel):
    scheduled_date: date
    note: Optional[str] = None
    status: str = 'pending'

class WorkoutLogBase(BaseModel):
    workout_id: Optional[str] = None
    exercise_id: str
    set_number: int
    reps: int
    weight_kg: float
    notes: Optional[str] = None

class WorkoutLogCreate(WorkoutLogBase):
    pass

class WorkoutLogUpdate(WorkoutLogBase):
    pass

class WorkoutLog(WorkoutLogBase):
    id: str
    created_at: datetime
    
    # Nested exercise details
    exercise: Optional[dict] = None # Using dict to avoid circular imports or complex nesting for now
    
    class Config:
        from_attributes = True

class ScheduledWorkoutCreate(ScheduledWorkoutBase):
    routine_id: str

class ScheduledWorkout(ScheduledWorkoutBase):
    id: str
    user_id: str
    routine_id: Optional[str] = None
    created_at: datetime
    logs: List[WorkoutLog] = []
    duration_seconds: Optional[int] = 0
    calories_burned: Optional[float] = 0
    
    class Config:
        from_attributes = True

class ScheduledWorkoutUpdate(ScheduledWorkoutBase):
    pass

# For the Quick Log Session
class WorkoutSessionLog(BaseModel):
    routine_id: str
    duration_seconds: int
    calories_burned: float
    rating: int 
    difficulty: str
    notes: Optional[str] = None
    logs: List[WorkoutLogCreate] = []

class WorkoutCompletionResponse(BaseModel):
    workout: ScheduledWorkout
    xp_gained: int
    new_total_xp: int
    new_level: int
    level_up: bool
    prev_level_xp: int
    next_level_xp: int
