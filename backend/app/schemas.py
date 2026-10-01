from pydantic import BaseModel, ConfigDict


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
    answers: list[QuizAnswerResponse]


class QuizSubmissionAnswer(BaseModel):
    question_id: int
    answer_id: int


class QuizSubmissionRequest(BaseModel):
    answers: list[QuizSubmissionAnswer]


class QuizReviewItem(BaseModel):
    question_id: int
    question_text: str
    selected_answer: str | None
    correct_answer: str
    is_correct: bool


class QuizSubmissionResponse(BaseModel):
    score: int
    total: int
    review: list[QuizReviewItem]
