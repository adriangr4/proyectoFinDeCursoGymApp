from typing import Any, Dict, Optional, Union
from google.cloud import firestore
from google.cloud.firestore import FieldFilter
from app.services.base import CRUDBase
# Use Schema as Model since we don't have SQL models anymore
from app.schemas.user import User, UserCreate, UserUpdate
from app.core.security import get_password_hash, verify_password

class CRUDUser(CRUDBase[User, UserCreate, UserUpdate]):
    def get_by_email(self, db: firestore.Client, *, email: str) -> Optional[User]:
        # Firestore query
        docs = db.collection(self.collection_name).where(filter=FieldFilter("email", "==", email)).limit(1).stream()
        for doc in docs:
            return self.model(id=doc.id, **doc.to_dict())
        return None

    def get_by_username(self, db: firestore.Client, *, username: str) -> Optional[User]:
        docs = db.collection(self.collection_name).where(filter=FieldFilter("username", "==", username)).limit(1).stream()
        for doc in docs:
            return self.model(id=doc.id, **doc.to_dict())
        return None

    def create(self, db: firestore.Client, *, obj_in: UserCreate) -> User:
        # Check if exists (optional but good practice to enforce uniqueness manually since Firestore doesn't)
        # For MVP, skipping strict race-condition check, just query.
        if self.get_by_email(db, email=obj_in.email):
            raise ValueError("Email already registered")
            
        db_obj_data = {
            "email": obj_in.email,
            "password_hash": get_password_hash(obj_in.password),
            "username": obj_in.username,
            "reputation_score": 0.0,
            "created_at": firestore.SERVER_TIMESTAMP,
            "profile_picture": obj_in.profile_picture
        }
        
        _time, doc_ref = db.collection(self.collection_name).add(db_obj_data)
        
        # Return User object
        # Note: SERVER_TIMESTAMP is resolved on server, so local object might not have it strictly correct immediately,
        # but for response we can mock or fetch. Fetching is safer.
        doc = doc_ref.get()
        return self.model(id=doc.id, **doc.to_dict())

    def authenticate(self, db: firestore.Client, *, email: str, password: str) -> Optional[User]:
        user = self.get_by_email(db, email=email)
        if not user:
            return None
        # User schema doesn't have password_hash by default in UserBase, 
        # but the document DOES. We need to access the raw dict or ensure UserInDB has it.
        # Wait, app/schemas/user.py defines User inheriting UserInDBBase.
        # Does UserInDBBase have password_hash? 
        # Let's check schemas again. It usually doesn't strictly include it to avoid leaking.
        # We might need to fetch the doc directly or use a UserInDB schema that allows password_hash.
        
        # Fetch raw doc again to be sure (or just trust what we loaded if we added it to model)
        # Our Pydantic model 'User' likely filters it out if not defined.
        # Let's verify password against the raw firestore doc data if possible?
        # Re-fetching as dict for auth check
        doc_ref = db.collection(self.collection_name).document(user.id)
        doc = doc_ref.get()
        user_data = doc.to_dict()
        
        if not verify_password(password, user_data.get('password_hash', '')):
            return None
        return user

user = CRUDUser("users", User)
