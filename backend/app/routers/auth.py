import secrets

from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.common import SETUP_REQUIRED_MESSAGE, authenticated_user, hash_password, verify_password
from app.database import get_db
from app.models import User
from app.schemas import AuthResponse, Credentials, InstructorAssignment, SignUpRequest, UserResponse

router = APIRouter()

@router.post("/api/auth/signup", response_model=AuthResponse)
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


@router.post("/api/auth/login", response_model=AuthResponse)
def login(payload: Credentials, db: Session = Depends(get_db)) -> AuthResponse:
    user = db.scalar(select(User).where(User.email == payload.email.strip().lower()))
    if user is None or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    if user.role != "admin" and db.scalar(select(User.id).where(User.role == "instructor")) is None:
        raise HTTPException(status_code=503, detail=SETUP_REQUIRED_MESSAGE)
    user.session_token = secrets.token_urlsafe(32)
    db.commit()
    db.refresh(user)
    return AuthResponse(token=user.session_token, user=user)


@router.get("/api/me", response_model=UserResponse)
def get_me(authorization: str | None = Header(default=None), db: Session = Depends(get_db)) -> User:
    return authenticated_user(authorization, db)


@router.put("/api/me/instructor", response_model=UserResponse)
def assign_instructor(
    payload: InstructorAssignment,
    authorization: str | None = Header(default=None),
    db: Session = Depends(get_db),
) -> User:
    student = authenticated_user(authorization, db)
    if student.role != "student":
        raise HTTPException(status_code=403, detail="Only students can choose an instructor")
    if student.instructor_id is not None:
        raise HTTPException(status_code=409, detail="An instructor has already been chosen")
    instructor = db.scalar(select(User).where(User.id == payload.instructor_id, User.role == "instructor"))
    if instructor is None:
        raise HTTPException(status_code=404, detail="Instructor not found")
    student.instructor_id = instructor.id
    db.commit()
    db.refresh(student)
    return student


@router.get("/api/auth/me", response_model=UserResponse)
def me(authorization: str | None = Header(default=None), db: Session = Depends(get_db)) -> UserResponse:
    return authenticated_user(authorization, db)
