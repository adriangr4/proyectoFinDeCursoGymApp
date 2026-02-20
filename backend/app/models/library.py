from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, Text, DECIMAL, TIMESTAMP
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base_class import Base

class Exercise(Base):
    __tablename__ = "exercises"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    description = Column(Text)
    muscle_group = Column(String(50))
    video_url = Column(String(255))
    created_at = Column(TIMESTAMP, server_default=func.now())

    routine_exercises = relationship("RoutineExercise", back_populates="exercise")
    workout_logs = relationship("WorkoutLog", back_populates="exercise")

class Food(Base):
    __tablename__ = "foods"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    calories_per_100g = Column(DECIMAL(6, 2))
    protein_per_100g = Column(DECIMAL(5, 2))
    carbs_per_100g = Column(DECIMAL(5, 2))
    fat_per_100g = Column(DECIMAL(5, 2))
    created_at = Column(TIMESTAMP, server_default=func.now())

    diet_foods = relationship("DietFood", back_populates="food")

class Routine(Base):
    __tablename__ = "routines"

    id = Column(Integer, primary_key=True, index=True)
    creator_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(100), nullable=False)
    description = Column(Text)
    is_public = Column(Boolean, default=False)
    average_rating = Column(DECIMAL(3, 2), default=0.00)
    rating_count = Column(Integer, default=0)
    created_at = Column(TIMESTAMP, server_default=func.now())

    creator = relationship("User", back_populates="routines")
    exercises = relationship("RoutineExercise", back_populates="routine", cascade="all, delete-orphan")
    scheduled_workouts = relationship("ScheduledWorkout", back_populates="routine")

class RoutineExercise(Base):
    __tablename__ = "routine_exercises"

    id = Column(Integer, primary_key=True, index=True)
    routine_id = Column(Integer, ForeignKey("routines.id", ondelete="CASCADE"), nullable=False)
    exercise_id = Column(Integer, ForeignKey("exercises.id", ondelete="CASCADE"), nullable=False)
    day_of_week = Column(Integer)
    order_index = Column(Integer)
    target_sets = Column(Integer)
    target_reps_min = Column(Integer)
    target_reps_max = Column(Integer)

    routine = relationship("Routine", back_populates="exercises")
    exercise = relationship("Exercise", back_populates="routine_exercises")

class Diet(Base):
    __tablename__ = "diets"

    id = Column(Integer, primary_key=True, index=True)
    creator_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(100), nullable=False)
    description = Column(Text)
    is_public = Column(Boolean, default=False)
    average_rating = Column(DECIMAL(3, 2), default=0.00)
    rating_count = Column(Integer, default=0)
    created_at = Column(TIMESTAMP, server_default=func.now())

    creator = relationship("User", back_populates="diets")
    foods = relationship("DietFood", back_populates="diet", cascade="all, delete-orphan")

    @property
    def calories(self):
        return sum([(f.food.calories_per_100g * f.quantity_grams / 100) for f in self.foods]) if self.foods else 0

    @property
    def protein(self):
        return sum([(f.food.protein_per_100g * f.quantity_grams / 100) for f in self.foods]) if self.foods else 0

    @property
    def carbs(self):
        return sum([(f.food.carbs_per_100g * f.quantity_grams / 100) for f in self.foods]) if self.foods else 0

    @property
    def fats(self):
        return sum([(f.food.fat_per_100g * f.quantity_grams / 100) for f in self.foods]) if self.foods else 0


class DietFood(Base):
    __tablename__ = "diet_foods"

    id = Column(Integer, primary_key=True, index=True)
    diet_id = Column(Integer, ForeignKey("diets.id", ondelete="CASCADE"), nullable=False)
    food_id = Column(Integer, ForeignKey("foods.id", ondelete="CASCADE"), nullable=False)
    meal_name = Column(String(50))
    quantity_grams = Column(DECIMAL(6, 2))

    diet = relationship("Diet", back_populates="foods")
    food = relationship("Food", back_populates="diet_foods")
