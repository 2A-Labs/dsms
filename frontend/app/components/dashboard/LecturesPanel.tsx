import { lectures } from "./data/mockData";

export function LecturesPanel() {
  return (
    <>
      <div className="mb-8">
        <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.18em] text-primary">
          Assigned instructor
        </p>
        <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
          Learn with Jamie
        </h1>
        <p className="mt-2 text-sm text-text-secondary">
          Video lessons from your instructor, available whenever you need a
          refresher.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {lectures.map((lecture) => (
          <article
            className="overflow-hidden rounded-lg border border-border bg-surface"
            key={lecture.title}
          >
            <div
              className={`grid aspect-video place-items-center ${lecture.color}`}
            >
              <span className="grid size-12 place-items-center rounded-full bg-white text-lg text-primary shadow-sm">
                ▶
              </span>
            </div>
            <div className="p-5">
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-primary">
                {lecture.duration}
              </p>
              <h2 className="mt-2 font-display text-lg font-semibold">
                {lecture.title}
              </h2>
              <p className="mt-1 text-xs text-text-secondary">
                {lecture.instructor}
              </p>
            </div>
          </article>
        ))}
      </div>
    </>
  );
}
