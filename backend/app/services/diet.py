from app.services.base import CRUDBase
from app.schemas.diet import DietPlan as Diet, DietPlanCreate as DietCreate
from google.cloud import firestore

class CRUDDiet(CRUDBase[Diet, DietCreate, DietCreate]):
    pass

diet = CRUDDiet("diets", Diet)
