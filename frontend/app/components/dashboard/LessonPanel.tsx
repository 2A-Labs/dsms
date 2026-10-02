"use client";

import type { Instructor } from "./data/types";

type LessonPanelProps = {
  instructors: Instructor[];
  instructorId: number;
  selectedSlot: string;
  requestSent: boolean;
  requestError: string;
  onSlotChange: (slot: string) => void;
  onRequest: () => void;
};

export function LessonPanel({
  instructors,
  instructorId,
  selectedSlot,
  requestSent,
  requestError,
  onSlotChange,
  onRequest,
}: LessonPanelProps) {
  const instructor: Instructor =
    instructors.find((item) => item.id === instructorId) ?? instructors[0];
  if (!instructor) {
    return (
      <section className="rounded-lg border border-border bg-surface p-6 text-sm text-text-secondary">
        No instructor is currently available for booking.
      </section>
    );
  }
  return (
    <>
      <PageIntro
        eyebrow="Lesson requests"
        title="Find a time that works"
        text="Choose an instructor, pick one of their available times, and send a request for approval."
      />
      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <section className="rounded-lg border border-border bg-surface p-5 sm:p-7">
          <h2 className="font-display text-xl font-semibold">
            Your instructor
          </h2>
          <div className="mt-5 flex items-center gap-4 rounded-md border border-primary bg-primary-light p-4">
            <span className="grid size-10 place-items-center rounded-full bg-primary text-xs font-bold text-white">
              {instructor.initials}
            </span>
            <div>
              <strong className="block text-sm">{instructor.name}</strong>
              <span className="mt-1 block text-xs text-text-secondary">
                {instructor.school} · {instructor.location}
              </span>
            </div>
          </div>
          <h3 className="mt-8 font-display text-lg font-semibold">
            Pick an available time
          </h3>
          <div className="mt-4 grid gap-2 sm:grid-cols-3">
            {instructor.slots.length ? (
              instructor.slots.map((slot) => (
                <button
                  className={`rounded-md border px-3 py-3 text-xs font-bold ${selectedSlot === slot ? "border-primary bg-primary text-white" : "border-border text-text-secondary hover:border-primary hover:text-primary"}`}
                  type="button"
                  key={slot}
                  onClick={() => onSlotChange(slot)}
                >
                  {slot}
                </button>
              ))
            ) : (
              <p className="text-sm text-text-secondary">
                No bookable times are available for this instructor.
              </p>
            )}
          </div>
        </section>
        <section className="rounded-lg border border-border bg-surface p-5 sm:p-7">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">
            Request summary
          </p>
          <h2 className="mt-3 font-display text-xl font-semibold">
            Practical driving lesson
          </h2>
          <p className="mt-2 text-xs leading-5 text-text-secondary">
            Your instructor will approve or decline this request. You will see
            the confirmed time on your overview.
          </p>
          <div className="mt-6 border-y border-border py-4 text-xs">
            <div className="flex justify-between">
              <span className="text-text-secondary">Instructor</span>
              <strong>{instructor.name}</strong>
            </div>
            <div className="mt-3 flex justify-between">
              <span className="text-text-secondary">Requested time</span>
              <strong>{selectedSlot || "Choose a time"}</strong>
            </div>
          </div>
          {requestSent ? (
            <div className="mt-6 rounded-md bg-success/15 p-4 text-xs font-bold text-success">
              Request sent. {instructor.name} will review it soon.
            </div>
          ) : (
            <>
              {requestError && (
                <p className="mt-6 rounded-md bg-error/10 p-4 text-xs font-bold text-error">
                  {requestError}
                </p>
              )}
              <button
                className="mt-6 w-full rounded-md bg-primary px-4 py-3 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-40"
                type="button"
                disabled={!selectedSlot}
                onClick={onRequest}
              >
                Send booking request
              </button>
            </>
          )}
        </section>
      </div>
    </>
  );
}

function PageIntro({
  eyebrow,
  title,
  text,
}: {
  eyebrow: string;
  title: string;
  text: string;
}) {
  return (
    <div className="mb-8">
      <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.18em] text-primary">
        {eyebrow}
      </p>
      <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
        {title}
      </h1>
      <p className="mt-2 max-w-2xl text-sm text-text-secondary">{text}</p>
    </div>
  );
}
