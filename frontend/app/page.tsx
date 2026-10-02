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
  getQuizQuestions,
  submitQuiz,
  type ApiInstructor,
  type ApiLecture,
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
  const [bookings, setBookings] = useState<import("./lib/api").ApiBooking[]>([]);
  const [requestSent, setRequestSent] = useState(false);
  const [requestError, setRequestError] = useState("");
  const [quizQuestions, setQuizQuestions] = useState<ApiQuizQuestion[]>([]);
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
    ])
      .then(([availableInstructors, user, bookings, availableLectures, availableDocuments]) => {
        setInstructors(availableInstructors);
        setStudentName(user.name);
        setBookings(bookings);
        setLectures(availableLectures);
        setDocuments(availableDocuments);
        if (user.instructor_id !== null) {
          setAssignedInstructorId(user.instructor_id);
        }
        const latestBooking = bookings[0];
        if (latestBooking) {
          setSelectedSlot(latestBooking.slot);
          setRequestSent(true);
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
        <Sidebar tab={tab} studentName={studentName} onTabChange={setTab} />
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
