"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { HomePanel } from "./HomePanel";
import {
  initialBookable,
  initialLectures,
  initialRequests,
  hours,
} from "./data";
import { LecturesPanel } from "./LecturesPanel";
import { PlannerPanel } from "./PlannerPanel";
import { Sidebar } from "./Sidebar";
import type { RequestStatus, View } from "./types";

export default function InstructorPage() {
  const router = useRouter();
  const [isImpersonating, setIsImpersonating] = useState(false);
  const [view, setView] = useState<View>("home");
  const [bookable, setBookable] = useState(initialBookable);
  const [requests, setRequests] = useState(initialRequests);
  const [lectures, setLectures] = useState(initialLectures);
  const requestedCount = requests.filter(
    (request) => request.status === "Requested",
  ).length;

  useEffect(() => {
    setIsImpersonating(Boolean(localStorage.getItem("roadwise_admin_token")));
  }, []);

  function returnToAdmin() {
    const adminToken = localStorage.getItem("roadwise_admin_token");
    if (!adminToken) return;
    localStorage.setItem("roadwise_token", adminToken);
    localStorage.removeItem("roadwise_admin_token");
    document.cookie = `roadwise_session=${adminToken}; path=/; max-age=86400; samesite=lax`;
    router.replace("/admin");
  }

  function toggleBookable(day: string, hour: string) {
    const key = `${day}-${hour}`;
    setBookable((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function bookWholeDay(day: string) {
    setBookable(
      (current) =>
        new Set([...current, ...hours.map((hour) => `${day}-${hour}`)]),
    );
  }

  function updateRequest(id: number, status: RequestStatus) {
    setRequests((current) =>
      current.map((request) =>
        request.id === id ? { ...request, status } : request,
      ),
    );
  }

  return (
    <main className="min-h-screen bg-background font-sans text-text">
      <div className="flex min-h-screen flex-col lg:flex-row">
        <Sidebar
          view={view}
          pendingCount={requestedCount}
          onViewChange={setView}
          onReturnToAdmin={isImpersonating ? returnToAdmin : undefined}
        />
        <section className="w-full lg:ml-64">
          <div className="mx-auto max-w-350 px-5 py-8 sm:px-8 lg:px-12 lg:py-12">
            {view === "home" ? (
              <HomePanel onPlanner={() => setView("planner")} />
            ) : view === "planner" ? (
              <PlannerPanel
                bookable={bookable}
                requests={requests}
                onToggle={toggleBookable}
                onBookWholeDay={bookWholeDay}
                onUpdateRequest={updateRequest}
              />
            ) : (
              <LecturesPanel
                lectures={lectures}
                onAdd={(lecture) =>
                  setLectures((current) => [
                    ...current,
                    { ...lecture, id: Date.now() },
                  ])
                }
                onRemove={(id) =>
                  setLectures((current) =>
                    current.filter((lecture) => lecture.id !== id),
                  )
                }
              />
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
