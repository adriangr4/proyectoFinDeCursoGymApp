from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, Date, Numeric, Enum, DECIMAL, TIMESTAMP
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base_class import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    profile_picture = Column(String(255), nullable=True)
    reputation_score = Column(DECIMAL(3, 2), default=0.00)
    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())

    profile = relationship("UserProfile", back_populates="user", uselist=False)
    routines = relationship("Routine", back_populates="creator")
    diets = relationship("Diet", back_populates="creator")
    scheduled_workouts = relationship("ScheduledWorkout", back_populates="user")
    ratings = relationship("ContentRating", back_populates="rater")

class UserProfile(Base):
    __tablename__ = "user_profiles"

    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    height_cm = Column(DECIMAL(5, 2))
    weight_kg = Column(DECIMAL(5, 2))
    birth_date = Column(Date)
    gender = Column(Enum('male', 'female', 'other'), nullable=True)
    activity_level = Column(Enum('sedentary', 'light', 'moderate', 'active', 'very_active'), nullable=True)
    bmr = Column(DECIMAL(6, 2))
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())

    user = relationship("User", back_populates="profile")
