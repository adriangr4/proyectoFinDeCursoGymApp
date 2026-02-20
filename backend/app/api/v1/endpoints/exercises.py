from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from google.cloud import firestore

from app.db.session import get_db
from app.schemas import exercise as schemas
from app.services.exercise import exercise as crud

router = APIRouter()

@router.get("/", response_model=List[schemas.Exercise])
def read_exercises(
    db: firestore.Client = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
):
    """
    Retrieve exercises.
    """
    exercises = crud.get_multi(db, skip=skip, limit=limit)
    return exercises

@router.post("/", response_model=schemas.Exercise)
def create_exercise(
    *,
    db: firestore.Client = Depends(get_db),
    exercise_in: schemas.ExerciseCreate,
):
    """
    Create new exercise.
    """
    exercise = crud.create(db=db, obj_in=exercise_in)
    return exercise
