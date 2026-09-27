import { lessons } from "./data";

export function HomePanel({ onPlanner }: { onPlanner: () => void }) {
  return (
    <>
      <div className="mb-10 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.18em] text-primary">
            Friday, 26 September 2026
          </p>
          <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            Good morning, Jamie.
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
          Plan your week →
        </button>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <Summary label="Lessons today" value="3" detail="1 complete" />
        <Summary
          label="Bookable this week"
          value="7"
          detail="Slots available"
        />
        <Summary
          label="Requests to review"
          value="2"
          detail="Needs your decision"
        />
      </div>
      <section className="mt-6 rounded-lg border border-border bg-surface p-5 sm:p-7">
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h2 className="font-display text-xl font-semibold">
              Today&apos;s lessons
            </h2>
            <p className="mt-1 text-xs text-text-secondary">
              Your schedule for Friday, 26 September
            </p>
          </div>
          <span className="rounded-full bg-primary-light px-2.5 py-1 text-[10px] font-bold text-primary">
            On schedule
          </span>
        </div>
        <div className="divide-y divide-border border-y border-border">
          {lessons.map((lesson) => (
            <div
              className="grid min-h-22 grid-cols-[52px_1fr_auto] items-center gap-4"
              key={lesson.time}
            >
              <time className="font-display text-sm font-semibold text-text-secondary">
                {lesson.time}
              </time>
              <div>
                <p className="text-sm font-bold">{lesson.student}</p>
                <p className="mt-1 text-xs text-text-secondary">
                  {lesson.detail}
                </p>
              </div>
              <span
                className={`text-[10px] font-bold ${lesson.status === "Complete" ? "text-success" : lesson.status === "Next up" ? "text-primary" : "text-text-secondary"}`}
              >
                {lesson.status}
              </span>
            </div>
          ))}
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
