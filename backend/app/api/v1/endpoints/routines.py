from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from google.cloud import firestore

from app.db.session import get_db
from app.schemas import routine as schemas
from app.services.routine import routine as crud
from app.api import deps

# Use deps to get current user if needed for ownership check?
# currently create_routine doesn't check ownership in crud.create 
# but models had creator_id. We should inject it.

router = APIRouter()

@router.get("/", response_model=List[schemas.Routine])
def read_routines(
    db: firestore.Client = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: Any = Depends(deps.get_current_active_user),
):
    """
    Retrieve routines.
    """
    print("DEBUG: Endpoint read_routines called", flush=True)
    routines = crud.get_multi_with_exercises(db, creator_id=current_user.id, skip=skip, limit=limit)
    print(f"DEBUG: Endpoint returning {len(routines)} routines", flush=True)
    return routines

@router.post("/", response_model=schemas.Routine)
def create_routine(
    *,
    db: firestore.Client = Depends(get_db),
    routine_in: schemas.RoutineCreate,
    current_user: Any = Depends(deps.get_current_active_user),
):
    """
    Create new routine.
    """
    # Force creator_id from current user
    # RoutineCreate schema doesn't have creator_id likely?
    # Schema says: RoutineCreate(RoutineBase) -> name, description, is_public.
    # RoutineInDBBase has creator_id.
    # We must inject creator_id into the object passed to CRUD or handle it in service.
    # CRUDBase using jsonable_encoder might miss it if not in schema.
    # But CRUD.create expects obj_in.
    # We should add creator_id to obj_in before calling create? Pydantic strictness might block it.
    # We can pass dictionary to crud.create if obj_in can be dict? Yes CRUDBase supports obj_in (CreateSchemaType).
    # IF CreateSchemaType doesn't have creator_id, we can't set it there.
    # We should update RoutineCreate schema to Optional[str] creator_id or handle it in service.
    # Or just inject into the dict in service.create?
    # Actually, current auth logic must be ensuring creator_id.
    # app/services/routine.py doesn't set creator_id.
    # So validation would fail or it would be null?
    # I should update RoutineCreate schema or manually handle it here.
    
    # Firestore allows arbitrary fields. We can pass a dict.
    routine_data = routine_in.model_dump()
    routine_data["creator_id"] = current_user.id
    
    # Store weekly_plan temporarily and remove from routine to match base schema if needed
    weekly_plan = routine_data.pop("weekly_plan", [])
    
    routine = crud.create(db=db, obj_in=routine_data)
    
    # Process weekly_plan and save to routine_exercises
    if weekly_plan:
        batch = db.batch()
        day_map = {
            "Monday": 1, "Tuesday": 2, "Wednesday": 3, "Thursday": 4, 
            "Friday": 5, "Saturday": 6, "Sunday": 7
        }
        
        exercises_ref = db.collection("routine_exercises")
        
        for day_data in weekly_plan:
            day_name = day_data.get("day")
            exercises = day_data.get("exercises", [])
            day_num = day_map.get(day_name, 1)
            
            for index, ex in enumerate(exercises):
                new_doc = exercises_ref.document()
                ex_data = {
                    "routine_id": routine.id,
                    "exercise_id": ex.get("exercise_id"),
                    "day_of_week": day_num,
                    "order_index": index,
                    "target_sets": ex.get("series"),
                    "target_reps_min": int(ex.get("reps", "0").split('-')[0]) if '-' in str(ex.get("reps", "")) else int(ex.get("reps", "0")) if str(ex.get("reps", "")).isdigit() else 0,
                    # Optional max reps
                    "target_reps_max": int(ex.get("reps", "0").split('-')[1]) if '-' in str(ex.get("reps", "")) else None,
                    "reps_display": ex.get("reps") # store original string for UI just in case
                }
                batch.set(new_doc, ex_data)
                
        batch.commit()
    
    # We should return the routine with exercises to match the response_model
    # The crud.create returns a basic model. We can fetch it full or just return it as is.
    # We'll fetch it full so it matches what GET /routines/{id} returns
    routine_with_ex = crud.get_with_exercises(db, id=routine.id)
    return routine_with_ex

@router.get("/{routine_id}", response_model=schemas.Routine)
def read_routine(
    routine_id: str,
    db: firestore.Client = Depends(get_db),
):
    """
    Get routine by ID.
    """
    routine = crud.get_with_exercises(db, id=routine_id)
    if not routine:
        raise HTTPException(status_code=404, detail="Routine not found")
    return routine

@router.delete("/{routine_id}", response_model=dict)
def delete_routine(
    routine_id: str,
    db: firestore.Client = Depends(get_db),
    current_user: Any = Depends(deps.get_current_active_user),
):
    """
    Delete a routine by ID and all its associated exercises.
    """
    routine = crud.get_with_exercises(db, id=routine_id)
    if not routine:
        raise HTTPException(status_code=404, detail="Routine not found")
        
    # Optional: check ownership here
    if routine.get("creator_id") != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")

    # 1. Delete associated exercises in a batch
    batch = db.batch()
    exercises_ref = db.collection("routine_exercises").where("routine_id", "==", routine_id).stream()
    for ex_doc in exercises_ref:
        batch.delete(ex_doc.reference)
        
    # Wait to commit batch, then delete the routine
    batch.commit()
    
    # 2. Delete the specific routine doc
    try:
        crud.remove(db=db, id=routine_id)
    except Exception as e:
        # Fallback if crud.remove doesn't handle str IDs smoothly
        db.collection(crud.collection_name).document(routine_id).delete()
        
    return {"status": "success", "message": "Routine deleted"}
