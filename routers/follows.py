from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
from models import Follow
from schemas import FollowResponse

router = APIRouter()

@router.post("/", response_model=FollowResponse, status_code=status.HTTP_201_CREATED)
async def follow_user(follower_id: int, following_id: int, db: Session = Depends(get_db)):
    db_follow = Follow(follower_id=follower_id, following_id=following_id)
    db.add(db_follow)
    db.commit()
    db.refresh(db_follow)
    return db_follow

@router.delete("/{follow_id}", status_code=status.HTTP_204_NO_CONTENT)
async def unfollow_user(follow_id: int, db: Session = Depends(get_db)):
    f = db.query(Follow).filter(Follow.id == follow_id).first()
    if not f:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Follow relation not found")
    db.delete(f)
    db.commit()
    return None
