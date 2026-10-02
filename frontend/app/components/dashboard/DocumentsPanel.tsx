import type { ApiDocument } from "../../lib/api";

export function DocumentsPanel({
  documents,
  loading,
  error,
}: {
  documents: ApiDocument[];
  loading: boolean;
  error: string;
}) {
  return (
    <>
      <div className="mb-8">
        <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.18em] text-primary">Student resources</p>
        <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">Documents</h1>
        <p className="mt-2 max-w-2xl text-sm text-text-secondary">Download handouts and study material from your instructor.</p>
      </div>
      {loading && <p className="rounded-lg border border-border bg-surface p-6 text-sm text-text-secondary">Loading documents...</p>}
      {error && !loading && <p className="rounded-lg border border-error/20 bg-error/10 p-6 text-sm font-bold text-error">{error}</p>}
      {!loading && !error && documents.length === 0 && (
        <p className="rounded-lg border border-border bg-surface p-6 text-sm text-text-secondary">Your instructor has not published any documents yet.</p>
      )}
      {!loading && !error && documents.length > 0 && (
        <div className="grid gap-3">
          {documents.map((document) => (
            <article className="flex items-center gap-4 rounded-lg border border-border bg-surface p-5" key={document.id}>
              <span className="grid size-11 place-items-center rounded-md bg-primary-light text-lg text-primary">↓</span>
              <div className="min-w-0 flex-1">
                <h2 className="font-display text-lg font-semibold">{document.title}</h2>
                <p className="mt-1 truncate text-xs text-text-secondary">{document.file_name}</p>
              </div>
              <a
                className="rounded-md bg-primary px-4 py-2.5 text-xs font-bold text-white"
                href={document.file_url}
                download={document.file_name}
                target="_blank"
                rel="noreferrer"
              >
                Download
              </a>
            </article>
          ))}
        </div>
      )}
    </>
  );
}
