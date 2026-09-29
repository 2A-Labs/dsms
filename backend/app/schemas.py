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


class SchoolSettingsUpdate(BaseModel):
    school_name: str
    logo_mark: str
    primary_color: str
    accent_color: str


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


class BookingCreate(BaseModel):
    instructor_id: int
    slot: str


class BookingResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    student_id: int
    instructor_id: int
    slot: str
    status: str
