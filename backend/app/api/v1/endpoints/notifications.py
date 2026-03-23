from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from google.cloud import firestore
import pytz
from datetime import datetime

from app.db.session import get_db
from app.api import deps
from app.schemas.notification import Notification

router = APIRouter()

@router.get("/", response_model=List[Notification])
def get_notifications(
    db: firestore.Client = Depends(get_db),
    current_user: Any = Depends(deps.get_current_active_user),
    limit: int = 30
):
    docs = db.collection("notifications")\
        .where(filter=firestore.FieldFilter("user_id", "==", current_user.id))\
        .order_by("created_at", direction=firestore.Query.DESCENDING)\
        .limit(limit)\
        .stream()

    results = []
    for doc in docs:
        data = doc.to_dict()
        results.append(Notification(id=doc.id, **data))
    return results

@router.patch("/{notif_id}/read", response_model=Notification)
def mark_read(
    notif_id: str,
    db: firestore.Client = Depends(get_db),
    current_user: Any = Depends(deps.get_current_active_user),
):
    doc_ref = db.collection("notifications").document(notif_id)
    doc = doc_ref.get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    data = doc.to_dict()
    if data.get("user_id") != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    doc_ref.update({"read": True})
    data["read"] = True
    return Notification(id=doc.id, **data)
