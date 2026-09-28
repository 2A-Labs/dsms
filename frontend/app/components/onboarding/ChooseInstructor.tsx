"use client";

import { useState } from "react";
import type { Instructor } from "../dashboard/data/types";

export function ChooseInstructor({
  instructors,
  onAssign,
}: {
  instructors: Instructor[];
  onAssign: (instructorId: number) => void;
}) {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const selectedInstructor = instructors.find(
    (instructor) => instructor.id === selectedId,
  );

  return (
    <main className="min-h-screen bg-background px-5 py-8 font-sans text-text sm:px-8 sm:py-12">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-5xl flex-col justify-center">
        <div className="mb-10 flex items-center gap-2.5 font-display text-xl font-bold">
          <span className="grid size-8 place-items-center rounded-lg bg-primary text-sm text-white">
            R
          </span>
          roadwise
        </div>
        <div className="max-w-2xl">
          <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.18em] text-primary">
            One-time setup
          </p>
          <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-5xl">
            Choose your instructor
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-6 text-text-secondary">
            Your instructor will manage your lessons and approve your booking
            requests. You can only choose one instructor for your account.
          </p>
        </div>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {instructors.map((instructor) => {
            const selected = instructor.id === selectedId;
            return (
              <button
                className={`rounded-lg border p-5 text-left transition ${selected ? "border-primary bg-primary-light shadow-lg shadow-primary/10" : "border-border bg-surface hover:border-primary"}`}
                key={instructor.id}
                type="button"
                onClick={() => setSelectedId(instructor.id)}
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="grid size-11 place-items-center rounded-full bg-primary text-xs font-bold text-white">
                    {instructor.initials}
                  </span>
                  <span
                    className={`grid size-5 place-items-center rounded-full border text-[10px] ${selected ? "border-primary bg-primary text-white" : "border-border text-transparent"}`}
                  >
                    ✓
                  </span>
                </div>
                <h2 className="mt-6 font-display text-lg font-semibold">
                  {instructor.name}
                </h2>
                <p className="mt-1 text-xs text-text-secondary">
                  {instructor.school}
                </p>
                <p className="mt-4 text-xs font-bold text-primary">
                  {instructor.location}
                </p>
                <p className="mt-2 text-[11px] text-text-secondary">
                  {instructor.slots.length} upcoming availability windows
                </p>
              </button>
            );
          })}
        </div>
        <div className="mt-8 flex flex-col items-start justify-between gap-4 border-t border-border pt-6 sm:flex-row sm:items-center">
          <p className="text-xs text-text-secondary">
            Selected instructor: {selectedInstructor?.name ?? "None yet"}
          </p>
          <button
            className="rounded-md bg-primary px-5 py-3 text-xs font-bold text-white shadow-lg shadow-primary/20 transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-40"
            type="button"
            disabled={selectedId === null}
            onClick={() => selectedId !== null && onAssign(selectedId)}
          >
            Continue to dashboard
          </button>
        </div>
      </div>
    </main>
  );
}
