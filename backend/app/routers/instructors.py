import base64
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, File, Form, Header, HTTPException, UploadFile
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.common import hash_password, instructor_student, instructor_user
from app.database import get_db
from app.models import Booking, InstructorAvailability, StudentDocument, User, VideoInstruction
from app.schemas import BookingStatusUpdate, InstructorAvailabilityUpdate, InstructorBookingResponse, InstructorResponse, InstructorScheduleResponse, InstructorStudentResponse, InstructorStudentUpdate, LectureResponse, StudentDocumentResponse, StudentPasswordReset

router = APIRouter()

BOOKABLE_WINDOW_DAYS = 15

@router.get("/api/instructor/lectures", response_model=list[LectureResponse])
def list_instructor_lectures(
    authorization: str | None = Header(default=None), db: Session = Depends(get_db)
) -> list[LectureResponse]:
    instructor = instructor_user(authorization, db)
    lectures = db.scalars(
        select(VideoInstruction)
        .where(VideoInstruction.instructor_id == instructor.id)
        .order_by(VideoInstruction.created_at.desc())
    )
    return [
        LectureResponse(
            id=lecture.id,
            instructor_id=lecture.instructor_id,
            instructor_name=instructor.name,
            title=lecture.title,
            file_url=lecture.file_url,
            duration_seconds=lecture.duration_seconds,
        )
        for lecture in lectures
    ]


@router.post("/api/instructor/lectures", response_model=LectureResponse, status_code=201)
async def create_instructor_lecture(
    title: str = Form(...),
    file: UploadFile = File(...),
    authorization: str | None = Header(default=None),
    db: Session = Depends(get_db),
) -> LectureResponse:
    instructor = instructor_user(authorization, db)
    if not file.content_type or not file.content_type.startswith("video/"):
        raise HTTPException(status_code=400, detail="Only video files can be uploaded")
    contents = await file.read()
    if not contents:
        raise HTTPException(status_code=400, detail="The video file is empty")
    if len(contents) > 50 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="Video files must be smaller than 50 MB")
    lecture = VideoInstruction(
        instructor_id=instructor.id,
        title=title.strip(),
        file_url=f"data:{file.content_type};base64,{base64.b64encode(contents).decode('ascii')}",
    )
    db.add(lecture)
    db.commit()
    db.refresh(lecture)
    return LectureResponse(
        id=lecture.id,
        instructor_id=lecture.instructor_id,
        instructor_name=instructor.name,
        title=lecture.title,
        file_url=lecture.file_url,
        duration_seconds=lecture.duration_seconds,
    )


@router.delete("/api/instructor/lectures/{lecture_id}", status_code=204)
def delete_instructor_lecture(
    lecture_id: int,
    authorization: str | None = Header(default=None),
    db: Session = Depends(get_db),
) -> None:
    instructor = instructor_user(authorization, db)
    lecture = db.scalar(
        select(VideoInstruction).where(
            VideoInstruction.id == lecture_id,
            VideoInstruction.instructor_id == instructor.id,
        )
    )
    if lecture is None:
        raise HTTPException(status_code=404, detail="Lecture not found")
    db.delete(lecture)
    db.commit()


@router.get("/api/instructor/students", response_model=list[InstructorStudentResponse])
def list_instructor_students(
    authorization: str | None = Header(default=None), db: Session = Depends(get_db)
) -> list[User]:
    instructor = instructor_user(authorization, db)
    return list(
        db.scalars(
            select(User)
            .where(User.role == "student", User.instructor_id == instructor.id)
            .order_by(User.name)
        )
    )


@router.patch("/api/instructor/students/{student_id}", response_model=InstructorStudentResponse)
def update_instructor_student(
    student_id: int,
    payload: InstructorStudentUpdate,
    authorization: str | None = Header(default=None),
    db: Session = Depends(get_db),
) -> User:
    instructor = instructor_user(authorization, db)
    student = instructor_student(instructor, student_id, db)
    email = payload.email.strip().lower()
    duplicate = db.scalar(select(User.id).where(User.email == email, User.id != student_id))
    if duplicate is not None:
        raise HTTPException(status_code=409, detail="An account with that email already exists")
    student.name = payload.name.strip()
    student.email = email
    db.commit()
    db.refresh(student)
    return student


@router.patch("/api/instructor/students/{student_id}/password", status_code=204)
def reset_student_password(
    student_id: int,
    payload: StudentPasswordReset,
    authorization: str | None = Header(default=None),
    db: Session = Depends(get_db),
) -> None:
    instructor = instructor_user(authorization, db)
    student = instructor_student(instructor, student_id, db)
    student.password_hash = hash_password(payload.password)
    student.session_token = None
    db.commit()


@router.get("/api/instructor/documents", response_model=list[StudentDocumentResponse])
def list_instructor_documents(
    authorization: str | None = Header(default=None), db: Session = Depends(get_db)
) -> list[StudentDocument]:
    instructor = instructor_user(authorization, db)
    return list(
        db.scalars(
            select(StudentDocument)
            .where(StudentDocument.instructor_id == instructor.id)
            .order_by(StudentDocument.created_at.desc())
        )
    )


@router.post("/api/instructor/documents", response_model=StudentDocumentResponse, status_code=201)
async def create_instructor_document(
    title: str = Form(...),
    file: UploadFile = File(...),
    authorization: str | None = Header(default=None),
    db: Session = Depends(get_db),
) -> StudentDocument:
    instructor = instructor_user(authorization, db)
    if not file.content_type or file.content_type.startswith("video/"):
        raise HTTPException(status_code=400, detail="Choose a document file, not a video")
    contents = await file.read()
    if not contents:
        raise HTTPException(status_code=400, detail="The document file is empty")
    if len(contents) > 10 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="Document files must be smaller than 10 MB")
    document = StudentDocument(
        instructor_id=instructor.id,
        title=title.strip(),
        file_name=file.filename or "document",
        mime_type=file.content_type,
        file_url=f"data:{file.content_type};base64,{base64.b64encode(contents).decode('ascii')}",
    )
    db.add(document)
    db.commit()
    db.refresh(document)
    return document


@router.delete("/api/instructor/documents/{document_id}", status_code=204)
def delete_instructor_document(
    document_id: int,
    authorization: str | None = Header(default=None),
    db: Session = Depends(get_db),
) -> None:
    instructor = instructor_user(authorization, db)
    document = db.scalar(
        select(StudentDocument).where(
            StudentDocument.id == document_id,
            StudentDocument.instructor_id == instructor.id,
        )
    )
    if document is None:
        raise HTTPException(status_code=404, detail="Document not found")
    db.delete(document)
    db.commit()


@router.get("/api/instructors", response_model=list[InstructorResponse])
def list_instructors(db: Session = Depends(get_db)) -> list[InstructorResponse]:
    now = datetime.now()
    latest_visible_slot = now + timedelta(days=BOOKABLE_WINDOW_DAYS)
    instructors = db.scalars(select(User).where(User.role == "instructor").order_by(User.id))
    result = []
    for instructor in instructors:
        availability = list(
            db.scalars(
                select(InstructorAvailability.slot).where(
                    InstructorAvailability.instructor_id == instructor.id
                )
            )
        )
        booked_slots = set(
            db.scalars(
                select(Booking.slot).where(
                    Booking.instructor_id == instructor.id,
                    Booking.status != "Declined",
                )
            )
        )
        visible_slots = []
        for slot in availability:
            try:
                parsed_slot = datetime.strptime(slot, "%Y-%m-%d · %H:%M")
            except ValueError:
                continue
            if now <= parsed_slot <= latest_visible_slot and slot not in booked_slots:
                visible_slots.append((parsed_slot, slot))
        visible_slots.sort(key=lambda item: item[0])
        result.append(
            InstructorResponse(
                id=instructor.id,
                name=instructor.name,
                initials="".join(part[0] for part in instructor.name.split()),
                school=instructor.school or "Roadwise Central",
                location=instructor.location or "Northside",
                slots=[slot for _, slot in visible_slots],
            )
        )
    return result


@router.get("/api/instructor/schedule", response_model=InstructorScheduleResponse)
def get_instructor_schedule(
    authorization: str | None = Header(default=None), db: Session = Depends(get_db)
) -> InstructorScheduleResponse:
    instructor = instructor_user(authorization, db)
    availability = list(
        db.scalars(
            select(InstructorAvailability.slot).where(
                InstructorAvailability.instructor_id == instructor.id
            )
        )
    )
    bookings = list(
        db.execute(
            select(Booking, User.name)
            .join(User, User.id == Booking.student_id)
            .where(Booking.instructor_id == instructor.id)
            .order_by(Booking.slot)
        )
    )
    booking_responses = [
        InstructorBookingResponse(
            id=booking.id,
            student_id=booking.student_id,
            student_name=student_name,
            slot=booking.slot,
            status=booking.status,
        )
        for booking, student_name in bookings
    ]
    booked_slots = {
        booking.slot for booking, _ in bookings if booking.status != "Declined"
    }
    return InstructorScheduleResponse(
        bookable_slots=[slot for slot in availability if slot not in booked_slots],
        bookings=booking_responses,
        booked_hours=sum(booking.status == "Booked" for booking, _ in bookings),
    )


@router.put("/api/instructor/availability")
def update_instructor_availability(
    payload: InstructorAvailabilityUpdate,
    authorization: str | None = Header(default=None),
    db: Session = Depends(get_db),
) -> None:
    instructor = instructor_user(authorization, db)
    availability = db.scalar(
        select(InstructorAvailability).where(
            InstructorAvailability.instructor_id == instructor.id,
            InstructorAvailability.slot == payload.slot,
        )
    )
    active_booking = db.scalar(
        select(Booking.id).where(
            Booking.instructor_id == instructor.id,
            Booking.slot == payload.slot,
            Booking.status != "Declined",
        )
    )
    if not payload.is_open and active_booking is not None:
        raise HTTPException(status_code=409, detail="This slot has an active booking")
    if payload.is_open and availability is None:
        db.add(InstructorAvailability(instructor_id=instructor.id, slot=payload.slot))
    elif not payload.is_open and availability is not None:
        db.delete(availability)
    db.commit()


@router.patch("/api/instructor/bookings/{booking_id}")
def update_instructor_booking(
    booking_id: int,
    payload: BookingStatusUpdate,
    authorization: str | None = Header(default=None),
    db: Session = Depends(get_db),
) -> InstructorBookingResponse:
    instructor = instructor_user(authorization, db)
    if payload.status not in {"Requested", "Booked", "Declined"}:
        raise HTTPException(status_code=400, detail="Invalid booking status")
    booking = db.scalar(
        select(Booking).where(
            Booking.id == booking_id,
            Booking.instructor_id == instructor.id,
        )
    )
    if booking is None:
        raise HTTPException(status_code=404, detail="Booking not found")
    if payload.status == "Booked":
        conflict = db.scalar(
            select(Booking.id).where(
                Booking.instructor_id == instructor.id,
                Booking.slot == booking.slot,
                Booking.id != booking.id,
                Booking.status == "Booked",
            )
        )
        if conflict is not None:
            raise HTTPException(status_code=409, detail="This slot is already booked")
    booking.status = payload.status
    db.commit()
    student_name = db.scalar(select(User.name).where(User.id == booking.student_id))
    return InstructorBookingResponse(
        id=booking.id,
        student_id=booking.student_id,
        student_name=student_name or "Unknown student",
        slot=booking.slot,
        status=booking.status,
    )
