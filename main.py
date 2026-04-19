from fastapi import FastAPI, Depends, HTTPException, status, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, Response
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
import os
from datetime import datetime, timedelta
from typing import Optional, List
from pathlib import Path
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

# Mount static files with correct MIME types
from pathlib import Path
from fastapi.staticfiles import StaticFiles
import os

# Use static folder if it exists, otherwise use root directory
static_folder = Path(__file__).parent / "static"
if not static_folder.exists():
    # Create static folder and copy files if they don't exist
    static_folder.mkdir(exist_ok=True)
    
# Mount static files
app.mount("/static", StaticFiles(directory=str(static_folder)), name="static")

# Serve index.html from root for the / path
@app.get("/")
async def read_root():
    # Look for index.html in static folder first, then root
    index_path = static_folder / "index.html"
    if not index_path.exists():
        index_path = Path(__file__).parent / "index.html"
    return FileResponse(str(index_path), media_type="text/html")

# CSS route (already served by static mount, but keep for explicit control)
@app.get("/static/style.css")
async def serve_style():
    style_path = static_folder / "style.css"
    if not style_path.exists():
        style_path = Path(__file__).parent / "style.css"
    if style_path.exists():
        return FileResponse(str(style_path), media_type="text/css")
    raise HTTPException(status_code=404, detail="CSS file not found")

@app.get("/static/style.next.css")
async def serve_style_next():
    style_path = static_folder / "style.next.css"
    if not style_path.exists():
        style_path = Path(__file__).parent / "style.next.css"
    if style_path.exists():
        return FileResponse(str(style_path), media_type="text/css")
    raise HTTPException(status_code=404, detail="CSS file not found")

# Serve JS files with correct MIME type
@app.get("/static/abc.js")
async def serve_abc_js():
    js_path = static_folder / "abc.js"
    if not js_path.exists():
        js_path = Path(__file__).parent / "abc.js"
    if js_path.exists():
        return FileResponse(str(js_path), media_type="application/javascript")
    raise HTTPException(status_code=404, detail="JS file not found")

# Serve images with correct MIME type
@app.get("/static/Images/{filename}")
async def serve_images(filename: str):
    image_paths = [
        static_folder / "Images" / filename,
        Path(__file__).parent / "Images" / filename
    ]
    for image_path in image_paths:
        if image_path.exists():
            # Determine MIME type based on file extension
            ext = filename.split('.')[-1].lower()
            mime_types = {
                'jpeg': 'image/jpeg',
                'jpg': 'image/jpeg',
                'png': 'image/png',
                'gif': 'image/gif',
                'svg': 'image/svg+xml',
                'webp': 'image/webp'
            }
            media_type = mime_types.get(ext, 'application/octet-stream')
            return FileResponse(str(image_path), media_type=media_type)
    raise HTTPException(status_code=404, detail="Image not found")

# Serve favicon
@app.get("/favicon.ico")
async def favicon():
    # If favicon doesn't exist, return a 204 No Content instead of 404
    favicon_paths = [
        static_folder / "favicon.ico",
        Path(__file__).parent / "favicon.ico"
    ]
    for favicon_path in favicon_paths:
        if favicon_path.exists():
            return FileResponse(str(favicon_path), media_type="image/x-icon")
    # Return empty response to suppress 404 errors
    from fastapi.responses import Response
    return Response(status_code=204)

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

# API root endpoint
@app.get("/api", tags=["API"])
async def api_root():
    """API root endpoint"""
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
    uvicorn.run(app, host="0.0.0.0", port=8000)
