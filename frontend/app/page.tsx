"use client";

import { useEffect, useState } from "react";
import { HomePanel } from "./components/dashboard/HomePanel";
import { questions } from "./components/dashboard/data/mockData";
import { LecturesPanel } from "./components/dashboard/LecturesPanel";
import { LessonPanel } from "./components/dashboard/LessonPanel";
import { QuizPanel } from "./components/dashboard/QuizPanel";
import { Sidebar } from "./components/dashboard/Sidebar";
import { ChooseInstructor } from "./components/onboarding/ChooseInstructor";
import { createBooking, getInstructors, getMyBookings, type ApiInstructor } from "./lib/api";
import type {
  Question,
  QuizCategory,
  Tab,
} from "./components/dashboard/data/types";

function shuffle<T>(items: T[]) {
  return [...items].sort(() => Math.random() - 0.5);
}

export default function Dashboard() {
  const [instructors, setInstructors] = useState<ApiInstructor[]>([]);
  const [assignedInstructorId, setAssignedInstructorId] = useState<
    number | null
  >(null);
  const [tab, setTab] = useState<Tab>("home");
  const [selectedSlot, setSelectedSlot] = useState("");
  const [requestSent, setRequestSent] = useState(false);
  const [requestError, setRequestError] = useState("");
  const [quizCategory, setQuizCategory] = useState<QuizCategory | null>(null);
  const [quizQuestions, setQuizQuestions] = useState<Question[]>([]);
  const [quizIndex, setQuizIndex] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [quizDone, setQuizDone] = useState(false);
  const score = answers.filter(
    (answer, index) => answer === quizQuestions[index]?.answer,
  ).length;

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
      return <main className="grid min-h-screen place-items-center bg-background text-sm text-text-secondary">Loading instructors...</main>;
    }
    return <ChooseInstructor instructors={instructors} onAssign={setAssignedInstructorId} />;
  }

  function startQuiz(category: QuizCategory) {
    const selected =
      category === "final"
        ? ["theory", "signs", "intersections"].flatMap((key) =>
            shuffle(
              questions.filter((question) => question.category === key),
            ).slice(0, key === "theory" ? 20 : key === "signs" ? 10 : 4),
          )
        : shuffle(
            questions.filter((question) => question.category === category),
          ).slice(0, 10);
    setQuizCategory(category);
    setQuizQuestions(selected);
    setQuizIndex(0);
    setAnswers([]);
    setQuizDone(false);
  }

  function chooseAnswer(answer: number) {
    const nextAnswers = [...answers];
    nextAnswers[quizIndex] = answer;
    setAnswers(nextAnswers);
    if (quizIndex === quizQuestions.length - 1) setQuizDone(true);
    else setQuizIndex((current) => current + 1);
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
                    setRequestError(error instanceof Error ? error.message : "Unable to send booking request");
                  }
                }}
              />
            )}
            {tab === "quiz" && (
              <QuizPanel
                category={quizCategory}
                questions={quizQuestions}
                index={quizIndex}
                answers={answers}
                done={quizDone}
                score={score}
                onStart={startQuiz}
                onAnswer={chooseAnswer}
                onReset={() => {
                  setQuizCategory(null);
                  setQuizDone(false);
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
