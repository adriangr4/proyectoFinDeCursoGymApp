from typing import Any, Dict, Generic, List, Optional, Type, TypeVar, Union
from fastapi.encoders import jsonable_encoder
from pydantic import BaseModel
from google.cloud import firestore

ModelType = TypeVar("ModelType", bound=BaseModel)
CreateSchemaType = TypeVar("CreateSchemaType", bound=BaseModel)
UpdateSchemaType = TypeVar("UpdateSchemaType", bound=BaseModel)

class CRUDBase(Generic[ModelType, CreateSchemaType, UpdateSchemaType]):
    def __init__(self, collection_name: str, model: Type[ModelType]):
        """
        CRUD object with default methods to Create, Read, Update, Delete (CRUD).
        **Parameters**
        * `collection_name`: The Firestore collection name
        * `model`: The Pydantic model class (schema) for response validation
        """
        self.collection_name = collection_name
        self.model = model

    def get(self, db: firestore.Client, id: str) -> Optional[ModelType]:
        doc_ref = db.collection(self.collection_name).document(id)
        doc = doc_ref.get()
        if doc.exists:
            data = doc.to_dict()
            if "id" in data:
                del data["id"]
            return self.model(id=doc.id, **data)
        return None

    def get_multi(self, db: firestore.Client, skip: int = 0, limit: int = 100) -> List[ModelType]:
        # Firestore offset is expensive/complex. For simple MVP, we define simple list.
        # Ideally use cursors, but here we just list.
        docs = db.collection(self.collection_name).limit(limit).stream() # Skip is hard without sorting
        # For true skip, we need verification. For now, let's just return first N.
        
        def _map_doc(doc):
            data = doc.to_dict()
            if "id" in data:
                del data["id"]
            return self.model(id=doc.id, **data)
            
        return [_map_doc(doc) for doc in docs]

    def create(self, db: firestore.Client, *, obj_in: CreateSchemaType) -> ModelType:
        obj_in_data = jsonable_encoder(obj_in)
        # Add timestamp if needed? Firestore adds creation time to metadata but not field.
        # We can add 'created_at' manually if schema has it.
        from datetime import datetime
        if 'created_at' not in obj_in_data and 'created_at' in self.model.model_fields:
             obj_in_data['created_at'] = datetime.utcnow()

        _time, doc_ref = db.collection(self.collection_name).add(obj_in_data)
        
        # Determine ID. Firestore defines it in doc_ref.id
        return self.model(id=doc_ref.id, **obj_in_data)

    def update(self, db: firestore.Client, *, id: str, obj_in: Union[UpdateSchemaType, Dict[str, Any]]) -> ModelType:
        doc_ref = db.collection(self.collection_name).document(id)
        
        if isinstance(obj_in, dict):
            update_data = obj_in
        else:
            update_data = obj_in.model_dump(exclude_unset=True)
            
        doc_ref.update(update_data)
        
        # Return updated
        doc = doc_ref.get()
        return self.model(id=doc.id, **doc.to_dict())

    def remove(self, db: firestore.Client, *, id: str) -> Any:
        db.collection(self.collection_name).document(id).delete()
        return {"id": id, "status": "deleted"}
