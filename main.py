import shutil
from datetime import datetime
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, Response
from fastapi.staticfiles import StaticFiles

import ai
import auth
import comments
import calls
import follows
import messages
import notifications
import nsfw
import posts
import users
from database import Base, engine

# Create tables
Base.metadata.create_all(bind=engine)

project_root = Path(__file__).parent
static_folder = project_root / "static"
static_folder.mkdir(exist_ok=True)


def sync_frontend_assets() -> None:
    """Keep frontend assets available under /static."""
    for asset_name in ("index.html", "style.css", "style.next.css", "abc.js"):
        source = project_root / asset_name
        target = static_folder / asset_name
        if source.exists():
            shutil.copy2(source, target)

    source_images = project_root / "Images"
    target_images = static_folder / "Images"
    if source_images.exists():
        target_images.mkdir(exist_ok=True)
        for image_path in source_images.iterdir():
            if image_path.is_file():
                shutil.copy2(image_path, target_images / image_path.name)


sync_frontend_assets()

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
app.mount("/static", StaticFiles(directory=str(static_folder)), name="static")


@app.get("/")
async def read_root():
    index_path = static_folder / "index.html"
    if not index_path.exists():
        index_path = project_root / "index.html"
    return FileResponse(str(index_path), media_type="text/html")


@app.get("/static/style.css")
async def serve_style():
    style_path = static_folder / "style.css"
    if not style_path.exists():
        style_path = project_root / "style.css"
    if style_path.exists():
        return FileResponse(str(style_path), media_type="text/css")
    raise HTTPException(status_code=404, detail="CSS file not found")


@app.get("/static/style.next.css")
async def serve_style_next():
    style_path = static_folder / "style.next.css"
    if not style_path.exists():
        style_path = project_root / "style.next.css"
    if style_path.exists():
        return FileResponse(str(style_path), media_type="text/css")
    raise HTTPException(status_code=404, detail="CSS file not found")


@app.get("/static/abc.js")
async def serve_abc_js():
    js_path = static_folder / "abc.js"
    if not js_path.exists():
        js_path = project_root / "abc.js"
    if js_path.exists():
        return FileResponse(str(js_path), media_type="application/javascript")
    raise HTTPException(status_code=404, detail="JS file not found")


@app.get("/static/Images/{filename}")
async def serve_images(filename: str):
    image_paths = [
        static_folder / "Images" / filename,
        project_root / "Images" / filename
    ]
    for image_path in image_paths:
        if image_path.exists():
            ext = filename.split(".")[-1].lower()
            mime_types = {
                "jpeg": "image/jpeg",
                "jpg": "image/jpeg",
                "png": "image/png",
                "gif": "image/gif",
                "svg": "image/svg+xml",
                "webp": "image/webp",
            }
            return FileResponse(str(image_path), media_type=mime_types.get(ext, "application/octet-stream"))
    raise HTTPException(status_code=404, detail="Image not found")


@app.get("/favicon.ico")
async def favicon():
    favicon_paths = [
        static_folder / "favicon.ico",
        project_root / "favicon.ico"
    ]
    for favicon_path in favicon_paths:
        if favicon_path.exists():
            return FileResponse(str(favicon_path), media_type="image/x-icon")
    return Response(status_code=204)


# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(users.router, prefix="/api/users", tags=["Users"])
app.include_router(posts.router, prefix="/api/posts", tags=["Posts"])
app.include_router(comments.router, prefix="/api/comments", tags=["Comments"])
app.include_router(notifications.router, prefix="/api/notifications", tags=["Notifications"])
app.include_router(messages.router, prefix="/api/messages", tags=["Messages"])
app.include_router(calls.router, prefix="/api/calls", tags=["Calls"])
app.include_router(follows.router, prefix="/api/follows", tags=["Follows"])
app.include_router(ai.router, prefix="/api/ai", tags=["AI / ML"])
app.include_router(nsfw.router, prefix="/api/nsfw", tags=["NSFW"])


@app.get("/api", tags=["API"])
async def api_root():
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
            "ai_ml": "/api/ai",
            "nsfw": "/api/nsfw",
        }
    }


@app.get("/health", tags=["Health"])
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now()}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
