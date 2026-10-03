from contextlib import asynccontextmanager

from fastapi import FastAPI
from sqlalchemy import select, text
from sqlalchemy.orm import Session

from app.database import Base, engine
from app.models import Course, Quiz, SchoolSettings


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
        session.execute(text("ALTER TABLE quiz_questions ADD COLUMN IF NOT EXISTS image_url TEXT"))
        session.execute(text("ALTER TABLE quiz_questions ADD COLUMN IF NOT EXISTS allow_multiple BOOLEAN NOT NULL DEFAULT FALSE"))
        session.execute(text("ALTER TABLE quiz_questions ADD COLUMN IF NOT EXISTS quiz_id INTEGER REFERENCES quizzes(id)"))
        session.execute(text("ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS description VARCHAR(500)"))
        session.execute(text("DROP INDEX IF EXISTS uq_quiz_answer_one_correct"))
        default_quiz = session.scalar(select(Quiz).order_by(Quiz.id).limit(1))
        if default_quiz is None:
            default_quiz = Quiz(name="General Quiz")
            session.add(default_quiz)
            session.flush()
        session.execute(
            text("UPDATE quiz_questions SET quiz_id = :quiz_id WHERE quiz_id IS NULL"),
            {"quiz_id": default_quiz.id},
        )
        session.commit()
    yield
