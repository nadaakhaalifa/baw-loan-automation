from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from app.core.config import settings

"""
Database Configuration

Handles PostgreSQL database connection setup
using SQLAlchemy.

Responsibilities:
- Create database engine
- Create database sessions
- Provide dependency injection for DB sessions
- Define SQLAlchemy Base model

Used across all workflow modules.
"""

engine = create_engine(settings.DATABASE_URL)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


class Base(DeclarativeBase):
    pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()