import type { ApiLecture } from "../../lib/api";

export function LecturesPanel({
  lectures,
  loading,
  error,
}: {
  lectures: ApiLecture[];
  loading: boolean;
  error: string;
}) {
  const instructorName = lectures[0]?.instructor_name ?? "your instructor";

  return (
    <>
      <div className="mb-8">
        <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.18em] text-primary">
          Assigned instructor
        </p>
        <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
          Learn with {instructorName}
        </h1>
        <p className="mt-2 text-sm text-text-secondary">
          Video lessons from your instructor, available whenever you need a
          refresher.
        </p>
      </div>
      {loading && (
        <p className="rounded-lg border border-border bg-surface p-6 text-sm text-text-secondary">
          Loading video lectures...
        </p>
      )}
      {error && !loading && (
        <p className="rounded-lg border border-error/20 bg-error/10 p-6 text-sm font-bold text-error">
          {error}
        </p>
      )}
      {!loading && !error && lectures.length === 0 && (
        <p className="rounded-lg border border-border bg-surface p-6 text-sm text-text-secondary">
          There are no video lectures from your instructor yet. Check back soon
          for new lessons.
        </p>
      )}
      {!loading && !error && lectures.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {lectures.map((lecture, index) => (
            <article
              className="overflow-hidden rounded-lg border border-border bg-surface"
              key={lecture.id}
            >
              <div
                className={`grid aspect-video place-items-center ${["bg-primary-light", "bg-warning/15", "bg-success/15"][index % 3]}`}
              >
                <a
                  className="grid size-12 place-items-center rounded-full bg-white text-lg text-primary shadow-sm"
                  href={lecture.file_url}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={`Play ${lecture.title}`}
                >
                  ▶
                </a>
              </div>
              <div className="p-5">
                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-primary">
                  {formatDuration(lecture.duration_seconds)}
                </p>
                <h2 className="mt-2 font-display text-lg font-semibold">
                  {lecture.title}
                </h2>
                <p className="mt-1 text-xs text-text-secondary">
                  {lecture.instructor_name}
                </p>
              </div>
            </article>
          ))}
        </div>
      )}
    </>
  );
}

function formatDuration(seconds: number | null) {
  if (seconds === null) return "Video lecture";
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}
