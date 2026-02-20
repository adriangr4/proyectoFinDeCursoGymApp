from pydantic import BaseModel
from typing import Optional
from datetime import datetime

# Shared properties
class ExerciseBase(BaseModel):
    name: str
    description: Optional[str] = None
    muscle_group: Optional[str] = None
    video_url: Optional[str] = None
    type: Optional[str] = None

# Properties to receive on item creation
class ExerciseCreate(ExerciseBase):
    pass

# Properties to receive on item update
class ExerciseUpdate(ExerciseBase):
    name: Optional[str] = None

# Properties shared by models stored in DB
class ExerciseInDBBase(ExerciseBase):
    id: str
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# Properties to return to client
class Exercise(ExerciseInDBBase):
    pass
