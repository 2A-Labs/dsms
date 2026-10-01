from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, Index, String, Text, UniqueConstraint
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


class SchoolSettings(Base):
    __tablename__ = "school_settings"

    id: Mapped[int] = mapped_column(primary_key=True)
    school_name: Mapped[str] = mapped_column(String(120), default="Roadwise")
    logo_mark: Mapped[str] = mapped_column(String(8), default="R")
    logo_data: Mapped[str | None] = mapped_column(Text, nullable=True)
    primary_color: Mapped[str] = mapped_column(String(7), default="#4f46e5")
    accent_color: Mapped[str] = mapped_column(String(7), default="#e0e7ff")


class Booking(Base):
    __tablename__ = "bookings"
    __table_args__ = (UniqueConstraint("instructor_id", "slot", name="uq_booking_instructor_slot"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    student_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    instructor_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    slot: Mapped[str] = mapped_column(String(80))
    status: Mapped[str] = mapped_column(String(30), default="Requested")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class InstructorAvailability(Base):
    __tablename__ = "instructor_availability"
    __table_args__ = (
        UniqueConstraint("instructor_id", "slot", name="uq_instructor_availability_slot"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    instructor_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    slot: Mapped[str] = mapped_column(String(80))

class StudentInstructor(Base):
    __tablename__ = "student_instructors"
    __table_args__ = (
        UniqueConstraint("student_id", "instructor_id", name="uq_student_instructor"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    student_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    instructor_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)


class PlannerBlock(Base):
    __tablename__ = "planner_blocks"
    __table_args__ = (
        UniqueConstraint("instructor_id", "starts_at", name="uq_planner_instructor_start"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    instructor_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    student_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)

    starts_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    ends_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

    status: Mapped[str] = mapped_column(String(30), default="closed", nullable=False)
    lesson_title: Mapped[str | None] = mapped_column(String(160), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    completed_by: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)


class VideoInstruction(Base):
    __tablename__ = "video_instructions"

    id: Mapped[int] = mapped_column(primary_key=True)
    instructor_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    title: Mapped[str] = mapped_column(String(160), nullable=False)
    file_url: Mapped[str] = mapped_column(Text, nullable=False)
    duration_seconds: Mapped[int | None] = mapped_column(nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)


class QuizQuestion(Base):
    __tablename__ = "quiz_questions"

    id: Mapped[int] = mapped_column(primary_key=True)
    question_text: Mapped[str] = mapped_column(Text, nullable=False)
    is_active: Mapped[bool] = mapped_column(default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)


class QuizAnswer(Base):
    __tablename__ = "quiz_answers"

    id: Mapped[int] = mapped_column(primary_key=True)
    question_id: Mapped[int] = mapped_column(ForeignKey("quiz_questions.id"), nullable=False)
    answer_text: Mapped[str] = mapped_column(Text, nullable=False)
    is_correct: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)


Index(
    "uq_quiz_answer_one_correct",
    QuizAnswer.question_id,
    unique=True,
    postgresql_where=QuizAnswer.is_correct.is_(True),
)