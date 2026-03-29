from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
from models import Notification
from schemas import NotificationResponse, NotificationMarkRead

router = APIRouter()

@router.get("/", response_model=list[NotificationResponse])
async def list_notifications(recipient_id: int, db: Session = Depends(get_db)):
    return db.query(Notification).filter(Notification.recipient_id == recipient_id).all()

@router.patch("/{notification_id}", response_model=NotificationResponse)
async def mark_notification(notification_id: int, mark: NotificationMarkRead, db: Session = Depends(get_db)):
    n = db.query(Notification).filter(Notification.id == notification_id).first()
    if not n:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notification not found")
    n.is_read = mark.is_read
    db.commit()
    db.refresh(n)
    return n
