"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { HomePanel } from "./HomePanel";
import { getPlannerDays, hours, isPlannerSlotPast } from "./data";
import { LecturesPanel } from "./LecturesPanel";
import { DocumentsPanel } from "./DocumentsPanel";
import { StudentsPanel } from "./StudentsPanel";
import { QuizEditorPanel } from "../components/quiz/QuizEditorPanel";
import { PlannerPanel } from "./PlannerPanel";
import { Sidebar } from "./Sidebar";
import type { BookingRequest, RequestStatus, View } from "./types";
import type { PlannerDay } from "./data";
import {
  clearSession,
  createInstructorDocument,
  createInstructorLecture,
  deleteInstructorDocument,
  deleteInstructorLecture,
  getInstructorDocuments,
  getInstructorSchedule,
  getInstructorLectures,
  getInstructorStudents,
  getMe,
  resetStudentPassword,
  updateInstructorStudent,
  updateInstructorAvailability,
  updateInstructorBooking,
} from "../lib/api";
import type { Lecture } from "./types";
import type { NotificationItem } from "../components/Notifications";

export default function InstructorPage() {
  const router = useRouter();
  const [isImpersonating, setIsImpersonating] = useState(false);
  const [view, setView] = useState<View>("home");
  const [bookable, setBookable] = useState<Set<string>>(new Set());
  const [requests, setRequests] = useState<BookingRequest[]>([]);
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [documents, setDocuments] = useState<import("../lib/api").ApiDocument[]>([]);
  const [students, setStudents] = useState<import("../lib/api").ApiStudent[]>([]);
  const [instructorName, setInstructorName] = useState("Instructor");
  const [bookedHours, setBookedHours] = useState(0);
  const [scheduleError, setScheduleError] = useState("");
  const [plannerDays] = useState(() => getPlannerDays());
  const requestedCount = requests.filter(
    (request) => request.status === "Requested",
  ).length;
  const notifications: NotificationItem[] = requests
    .slice()
    .sort((left, right) => right.id - left.id)
    .slice(0, 5)
    .map((request) => ({
      id: `request-${request.id}`,
      title:
        request.status === "Requested"
          ? "New lesson request"
          : `Request ${request.status.toLowerCase()}`,
      detail: `${request.student} · ${request.day} at ${request.time}`,
      tone:
        request.status === "Booked"
          ? "success"
          : request.status === "Declined"
            ? "error"
            : "warning",
    }));

  useEffect(() => {
    setIsImpersonating(Boolean(localStorage.getItem("roadwise_admin_token")));
    Promise.all([
      getMe(),
      getInstructorSchedule(),
      getInstructorLectures(),
      getInstructorDocuments(),
      getInstructorStudents(),
    ])
      .then(([user, schedule, loadedLectures, loadedDocuments, loadedStudents]) => {
        setInstructorName(user.name);
        setBookedHours(schedule.booked_hours);
        setBookable(
          new Set(
            schedule.bookable_slots.map((slot) => slot.replace(" · ", "-")),
          ),
        );
        setRequests(
          schedule.bookings.map((booking) => {
            const [day, time] = booking.slot.split(" · ");
            return {
              id: booking.id,
              student: booking.student_name,
              day,
              time,
              detail: "Practical driving lesson",
              status: booking.status,
            };
          }),
        );
        setLectures(
          loadedLectures.map((lecture) => ({
            id: lecture.id,
            title: lecture.title,
            file: lecture.file_url.startsWith("data:")
              ? "Uploaded video"
              : lecture.file_url,
            fileUrl: lecture.file_url,
          })),
        );
        setDocuments(loadedDocuments);
        setStudents(loadedStudents);
      })
      .catch(() => setScheduleError("We could not load your instructor data."));
  }, []);

  useEffect(() => {
    const refreshSchedule = () => {
      getInstructorSchedule()
        .then((schedule) => {
          setBookedHours(schedule.booked_hours);
          setBookable(
            new Set(
              schedule.bookable_slots.map((slot) => slot.replace(" · ", "-")),
            ),
          );
          setRequests(
            schedule.bookings.map((booking) => {
              const [day, time] = booking.slot.split(" · ");
              return {
                id: booking.id,
                student: booking.student_name,
                day,
                time,
                detail: "Practical driving lesson",
                status: booking.status,
              };
            }),
          );
        })
        .catch(() => undefined);
    };
    const interval = window.setInterval(refreshSchedule, 15000);
    return () => window.clearInterval(interval);
  }, []);

  function returnToAdmin() {
    const adminToken = localStorage.getItem("roadwise_admin_token");
    if (!adminToken) return;
    localStorage.setItem("roadwise_token", adminToken);
    localStorage.removeItem("roadwise_admin_token");
    document.cookie = `roadwise_session=${adminToken}; path=/; max-age=86400; samesite=lax`;
    document.cookie =
      "roadwise_role=admin; path=/; max-age=86400; samesite=lax";
    router.replace("/admin");
  }

  function signOut() {
    clearSession();
    router.replace("/login");
  }

  async function toggleBookable(day: string, hour: string) {
    const key = `${day}-${hour}`;
    const isOpen = !bookable.has(key);
    setScheduleError("");
    try {
      await updateInstructorAvailability(`${day} · ${hour}`, isOpen);
      setBookable((current) => {
        const next = new Set(current);
        if (isOpen) next.add(key);
        else next.delete(key);
        return next;
      });
    } catch (error) {
      setScheduleError(
        error instanceof Error
          ? error.message
          : "Unable to update availability",
      );
    }
  }

  async function bookWholeDay(day: PlannerDay) {
    const slots = hours.filter(
      (hour) =>
        !isPlannerSlotPast(day.key, hour) && !bookable.has(`${day.key}-${hour}`),
    );
    setScheduleError("");
    try {
      await Promise.all(
        slots.map((hour) =>
          updateInstructorAvailability(`${day.key} · ${hour}`, true),
        ),
      );
      setBookable(
        (current) =>
          new Set([...current, ...slots.map((hour) => `${day.key}-${hour}`)]),
      );
    } catch (error) {
      setScheduleError(
        error instanceof Error
          ? error.message
          : "Unable to update availability",
      );
    }
  }

  async function updateRequest(id: number, status: RequestStatus) {
    setScheduleError("");
    try {
      const booking = await updateInstructorBooking(id, status);
      setRequests((current) =>
        current.map((request) =>
          request.id === id ? { ...request, status: booking.status } : request,
        ),
      );
      if (status === "Booked") {
        setBookedHours((current) => current + 1);
        setBookable((current) => {
          const next = new Set(current);
          const [day, time] = booking.slot.split(" · ");
          next.delete(`${day}-${time}`);
          return next;
        });
      }
    } catch (error) {
      setScheduleError(
        error instanceof Error ? error.message : "Unable to update booking",
      );
    }
  }

  return (
    <main className="min-h-screen bg-background font-sans text-text">
      <div className="flex min-h-screen flex-col lg:flex-row">
        <Sidebar
          view={view}
          instructorName={instructorName}
          bookedHours={bookedHours}
          bookableSlots={bookable.size}
          pendingCount={requestedCount}
          onViewChange={setView}
          onReturnToAdmin={isImpersonating ? returnToAdmin : undefined}
          onSignOut={signOut}
          notifications={notifications}
        />
        <section className="w-full lg:ml-64">
          <div className="mx-auto max-w-350 px-5 py-8 sm:px-8 lg:px-12 lg:py-12">
            {scheduleError && (
              <p className="mb-6 rounded-md bg-error/10 p-4 text-xs font-bold text-error">
                {scheduleError}
              </p>
            )}
            {view === "home" ? (
              <HomePanel
                instructorName={instructorName}
                requests={requests}
                bookableSlots={bookable.size}
                onPlanner={() => setView("planner")}
              />
            ) : view === "planner" ? (
              <PlannerPanel
                days={plannerDays}
                bookable={bookable}
                requests={requests}
                onToggle={toggleBookable}
                onBookWholeDay={bookWholeDay}
                onUpdateRequest={updateRequest}
              />
            ) : view === "lectures" ? (
              <LecturesPanel
                lectures={lectures}
                onAdd={async (title, file) => {
                  const lecture = await createInstructorLecture(title, file);
                  setLectures((current) => [
                    {
                      id: lecture.id,
                      title: lecture.title,
                      file: file.name,
                      fileUrl: lecture.file_url,
                    },
                    ...current,
                  ]);
                }}
                onRemove={async (id) => {
                  await deleteInstructorLecture(id);
                  setLectures((current) =>
                    current.filter((lecture) => lecture.id !== id),
                  );
                }}
              />
            ) : view === "documents" ? (
              <DocumentsPanel
                documents={documents}
                onAdd={async (title, file) => {
                  const document = await createInstructorDocument(title, file);
                  setDocuments((current) => [document, ...current]);
                }}
                onRemove={async (id) => {
                  await deleteInstructorDocument(id);
                  setDocuments((current) =>
                    current.filter((document) => document.id !== id),
                  );
                }}
              />
            ) : view === "students" ? (
              <StudentsPanel
                students={students}
                onUpdate={async (id, name, email) => {
                  const student = await updateInstructorStudent(id, { name, email });
                  setStudents((current) =>
                    current.map((item) => (item.id === student.id ? student : item)),
                  );
                }}
                onResetPassword={async (id, password) => {
                  await resetStudentPassword(id, password);
                }}
              />
            ) : (
              <QuizEditorPanel />
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
