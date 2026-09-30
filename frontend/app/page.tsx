"use client";

import { useEffect, useState } from "react";
import { HomePanel } from "./components/dashboard/HomePanel";
import { LecturesPanel } from "./components/dashboard/LecturesPanel";
import { LessonPanel } from "./components/dashboard/LessonPanel";
import { QuizPanel } from "./components/dashboard/QuizPanel";
import { Sidebar } from "./components/dashboard/Sidebar";
import { ChooseInstructor } from "./components/onboarding/ChooseInstructor";
import {
  createBooking,
  getInstructors,
  getMyBookings,
  getQuizQuestions,
  submitQuiz,
  type ApiInstructor,
  type ApiQuizQuestion,
  type ApiQuizSubmission,
} from "./lib/api";
import type { Tab } from "./components/dashboard/data/types";

export default function Dashboard() {
  const [instructors, setInstructors] = useState<ApiInstructor[]>([]);
  const [assignedInstructorId, setAssignedInstructorId] = useState<
    number | null
  >(null);
  const [tab, setTab] = useState<Tab>("home");
  const [selectedSlot, setSelectedSlot] = useState("");
  const [requestSent, setRequestSent] = useState(false);
  const [requestError, setRequestError] = useState("");
  const [quizQuestions, setQuizQuestions] = useState<ApiQuizQuestion[]>([]);
  const [quizIndex, setQuizIndex] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [quizResult, setQuizResult] = useState<ApiQuizSubmission | null>(null);
  const [quizLoading, setQuizLoading] = useState(false);
  const [quizError, setQuizError] = useState("");

  useEffect(() => {
    Promise.all([getInstructors(), getMyBookings()])
      .then(([availableInstructors, bookings]) => {
        setInstructors(availableInstructors);
        const latestBooking = bookings[0];
        if (latestBooking) {
          setAssignedInstructorId(latestBooking.instructor_id);
          setSelectedSlot(latestBooking.slot);
          setRequestSent(true);
        }
      })
      .catch(() => setRequestError("We could not load your booking details."));
  }, []);

  if (assignedInstructorId === null) {
    if (instructors.length === 0) {
      return (
        <main className="grid min-h-screen place-items-center bg-background text-sm text-text-secondary">
          Loading instructors...
        </main>
      );
    }
    return (
      <ChooseInstructor
        instructors={instructors}
        onAssign={setAssignedInstructorId}
      />
    );
  }

  async function startQuiz() {
    setQuizLoading(true);
    setQuizError("");
    try {
      setQuizQuestions(await getQuizQuestions());
      setQuizIndex(0);
      setAnswers([]);
      setQuizResult(null);
    } catch (error) {
      setQuizError(
        error instanceof Error ? error.message : "Unable to load the quiz",
      );
    } finally {
      setQuizLoading(false);
    }
  }

  async function chooseAnswer(answer: number) {
    const nextAnswers = [...answers];
    nextAnswers[quizIndex] = answer;
    setAnswers(nextAnswers);
    if (quizIndex === quizQuestions.length - 1) {
      setQuizLoading(true);
      setQuizError("");
      try {
        setQuizResult(
          await submitQuiz(
            quizQuestions.map((question, questionIndex) => ({
              question_id: question.id,
              answer_id: nextAnswers[questionIndex],
            })),
          ),
        );
      } catch (error) {
        setQuizError(
          error instanceof Error ? error.message : "Unable to submit the quiz",
        );
      } finally {
        setQuizLoading(false);
      }
    } else setQuizIndex((current) => current + 1);
  }

  return (
    <main className="min-h-screen bg-background font-sans text-text">
      <div className="flex min-h-screen flex-col lg:flex-row">
        <Sidebar tab={tab} onTabChange={setTab} />
        <section className="w-full lg:ml-64">
          <div className="mx-auto max-w-350 px-5 py-8 sm:px-8 lg:px-12 lg:py-12">
            {tab === "home" && <HomePanel onTabChange={setTab} />}
            {tab === "lessons" && (
              <LessonPanel
                instructors={instructors}
                instructorId={assignedInstructorId}
                selectedSlot={selectedSlot}
                requestSent={requestSent}
                requestError={requestError}
                onSlotChange={setSelectedSlot}
                onRequest={async () => {
                  setRequestError("");
                  try {
                    await createBooking(assignedInstructorId, selectedSlot);
                    setRequestSent(true);
                  } catch (error) {
                    setRequestError(
                      error instanceof Error
                        ? error.message
                        : "Unable to send booking request",
                    );
                  }
                }}
              />
            )}
            {tab === "quiz" && (
              <QuizPanel
                questions={quizQuestions}
                index={quizIndex}
                result={quizResult}
                loading={quizLoading}
                error={quizError}
                onStart={startQuiz}
                onAnswer={chooseAnswer}
                onReset={() => {
                  setQuizQuestions([]);
                  setQuizResult(null);
                  setQuizError("");
                }}
              />
            )}
            {tab === "lectures" && <LecturesPanel />}
          </div>
        </section>
      </div>
    </main>
  );
}
