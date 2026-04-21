from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
import os

# Database URL - SQLite for development
# To use MongoDB, you'll need to switch to mongoengine or use pymongo directly
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///:memory:")

engine_kwargs = {"echo": False}
sqlite_connect_args = {}
if DATABASE_URL.startswith("sqlite"):
    sqlite_connect_args["check_same_thread"] = False
    if DATABASE_URL in {"sqlite:///:memory:", "sqlite://"}:
        engine_kwargs["poolclass"] = StaticPool

# Create engine
engine = create_engine(
    DATABASE_URL,
    connect_args=sqlite_connect_args,
    **engine_kwargs
)

# Session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for models
Base = declarative_base()

# Dependency to get database session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
