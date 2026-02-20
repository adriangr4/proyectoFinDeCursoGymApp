from typing import Optional
from google.cloud import firestore
from google.cloud.firestore import FieldFilter
from app.services.base import CRUDBase
from app.schemas.social import ContentRating, ContentRatingCreate, ContentRatingUpdate

class CRUDContentRating(CRUDBase[ContentRating, ContentRatingCreate, ContentRatingUpdate]):
    def get_by_rater_and_content(self, db: firestore.Client, rater_id: str, content_type: str, content_id: str) -> Optional[ContentRating]:
        docs = db.collection(self.collection_name)\
                 .where(filter=FieldFilter("rater_id", "==", rater_id))\
                 .where(filter=FieldFilter("content_type", "==", content_type))\
                 .where(filter=FieldFilter("content_id", "==", content_id))\
                 .limit(1)\
                 .stream()
        for doc in docs:
            return self.model(id=doc.id, **doc.to_dict())
        return None

content_rating = CRUDContentRating("content_ratings", ContentRating)
