from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
from models import Follow
from schemas import FollowResponse, ActionWithConfirmation

router = APIRouter()

@router.post("/", response_model=FollowResponse, status_code=status.HTTP_201_CREATED)
async def follow_user(follower_id: int, following_id: int, db: Session = Depends(get_db)):
    db_follow = Follow(follower_id=follower_id, following_id=following_id)
    db.add(db_follow)
    db.commit()
    db.refresh(db_follow)
    return db_follow

@router.delete("/{follow_id}", status_code=status.HTTP_204_NO_CONTENT)
async def unfollow_user(
    follow_id: int,
    request: ActionWithConfirmation,
    user_id: int,
    db: Session = Depends(get_db)
):
    from routers.auth import confirmation_tokens
    from datetime import datetime
    
    f = db.query(Follow).filter(Follow.id == follow_id).first()
    if not f:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Follow relation not found")
    
    if f.__dict__['follower_id'] != user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only unfollow your own follows")
    
    # Validate confirmation token
    if request.confirmation_token not in confirmation_tokens:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid confirmation token")
    
    token_data = confirmation_tokens[request.confirmation_token]
    if token_data["user_id"] != user_id or token_data["action"] != "unfollow" or token_data["resource_id"] != follow_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid confirmation token")
    
    if datetime.utcnow() > token_data["expires_at"]:
        del confirmation_tokens[request.confirmation_token]
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Confirmation token expired")
    
    db.delete(f)
    db.commit()
    del confirmation_tokens[request.confirmation_token]
    return None
