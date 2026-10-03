from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.common import hash_password
from app.database import get_db
from app.models import User
from app.schemas import AuthResponse, SetupRequest, SetupStatusResponse

router = APIRouter()

@router.get("/api/setup/status", response_model=SetupStatusResponse)
def get_setup_status(db: Session = Depends(get_db)) -> SetupStatusResponse:
    return SetupStatusResponse(
        setup_required=db.scalar(select(User.id).where(User.role == "admin")) is None
    )


@router.post("/api/setup", response_model=AuthResponse, status_code=201)
def setup_application(payload: SetupRequest, db: Session = Depends(get_db)) -> AuthResponse:
    if db.scalar(select(User.id).where(User.role == "admin")) is not None:
        raise HTTPException(status_code=409, detail="The application is already set up")

    email = payload.email.strip().lower()
    if db.scalar(select(User.id).where(User.email == email)) is not None:
        raise HTTPException(status_code=409, detail="An account with that email already exists")

    admin = User(
        name=payload.name.strip(),
        email=email,
        password_hash=hash_password(payload.password),
        role="admin",
        session_token=secrets.token_urlsafe(32),
    )
    db.add(admin)
    db.commit()
    db.refresh(admin)
    return AuthResponse(token=admin.session_token, user=admin)
