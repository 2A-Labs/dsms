import hashlib
import hmac
import secrets

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.config import get_settings
from app.models import Quiz, QuizAnswer, QuizQuestion, User
from app.schemas import QuizQuestionManageResponse, QuizResponse

settings = get_settings()
SETUP_REQUIRED_MESSAGE = "Please ask your administrator to set up the application"


def hash_password(password: str) -> str:
    salt = secrets.token_bytes(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode(), salt, 120_000)
    return f"{salt.hex()}:{digest.hex()}"


def verify_password(password: str, stored: str) -> bool:
    salt_hex, digest_hex = stored.split(":", maxsplit=1)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode(), bytes.fromhex(salt_hex), 120_000)
    return hmac.compare_digest(digest.hex(), digest_hex)


def current_user(token: str, db: Session) -> User:
    user = db.scalar(select(User).where(User.session_token == token))
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid session")
    return user


def authenticated_user(authorization: str | None, db: Session) -> User:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing session token")
    return current_user(authorization[7:], db)


def student_user(authorization: str | None, db: Session) -> User:
    user = authenticated_user(authorization, db)
    if user.role != "student":
        raise HTTPException(status_code=403, detail="Only students can take quizzes")
    return user


def admin_user(authorization: str | None, db: Session) -> User:
    user = authenticated_user(authorization, db)
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admins can manage school settings")
    return user


def instructor_user(authorization: str | None, db: Session) -> User:
    user = authenticated_user(authorization, db)
    if user.role != "instructor":
        raise HTTPException(status_code=403, detail="Only instructors can manage lectures")
    return user


def quiz_manager(authorization: str | None, db: Session) -> User:
    user = authenticated_user(authorization, db)
    if user.role not in {"admin", "instructor"}:
        raise HTTPException(status_code=403, detail="Only admins and instructors can manage quizzes")
    return user


def quiz_response(quiz: Quiz, db: Session) -> QuizResponse:
    question_count = db.scalar(select(func.count(QuizQuestion.id)).where(QuizQuestion.quiz_id == quiz.id, QuizQuestion.is_active.is_(True)))
    return QuizResponse(id=quiz.id, name=quiz.name, description=quiz.description, is_active=quiz.is_active, question_count=question_count or 0)


def quiz_manage_response(question: QuizQuestion, db: Session) -> QuizQuestionManageResponse:
    answers = list(db.scalars(select(QuizAnswer).where(QuizAnswer.question_id == question.id).order_by(QuizAnswer.id)))
    return QuizQuestionManageResponse(id=question.id, quiz_id=question.quiz_id, question_text=question.question_text, image_url=question.image_url, allow_multiple=question.allow_multiple, is_active=question.is_active, answers=[{"answer_text": answer.answer_text, "is_correct": answer.is_correct} for answer in answers])


def instructor_student(instructor: User, student_id: int, db: Session) -> User:
    student = db.scalar(select(User).where(User.id == student_id, User.role == "student", User.instructor_id == instructor.id))
    if student is None:
        raise HTTPException(status_code=404, detail="Student not found")
    return student
