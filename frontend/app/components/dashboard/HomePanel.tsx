import type { Tab } from "./data/types";

type HomePanelProps = {
  studentName: string;
  onTabChange: (tab: Tab) => void;
};

export function HomePanel({ studentName, onTabChange }: HomePanelProps) {
  return (
    <>
      <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.18em] text-primary">
            Sunday, 27 September 2026
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
          Next driving test
        </p>
        <p className="mt-2 font-display text-2xl font-semibold">
          Practical test · 14 October
        </p>
        <p className="mt-1 text-sm text-primary-light">
          09:30 · Northside Test Centre
        </p>
      </section>
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Stat label="Lessons completed" value="12" detail="of 20 planned" />
        <Stat label="Quiz readiness" value="68%" detail="Keep practising" />
        <Stat
          label="Next lesson"
          value="Tue 29"
          detail="13:00 · Jamie Carter"
        />
      </div>
      <section className="mt-6 rounded-lg border border-border bg-surface p-5 sm:p-7">
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h2 className="font-display text-xl font-semibold">
              Your learning path
            </h2>
            <p className="mt-1 text-xs text-text-secondary">
              Small steps, steady progress.
            </p>
          </div>
          <button
            className="text-xs font-bold text-primary"
            type="button"
            onClick={() => onTabChange("quiz")}
          >
            Open quizzes →
          </button>
        </div>
        <div className="grid gap-4">
          <Progress label="Driving theory" value="74%" progress={74} />
          <Progress label="Road signs" value="61%" progress={61} />
          <Progress label="Junctions" value="58%" progress={58} />
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
function Progress({
  label,
  value,
  progress,
}: {
  label: string;
  value: string;
  progress: number;
}) {
  return (
    <div>
      <div className="mb-2 flex justify-between text-xs">
        <span className="font-bold">{label}</span>
        <span className="font-bold text-primary">{value}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-background">
        <div
          className="h-full rounded-full bg-primary"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
