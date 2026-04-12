from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
from models import Post, User
from schemas import PostCreate, PostResponse, PostDetailResponse

router = APIRouter()

@router.get("/", response_model=list[PostResponse])
async def get_nsfw_posts(db: Session = Depends(get_db)):
    """Get all NSFW posts (18+ content)"""
    posts = (
        db.query(Post)
        .filter(Post.is_nsfw == True)
        .order_by(Post.created_at.desc())
        .all()
    )
    return posts

@router.post("/", response_model=PostResponse, status_code=status.HTTP_201_CREATED)
async def create_nsfw_post(post: PostCreate, author_id: int, db: Session = Depends(get_db)):
    """Create an NSFW post"""
    if not post.is_nsfw:
        raise HTTPException(status_code=400, detail="This endpoint is for NSFW content only")
    
    db_post = Post(
        author_id=author_id, 
        content=post.content, 
        image_url=post.image_url, 
        is_nsfw=True
    )
    db.add(db_post)
    db.commit()
    db.refresh(db_post)
    return db_post

@router.get("/{post_id}", response_model=PostDetailResponse)
async def get_nsfw_post(post_id: int, db: Session = Depends(get_db)):
    """Get a specific NSFW post"""
    post = db.query(Post).filter(Post.id == post_id, Post.is_nsfw == True).first()
    if not post:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="NSFW post not found")
    return post