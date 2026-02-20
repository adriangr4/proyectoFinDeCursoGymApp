from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from google.cloud import firestore

from app.core.config import settings
from app.db.session import get_db

from app.api.v1.api import api_router

app = FastAPI(title=settings.PROJECT_NAME)

# Set up CORS
origins = [
    "http://localhost",
    "http://localhost:5173", # Vite default port
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from fastapi.exceptions import RequestValidationError
from fastapi.requests import Request
from fastapi.responses import JSONResponse

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    print(f"Validation error: {exc}")
    return JSONResponse(
        status_code=422,
        content={"detail": exc.errors(), "body": exc.body},
    )

app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/")
def read_root():
    return {"message": "Bienvenido a GymTrack API (Firestore)"}

@app.get("/health")
def health_check(db: firestore.Client = Depends(get_db)):
    try:
        # Simple check: list collections (fast) or just check project
        # db.collections() returns a generator
        # Note: python client collections() does not accept limit argument directly in all versions
        # Just getting the iterator is enough to verify connection structure
        cols = db.collections()
        # triggering a tiny read
        next(cols, None)
        return {"status": "ok", "database": "connected", "project": db.project}
    except Exception as e:
        return {"status": "error", "database": str(e)}
