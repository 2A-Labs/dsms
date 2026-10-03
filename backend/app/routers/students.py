from fastapi import APIRouter, Depends, Header, HTTPException
from openai import OpenAI, OpenAIError
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.common import authenticated_user, settings
from app.database import get_db
from app.models import StudentDocument, User, VideoInstruction
from app.schemas import AssistantChatRequest, AssistantChatResponse, LectureResponse, StudentDocumentResponse

router = APIRouter()

@router.get("/api/lectures", response_model=list[LectureResponse])
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


@router.get("/api/documents", response_model=list[StudentDocumentResponse])
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


@router.post("/api/assistant/chat", response_model=AssistantChatResponse)
def assistant_chat(
    payload: AssistantChatRequest,
    authorization: str | None = Header(default=None),
    db: Session = Depends(get_db),
) -> AssistantChatResponse:
    student = authenticated_user(authorization, db)
    if student.role != "student":
        raise HTTPException(status_code=403, detail="Only students can use the assistant")
    if not settings.openai_api_key:
        raise HTTPException(status_code=503, detail="The AI assistant is not configured")

    instructor_name = "your instructor"
    document_titles: list[str] = []
    if student.instructor_id is not None:
        instructor = db.scalar(select(User).where(User.id == student.instructor_id))
        if instructor is not None:
            instructor_name = instructor.name
        document_titles = list(
            db.scalars(
                select(StudentDocument.title)
                .where(StudentDocument.instructor_id == student.instructor_id)
                .order_by(StudentDocument.created_at.desc())
                .limit(20)
            )
        )

    materials = ", ".join(document_titles) if document_titles else "No documents have been published yet"
    system_prompt = (
        "You are Roadwise Assistant, a careful driving-school tutor. "
        "Help students understand driving theory, lesson preparation, and safe practice. "
        "Be concise, encouraging, and practical. Do not provide legal certainty when rules vary by location; "
        "recommend checking the official local source or asking the instructor. "
        f"The student's instructor is {instructor_name}. Their available document titles are: {materials}. "
        "You only know the document titles, not the full document contents, so never pretend to quote an uploaded file."
    )
    messages = [{"role": "system", "content": system_prompt}]
    messages.extend(
        {"role": message.role, "content": message.content}
        for message in payload.history[-10:]
    )
    messages.append({"role": "user", "content": payload.message})

    try:
        response = OpenAI(api_key=settings.openai_api_key).chat.completions.create(
            model=settings.openai_model,
            messages=messages,
            temperature=0.3,
            max_tokens=500,
        )
    except OpenAIError as error:
        raise HTTPException(status_code=502, detail="The AI assistant is temporarily unavailable") from error

    reply = response.choices[0].message.content if response.choices else None
    if not reply:
        raise HTTPException(status_code=502, detail="The AI assistant returned an empty response")
    return AssistantChatResponse(reply=reply)
