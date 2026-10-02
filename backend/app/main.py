import base64
import hashlib
import hmac
import json
import secrets
from contextlib import asynccontextmanager
from threading import Lock
from time import monotonic
from urllib.parse import urlencode
from urllib.request import Request, urlopen

from fastapi import Depends, FastAPI, File, Form, Header, HTTPException, UploadFile, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import func, select, text
from sqlalchemy.orm import Session

from app.config import get_settings
from app.database import Base, engine, get_db
from app.models import Booking, Course, InstructorAvailability, QuizAnswer, QuizQuestion, SchoolSettings, StudentDocument, User, VideoInstruction
from app.schemas import (
    AuthResponse,
    BookingCreate,
    BookingResponse,
    CourseResponse,
    Credentials,
    InstructorCreate,
    InstructorAvailabilityUpdate,
    InstructorBookingResponse,
    InstructorAssignment,
    InstructorResponse,
    InstructorScheduleResponse,
    InstructorUpdate,
    LectureResponse,
    HeroImageResponse,
    InstructorStudentResponse,
    InstructorStudentUpdate,
    SignUpRequest,
    SchoolSettingsResponse,
    SchoolSettingsUpdate,
    StudentDocumentResponse,
    StudentPasswordReset,
    SetupRequest,
    SetupStatusResponse,
    QuizQuestionResponse,
    QuizSubmissionRequest,
    QuizSubmissionResponse,
    BookingStatusUpdate,
    UserResponse,
)

SETUP_REQUIRED_MESSAGE = "Please ask your administrator to set up the application"
HERO_IMAGE_CACHE_SECONDS = 60
hero_image_cache: HeroImageResponse | None = None
hero_image_last_requested_at = 0.0
hero_image_cache_lock = Lock()


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
        if session.scalar(select(SchoolSettings.id).limit(1)) is None:
            session.add(SchoolSettings())
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


def fetch_unsplash_hero_image() -> HeroImageResponse:
    access_key = settings.unsplash_access_key
    if not access_key:
        raise HTTPException(status_code=503, detail="Unsplash is not configured")

    query = urlencode({"query": "driving lesson", "orientation": "landscape"})
    request = Request(
        f"https://api.unsplash.com/photos/random?{query}",
        headers={"Authorization": f"Client-ID {access_key}"},
    )
    try:
        with urlopen(request, timeout=5) as response:
            photo = json.loads(response.read())
    except (OSError, ValueError) as error:
        raise HTTPException(status_code=502, detail="Unable to load the Unsplash image") from error

    user = photo.get("user", {})
    links = photo.get("links", {})
    photographer_name = user.get("name")
    photographer_url = user.get("links", {}).get("html")
    image_url = photo.get("urls", {}).get("regular")
    unsplash_url = links.get("html")
    if not all((photographer_name, photographer_url, image_url, unsplash_url)):
        raise HTTPException(status_code=502, detail="Unsplash returned an incomplete image")
    return HeroImageResponse(
        image_url=image_url,
        photographer_name=photographer_name,
        photographer_url=photographer_url,
        unsplash_url=unsplash_url,
    )


@app.get("/api/branding/hero-image", response_model=HeroImageResponse)
def get_hero_image() -> HeroImageResponse:
    global hero_image_cache, hero_image_last_requested_at

    with hero_image_cache_lock:
        now = monotonic()
        if (
            hero_image_cache is not None
            and now - hero_image_last_requested_at < HERO_IMAGE_CACHE_SECONDS
        ):
            return hero_image_cache

        cached_image = hero_image_cache
        hero_image_last_requested_at = now
        try:
            hero_image_cache = fetch_unsplash_hero_image()
        except HTTPException:
            if cached_image is not None:
                return cached_image
            raise
        return hero_image_cache


@app.get("/api/setup/status", response_model=SetupStatusResponse)
def get_setup_status(db: Session = Depends(get_db)) -> SetupStatusResponse:
    return SetupStatusResponse(
        setup_required=db.scalar(select(User.id).where(User.role == "admin")) is None
    )


@app.post("/api/setup", response_model=AuthResponse, status_code=201)
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


def student_user(authorization: str | None, db: Session) -> User:
    user = authenticated_user(authorization, db)
    if user.role != "student":
        raise HTTPException(status_code=403, detail="Only students can take quizzes")
    return user


@app.get("/api/quiz/questions", response_model=list[QuizQuestionResponse])
def get_quiz_questions(
    authorization: str | None = Header(default=None), db: Session = Depends(get_db)
) -> list[QuizQuestionResponse]:
    student_user(authorization, db)
    questions = list(
        db.scalars(
            select(QuizQuestion)
            .where(QuizQuestion.is_active.is_(True))
            .order_by(func.random())
            .limit(20)
        )
    )
    if len(questions) < 20:
        raise HTTPException(status_code=409, detail="At least 20 active quiz questions are required")

    question_ids = [question.id for question in questions]
    answers = list(
        db.scalars(
            select(QuizAnswer)
            .where(QuizAnswer.question_id.in_(question_ids))
            .order_by(QuizAnswer.id)
        )
    )
    answers_by_question: dict[int, list[QuizAnswer]] = {question_id: [] for question_id in question_ids}
    for answer in answers:
        answers_by_question[answer.question_id].append(answer)
    return [
        QuizQuestionResponse(
            id=question.id,
            question_text=question.question_text,
            answers=[
                {"id": answer.id, "answer_text": answer.answer_text}
                for answer in answers_by_question[question.id]
            ],
        )
        for question in questions
    ]


@app.post("/api/quiz/submit", response_model=QuizSubmissionResponse)
def submit_quiz(
    payload: QuizSubmissionRequest,
    authorization: str | None = Header(default=None),
    db: Session = Depends(get_db),
) -> QuizSubmissionResponse:
    student_user(authorization, db)
    if not payload.answers:
        raise HTTPException(status_code=400, detail="At least one answer is required")

    question_ids = [answer.question_id for answer in payload.answers]
    if len(question_ids) != len(set(question_ids)):
        raise HTTPException(status_code=400, detail="Each question can only be answered once")

    questions = list(db.scalars(select(QuizQuestion).where(QuizQuestion.id.in_(question_ids))))
    questions_by_id = {question.id: question for question in questions}
    answers = list(db.scalars(select(QuizAnswer).where(QuizAnswer.question_id.in_(question_ids))))
    answers_by_question: dict[int, list[QuizAnswer]] = {question_id: [] for question_id in question_ids}
    for answer in answers:
        answers_by_question[answer.question_id].append(answer)

    review = []
    for submitted in payload.answers:
        question = questions_by_id.get(submitted.question_id)
        if question is None:
            raise HTTPException(status_code=400, detail="Quiz question not found")
        question_answers = answers_by_question[question.id]
        selected = next((answer for answer in question_answers if answer.id == submitted.answer_id), None)
        correct = next((answer for answer in question_answers if answer.is_correct), None)
        if correct is None:
            raise HTTPException(status_code=409, detail="Every question must have one correct answer")
        review.append(
            {
                "question_id": question.id,
                "question_text": question.question_text,
                "selected_answer": selected.answer_text if selected else None,
                "correct_answer": correct.answer_text,
                "is_correct": selected is not None and selected.is_correct,
            }
        )

    return QuizSubmissionResponse(
        score=sum(item["is_correct"] for item in review),
        total=len(review),
        review=review,
    )


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


def instructor_user(authorization: str | None, db: Session) -> User:
    user = authenticated_user(authorization, db)
    if user.role != "instructor":
        raise HTTPException(status_code=403, detail="Only instructors can manage lectures")
    return user


def instructor_student(instructor: User, student_id: int, db: Session) -> User:
    student = db.scalar(
        select(User).where(
            User.id == student_id,
            User.role == "student",
            User.instructor_id == instructor.id,
        )
    )
    if student is None:
        raise HTTPException(status_code=404, detail="Student not found")
    return student


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
    if user.role != "admin" and db.scalar(select(User.id).where(User.role == "instructor")) is None:
        raise HTTPException(status_code=503, detail=SETUP_REQUIRED_MESSAGE)
    user.session_token = secrets.token_urlsafe(32)
    db.commit()
    db.refresh(user)
    return AuthResponse(token=user.session_token, user=user)


@app.get("/api/me", response_model=UserResponse)
def get_me(authorization: str | None = Header(default=None), db: Session = Depends(get_db)) -> User:
    return authenticated_user(authorization, db)


@app.put("/api/me/instructor", response_model=UserResponse)
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


@app.get("/api/instructor/lectures", response_model=list[LectureResponse])
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


@app.post("/api/instructor/lectures", response_model=LectureResponse, status_code=201)
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


@app.delete("/api/instructor/lectures/{lecture_id}", status_code=204)
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


@app.get("/api/instructor/students", response_model=list[InstructorStudentResponse])
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


@app.patch("/api/instructor/students/{student_id}", response_model=InstructorStudentResponse)
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


@app.patch("/api/instructor/students/{student_id}/password", status_code=204)
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


@app.get("/api/instructor/documents", response_model=list[StudentDocumentResponse])
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


@app.post("/api/instructor/documents", response_model=StudentDocumentResponse, status_code=201)
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


@app.delete("/api/instructor/documents/{document_id}", status_code=204)
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


@app.get("/api/instructors", response_model=list[InstructorResponse])
def list_instructors(db: Session = Depends(get_db)) -> list[InstructorResponse]:
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
        result.append(
            InstructorResponse(
                id=instructor.id,
                name=instructor.name,
                initials="".join(part[0] for part in instructor.name.split()),
                school=instructor.school or "Roadwise Central",
                location=instructor.location or "Northside",
                slots=[slot for slot in availability if slot not in booked_slots],
            )
        )
    return result


@app.get("/api/instructor/schedule", response_model=InstructorScheduleResponse)
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


@app.put("/api/instructor/availability")
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


@app.patch("/api/instructor/bookings/{booking_id}")
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


@app.get("/api/lectures", response_model=list[LectureResponse])
def list_my_lectures(
    authorization: str | None = Header(default=None), db: Session = Depends(get_db)
) -> list[LectureResponse]:
    student = authenticated_user(authorization, db)
    if student.role != "student":
        raise HTTPException(status_code=403, detail="Only students can view assigned lectures")
    if student.instructor_id is None:
        return []
    instructor = db.scalar(select(User).where(User.id == student.instructor_id, User.role == "instructor"))
    if instructor is None:
        return []
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


@app.get("/api/documents", response_model=list[StudentDocumentResponse])
def list_my_documents(
    authorization: str | None = Header(default=None), db: Session = Depends(get_db)
) -> list[StudentDocument]:
    student = authenticated_user(authorization, db)
    if student.role != "student":
        raise HTTPException(status_code=403, detail="Only students can view documents")
    if student.instructor_id is None:
        return []
    return list(
        db.scalars(
            select(StudentDocument)
            .where(StudentDocument.instructor_id == student.instructor_id)
            .order_by(StudentDocument.created_at.desc())
        )
    )


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


@app.get("/api/bookings/me", response_model=list[BookingResponse])
def list_my_bookings(authorization: str | None = Header(default=None), db: Session = Depends(get_db)) -> list[Booking]:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing session token")
    user = current_user(authorization[7:], db)
    return list(db.scalars(select(Booking).where(Booking.student_id == user.id).order_by(Booking.id.desc())))
