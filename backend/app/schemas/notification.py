from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class NotificationBase(BaseModel):
    user_id: str
    actor_id: str
    actor_name: str
    actor_avatar: Optional[str] = None
    type: str # 'like', 'comment', 'follow', 'import', 'post'
    content_id: Optional[str] = None
    message: Optional[str] = None

class NotificationCreate(NotificationBase):
    pass

class Notification(NotificationBase):
    id: str
    read: bool = False
    created_at: datetime
