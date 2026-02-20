from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

# Shared properties
class UserBase(BaseModel):
    username: Optional[str] = None
    email: Optional[EmailStr] = None
    profile_picture: Optional[str] = None
    level: int = 1
    xp: int = 0
    current_weight: Optional[float] = None
    daily_calorie_goal: Optional[int] = 2000
    current_diet_id: Optional[str] = None
    current_routine_id: Optional[str] = None # Added field
    height: Optional[int] = None # in cm
    # is_active: Optional[bool] = True # Removed to match DB model

# Properties to receive via API on creation
class UserCreate(UserBase):
    username: str
    email: EmailStr
    password: str

# Properties to receive via API on update
class UserUpdate(UserBase):
    password: Optional[str] = None

class UserInDBBase(UserBase):
    id: Optional[str] = None
    created_at: Optional[datetime] = None
    reputation_score: float = 0.0

    class Config:
        from_attributes = True

# Additional properties to return via API
# Additional properties to return via API
class User(UserInDBBase):
    pass

class DashboardStats(BaseModel):
    calories_burned: int
    calories_target: int
    time_minutes: int
    steps: int
    mission_name: Optional[str] = None
    mission_duration: Optional[int] = None
    mission_img: Optional[str] = None

class WeightLogBase(BaseModel):
    weight: float
    date: datetime # or date
    
class WeightLogCreate(WeightLogBase):
    pass

class WeightLog(WeightLogBase):
    id: str
    user_id: str
    
    class Config:
        from_attributes = True

