from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.common import quiz_manage_response, quiz_manager, quiz_response
from app.database import get_db
from app.models import Quiz, QuizAnswer, QuizQuestion
from app.schemas import QuizQuestionManageResponse, QuizQuestionWrite, QuizResponse, QuizWrite

router = APIRouter()

@router.get("/api/quiz/manage/quizzes", response_model=list[QuizResponse])
def list_manage_quizzes(
    authorization: str | None = Header(default=None), db: Session = Depends(get_db)
) -> list[Quiz]:
    quiz_manager(authorization, db)
    return [quiz_response(quiz, db) for quiz in db.scalars(select(Quiz).order_by(Quiz.name))]


@router.post("/api/quiz/manage/quizzes", response_model=QuizResponse, status_code=201)
def create_manage_quiz(
    payload: QuizWrite,
    authorization: str | None = Header(default=None),
    db: Session = Depends(get_db),
) -> Quiz:
    quiz_manager(authorization, db)
    if db.scalar(select(Quiz.id).where(Quiz.name == payload.name.strip())) is not None:
        raise HTTPException(status_code=409, detail="A quiz with that name already exists")
    quiz = Quiz(
        name=payload.name.strip(),
        description=payload.description.strip() if payload.description else None,
        is_active=payload.is_active,
    )
    db.add(quiz)
    db.commit()
    db.refresh(quiz)
    return quiz_response(quiz, db)


@router.delete("/api/quiz/manage/quizzes/{quiz_id}", status_code=204)
def delete_manage_quiz(
    quiz_id: int,
    authorization: str | None = Header(default=None),
    db: Session = Depends(get_db),
) -> None:
    quiz_manager(authorization, db)
    quiz = db.scalar(select(Quiz).where(Quiz.id == quiz_id))
    if quiz is None:
        raise HTTPException(status_code=404, detail="Quiz not found")
    question_ids = list(db.scalars(select(QuizQuestion.id).where(QuizQuestion.quiz_id == quiz.id)))
    if question_ids:
        for answer in list(db.scalars(select(QuizAnswer).where(QuizAnswer.question_id.in_(question_ids)))):
            db.delete(answer)
        for question in list(db.scalars(select(QuizQuestion).where(QuizQuestion.id.in_(question_ids)))):
            db.delete(question)
    db.delete(quiz)
    db.commit()


@router.get("/api/quiz/manage/questions", response_model=list[QuizQuestionManageResponse])
def list_manage_quiz_questions(
    authorization: str | None = Header(default=None), db: Session = Depends(get_db)
) -> list[QuizQuestionManageResponse]:
    quiz_manager(authorization, db)
    questions = db.scalars(select(QuizQuestion).order_by(QuizQuestion.id.desc()))
    return [quiz_manage_response(question, db) for question in questions]


def validate_quiz_answers(payload: QuizQuestionWrite) -> None:
    correct_count = sum(answer.is_correct for answer in payload.answers)
    if correct_count != 1 and not payload.allow_multiple:
        raise HTTPException(status_code=400, detail="Single-answer questions need exactly one correct answer")
    if payload.allow_multiple and correct_count < 2:
        raise HTTPException(status_code=400, detail="Multiple-answer questions need at least two correct answers")


@router.post("/api/quiz/manage/questions", response_model=QuizQuestionManageResponse, status_code=201)
def create_manage_quiz_question(
    payload: QuizQuestionWrite,
    authorization: str | None = Header(default=None),
    db: Session = Depends(get_db),
) -> QuizQuestionManageResponse:
    quiz_manager(authorization, db)
    validate_quiz_answers(payload)
    quiz = db.scalar(select(Quiz).where(Quiz.id == payload.quiz_id))
    if quiz is None:
        raise HTTPException(status_code=404, detail="Quiz not found")
    question = QuizQuestion(
        quiz_id=quiz.id,
        question_text=payload.question_text.strip(),
        image_url=payload.image_url.strip() if payload.image_url else None,
        allow_multiple=payload.allow_multiple,
        is_active=payload.is_active,
    )
    db.add(question)
    db.flush()
    db.add_all(
        [
            QuizAnswer(
                question_id=question.id,
                answer_text=answer.answer_text.strip(),
                is_correct=answer.is_correct,
            )
            for answer in payload.answers
        ]
    )
    db.commit()
    db.refresh(question)
    return quiz_manage_response(question, db)


@router.patch("/api/quiz/manage/questions/{question_id}", response_model=QuizQuestionManageResponse)
def update_manage_quiz_question(
    question_id: int,
    payload: QuizQuestionWrite,
    authorization: str | None = Header(default=None),
    db: Session = Depends(get_db),
) -> QuizQuestionManageResponse:
    quiz_manager(authorization, db)
    question = db.scalar(select(QuizQuestion).where(QuizQuestion.id == question_id))
    if question is None:
        raise HTTPException(status_code=404, detail="Quiz question not found")
    validate_quiz_answers(payload)
    quiz = db.scalar(select(Quiz).where(Quiz.id == payload.quiz_id))
    if quiz is None:
        raise HTTPException(status_code=404, detail="Quiz not found")
    question.quiz_id = quiz.id
    question.question_text = payload.question_text.strip()
    question.image_url = payload.image_url.strip() if payload.image_url else None
    question.allow_multiple = payload.allow_multiple
    question.is_active = payload.is_active
    for answer in list(db.scalars(select(QuizAnswer).where(QuizAnswer.question_id == question.id))):
        db.delete(answer)
    db.flush()
    db.add_all(
        [
            QuizAnswer(
                question_id=question.id,
                answer_text=answer.answer_text.strip(),
                is_correct=answer.is_correct,
            )
            for answer in payload.answers
        ]
    )
    db.commit()
    db.refresh(question)
    return quiz_manage_response(question, db)


@router.delete("/api/quiz/manage/questions/{question_id}", status_code=204)
def delete_manage_quiz_question(
    question_id: int,
    authorization: str | None = Header(default=None),
    db: Session = Depends(get_db),
) -> None:
    quiz_manager(authorization, db)
    question = db.scalar(select(QuizQuestion).where(QuizQuestion.id == question_id))
    if question is None:
        raise HTTPException(status_code=404, detail="Quiz question not found")
    for answer in list(db.scalars(select(QuizAnswer).where(QuizAnswer.question_id == question.id))):
        db.delete(answer)
    db.delete(question)
    db.commit()
