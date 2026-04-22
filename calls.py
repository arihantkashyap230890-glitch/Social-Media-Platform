from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from database import get_db
from models import CallIceCandidate, CallSession, User
from schemas import (
    CallAnswerUpdate,
    CallIceCandidateCreate,
    CallIceCandidateResponse,
    CallOfferUpdate,
    CallSessionCreate,
    CallSessionResponse,
)

router = APIRouter()


def get_user_or_404(db: Session, user_id: int) -> User:
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return user


def get_call_for_user_or_404(db: Session, call_id: int, user_id: int) -> CallSession:
    call = db.query(CallSession).filter(CallSession.id == call_id).first()
    if not call:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Call not found")
    if user_id not in {call.caller_id, call.callee_id}:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User cannot access this call")
    return call


@router.post("/", response_model=CallSessionResponse, status_code=status.HTTP_201_CREATED)
async def create_call(
    payload: CallSessionCreate,
    caller_id: int = Query(...),
    db: Session = Depends(get_db),
):
    if caller_id == payload.recipient_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="You cannot call yourself")

    get_user_or_404(db, caller_id)
    get_user_or_404(db, payload.recipient_id)

    active_call = db.query(CallSession).filter(
        CallSession.status.in_(["initiated", "ringing", "connected"]),
        (
            ((CallSession.caller_id == caller_id) & (CallSession.callee_id == payload.recipient_id)) |
            ((CallSession.caller_id == payload.recipient_id) & (CallSession.callee_id == caller_id))
        )
    ).order_by(CallSession.created_at.desc()).first()
    if active_call:
        return active_call

    call = CallSession(
        caller_id=caller_id,
        callee_id=payload.recipient_id,
        call_type=payload.call_type,
        status="initiated",
    )
    db.add(call)
    db.commit()
    db.refresh(call)
    return call


@router.get("/incoming/{user_id}", response_model=list[CallSessionResponse])
async def get_incoming_calls(user_id: int, db: Session = Depends(get_db)):
    return db.query(CallSession).filter(
        CallSession.callee_id == user_id,
        CallSession.status == "ringing",
        CallSession.offer_sdp.isnot(None)
    ).order_by(CallSession.created_at.desc()).all()


@router.get("/{call_id}", response_model=CallSessionResponse)
async def get_call(call_id: int, user_id: int = Query(...), db: Session = Depends(get_db)):
    return get_call_for_user_or_404(db, call_id, user_id)


@router.post("/{call_id}/offer", response_model=CallSessionResponse)
async def update_offer(
    call_id: int,
    payload: CallOfferUpdate,
    user_id: int = Query(...),
    db: Session = Depends(get_db),
):
    call = get_call_for_user_or_404(db, call_id, user_id)
    if call.caller_id != user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only the caller can send the offer")

    call.offer_sdp = payload.offer_sdp
    call.status = "ringing"
    db.commit()
    db.refresh(call)
    return call


@router.post("/{call_id}/answer", response_model=CallSessionResponse)
async def answer_call(
    call_id: int,
    payload: CallAnswerUpdate,
    user_id: int = Query(...),
    db: Session = Depends(get_db),
):
    call = get_call_for_user_or_404(db, call_id, user_id)
    if call.callee_id != user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only the callee can answer this call")

    call.answer_sdp = payload.answer_sdp
    call.status = "connected"
    call.started_at = call.started_at or datetime.utcnow()
    db.commit()
    db.refresh(call)
    return call


@router.post("/{call_id}/reject", response_model=CallSessionResponse)
async def reject_call(call_id: int, user_id: int = Query(...), db: Session = Depends(get_db)):
    call = get_call_for_user_or_404(db, call_id, user_id)
    call.status = "rejected"
    call.ended_at = datetime.utcnow()
    db.commit()
    db.refresh(call)
    return call


@router.post("/{call_id}/end", response_model=CallSessionResponse)
async def end_call(call_id: int, user_id: int = Query(...), db: Session = Depends(get_db)):
    call = get_call_for_user_or_404(db, call_id, user_id)
    call.status = "ended"
    call.ended_at = datetime.utcnow()
    db.commit()
    db.refresh(call)
    return call


@router.get("/{call_id}/candidates", response_model=list[CallIceCandidateResponse])
async def get_call_candidates(call_id: int, user_id: int = Query(...), db: Session = Depends(get_db)):
    call = get_call_for_user_or_404(db, call_id, user_id)
    own_role = "caller" if call.caller_id == user_id else "callee"
    remote_role = "callee" if own_role == "caller" else "caller"
    return db.query(CallIceCandidate).filter(
        CallIceCandidate.call_session_id == call_id,
        CallIceCandidate.role == remote_role
    ).order_by(CallIceCandidate.created_at.asc()).all()


@router.post("/{call_id}/candidates", response_model=CallIceCandidateResponse, status_code=status.HTTP_201_CREATED)
async def add_call_candidate(
    call_id: int,
    payload: CallIceCandidateCreate,
    user_id: int = Query(...),
    db: Session = Depends(get_db),
):
    call = get_call_for_user_or_404(db, call_id, user_id)
    expected_role = "caller" if call.caller_id == user_id else "callee"
    if payload.role != expected_role:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Candidate role does not match user")

    candidate = CallIceCandidate(
        call_session_id=call_id,
        user_id=user_id,
        role=payload.role,
        candidate=payload.candidate,
        sdp_mid=payload.sdp_mid,
        sdp_mline_index=payload.sdp_mline_index,
    )
    db.add(candidate)
    db.commit()
    db.refresh(candidate)
    return candidate
