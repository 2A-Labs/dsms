import type { Tab } from "./data/types";
import type { ApiBooking, ApiInstructor } from "../../lib/api";

type HomePanelProps = {
  studentName: string;
  instructor: ApiInstructor | undefined;
  bookings: ApiBooking[];
  lectureCount: number;
  documentCount: number;
  onTabChange: (tab: Tab) => void;
};

export function HomePanel({
  studentName,
  instructor,
  bookings,
  lectureCount,
  documentCount,
  onTabChange,
}: HomePanelProps) {
  const dateLabel = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());
  const nextBooking = bookings.find(
    (booking) => booking.status === "Booked" || booking.status === "Requested",
  );
  const pendingRequests = bookings.filter(
    (booking) => booking.status === "Requested",
  ).length;
  const confirmedLessons = bookings.filter(
    (booking) => booking.status === "Booked",
  ).length;

  return (
    <>
      <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.18em] text-primary">
            {dateLabel}
          </p>
          <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            Good morning, {studentName}.
          </h1>
          <p className="mt-2 text-sm text-text-secondary">
            Keep your next milestone in sight.
          </p>
        </div>
        <button
          className="w-fit rounded-md bg-primary px-4 py-3 text-xs font-bold text-white shadow-lg shadow-primary/20"
          type="button"
          onClick={() => onTabChange("lessons")}
        >
          Book a lesson →
        </button>
      </div>
      <section className="rounded-lg bg-primary p-5 text-white shadow-lg shadow-primary/15 sm:p-7">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary-light">
          Next booking
        </p>
        <p className="mt-2 font-display text-2xl font-semibold">
          {nextBooking ? formatSlot(nextBooking.slot) : "No upcoming bookings"}
        </p>
        <p className="mt-1 text-sm text-primary-light">
          {nextBooking
            ? nextBooking.status === "Booked"
              ? "Confirmed lesson"
              : "Awaiting instructor approval"
            : "Choose a time from your instructor's availability."}
        </p>
      </section>
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Stat
          label="Assigned instructor"
          value={instructor?.name ?? "Not assigned"}
          detail="Your lesson contact"
        />
        <Stat
          label="Confirmed lessons"
          value={String(confirmedLessons)}
          detail="From your booking history"
        />
        <Stat
          label="Pending requests"
          value={String(pendingRequests)}
          detail="Awaiting a decision"
        />
      </div>
      <section className="mt-6 rounded-lg border border-border bg-surface p-5 sm:p-7">
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h2 className="font-display text-xl font-semibold">
                  Your resources
            </h2>
            <p className="mt-1 text-xs text-text-secondary">
                  Materials currently available in your workspace.
            </p>
          </div>
          <button
            className="text-xs font-bold text-primary"
            type="button"
            onClick={() => onTabChange("assistant")}
          >
            Open assistant →
          </button>
        </div>
        <div className="grid gap-4">
          <ResourceRow
            label="Video lectures"
            value={lectureCount}
            onClick={() => onTabChange("lectures")}
          />
          <ResourceRow
            label="Documents"
            value={documentCount}
            onClick={() => onTabChange("documents")}
          />
          <ResourceRow
            label="Quiz questions"
            value="On demand"
            onClick={() => onTabChange("quiz")}
          />
        </div>
      </section>
    </>
  );
}

function Stat({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <article className="rounded-lg border border-border bg-surface p-5">
      <p className="text-xs font-medium text-text-secondary">{label}</p>
      <strong className="mt-5 block font-display text-3xl font-semibold">
        {value}
      </strong>
      <p className="mt-2 text-[11px] font-bold text-success">{detail}</p>
    </article>
  );
}
function ResourceRow({
  label,
  value,
  onClick,
}: {
  label: string;
  value: number | string;
  onClick: () => void;
}) {
  return (
    <button
      className="flex w-full items-center justify-between border-b border-border pb-3 text-left text-xs last:border-0 last:pb-0"
      type="button"
      onClick={onClick}
    >
        <span className="font-bold">{label}</span>
        <span className="font-bold text-primary">{value} →</span>
    </button>
  );
}

function formatSlot(slot: string): string {
  return slot.replace(" · ", " at ");
}
