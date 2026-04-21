from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload

from auth import get_current_user
from database import get_db
from models import Post, User
from schemas import PostCreate, PostDetailResponse, PostResponse

router = APIRouter()


@router.get("/", response_model=list[PostResponse])
async def get_nsfw_posts(db: Session = Depends(get_db)):
    posts = (
        db.query(Post)
        .options(joinedload(Post.author), joinedload(Post.comments), joinedload(Post.liked_by))
        .filter(Post.is_nsfw == True)
        .order_by(Post.created_at.desc())
        .all()
    )
    return posts


@router.post("/", response_model=PostResponse, status_code=status.HTTP_201_CREATED)
async def create_nsfw_post(
    post: PostCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not post.is_nsfw:
        raise HTTPException(status_code=400, detail="This endpoint is for NSFW content only")

    db_post = Post(
        author_id=current_user.id,
        content=post.content,
        image_url=post.image_url,
        is_nsfw=True
    )
    db.add(db_post)
    db.commit()
    db.refresh(db_post)

    return (
        db.query(Post)
        .options(joinedload(Post.author), joinedload(Post.comments), joinedload(Post.liked_by))
        .filter(Post.id == db_post.id)
        .first()
    )


@router.get("/{post_id}", response_model=PostDetailResponse)
async def get_nsfw_post(post_id: int, db: Session = Depends(get_db)):
    post = (
        db.query(Post)
        .options(joinedload(Post.author), joinedload(Post.comments), joinedload(Post.liked_by))
        .filter(Post.id == post_id, Post.is_nsfw == True)
        .first()
    )
    if not post:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="NSFW post not found")
    return post
