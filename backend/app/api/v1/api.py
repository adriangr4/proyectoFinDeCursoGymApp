from fastapi import APIRouter
from app.api.v1.endpoints import auth, users, routines, tracking, diet, social, nutrition, exercises

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(routines.router, prefix="/routines", tags=["routines"])
api_router.include_router(exercises.router, prefix="/exercises", tags=["exercises"])
api_router.include_router(tracking.router, prefix="/tracking", tags=["tracking"])
api_router.include_router(diet.router, prefix="/diets", tags=["diet"])
api_router.include_router(nutrition.router, prefix="/nutrition", tags=["nutrition"])
api_router.include_router(social.router, prefix="/social", tags=["social"])
api_router.include_router(auth.router, tags=["login"])
