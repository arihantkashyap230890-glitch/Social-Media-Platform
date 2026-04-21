from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload

from auth import get_current_user, require_admin
from database import get_db
from models import Comment, Post, User
from schemas import ActionWithConfirmation, PostCreate, PostDetailResponse, PostResponse

router = APIRouter()


@router.get("/", response_model=list[PostResponse])
async def list_posts(db: Session = Depends(get_db)):
    return (
        db.query(Post)
        .options(joinedload(Post.author), joinedload(Post.comments), joinedload(Post.liked_by))
        .order_by(Post.created_at.desc())
        .all()
    )


@router.post("/", response_model=PostResponse, status_code=status.HTTP_201_CREATED)
async def create_post(
    post: PostCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db_post = Post(
        author_id=current_user.id,
        content=post.content,
        image_url=post.image_url,
        is_nsfw=post.is_nsfw
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
async def get_post(post_id: int, db: Session = Depends(get_db)):
    post = (
        db.query(Post)
        .options(
            joinedload(Post.author),
            joinedload(Post.comments).joinedload(Comment.author),
            joinedload(Post.liked_by),
        )
        .filter(Post.id == post_id)
        .first()
    )
    if not post:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found")
    return post


@router.delete("/{post_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_post_admin(
    post_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found")

    db.delete(post)
    db.commit()


@router.delete("/comments/{comment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_comment_admin(
    comment_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    comment = db.query(Comment).filter(Comment.id == comment_id).first()
    if not comment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Comment not found")

    db.delete(comment)
    db.commit()


@router.delete("/{post_id}/user", status_code=status.HTTP_204_NO_CONTENT)
async def delete_post_user(
    post_id: int,
    request: ActionWithConfirmation | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found")

    if post.author_id != current_user.id:  # type: ignore
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only delete your own posts")

    if request and request.confirmation_token:
        from auth import confirmation_tokens
        from datetime import datetime

        token_data = confirmation_tokens.get(request.confirmation_token)
        if token_data and token_data["user_id"] == current_user.id and token_data["action"] == "delete_post" and token_data["resource_id"] == post_id:
            if datetime.utcnow() <= token_data["expires_at"]:
                del confirmation_tokens[request.confirmation_token]

    db.delete(post)
    db.commit()
