import type { BookingRequest } from "./types";

export function HomePanel({
  instructorName,
  requests,
  bookableSlots,
  onPlanner,
}: {
  instructorName: string;
  requests: BookingRequest[];
  bookableSlots: number;
  onPlanner: () => void;
}) {
  const today = new Date();
  const dateLabel = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(today);
  const dayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  const lessons = requests.filter((request) => request.day === dayKey);
  const pendingRequests = requests.filter(
    (request) => request.status === "Requested",
  ).length;

  return (
    <>
      <div className="mb-10 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.18em] text-primary">
            {dateLabel}
          </p>
          <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            Good morning, {instructorName}.
          </h1>
          <p className="mt-2 text-sm text-text-secondary">
            Here&apos;s your teaching plan for today.
          </p>
        </div>
        <button
          className="w-fit rounded-md bg-primary px-4 py-3 text-xs font-bold text-white shadow-lg shadow-primary/20"
          type="button"
          onClick={onPlanner}
        >
          Plan availability →
        </button>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <Summary
          label="Lessons today"
          value={String(lessons.length)}
          detail="From current bookings"
        />
        <Summary
          label="Bookable slots"
          value={String(bookableSlots)}
          detail="Currently open"
        />
        <Summary
          label="Requests to review"
          value={String(pendingRequests)}
          detail="Awaiting your decision"
        />
      </div>
      <section className="mt-6 rounded-lg border border-border bg-surface p-5 sm:p-7">
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h2 className="font-display text-xl font-semibold">
              Today&apos;s lessons
            </h2>
            <p className="mt-1 text-xs text-text-secondary">
              Your schedule for {dateLabel}
            </p>
          </div>
          <span className="rounded-full bg-primary-light px-2.5 py-1 text-[10px] font-bold text-primary">
            {lessons.length ? "On schedule" : "No classes"}
          </span>
        </div>
        <div className="divide-y divide-border border-y border-border">
          {lessons.length ? (
            lessons.map((lesson) => (
              <div
                className="grid min-h-22 grid-cols-[52px_1fr_auto] items-center gap-4"
                key={`${lesson.day}-${lesson.time}`}
              >
                <time className="font-display text-sm font-semibold text-text-secondary">
                  {lesson.time}
                </time>
                <div>
                  <p className="text-sm font-bold">{lesson.student}</p>
                  <p className="mt-1 text-xs text-text-secondary">Driving lesson</p>
                </div>
                <span
                  className={`text-[10px] font-bold ${lesson.status === "Booked" ? "text-success" : lesson.status === "Requested" ? "text-primary" : "text-text-secondary"}`}
                >
                  {lesson.status}
                </span>
              </div>
            ))
          ) : (
            <p className="px-2 py-8 text-sm text-text-secondary">
              No classes scheduled for today.
            </p>
          )}
        </div>
      </section>
    </>
  );
}

function Summary({
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
