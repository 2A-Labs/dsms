import secrets

from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.common import admin_user, hash_password
from app.database import get_db
from app.models import Booking, SchoolSettings, User
from app.schemas import AuthResponse, InstructorCreate, InstructorUpdate, SchoolSettingsResponse, SchoolSettingsUpdate, UserResponse

router = APIRouter()

@router.get("/api/admin/settings", response_model=SchoolSettingsResponse)
def get_school_settings(
    authorization: str | None = Header(default=None), db: Session = Depends(get_db)
) -> SchoolSettings:
    admin_user(authorization, db)
    settings = db.scalar(select(SchoolSettings).limit(1))
    if settings is None:
        settings = SchoolSettings()
        db.add(settings)
        db.commit()
        db.refresh(settings)
    return settings


@router.get("/api/settings", response_model=SchoolSettingsResponse)
def public_school_settings(db: Session = Depends(get_db)) -> SchoolSettings:
    settings = db.scalar(select(SchoolSettings).limit(1))
    if settings is None:
        settings = SchoolSettings()
    return settings


@router.put("/api/admin/settings", response_model=SchoolSettingsResponse)
def update_school_settings(
    payload: SchoolSettingsUpdate,
    authorization: str | None = Header(default=None),
    db: Session = Depends(get_db),
) -> SchoolSettings:
    admin_user(authorization, db)
    settings = db.scalar(select(SchoolSettings).limit(1))
    if settings is None:
        settings = SchoolSettings()
        db.add(settings)
    settings.school_name = payload.school_name.strip() or "Roadwise"
    settings.logo_mark = payload.logo_mark.strip()[:2] or "R"
    if payload.logo_data is not None:
        settings.logo_data = payload.logo_data
    settings.primary_color = payload.primary_color
    settings.accent_color = payload.accent_color
    db.commit()
    db.refresh(settings)
    return settings


@router.get("/api/admin/instructors", response_model=list[UserResponse])
def list_admin_instructors(
    authorization: str | None = Header(default=None), db: Session = Depends(get_db)
) -> list[User]:
    admin_user(authorization, db)
    return list(db.scalars(select(User).where(User.role == "instructor").order_by(User.id)))


@router.post("/api/admin/instructors/{instructor_id}/impersonate", response_model=AuthResponse)
def impersonate_instructor(
    instructor_id: int,
    authorization: str | None = Header(default=None),
    db: Session = Depends(get_db),
) -> AuthResponse:
    admin_user(authorization, db)
    instructor = db.scalar(select(User).where(User.id == instructor_id, User.role == "instructor"))
    if instructor is None:
        raise HTTPException(status_code=404, detail="Instructor not found")
    instructor.session_token = secrets.token_urlsafe(32)
    db.commit()
    db.refresh(instructor)
    return AuthResponse(token=instructor.session_token, user=instructor)


@router.post("/api/admin/instructors", response_model=UserResponse, status_code=201)
def create_instructor(
    payload: InstructorCreate,
    authorization: str | None = Header(default=None),
    db: Session = Depends(get_db),
) -> User:
    admin_user(authorization, db)
    email = payload.email.strip().lower()
    if db.scalar(select(User.id).where(User.email == email)) is not None:
        raise HTTPException(status_code=409, detail="An account with that email already exists")
    instructor = User(
        name=payload.name.strip(),
        email=email,
        password_hash=hash_password(payload.password),
        role="instructor",
        school=payload.school,
        location=payload.location,
    )
    db.add(instructor)
    db.commit()
    db.refresh(instructor)
    return instructor


@router.patch("/api/admin/instructors/{instructor_id}", response_model=UserResponse)
def update_instructor(
    instructor_id: int,
    payload: InstructorUpdate,
    authorization: str | None = Header(default=None),
    db: Session = Depends(get_db),
) -> User:
    admin_user(authorization, db)
    instructor = db.scalar(select(User).where(User.id == instructor_id, User.role == "instructor"))
    if instructor is None:
        raise HTTPException(status_code=404, detail="Instructor not found")
    if payload.email is not None:
        email = payload.email.strip().lower()
        duplicate = db.scalar(select(User.id).where(User.email == email, User.id != instructor_id))
        if duplicate is not None:
            raise HTTPException(status_code=409, detail="An account with that email already exists")
        instructor.email = email
    if payload.name is not None:
        instructor.name = payload.name.strip()
    if payload.password:
        instructor.password_hash = hash_password(payload.password)
    if payload.school is not None:
        instructor.school = payload.school
    if payload.location is not None:
        instructor.location = payload.location
    db.commit()
    db.refresh(instructor)
    return instructor


@router.delete("/api/admin/instructors/{instructor_id}", status_code=204)
def delete_instructor(
    instructor_id: int,
    authorization: str | None = Header(default=None),
    db: Session = Depends(get_db),
) -> None:
    admin_user(authorization, db)
    instructor = db.scalar(select(User).where(User.id == instructor_id, User.role == "instructor"))
    if instructor is None:
        raise HTTPException(status_code=404, detail="Instructor not found")
    if db.scalar(select(Booking.id).where(Booking.instructor_id == instructor_id).limit(1)) is not None:
        raise HTTPException(
            status_code=409,
            detail="This instructor has booking history and cannot be removed",
        )
    db.delete(instructor)
    db.commit()
