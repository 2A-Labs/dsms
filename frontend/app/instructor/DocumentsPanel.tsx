"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import type { ApiDocument } from "../lib/api";

export function DocumentsPanel({
  documents,
  onAdd,
  onRemove,
}: {
  documents: ApiDocument[];
  onAdd: (title: string, file: File) => Promise<void>;
  onRemove: (id: number) => Promise<void>;
}) {
  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [removingId, setRemovingId] = useState<number | null>(null);

  async function addDocument(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!title || !file) return;
    setError("");
    setSubmitting(true);
    try {
      await onAdd(title, file);
      setTitle("");
      setFile(null);
      event.currentTarget.reset();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to upload document");
    } finally {
      setSubmitting(false);
    }
  }

  async function removeDocument(id: number) {
    setError("");
    setRemovingId(id);
    try {
      await onRemove(id);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to remove document");
    } finally {
      setRemovingId(null);
    }
  }

  return (
    <>
      <div className="mb-8">
        <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.18em] text-primary">
          Student resources
        </p>
        <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
          Documents
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-text-secondary">
          Publish handouts, checklists, and study material for your students.
        </p>
      </div>
      <div className="grid gap-6 xl:grid-cols-[0.75fr_1.25fr]">
        <section className="rounded-lg border border-border bg-surface p-5 sm:p-7">
          <h2 className="font-display text-xl font-semibold">Add a document</h2>
          <form className="mt-6 grid gap-5" onSubmit={addDocument}>
            <label className="grid gap-2 text-xs font-bold">
              Document title
              <input
                className="rounded-md border border-border bg-background px-3.5 py-3 text-sm font-normal outline-none focus:border-primary focus:ring-4 focus:ring-primary-light"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Roundabout checklist"
                required
              />
            </label>
            <label className="grid gap-2 text-xs font-bold">
              File
              <input
                className="rounded-md border border-border bg-background px-3 py-3 text-xs font-normal"
                type="file"
                onChange={(event: ChangeEvent<HTMLInputElement>) => setFile(event.target.files?.[0] ?? null)}
                required
              />
            </label>
            {file && <p className="-mt-2 text-xs text-text-secondary">Selected: {file.name}</p>}
            {error && <p className="text-xs font-bold text-error">{error}</p>}
            <button
              className="rounded-md bg-primary px-4 py-3 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-40"
              type="submit"
              disabled={!title || !file || submitting}
            >
              {submitting ? "Uploading..." : "Publish document"}
            </button>
          </form>
        </section>
        <section className="rounded-lg border border-border bg-surface p-5 sm:p-7">
          <div className="mb-6 flex items-start justify-between">
            <div>
              <h2 className="font-display text-xl font-semibold">Published documents</h2>
              <p className="mt-1 text-xs text-text-secondary">Visible to your assigned students.</p>
            </div>
            <span className="rounded-full bg-primary-light px-2.5 py-1 text-[10px] font-bold text-primary">
              {documents.length} files
            </span>
          </div>
          <div className="grid gap-3">
            {documents.length ? documents.map((document) => (
              <div className="flex items-center gap-4 border-b border-border pb-4 last:border-0 last:pb-0" key={document.id}>
                <span className="grid size-10 place-items-center rounded-md bg-primary-light text-primary">↓</span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold">{document.title}</p>
                  <p className="mt-1 truncate text-[11px] text-text-secondary">{document.file_name}</p>
                </div>
                <button
                  className="text-xs font-bold text-error"
                  type="button"
                  disabled={removingId === document.id}
                  onClick={() => removeDocument(document.id)}
                >
                  {removingId === document.id ? "Removing..." : "Remove"}
                </button>
              </div>
            )) : <p className="text-sm text-text-secondary">No student documents published yet.</p>}
          </div>
        </section>
      </div>
    </>
  );
}
