from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    PROJECT_NAME: str = "GymTrack API"
    API_V1_STR: str = "/api/v1"
    
    # Database
    FIREBASE_CREDENTIALS_PATH: str = "serviceAccountKey.json"

    # Security
    SECRET_KEY: str = "YOUR_SUPER_SECRET_KEY_HERE_CHANGE_IN_PRODUCTION"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 8 # 8 days

    class Config:
        case_sensitive = True
        env_file = ".env"

settings = Settings()
