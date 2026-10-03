"use client";

import { useEffect, useState } from "react";
import { HomePanel } from "./components/dashboard/HomePanel";
import { LecturesPanel } from "./components/dashboard/LecturesPanel";
import { DocumentsPanel } from "./components/dashboard/DocumentsPanel";
import { AssistantPanel } from "./components/dashboard/AssistantPanel";
import { LessonPanel } from "./components/dashboard/LessonPanel";
import { QuizPanel } from "./components/dashboard/QuizPanel";
import { Sidebar } from "./components/dashboard/Sidebar";
import { ChooseInstructor } from "./components/onboarding/ChooseInstructor";
import {
  createBooking,
  assignInstructor,
  getMe,
  getInstructors,
  getMyBookings,
  getMyLectures,
  getMyDocuments,
  getQuizzes,
  getQuizQuestions,
  submitQuiz,
  type ApiInstructor,
  type ApiLecture,
  type ApiQuizQuestion,
  type ApiQuizSubmission,
  type ApiQuiz,
} from "./lib/api";
import type { Tab } from "./components/dashboard/data/types";
import type { NotificationItem } from "./components/Notifications";

export default function Dashboard() {
  const [instructors, setInstructors] = useState<ApiInstructor[]>([]);
  const [assignedInstructorId, setAssignedInstructorId] = useState<
    number | null
  >(null);
  const [tab, setTab] = useState<Tab>("home");
  const [selectedSlot, setSelectedSlot] = useState("");
  const [bookings, setBookings] = useState<import("./lib/api").ApiBooking[]>([]);
  const [requestStatus, setRequestStatus] = useState<
    "Requested" | "Booked" | "Declined" | null
  >(null);
  const [requestError, setRequestError] = useState("");
  const [quizQuestions, setQuizQuestions] = useState<ApiQuizQuestion[]>([]);
  const [quizzes, setQuizzes] = useState<ApiQuiz[]>([]);
  const [selectedQuizId, setSelectedQuizId] = useState<number | null>(null);
  const [quizIndex, setQuizIndex] = useState(0);
  const [answers, setAnswers] = useState<number[][]>([]);
  const [quizResult, setQuizResult] = useState<ApiQuizSubmission | null>(null);
  const [quizLoading, setQuizLoading] = useState(false);
  const [quizError, setQuizError] = useState("");
  const [loading, setLoading] = useState(true);
  const [studentName, setStudentName] = useState("");
  const [lectures, setLectures] = useState<ApiLecture[]>([]);
  const [documents, setDocuments] = useState<import("./lib/api").ApiDocument[]>([]);
  const [lecturesLoading, setLecturesLoading] = useState(true);
  const [lecturesError, setLecturesError] = useState("");
  const [documentsLoading, setDocumentsLoading] = useState(true);
  const [documentsError, setDocumentsError] = useState("");

  useEffect(() => {
    Promise.all([
      getInstructors(),
      getMe(),
      getMyBookings(),
      getMyLectures(),
      getMyDocuments(),
      getQuizzes(),
    ])
      .then(([availableInstructors, user, bookings, availableLectures, availableDocuments, availableQuizzes]) => {
        setInstructors(availableInstructors);
        setStudentName(user.name);
        setBookings(bookings);
        setLectures(availableLectures);
        setDocuments(availableDocuments);
        setQuizzes(availableQuizzes);
        setSelectedQuizId(availableQuizzes[0]?.id ?? null);
        if (user.instructor_id !== null) {
          setAssignedInstructorId(user.instructor_id);
        }
        const latestBooking = bookings[0];
        if (latestBooking) {
          setSelectedSlot(latestBooking.slot);
          setRequestStatus(toBookingStatus(latestBooking.status));
          if (user.instructor_id === null) {
            setAssignedInstructorId(latestBooking.instructor_id);
          }
        }
      })
      .catch(() => {
        setRequestError("We could not load your account details.");
        setLecturesError("We could not load your video lectures.");
        setDocumentsError("We could not load your documents.");
      })
      .finally(() => {
        setLoading(false);
        setLecturesLoading(false);
        setDocumentsLoading(false);
      });
  }, []);

  useEffect(() => {
    const refreshBookings = () => {
      getMyBookings()
        .then((latestBookings) => {
          setBookings(latestBookings);
          const latestBooking = latestBookings[0];
          if (latestBooking) {
            setSelectedSlot(latestBooking.slot);
            setRequestStatus(toBookingStatus(latestBooking.status));
          }
        })
        .catch(() => undefined);
    };
    const interval = window.setInterval(refreshBookings, 15000);
    return () => window.clearInterval(interval);
  }, []);

  const notifications: NotificationItem[] = bookings
    .slice(0, 5)
    .map((booking) => ({
      id: `booking-${booking.id}`,
      title:
        booking.status === "Booked"
          ? "Lesson confirmed"
          : booking.status === "Declined"
            ? "Booking request declined"
            : "Booking request sent",
      detail: `${formatSlot(booking.slot)} · ${
        booking.status === "Booked"
          ? "Your instructor accepted the lesson."
          : booking.status === "Declined"
            ? "Choose another available time to request a lesson."
            : "Waiting for your instructor to review it."
      }`,
      tone:
        booking.status === "Booked"
          ? "success"
          : booking.status === "Declined"
            ? "error"
            : "primary",
    }));

  if (assignedInstructorId === null) {
    if (loading) {
      return (
        <main className="grid min-h-screen place-items-center bg-background text-sm text-text-secondary">
          Loading instructors...
        </main>
      );
    }
    return (
      <ChooseInstructor
        instructors={instructors}
        onAssign={async (instructorId) => {
          await assignInstructor(instructorId);
          setAssignedInstructorId(instructorId);
        }}
      />
    );
  }

  async function startQuiz() {
    setQuizLoading(true);
    setQuizError("");
    try {
      if (selectedQuizId === null) throw new Error("No quiz is available yet");
      setQuizQuestions(await getQuizQuestions(selectedQuizId));
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

  async function chooseAnswer(answerIds: number[]) {
    const nextAnswers = [...answers];
    nextAnswers[quizIndex] = answerIds;
    setAnswers(nextAnswers);
    if (quizIndex === quizQuestions.length - 1) {
      setQuizLoading(true);
      setQuizError("");
      try {
        setQuizResult(
          await submitQuiz(
            quizQuestions.map((question, questionIndex) => ({
              question_id: question.id,
              answer_ids: nextAnswers[questionIndex],
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
        <Sidebar
          tab={tab}
          studentName={studentName}
          onTabChange={setTab}
          notifications={notifications}
        />
        <section className="w-full lg:ml-64">
          <div className="mx-auto max-w-350 px-5 py-8 sm:px-8 lg:px-12 lg:py-12">
            {tab === "home" && (
              <HomePanel
                studentName={studentName}
                instructor={instructors.find((item) => item.id === assignedInstructorId)}
                bookings={bookings}
                lectureCount={lectures.length}
                documentCount={documents.length}
                onTabChange={setTab}
              />
            )}
            {tab === "lessons" && (
              <LessonPanel
                instructors={instructors}
                instructorId={assignedInstructorId}
                selectedSlot={selectedSlot}
                requestStatus={requestStatus}
                requestError={requestError}
                onSlotChange={setSelectedSlot}
                onRequest={async () => {
                  setRequestError("");
                  try {
                    const booking = await createBooking(
                      assignedInstructorId,
                      selectedSlot,
                    );
                    setBookings((current) => [booking, ...current]);
                    setRequestStatus(toBookingStatus(booking.status));
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
              <>
                {quizQuestions.length === 0 && !quizResult && (
                  <section className="mb-8">
                    <div className="mb-4">
                      <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-primary">Knowledge checks</p>
                      <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">Choose a quiz</h1>
                      <p className="mt-2 text-sm text-text-secondary">Select a quiz below, then start when you are ready.</p>
                    </div>
                    {quizzes.length ? (
                      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                        {quizzes.map((quiz) => (
                          <button
                            className={`min-h-44 rounded-lg border p-5 text-left transition ${selectedQuizId === quiz.id ? "border-primary bg-primary-light shadow-lg shadow-primary/10" : "border-border bg-surface hover:border-primary"}`}
                            key={quiz.id}
                            type="button"
                            onClick={() => { setSelectedQuizId(quiz.id); setQuizError(""); }}
                          >
                            <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-primary">{quiz.question_count} questions</span>
                            <h2 className="mt-4 font-display text-xl font-semibold">{quiz.name}</h2>
                            <p className="mt-2 text-xs leading-5 text-text-secondary">{quiz.description || "No description added."}</p>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <p className="rounded-lg border border-border bg-surface p-6 text-sm text-text-secondary">No quizzes are available yet.</p>
                    )}
                  </section>
                )}
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
              </>
            )}
            {tab === "lectures" && (
              <LecturesPanel
                lectures={lectures}
                loading={lecturesLoading}
                error={lecturesError}
              />
            )}
            {tab === "documents" && (
              <DocumentsPanel
                documents={documents}
                loading={documentsLoading}
                error={documentsError}
              />
            )}
            {tab === "assistant" && <AssistantPanel />}
          </div>
        </section>
      </div>
    </main>
  );
}

function toBookingStatus(
  status: string,
): "Requested" | "Booked" | "Declined" | null {
  return status === "Requested" || status === "Booked" || status === "Declined"
    ? status
    : null;
}

function formatSlot(slot: string): string {
  return slot.replace(" · ", " at ");
}
