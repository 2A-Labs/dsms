from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class CourseResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    category: str
    duration_hours: int
    status: str


class Credentials(BaseModel):
    email: str
    password: str


class SignUpRequest(Credentials):
    name: str


class SetupRequest(SignUpRequest):
    pass


class SetupStatusResponse(BaseModel):
    setup_required: bool


class HeroImageResponse(BaseModel):
    image_url: str
    photographer_name: str
    photographer_url: str
    unsplash_url: str


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    email: str
    role: str
    instructor_id: int | None
    school: str | None = None
    location: str | None = None


class InstructorCreate(BaseModel):
    name: str
    email: str
    password: str
    school: str | None = None
    location: str | None = None


class InstructorUpdate(BaseModel):
    name: str | None = None
    email: str | None = None
    password: str | None = None
    school: str | None = None
    location: str | None = None


class InstructorStudentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    email: str


class InstructorStudentUpdate(BaseModel):
    name: str
    email: str


class StudentPasswordReset(BaseModel):
    password: str = Field(min_length=8)


class AssistantChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=2000)
    history: list["AssistantMessage"] = Field(default_factory=list, max_length=12)


class AssistantMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str = Field(min_length=1, max_length=2000)


class AssistantChatResponse(BaseModel):
    reply: str


class SchoolSettingsResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    school_name: str
    logo_mark: str
    primary_color: str
    accent_color: str
    logo_data: str | None = None


class SchoolSettingsUpdate(BaseModel):
    school_name: str
    logo_mark: str
    primary_color: str
    accent_color: str
    logo_data: str | None = None


class AuthResponse(BaseModel):
    token: str
    user: UserResponse


class InstructorResponse(BaseModel):
    id: int
    name: str
    initials: str
    school: str
    location: str
    slots: list[str]


class LectureResponse(BaseModel):
    id: int
    instructor_id: int
    instructor_name: str
    title: str
    file_url: str
    duration_seconds: int | None


class StudentDocumentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    instructor_id: int
    title: str
    file_name: str
    mime_type: str
    file_url: str
    created_at: datetime


class BookingCreate(BaseModel):
    instructor_id: int
    slot: str


class InstructorAssignment(BaseModel):
    instructor_id: int


class BookingResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    student_id: int
    instructor_id: int
    slot: str
    status: str


class InstructorBookingResponse(BaseModel):
    id: int
    student_id: int
    student_name: str
    slot: str
    status: str


class InstructorScheduleResponse(BaseModel):
    bookable_slots: list[str]
    bookings: list[InstructorBookingResponse]
    booked_hours: int


class InstructorAvailabilityUpdate(BaseModel):
    slot: str
    is_open: bool


class BookingStatusUpdate(BaseModel):
    status: str


class QuizAnswerResponse(BaseModel):
    id: int
    answer_text: str


class QuizQuestionResponse(BaseModel):
    id: int
    question_text: str
    image_url: str | None = None
    allow_multiple: bool = False
    answers: list[QuizAnswerResponse]


class QuizAnswerManage(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    answer_text: str = Field(min_length=1, max_length=500)
    is_correct: bool = False


class QuizQuestionManageResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    question_text: str
    image_url: str | None
    allow_multiple: bool
    is_active: bool
    answers: list[QuizAnswerManage]


class QuizQuestionWrite(BaseModel):
    question_text: str = Field(min_length=1, max_length=2000)
    image_url: str | None = None
    allow_multiple: bool = False
    is_active: bool = True
    answers: list[QuizAnswerManage] = Field(min_length=2, max_length=8)


class QuizSubmissionAnswer(BaseModel):
    question_id: int
    answer_ids: list[int] = Field(min_length=1, max_length=8)


class QuizSubmissionRequest(BaseModel):
    answers: list[QuizSubmissionAnswer]


class QuizReviewItem(BaseModel):
    question_id: int
    question_text: str
    selected_answers: list[str]
    correct_answers: list[str]
    is_correct: bool


class QuizSubmissionResponse(BaseModel):
    score: int
    total: int
    review: list[QuizReviewItem]
