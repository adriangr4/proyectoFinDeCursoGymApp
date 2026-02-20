from pydantic import BaseModel, Field
from typing import Optional, List, Any
from datetime import datetime

class PostBase(BaseModel):
    content_type: str # 'routine' or 'diet'
    content_id: str
    content_name: str
    content_image: Optional[str] = None # Diet image or routine placeholder
    
    creator_id: str
    creator_name: str
    creator_avatar: Optional[str] = None
    
    likes: List[str] = []
    rating_sum: float = 0.0
    rating_count: int = 0

class PostCreate(PostBase):
    pass

class Post(PostBase):
    id: str
    created_at: datetime
    
    class Config:
        from_attributes = True

# --- SOCIAL (RATINGS) ---
class RatingBase(BaseModel):
    content_type: str # 'routine' or 'diet'
    content_id: str
    score: int = Field(..., ge=1, le=5)

class RatingCreate(RatingBase):
    pass

class Rating(RatingBase):
    id: str
    rater_id: str
    created_at: datetime
    
    class Config:
        from_attributes = True
