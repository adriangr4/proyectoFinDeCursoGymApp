from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class ContentRatingBase(BaseModel):
    rater_id: str
    content_type: str # 'routine' or 'diet'
    content_id: str
    score: int

class ContentRatingCreate(ContentRatingBase):
    pass

class ContentRatingUpdate(ContentRatingBase):
    score: Optional[int] = None

class ContentRating(ContentRatingBase):
    id: str
    created_at: datetime

    class Config:
        from_attributes = True
