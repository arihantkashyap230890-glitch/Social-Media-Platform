from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os

# Database URL - MongoDB configuration
# Update this with your MongoDB connection string
# Default: mongodb://localhost:27017 (for local MongoDB)
# For MongoDB Atlas: mongodb+srv://username:password@cluster.mongodb.net/database_name
DATABASE_URL = os.getenv("DATABASE_URL", "mongodb://localhost:27017/connect_hub")

# Create engine
engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {},
    echo=False
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
