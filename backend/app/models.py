from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class Course(Base):
    __tablename__ = "courses"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(120), unique=True)
    category: Mapped[str] = mapped_column(String(40), default="B")
    duration_hours: Mapped[int] = mapped_column(default=40)
    status: Mapped[str] = mapped_column(String(30), default="active")


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(120))
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    role: Mapped[str] = mapped_column(String(30), default="student")
    session_token: Mapped[str | None] = mapped_column(String(255), unique=True, nullable=True)
    instructor_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    school: Mapped[str | None] = mapped_column(String(120), nullable=True)
    location: Mapped[str | None] = mapped_column(String(120), nullable=True)


class Booking(Base):
    __tablename__ = "bookings"
    __table_args__ = (UniqueConstraint("instructor_id", "slot", name="uq_booking_instructor_slot"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    student_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    instructor_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    slot: Mapped[str] = mapped_column(String(80))
    status: Mapped[str] = mapped_column(String(30), default="Requested")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
