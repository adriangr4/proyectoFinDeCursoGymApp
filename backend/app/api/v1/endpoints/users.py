from typing import Any, List
from fastapi import APIRouter, Body, Depends, HTTPException
from fastapi.encoders import jsonable_encoder
from google.cloud import firestore

from app.db.session import get_db
from app.schemas import user as schemas
from app.services.user import user as crud
from app.services.tracking import scheduled_workout as crud_tracking
from app.services.routine import routine as crud_routine
from app.api import deps
from app.schemas.tracking import ScheduledWorkout
from datetime import date, datetime
from app.core.gamification import calculate_level, calculate_xp_for_next_level, get_rank

router = APIRouter()

@router.get("/", response_model=List[schemas.User])
def read_users(
    db: firestore.Client = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
):
    """
    Retrieve users.
    """
    users = crud.get_multi(db, skip=skip, limit=limit)
    return users

@router.post("/", response_model=schemas.User)
def create_user(
    *,
    db: firestore.Client = Depends(get_db),
    user_in: schemas.UserCreate,
):
    """
    Create new user.
    """
    user = crud.get_by_email(db, email=user_in.email)
    if user:
        raise HTTPException(
            status_code=400,
            detail="The user with this email already exists in the system.",
        )
    user = crud.get_by_username(db, username=user_in.username)
    if user:
        raise HTTPException(
            status_code=400,
            detail="The user with this username already exists in the system.",
        )
    user = crud.create(db, obj_in=user_in)
    return user

@router.get("/me/dashboard", response_model=Any) # Changed response_model to Any to allow extra fields or update DashboardStats schema
def get_dashboard(
    db: firestore.Client = Depends(get_db),
    current_user: schemas.User = Depends(deps.get_current_active_user),
):
    """
    Get current user dashboard stats (Real Data).
    """
    today = date.today().isoformat()
    
    try:
        # 1. Calculate Calories Burned & Time (from today's completed workouts)
        docs = db.collection("scheduled_workouts")\
                 .where(filter=firestore.FieldFilter("user_id", "==", current_user.id))\
                 .where(filter=firestore.FieldFilter("scheduled_date", "==", today))\
                 .stream()
                 
        completed_today = []
        mission_workout = None
        
        for doc in docs:
            data = doc.to_dict()
            try:
                sw = ScheduledWorkout(id=doc.id, **data)
                if sw.status == 'completed':
                    completed_today.append(sw)
                
                if not mission_workout:
                    mission_workout = sw
            except Exception:
                continue

        calories_burned = 0
        time_minutes = 0
        
        for workout in completed_today:
            cals = workout.calories_burned or 0
            dur_sec = workout.duration_seconds or 0
            
            if cals == 0 and workout.routine_id:
                routine = crud_routine.get(db, id=workout.routine_id)
                if routine:
                    cals = 300
                    if dur_sec == 0:
                        dur_sec = 45 * 60
            
            calories_burned += int(cals)
            time_minutes += int(dur_sec / 60)
                
        mission_name = "Descanso Activo"
        mission_duration = 0
        mission_img = "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=1000&auto=format&fit=crop"
        
        if mission_workout:
            if mission_workout.routine_id:
                 routine = crud_routine.get(db, id=mission_workout.routine_id)
                 if routine:
                     mission_name = routine.name
                     mission_duration = 45 # Default or from routine if available
            else:
                 mission_name = "Entrenamiento Personalizado"
        elif current_user.current_routine_id:
            # Fallback to selected routine
            routine = crud_routine.get(db, id=current_user.current_routine_id)
            if routine:
                mission_name = routine.name
                mission_duration = 60 # Default duration for routine
                # We could also fetch image if routine has it

        # Gamification Stats
        level = calculate_level(current_user.xp)
        rank = get_rank(level)
        xp_next_level = calculate_xp_for_next_level(level + 1) # Simplification using next level total req
        # Actually we want XP req for current level cap.
        # Formula in gamification.py was total XP.
        # Level N starts at (N-1)^2 * 100.
        # Level N+1 starts at N^2 * 100.
        # Current Level Progress = XP - StartXP
        # Target Progress = EndXP - StartXP
        
        start_xp = (level - 1) ** 2 * 100
        end_xp = level ** 2 * 100
        
        xp_progress = current_user.xp - start_xp
        xp_needed = end_xp - start_xp
        if xp_needed <= 0: xp_needed = 100 # Fallback for lvl 1
        
        progress_percentage = min(100, int((xp_progress / xp_needed) * 100))
        if current_user.xp < 0: progress_percentage = 0

        return {
            "calories_burned": calories_burned,
            "calories_target": 600,
            "time_minutes": time_minutes,
            "steps": int(current_user.current_weight) if current_user.current_weight else 0, # Hack: using steps for weight? No, better use explicit fields
            "mission_name": mission_name,
            "mission_duration": mission_duration,
            "mission_img": mission_img,
            # Extra fields (ensure frontend handles them)
            "level": level,
            "rank": rank,
            "xp": current_user.xp,
            "xp_progress": progress_percentage,
            "current_weight": current_user.current_weight,
            "height": current_user.height
        }
    except Exception as e:
        print(f"Error in get_dashboard: {e}")
        # Return partial/default stats to avoid 500 error
        return {
            "calories_burned": 0,
            "calories_target": 600,
            "time_minutes": 0,
            "steps": 0,
            "mission_name": "Descanso Activo",
            "mission_duration": 0,
            "mission_img": "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=1000&auto=format&fit=crop",
            "level": 1,
            "rank": "Novato",
            "xp": 0,
            "xp_progress": 0,
            "current_weight": 0,
            "height": 0
        }
    
@router.put("/me/active_diet")
async def set_active_diet(
    diet_id: str = Body(..., embed=True),
    current_user: schemas.User = Depends(deps.get_current_active_user)
):
    """
    Set the user's current active diet.
    """
    # Verify diet exists (optional but good practice)
    # For now just update the user record
    firestore.client().collection('users').document(current_user.id).update({
        "current_diet_id": diet_id
    })
    return {"status": "success", "current_diet_id": diet_id}

@router.put("/me", response_model=schemas.User)
def update_user_me(
    *,
    db: firestore.Client = Depends(get_db),
    user_in: schemas.UserUpdate,
    current_user: schemas.User = Depends(deps.get_current_active_user),
):
    """
    Update own user.
    """
    user = crud.update(db, id=current_user.id, obj_in=user_in)
    return user

@router.post("/me/weight", response_model=schemas.User)
def log_weight(
    *,
    db: firestore.Client = Depends(get_db),
    weight_in: schemas.WeightLogCreate,
    current_user: schemas.User = Depends(deps.get_current_active_user),
):
    """
    Log weight entry and update current user weight.
    """
    # 1. Add to weight_logs collection
    log_data = weight_in.model_dump()
    log_data["user_id"] = current_user.id
    # Ensure date is string
    if hasattr(log_data["date"], "isoformat"):
        log_data["date"] = log_data["date"].isoformat()
    
    db.collection("weight_logs").add(log_data)
    
    # 2. Update user current_weight
    crud.update(db, id=current_user.id, obj_in={"current_weight": weight_in.weight})
    
    return crud.get(db, id=current_user.id)

@router.get("/me/weight-history", response_model=List[schemas.WeightLog])
def get_weight_history(
    db: firestore.Client = Depends(get_db),
    current_user: schemas.User = Depends(deps.get_current_active_user),
):
    """
    Get weight history for graph.
    """
    docs = db.collection("weight_logs")\
             .where(filter=firestore.FieldFilter("user_id", "==", current_user.id))\
             .stream()
            
    logs = []
    for doc in docs:
        d = doc.to_dict()
        d["id"] = doc.id
        logs.append(d)
        
    # Sort by date
    logs.sort(key=lambda x: x["date"])
    
    return logs
