from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
from models import DirectMessage
from schemas import DirectMessageCreate, DirectMessageResponse

router = APIRouter()

@router.post("/", response_model=DirectMessageResponse, status_code=status.HTTP_201_CREATED)
async def send_message(message: DirectMessageCreate, sender_id: int, db: Session = Depends(get_db)):
    db_message = DirectMessage(sender_id=sender_id, recipient_id=message.recipient_id, content=message.content)
    db.add(db_message)
    db.commit()
    db.refresh(db_message)
    return db_message

@router.get("/thread/{user_id}", response_model=list[DirectMessageResponse])
async def get_messages(user_id: int, other_user_id: int, db: Session = Depends(get_db)):
    return db.query(DirectMessage).filter(
        ((DirectMessage.sender_id == user_id) & (DirectMessage.recipient_id == other_user_id)) | 
        ((DirectMessage.sender_id == other_user_id) & (DirectMessage.recipient_id == user_id))
    ).order_by(DirectMessage.created_at).all()
