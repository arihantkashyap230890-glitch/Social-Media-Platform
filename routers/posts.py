from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
from models import Post, User, Comment
from schemas import PostCreate, PostResponse, PostDetailResponse, ActionWithConfirmation
from routers.auth import require_admin, get_current_user

router = APIRouter()

@router.post("/", response_model=PostResponse, status_code=status.HTTP_201_CREATED)
async def create_post(post: PostCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db_post = Post(author_id=current_user.id, content=post.content, image_url=post.image_url, is_nsfw=post.is_nsfw)
    db.add(db_post)
    db.commit()
    db.refresh(db_post)
    return db_post

@router.get("/{post_id}", response_model=PostDetailResponse)
async def get_post(post_id: int, db: Session = Depends(get_db)):
    post = db.query(Post).filter(Post.id == post_id).first()
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
    """Allow an admin to delete any comment."""
    comment = db.query(Comment).filter(Comment.id == comment_id).first()
    if not comment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Comment not found")
    
    db.delete(comment)
    db.commit()

@router.delete("/{post_id}/user", status_code=status.HTTP_204_NO_CONTENT)
async def delete_post_user(
    post_id: int,
    request: ActionWithConfirmation,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    from routers.auth import confirmation_tokens
    from datetime import datetime
    
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found")
    
    if post.author_id != current_user.id: # type: ignore
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only delete your own posts")
    
    # Validate confirmation token
    if request.confirmation_token not in confirmation_tokens:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid confirmation token")
    
    token_data = confirmation_tokens[request.confirmation_token]
    if token_data["user_id"] != current_user.id or token_data["action"] != "delete_post" or token_data["resource_id"] != post_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid confirmation token")
    
    if datetime.utcnow() > token_data["expires_at"]:
        del confirmation_tokens[request.confirmation_token]
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Confirmation token expired")
    
    db.delete(post)
    db.commit()
    del confirmation_tokens[request.confirmation_token]
