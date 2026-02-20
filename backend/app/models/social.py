from sqlalchemy import Column, Integer, ForeignKey, Enum, TIMESTAMP, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from sqlalchemy.dialects.mysql import TINYINT
from app.db.base_class import Base

class ContentRating(Base):
    __tablename__ = "content_ratings"

    id = Column(Integer, primary_key=True, index=True)
    rater_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    content_type = Column(Enum('routine', 'diet'), nullable=False)
    content_id = Column(Integer, nullable=False)
    score = Column(TINYINT, nullable=False)
    created_at = Column(TIMESTAMP, server_default=func.now())

    rater = relationship("User", back_populates="ratings")

    __table_args__ = (
        UniqueConstraint('rater_id', 'content_type', 'content_id', name='unique_rating'),
    )
