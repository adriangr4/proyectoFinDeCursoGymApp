from sqlalchemy import Column, Integer, String, ForeignKey, Text, DECIMAL, TIMESTAMP, Date, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base_class import Base

class ScheduledWorkout(Base):
    __tablename__ = "scheduled_workouts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    routine_id = Column(Integer, ForeignKey("routines.id", ondelete="SET NULL"), nullable=True)
    scheduled_date = Column(Date, nullable=False)
    status = Column(Enum('pending', 'completed', 'skipped'), default='pending')
    notes = Column(Text)
    created_at = Column(TIMESTAMP, server_default=func.now())

    user = relationship("User", back_populates="scheduled_workouts")
    routine = relationship("Routine", back_populates="scheduled_workouts")
    logs = relationship("WorkoutLog", back_populates="scheduled_workout", cascade="all, delete-orphan")

    @property
    def duration_seconds(self):
        import re
        if not self.notes:
            return 0
        match = re.search(r"Duration: (\d+)s", self.notes)
        return int(match.group(1)) if match else 0

    @property
    def calories_burned(self):
        import re
        if not self.notes:
            return 0
        match = re.search(r"Calories: ([\d\.]+)", self.notes)
        return float(match.group(1)) if match else 0

class WorkoutLog(Base):
    __tablename__ = "workout_logs"

    id = Column(Integer, primary_key=True, index=True)
    scheduled_workout_id = Column(Integer, ForeignKey("scheduled_workouts.id", ondelete="CASCADE"), nullable=False)
    exercise_id = Column(Integer, ForeignKey("exercises.id", ondelete="CASCADE"), nullable=False)
    set_number = Column(Integer)
    weight_kg = Column(DECIMAL(6, 2))
    reps = Column(Integer)
    rpe = Column(Integer)
    notes = Column(Text)
    performed_at = Column(TIMESTAMP, server_default=func.now())

    scheduled_workout = relationship("ScheduledWorkout", back_populates="logs")
    exercise = relationship("Exercise", back_populates="workout_logs")
