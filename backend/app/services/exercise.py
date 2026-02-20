from app.services.base import CRUDBase
from app.schemas.exercise import Exercise, ExerciseCreate, ExerciseUpdate
from google.cloud import firestore

class CRUDExercise(CRUDBase[Exercise, ExerciseCreate, ExerciseUpdate]):
    pass

exercise = CRUDExercise("exercises", Exercise)
