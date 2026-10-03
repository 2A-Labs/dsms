from fastapi import APIRouter, Depends, Header, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.common import quiz_response, student_user
from app.database import get_db
from app.models import Quiz, QuizAnswer, QuizQuestion
from app.schemas import QuizQuestionResponse, QuizResponse, QuizSubmissionRequest, QuizSubmissionResponse

router = APIRouter()

@router.get("/api/quizzes", response_model=list[QuizResponse])
def list_quizzes(
    authorization: str | None = Header(default=None), db: Session = Depends(get_db)
) -> list[Quiz]:
    student_user(authorization, db)
    quizzes = db.scalars(select(Quiz).where(Quiz.is_active.is_(True)).order_by(Quiz.name))
    return [
        quiz_response(quiz, db)
        for quiz in quizzes
        if db.scalar(
            select(QuizQuestion.id)
            .where(QuizQuestion.quiz_id == quiz.id, QuizQuestion.is_active.is_(True))
            .limit(1)
        )
        is not None
    ]


@router.get("/api/quiz/questions", response_model=list[QuizQuestionResponse])
def get_quiz_questions(
    quiz_id: int | None = Query(default=None),
    authorization: str | None = Header(default=None), db: Session = Depends(get_db)
) -> list[QuizQuestionResponse]:
    student_user(authorization, db)
    question_query = select(QuizQuestion).where(QuizQuestion.is_active.is_(True))
    if quiz_id is not None:
        question_query = question_query.where(QuizQuestion.quiz_id == quiz_id)
    questions = list(db.scalars(question_query.order_by(func.random()).limit(20)))
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
            quiz_id=question.quiz_id,
            question_text=question.question_text,
            image_url=question.image_url,
            allow_multiple=question.allow_multiple,
            answers=[
                {"id": answer.id, "answer_text": answer.answer_text}
                for answer in answers_by_question[question.id]
            ],
        )
        for question in questions
    ]


@router.post("/api/quiz/submit", response_model=QuizSubmissionResponse)
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
        if len(submitted.answer_ids) > 1 and not question.allow_multiple:
            raise HTTPException(status_code=400, detail="This question accepts one answer")
        if len(submitted.answer_ids) != len(set(submitted.answer_ids)):
            raise HTTPException(status_code=400, detail="Each answer can only be selected once")
        selected = [answer for answer in question_answers if answer.id in submitted.answer_ids]
        if len(selected) != len(submitted.answer_ids):
            raise HTTPException(status_code=400, detail="Answer not found for this question")
        correct = [answer for answer in question_answers if answer.is_correct]
        if not correct:
            raise HTTPException(status_code=409, detail="Every question must have one correct answer")
        review.append(
            {
                "question_id": question.id,
                "question_text": question.question_text,
                "selected_answers": [answer.answer_text for answer in selected],
                "correct_answers": [answer.answer_text for answer in correct],
                "is_correct": {answer.id for answer in selected} == {answer.id for answer in correct},
            }
        )

    return QuizSubmissionResponse(
        score=sum(item["is_correct"] for item in review),
        total=len(review),
        review=review,
    )
