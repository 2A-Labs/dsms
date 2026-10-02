"use client";

import { useState } from "react";
import type { ApiStudent } from "../lib/api";

type StudentsPanelProps = {
  students: ApiStudent[];
  onUpdate: (id: number, name: string, email: string) => Promise<void>;
  onResetPassword: (id: number, password: string) => Promise<void>;
};

export function StudentsPanel({
  students,
  onUpdate,
  onResetPassword,
}: StudentsPanelProps) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [error, setError] = useState("");

  return (
    <>
      <div className="mb-8">
        <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.18em] text-primary">
          Student management
        </p>
        <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
          Your students
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-text-secondary">
          Keep student contact details current and reset access when needed.
        </p>
      </div>
      {error && (
        <p className="mb-6 rounded-md bg-error/10 p-4 text-xs font-bold text-error">
          {error}
        </p>
      )}
      <section className="rounded-lg border border-border bg-surface p-5 sm:p-7">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <h2 className="font-display text-xl font-semibold">Assigned students</h2>
            <p className="mt-1 text-xs text-text-secondary">
              Only students assigned to you appear here.
            </p>
          </div>
          <span className="rounded-full bg-primary-light px-2.5 py-1 text-[10px] font-bold text-primary">
            {students.length} students
          </span>
        </div>
        {students.length ? (
          <div className="grid gap-4">
            {students.map((student) => (
              <StudentRow
                key={student.id}
                student={student}
                editing={editingId === student.id}
                saving={savingId === student.id}
                onEdit={() => setEditingId(student.id)}
                onCancel={() => setEditingId(null)}
                onSave={async (name, email) => {
                  setError("");
                  setSavingId(student.id);
                  try {
                    await onUpdate(student.id, name, email);
                    setEditingId(null);
                  } catch (requestError) {
                    setError(
                      requestError instanceof Error
                        ? requestError.message
                        : "Unable to update student",
                    );
                  } finally {
                    setSavingId(null);
                  }
                }}
                onResetPassword={async (password) => {
                  setError("");
                  setSavingId(student.id);
                  try {
                    await onResetPassword(student.id, password);
                  } catch (requestError) {
                    setError(
                      requestError instanceof Error
                        ? requestError.message
                        : "Unable to reset password",
                    );
                  } finally {
                    setSavingId(null);
                  }
                }}
              />
            ))}
          </div>
        ) : (
          <p className="text-sm text-text-secondary">
            No students are assigned to you yet.
          </p>
        )}
      </section>
    </>
  );
}

function StudentRow({
  student,
  editing,
  saving,
  onEdit,
  onCancel,
  onSave,
  onResetPassword,
}: {
  student: ApiStudent;
  editing: boolean;
  saving: boolean;
  onEdit: () => void;
  onCancel: () => void;
  onSave: (name: string, email: string) => Promise<void>;
  onResetPassword: (password: string) => Promise<void>;
}) {
  const [name, setName] = useState(student.name);
  const [email, setEmail] = useState(student.email);
  const [password, setPassword] = useState("");

  return (
    <div className="border-b border-border pb-4 last:border-0 last:pb-0">
      {editing ? (
        <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
          <label className="grid gap-2 text-xs font-bold">
            Name
            <input
              className="rounded-md border border-border px-3 py-2.5 text-sm font-normal outline-none focus:border-primary"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </label>
          <label className="grid gap-2 text-xs font-bold">
            Email
            <input
              className="rounded-md border border-border px-3 py-2.5 text-sm font-normal outline-none focus:border-primary"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </label>
          <div className="flex gap-2">
            <button
              className="rounded-md bg-primary px-3 py-2.5 text-xs font-bold text-white disabled:opacity-50"
              type="button"
              disabled={saving || !name.trim() || !email.trim()}
              onClick={() => onSave(name.trim(), email.trim())}
            >
              Save
            </button>
            <button
              className="rounded-md border border-border px-3 py-2.5 text-xs font-bold text-text-secondary"
              type="button"
              onClick={onCancel}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-bold">{student.name}</p>
            <p className="mt-1 text-xs text-text-secondary">{student.email}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              className="rounded-md border border-border px-3 py-2 text-xs font-bold text-text-secondary"
              type="button"
              onClick={onEdit}
            >
              Edit details
            </button>
            <form
              className="flex gap-2"
              onSubmit={async (event) => {
                event.preventDefault();
                if (password.length < 8) return;
                await onResetPassword(password);
                setPassword("");
              }}
            >
              <input
                className="w-40 rounded-md border border-border px-3 py-2 text-xs outline-none focus:border-primary"
                type="password"
                minLength={8}
                placeholder="New password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
              <button
                className="rounded-md border border-primary/30 px-3 py-2 text-xs font-bold text-primary disabled:opacity-40"
                type="submit"
                disabled={saving || password.length < 8}
              >
                Reset password
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
