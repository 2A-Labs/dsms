"use client";

import { useState, type FormEvent } from "react";
import type { Lecture } from "./types";

type LecturesProps = {
  lectures: Lecture[];
  onAdd: (lecture: Omit<Lecture, "id">) => void;
  onRemove: (id: number) => void;
};

export function LecturesPanel({ lectures, onAdd, onRemove }: LecturesProps) {
  const [title, setTitle] = useState("");
  const [file, setFile] = useState("");
  function addLecture(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!title || !file) return;
    onAdd({ title, file });
    setTitle("");
    setFile("");
    event.currentTarget.reset();
  }
  return (
    <>
      <div className="mb-8">
        <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.18em] text-primary">
          Instructor library
        </p>
        <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
          Your lectures
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-text-secondary">
          Add video instruction for your assigned students, or remove lessons
          that are no longer relevant.
        </p>
      </div>
      <div className="grid gap-6 xl:grid-cols-[0.75fr_1.25fr]">
        <section className="rounded-lg border border-border bg-surface p-5 sm:p-7">
          <h2 className="font-display text-xl font-semibold">Add a lecture</h2>
          <form className="mt-6 grid gap-5" onSubmit={addLecture}>
            <label className="grid gap-2 text-xs font-bold">
              Lecture title
              <input
                className="rounded-md border border-border bg-background px-3.5 py-3 text-sm font-normal outline-none focus:border-primary focus:ring-4 focus:ring-primary-light"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Safe lane changes"
                required
              />
            </label>
            <label className="grid gap-2 text-xs font-bold">
              Video file
              <input
                className="rounded-md border border-border bg-background px-3 py-3 text-xs font-normal"
                type="file"
                accept="video/*"
                onChange={(event) =>
                  setFile(event.target.files?.[0]?.name ?? "")
                }
                required
              />
            </label>
            {file && (
              <p className="-mt-2 text-xs text-text-secondary">
                Selected: {file}
              </p>
            )}
            <button
              className="rounded-md bg-primary px-4 py-3 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-40"
              type="submit"
              disabled={!title || !file}
            >
              Add lecture
            </button>
          </form>
        </section>
        <section className="rounded-lg border border-border bg-surface p-5 sm:p-7">
          <div className="mb-6 flex items-start justify-between">
            <div>
              <h2 className="font-display text-xl font-semibold">
                Published lectures
              </h2>
              <p className="mt-1 text-xs text-text-secondary">
                Visible to your assigned students.
              </p>
            </div>
            <span className="rounded-full bg-primary-light px-2.5 py-1 text-[10px] font-bold text-primary">
              {lectures.length} videos
            </span>
          </div>
          <div className="grid gap-3">
            {lectures.map((lecture) => (
              <div
                className="flex items-center gap-4 border-b border-border pb-4 last:border-0 last:pb-0"
                key={lecture.id}
              >
                <span className="grid size-10 place-items-center rounded-md bg-primary-light text-primary">
                  ▶
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold">{lecture.title}</p>
                  <p className="mt-1 truncate text-[11px] text-text-secondary">
                    {lecture.file}
                  </p>
                </div>
                <button
                  className="text-xs font-bold text-error"
                  type="button"
                  onClick={() => onRemove(lecture.id)}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
