from fastapi import FastAPI, Depends, HTTPException, status, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
import os
from datetime import datetime, timedelta
from typing import Optional, List
import jwt
from passlib.context import CryptContext

from database import Base, engine, get_db
from models import User, Comment, Like, Follow, Notification, DirectMessage
from schemas import (
    UserRegister, UserLogin, TokenResponse, UserResponse,
    PostCreate, PostResponse, CommentCreate, CommentResponse,
    NotificationResponse, DirectMessageCreate, DirectMessageResponse
)
from routers import auth, users, posts, comments, notifications, messages, follows, ai, nsfw

# Create tables
Base.metadata.create_all(bind=engine)

# Initialize FastAPI app
app = FastAPI(
    title="Connect Hub API",
    description="Social Media Backend API",
    version="1.0.0"
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files
app.mount("/static", StaticFiles(directory="."), name="static")

# Serve the main HTML page
@app.get("/")
async def read_root():
    return FileResponse("index.html")

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(users.router, prefix="/api/users", tags=["Users"])
app.include_router(posts.router, prefix="/api/posts", tags=["Posts"])
app.include_router(comments.router, prefix="/api/comments", tags=["Comments"])
app.include_router(notifications.router, prefix="/api/notifications", tags=["Notifications"])
app.include_router(messages.router, prefix="/api/messages", tags=["Messages"])
app.include_router(follows.router, prefix="/api/follows", tags=["Follows"])
app.include_router(ai.router, prefix="/api/ai", tags=["AI / ML"])
app.include_router(nsfw.router, prefix="/api/nsfw", tags=["NSFW"])

# Root endpoint
@app.get("/", tags=["Root"])
async def root():
    """Welcome endpoint"""
    return {
        "message": "Welcome to Connect Hub API",
        "version": "1.0.0",
        "docs": "/docs",
        "endpoints": {
            "auth": "/api/auth",
            "users": "/api/users",
            "posts": "/api/posts",
            "comments": "/api/comments",
            "notifications": "/api/notifications",
            "messages": "/api/messages",
            "follows": "/api/follows",
            "ai_ml": "/api/ai"
        }
    }

# Health check endpoint
@app.get("/health", tags=["Health"])
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "timestamp": datetime.now()}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
