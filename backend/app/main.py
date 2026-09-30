import hashlib
import hmac
import secrets
from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI, Header, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select, text
from sqlalchemy.orm import Session

from app.config import get_settings
from app.database import Base, engine, get_db
from app.models import Booking, Course, SchoolSettings, User
from app.schemas import (
    AuthResponse,
    BookingCreate,
    BookingResponse,
    CourseResponse,
    Credentials,
    InstructorCreate,
    InstructorResponse,
    InstructorUpdate,
    SignUpRequest,
    SchoolSettingsResponse,
    SchoolSettingsUpdate,
    UserResponse,
)

DEFAULT_ADMIN_EMAIL = "admin@roadwise.local"
DEFAULT_ADMIN_PASSWORD = "Roadwise123!"
INSTRUCTOR_SLOTS = {
    "Jamie Carter": ["Mon 28 · 09:00", "Tue 29 · 13:00", "Thu 01 · 15:00"],
    "Priya Shah": ["Mon 28 · 11:00", "Wed 30 · 10:00", "Fri 02 · 14:00"],
    "Marcus Green": ["Tue 29 · 10:00", "Thu 01 · 09:00", "Sat 03 · 11:00"],
}


def hash_password(password: str) -> str:
    salt = secrets.token_bytes(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode(), salt, 120_000)
    return f"{salt.hex()}:{digest.hex()}"


def verify_password(password: str, stored: str) -> bool:
    salt_hex, digest_hex = stored.split(":", maxsplit=1)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode(), bytes.fromhex(salt_hex), 120_000)
    return hmac.compare_digest(digest.hex(), digest_hex)


@asynccontextmanager
async def lifespan(_: FastAPI):
    Base.metadata.create_all(bind=engine)
    with Session(engine) as session:
        session.execute(text("ALTER TABLE school_settings ADD COLUMN IF NOT EXISTS logo_data TEXT"))
        session.commit()
        if session.scalar(select(Course.id).limit(1)) is None:
            session.add_all(
                [
                    Course(name="Standard B Licence", category="B", duration_hours=40),
                    Course(name="Motorcycle Licence", category="A", duration_hours=30),
                ]
            )
            session.commit()
        if session.scalar(select(User.id).where(User.email == DEFAULT_ADMIN_EMAIL)) is None:
            session.add(
                User(
                    name="Roadwise Admin",
                    email=DEFAULT_ADMIN_EMAIL,
                    password_hash=hash_password(DEFAULT_ADMIN_PASSWORD),
                    role="admin",
                )
            )
        if session.scalar(select(SchoolSettings.id).limit(1)) is None:
            session.add(SchoolSettings())
        if session.scalar(select(User.id).where(User.role == "instructor")) is None:
            session.add_all(
                [
                    User(name="Jamie Carter", email="jamie@roadwise.local", password_hash=hash_password(secrets.token_urlsafe(24)), role="instructor", school="Roadwise Central", location="Northside"),
                    User(name="Priya Shah", email="priya@roadwise.local", password_hash=hash_password(secrets.token_urlsafe(24)), role="instructor", school="Roadwise Central", location="West End"),
                    User(name="Marcus Green", email="marcus@roadwise.local", password_hash=hash_password(secrets.token_urlsafe(24)), role="instructor", school="Roadwise Central", location="Lakeside"),
                ]
            )
        session.commit()
    yield


settings = get_settings()
app = FastAPI(title="Driving School API", version="0.1.0", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health(db: Session = Depends(get_db)) -> dict[str, str]:
    db.execute(text("SELECT 1"))
    return {"status": "ok", "database": "connected"}


@app.get("/api/courses", response_model=list[CourseResponse])
def list_courses(db: Session = Depends(get_db)) -> list[Course]:
    return list(db.scalars(select(Course).order_by(Course.id)))


def current_user(token: str, db: Session) -> User:
    user = db.scalar(select(User).where(User.session_token == token))
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid session")
    return user


def authenticated_user(authorization: str | None, db: Session) -> User:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing session token")
    return current_user(authorization[7:], db)


def admin_user(authorization: str | None, db: Session) -> User:
    user = authenticated_user(authorization, db)
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admins can manage school settings")
    return user


@app.post("/api/auth/signup", response_model=AuthResponse)
def signup(payload: SignUpRequest, db: Session = Depends(get_db)) -> AuthResponse:
    email = payload.email.strip().lower()
    if db.scalar(select(User.id).where(User.email == email)) is not None:
        raise HTTPException(status_code=409, detail="An account with that email already exists")
    user = User(name=payload.name.strip(), email=email, password_hash=hash_password(payload.password))
    user.session_token = secrets.token_urlsafe(32)
    db.add(user)
    db.commit()
    db.refresh(user)
    return AuthResponse(token=user.session_token, user=user)


@app.post("/api/auth/login", response_model=AuthResponse)
def login(payload: Credentials, db: Session = Depends(get_db)) -> AuthResponse:
    user = db.scalar(select(User).where(User.email == payload.email.strip().lower()))
    if user is None or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    user.session_token = secrets.token_urlsafe(32)
    db.commit()
    db.refresh(user)
    return AuthResponse(token=user.session_token, user=user)


@app.get("/api/auth/me", response_model=UserResponse)
def me(authorization: str | None = Header(default=None), db: Session = Depends(get_db)) -> UserResponse:
    return authenticated_user(authorization, db)


@app.get("/api/admin/settings", response_model=SchoolSettingsResponse)
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


@app.get("/api/settings", response_model=SchoolSettingsResponse)
def public_school_settings(db: Session = Depends(get_db)) -> SchoolSettings:
    settings = db.scalar(select(SchoolSettings).limit(1))
    if settings is None:
        settings = SchoolSettings()
    return settings


@app.put("/api/admin/settings", response_model=SchoolSettingsResponse)
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


@app.get("/api/admin/instructors", response_model=list[UserResponse])
def list_admin_instructors(
    authorization: str | None = Header(default=None), db: Session = Depends(get_db)
) -> list[User]:
    admin_user(authorization, db)
    return list(db.scalars(select(User).where(User.role == "instructor").order_by(User.id)))


@app.post("/api/admin/instructors/{instructor_id}/impersonate", response_model=AuthResponse)
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


@app.post("/api/admin/instructors", response_model=UserResponse, status_code=201)
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


@app.patch("/api/admin/instructors/{instructor_id}", response_model=UserResponse)
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


@app.delete("/api/admin/instructors/{instructor_id}", status_code=204)
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


@app.get("/api/instructors", response_model=list[InstructorResponse])
def list_instructors(db: Session = Depends(get_db)) -> list[InstructorResponse]:
    instructors = db.scalars(select(User).where(User.role == "instructor").order_by(User.id))
    return [
        InstructorResponse(
            id=instructor.id,
            name=instructor.name,
            initials="".join(part[0] for part in instructor.name.split()),
            school=instructor.school or "Roadwise Central",
            location=instructor.location or "Northside",
            slots=INSTRUCTOR_SLOTS.get(instructor.name, []),
        )
        for instructor in instructors
    ]


@app.post("/api/bookings", response_model=BookingResponse, status_code=201)
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
    if instructor is None or payload.slot not in INSTRUCTOR_SLOTS.get(instructor.name, []):
        raise HTTPException(status_code=400, detail="That instructor or time is not available")
    existing = db.scalar(select(Booking).where(Booking.instructor_id == instructor.id, Booking.slot == payload.slot, Booking.status != "Declined"))
    if existing is not None:
        raise HTTPException(status_code=409, detail="That time has already been requested")
    booking = Booking(student_id=student.id, instructor_id=instructor.id, slot=payload.slot)
    db.add(booking)
    db.commit()
    db.refresh(booking)
    return booking


@app.get("/api/bookings/me", response_model=list[BookingResponse])
def list_my_bookings(authorization: str | None = Header(default=None), db: Session = Depends(get_db)) -> list[Booking]:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing session token")
    user = current_user(authorization[7:], db)
    return list(db.scalars(select(Booking).where(Booking.student_id == user.id).order_by(Booking.id.desc())))
