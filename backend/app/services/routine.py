from typing import Any, Dict, Union, List
from google.cloud import firestore
from app.services.base import CRUDBase
from app.schemas.routine import Routine, RoutineCreate, RoutineUpdate

class CRUDRoutine(CRUDBase[Routine, RoutineCreate, RoutineUpdate]):
    def create(self, db: firestore.Client, *, obj_in: Union[RoutineCreate, Dict[str, Any]]) -> Routine:
        from fastapi.encoders import jsonable_encoder
        from datetime import datetime
        
        req_data = jsonable_encoder(obj_in)
        if "average_rating" not in req_data:
            req_data["average_rating"] = 0.0
        if "rating_count" not in req_data:
            req_data["rating_count"] = 0
        if "created_at" not in req_data:
            req_data["created_at"] = datetime.utcnow().isoformat()
            
        return super().create(db, obj_in=req_data)

    def get_with_exercises(self, db: firestore.Client, id: str) -> Union[Dict, None]:
        routine = self.get(db, id=id)
        if not routine:
            return None
        
        # Fetch exercises
        exercises_ref = db.collection("routine_exercises").where("routine_id", "==", id).stream()
        exercises = []
        for doc in exercises_ref:
            ex_data = doc.to_dict()
            ex_data["id"] = doc.id
            
            # Fetch the actual Exercise details
            if "exercise_id" in ex_data:
                ex_doc = db.collection("exercises").document(ex_data["exercise_id"]).get()
                if ex_doc.exists:
                    full_ex = ex_doc.to_dict()
                    full_ex["id"] = ex_doc.id
                    ex_data["exercise"] = full_ex
                else:
                    ex_data["exercise"] = None
            
            exercises.append(ex_data)
            
        if hasattr(routine, "model_dump"):
            routine_dict = routine.model_dump()
        else:
            routine_dict = dict(routine)
            
        routine_dict["exercises"] = exercises
        return routine_dict

    def get_multi_with_exercises(self, db: firestore.Client, *, creator_id: str = None, skip: int = 0, limit: int = 100) -> List[Dict]:
        # routines = self.get_multi(db, skip=skip, limit=limit)
        docs_collection = {}
        try:
            # 1. Fetch user's routines (fallback to unsorted if index missing)
            if creator_id:
                try:
                    q1 = db.collection(self.collection_name).where("creator_id", "==", creator_id).order_by("created_at", direction=firestore.Query.DESCENDING).limit(limit).stream()
                    for d in q1:
                        docs_collection[d.id] = d.to_dict()
                except Exception:
                    q1 = db.collection(self.collection_name).where("creator_id", "==", creator_id).stream()
                    for d in q1:
                        docs_collection[d.id] = d.to_dict()

            # 2. Fetch public templates
            try:
                q2 = db.collection(self.collection_name).where("is_public", "==", True).order_by("created_at", direction=firestore.Query.DESCENDING).limit(limit).stream()
                for d in q2:
                    docs_collection[d.id] = d.to_dict()
            except Exception:
                q2 = db.collection(self.collection_name).where("is_public", "==", True).stream()
                for d in q2:
                    docs_collection[d.id] = d.to_dict()
            
            # 3. Sort manually and apply pagination
            sorted_docs = sorted(docs_collection.items(), key=lambda x: str(x[1].get("created_at", "")), reverse=True)
            paginated = sorted_docs[skip : skip + limit]
            
            routines = [self.model(id=item[0], **item[1]) for item in paginated]

        except Exception as e:
            print(f"WARN: Merged query failed. Error: {e}")
            routines = []

        results = []
        routine_map = {}
        routine_ids = []

        for routine in routines:
            if hasattr(routine, "model_dump"):
                r_dict = routine.model_dump()
            else:
                r_dict = dict(routine)
            r_dict["exercises"] = [] # Initialize
            results.append(r_dict)
            routine_map[r_dict["id"]] = r_dict
            routine_ids.append(r_dict["id"])

        if not routine_ids:
            return results

        # 1. Batch fetch routine_exercises using 'IN' query
        # Firestore 'IN' supports up to 10 values. We must chunk.
        all_exercise_ids = set()
        routine_exercises_list = []
        
        chunk_size = 10
        id_chunks = [routine_ids[i:i + chunk_size] for i in range(0, len(routine_ids), chunk_size)]

        for chunk in id_chunks:
            # Note: Ensure "routine_exercises" is the correct collection name
            # Checking line 27/74 of original file: db.collection("routine_exercises")
            query = db.collection("routine_exercises").where("routine_id", "in", chunk)
            docs = query.stream()
            
            for doc in docs:
                data = doc.to_dict()
                data["id"] = doc.id
                routine_exercises_list.append(data)
                if "exercise_id" in data:
                    all_exercise_ids.add(data["exercise_id"])

        # 2. Batch fetch actual Exercises
        exercise_lookup = {}
        if all_exercise_ids:
            refs = [db.collection("exercises").document(eid) for eid in all_exercise_ids]
            
            # get_all allows fetching multiple documents
            # we chunk references just to be safe/efficient, though get_all handles many
            ref_chunks = [refs[i:i + 100] for i in range(0, len(refs), 100)]
            
            for chunk in ref_chunks:
                fetched_docs = db.get_all(chunk)
                for doc in fetched_docs:
                    if doc.exists:
                        data = doc.to_dict()
                        data["id"] = doc.id
                        exercise_lookup[doc.id] = data

        # 3. Associate exercises with routines
        # First, map routine_exercise to its full exercise detail
        for rex in routine_exercises_list:
             if "exercise_id" in rex and rex["exercise_id"] in exercise_lookup:
                 rex["exercise"] = exercise_lookup[rex["exercise_id"]]
             else:
                 rex["exercise"] = None
             
             # Add to appropriate routine
             r_id = rex.get("routine_id")
             if r_id in routine_map:
                 try:
                     routine_map[r_id]["exercises"].append(rex)
                 except KeyError:
                     routine_map[r_id]["exercises"] = [rex]

        # 4. Sort exercises within routines if needed (by order_index or just insertion order)
        # The frontend seems to rely on array order or 'order_index'
        for r_dict in results:
             if "exercises" in r_dict:
                 # sort by order potentially?
                 # r_dict["exercises"].sort(key=lambda x: x.get("order_index", 0))
                 pass

        return results

routine = CRUDRoutine("routines", Routine)
