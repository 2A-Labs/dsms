from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.common import current_user
from app.database import get_db
from app.models import Booking, InstructorAvailability, User
from app.schemas import BookingCreate, BookingResponse

router = APIRouter()

@router.post("/api/bookings", response_model=BookingResponse, status_code=201)
def create_booking(
    payload: BookingCreate,
    authorization: str | None = Header(default=None),
    db: Session = Depends(get_db),
) -> BookingResponse:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing session token")
    student = current_user(authorization[7:], db)
    if student.role != "student":
        raise HTTPException(status_code=403, detail="Only students can request lessons")
    instructor = db.scalar(select(User).where(User.id == payload.instructor_id, User.role == "instructor"))
    if instructor is None:
        raise HTTPException(status_code=400, detail="That instructor is not available")
    available = db.scalar(
        select(InstructorAvailability.id).where(
            InstructorAvailability.instructor_id == instructor.id,
            InstructorAvailability.slot == payload.slot,
        )
    )
    if available is None:
        raise HTTPException(status_code=400, detail="That instructor or time is not available")
    if student.instructor_id != instructor.id:
        raise HTTPException(status_code=403, detail="You can only request lessons from your chosen instructor")
    existing = db.scalar(select(Booking).where(Booking.instructor_id == instructor.id, Booking.slot == payload.slot, Booking.status != "Declined"))
    if existing is not None:
        raise HTTPException(status_code=409, detail="That time has already been requested")
    booking = Booking(student_id=student.id, instructor_id=instructor.id, slot=payload.slot)
    db.add(booking)
    db.commit()
    db.refresh(booking)
    return booking


@router.get("/api/bookings/me", response_model=list[BookingResponse])
def list_my_bookings(authorization: str | None = Header(default=None), db: Session = Depends(get_db)) -> list[Booking]:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing session token")
    user = current_user(authorization[7:], db)
    return list(db.scalars(select(Booking).where(Booking.student_id == user.id).order_by(Booking.id.desc())))
