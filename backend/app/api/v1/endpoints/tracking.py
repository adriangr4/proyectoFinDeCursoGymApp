from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException
from google.cloud import firestore

from app.db.session import get_db
from app.schemas import tracking as schemas
from app.schemas.social import ContentRatingCreate, ContentRatingUpdate
from app.services.tracking import scheduled_workout as crud_sw
from app.services.social import content_rating as crud_rating
from app.services.routine import routine as crud_routine
from app.api import deps
from datetime import date, datetime
from app.core.gamification import calculate_level

router = APIRouter()

# --- Scheduled Workouts ---

@router.get("/", response_model=List[schemas.ScheduledWorkout])
def read_scheduled_workouts(
    db: firestore.Client = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    user_id: Optional[str] = None
):
    """
    Retrieve scheduled workouts. Optional filter by user_id.
    """
    if user_id:
        return crud_sw.get_by_user(db, user_id=user_id, skip=skip, limit=limit)
    return crud_sw.get_multi(db, skip=skip, limit=limit)

@router.post("/", response_model=schemas.ScheduledWorkout)
def create_scheduled_workout(
    *,
    db: firestore.Client = Depends(get_db),
    workout_in: schemas.ScheduledWorkoutCreate,
    current_user: Any = Depends(deps.get_current_active_user),
):
    """
    Create new scheduled workout.
    """
    # Inject user_id
    workout_data = workout_in.model_dump()
    workout_data["user_id"] = current_user.id
    # Default status pending
    
    # We call crude generic create with dict
    # Using internal logic of CRUDBase to add it
    # note: CRUDBase.create expects Schema type usually but relies on jsonable_encoder
    # so passing dict usually works if typed properly? 
    # Actually CRUDBase signature is strict on obj_in: CreateSchemaType.
    # But python runtime doesn't enforce it.
    
    # Proper way: create Schema instance with user_id injected if schema allows.
    # ScheduledWorkoutCreate does NOT have user_id.
    # So we must use dict approach and hope code handles it.
    
    # To avoid Pydantic validation error in CRUDBase when it tries to use schema...
    # CRUDBase.create: obj_in_data = jsonable_encoder(obj_in) -> works for dict too.
    # Then self.model(**obj_in_data).
    # If self.model (ScheduledWorkout) has user_id, it works.
    
    # But wait, we need to pass a dict to `create`.
    # And my `CRUDBase` implementation: `obj_in_data = jsonable_encoder(obj_in)`. 
    # If I pass a dict, `obj_in` is a dict. `jsonable_encoder` handles dict.
    # `db.collection().add(obj_in_data)`.
    # `return self.model(id=..., **obj_in_data)`.
    # Yes, it should work.
    
    return crud_sw.create(db=db, obj_in=workout_data)

@router.put("/{workout_id}", response_model=schemas.ScheduledWorkout)
def update_scheduled_workout(
    *,
    db: firestore.Client = Depends(get_db),
    workout_id: str,
    workout_in: schemas.ScheduledWorkoutUpdate,
):
    """
    Update a scheduled workout (e.g. mark as completed).
    """
    workout = crud_sw.get(db, id=workout_id)
    if not workout:
        raise HTTPException(status_code=404, detail="Workout not found")
    workout = crud_sw.update(db, id=workout_id, obj_in=workout_in)
    workout = crud_sw.update(db, id=workout_id, obj_in=workout_in)
    return workout

@router.get("/{workout_id}", response_model=schemas.ScheduledWorkout)
def read_scheduled_workout(
    workout_id: str,
    db: firestore.Client = Depends(get_db),
):
    """
    Get a scheduled workout by ID with full details (exercises populated in logs).
    """
    workout = crud_sw.get(db, id=workout_id)
    if not workout:
        raise HTTPException(status_code=404, detail="Workout not found")
        
    # Convert to dict to manipulate
    workout_dict = workout.model_dump() if hasattr(workout, "model_dump") else dict(workout)
    
    # Populate exercises in logs
    if "logs" in workout_dict and workout_dict["logs"]:
        # Collect exercise IDs
        ex_ids = set()
        for log in workout_dict["logs"]:
            if "exercise_id" in log:
                ex_ids.add(log["exercise_id"])
        
        # Batch fetch exercises
        ex_lookup = {}
        if ex_ids:
            refs = [db.collection("exercises").document(eid) for eid in ex_ids]
            chunks = [refs[i:i + 100] for i in range(0, len(refs), 100)]
            for chunk in chunks:
                docs = db.get_all(chunk)
                for doc in docs:
                    if doc.exists:
                        d = doc.to_dict()
                        d["id"] = doc.id
                        ex_lookup[doc.id] = d
        
        # Attach to logs
        for log in workout_dict["logs"]:
            if "exercise_id" in log and log["exercise_id"] in ex_lookup:
                # We need to ensure Schema allows 'exercise' field in WorkoutLog?
                # WorkoutLog in schemas/tracking.py doesn't seem to have 'exercise' nested field explicitly defined in Pydantic?
                # Let's check schemas/tracking.py again.
                # It has `exercise_id` but no `exercise` field. 
                # We might need to add it to generic response or just let Pydantic ignore extra fields if configured?
                # Or update schema.
                log["exercise"] = ex_lookup[log["exercise_id"]]
                
    return workout_dict

# --- Logs (Nested) ---

@router.post("/{workout_id}/logs", response_model=schemas.ScheduledWorkout) # Return entire workout or just log?
# Returning WorkoutLog is tricky if no ID. But let's return the updated workout.
# Or we just return generic success.
# Original returned WorkoutLog. Firestore logs are embedded.
# We will return the updated ScheduledWorkout.
# But clients might expect WorkoutLog. 
# We'll change response_model to ScheduledWorkout for correctness with embedding.
def create_workout_log(
    *,
    db: firestore.Client = Depends(get_db),
    workout_id: str,
    log_in: schemas.WorkoutLogCreate,
):
    """
    Add a log (set) to a workout.
    """
    workout = crud_sw.get(db, id=workout_id)
    if not workout:
        raise HTTPException(status_code=404, detail="Workout not found")
    
    # Embed logic
    # Retrieve current logs, append new one, update document.
    current_logs = [log.model_dump() for log in workout.logs] if workout.logs else []
    
    new_log_data = log_in.model_dump()
    # Generate a pseudo ID for the log if needed by frontend
    import uuid
    new_log_data['id'] = str(uuid.uuid4())
    new_log_data['workout_id'] = workout_id
    new_log_data['created_at'] = datetime.utcnow().isoformat()
    
    current_logs.append(new_log_data)
    
    crud_sw.update(db, id=workout_id, obj_in={"logs": current_logs})
    
    # Return updated workout
    return crud_sw.get(db, id=workout_id)


@router.post("/log-session", response_model=schemas.WorkoutCompletionResponse)
def log_session(
    *,
    db: firestore.Client = Depends(get_db),
    session_in: schemas.WorkoutSessionLog,
    current_user = Depends(deps.get_current_active_user),
):
    """
    Log a completed workout session with summary stats and rating.
    """

    try:
        # Prepare logs with IDs
        import uuid
        logs_data = []
        if session_in.logs:
            for log_item in session_in.logs:
                d = log_item.model_dump()
                d['id'] = str(uuid.uuid4())
                d['created_at'] = datetime.utcnow().isoformat()
                logs_data.append(d)

        workout_data = {
            "user_id": current_user.id,
            "routine_id": session_in.routine_id,
            "scheduled_date": date.today().isoformat(),
            "status": 'completed',
            "notes": f"Difficulty: {session_in.difficulty}, Rating: {session_in.rating}/5. Notes: {session_in.notes or ''}",
            "duration_seconds": session_in.duration_seconds,
            "calories_burned": session_in.calories_burned,
            "created_at": datetime.utcnow().isoformat(),
            "logs": logs_data
        }
        
        # 1. Create ScheduledWorkout
        workout = crud_sw.create(db=db, obj_in=workout_data)
        
        # 2. Add or Update Rating
        existing = crud_rating.get_by_rater_and_content(
            db, 
            rater_id=current_user.id, 
            content_type='routine', 
            content_id=session_in.routine_id
        )
        
        if existing:
            crud_rating.update(db, id=existing.id, obj_in={"score": session_in.rating})
        else:
            rating_data = {
                "rater_id": current_user.id,
                "content_type": 'routine',
                "content_id": session_in.routine_id,
                "score": session_in.rating
            }
            crud_rating.create(db=db, obj_in=rating_data)
            
        # 3. Gamification: Award XP
        xp_gained = int(session_in.calories_burned / 2) if session_in.calories_burned else 50
        
        # Update user XP
        from app.services.user import user as crud_user
        
        user_data = crud_user.get(db, id=current_user.id)
        current_xp = user_data.xp or 0
        new_total_xp = current_xp + xp_gained
        
        # Calculate Levels
        old_level = calculate_level(current_xp)
        new_level = calculate_level(new_total_xp)
        level_up = new_level > old_level
        
        # Update DB
        crud_user.update(db, id=current_user.id, obj_in={"xp": new_total_xp})
        
        prev_level_xp = (new_level - 1) ** 2 * 100
        next_level_xp = new_level ** 2 * 100
            
        return {
            "workout": workout.model_dump(),
            "xp_gained": xp_gained,
            "new_total_xp": new_total_xp,
            "new_level": new_level,
            "level_up": level_up,
            "prev_level_xp": prev_level_xp,
            "next_level_xp": next_level_xp
        }

    except Exception as e:
        print(f"Error logging session: {e}") 
        raise HTTPException(status_code=400, detail=f"Error saving workout: {str(e)}")
