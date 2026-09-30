"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  createAdminInstructor,
  deleteAdminInstructor,
  getAdminInstructors,
  getSchoolSettings,
  impersonateInstructor,
  saveSchoolSettings,
  updateAdminInstructor,
  type AdminInstructor,
  type SchoolSettings,
} from "../lib/api";

const defaultSettings: Omit<SchoolSettings, "id"> = {
  school_name: "Roadwise",
  logo_mark: "R",
  primary_color: "#4f46e5",
  accent_color: "#e0e7ff",
};

export default function AdminPage() {
  const router = useRouter();
  const [settings, setSettings] = useState<SchoolSettings>({ id: 0, ...defaultSettings });
  const [instructors, setInstructors] = useState<AdminInstructor[]>([]);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("roadwise_token");
    fetch(`${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"}/api/auth/me`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((response) => response.json())
      .then((user) => {
        if (user.role !== "admin") {
          router.replace(user.role === "instructor" ? "/instructor" : "/");
          return;
        }
        return Promise.all([getSchoolSettings(), getAdminInstructors()]).then(([loadedSettings, loadedInstructors]) => {
          setSettings(loadedSettings);
          setInstructors(loadedInstructors);
        });
      })
      .catch(() => setError("We could not load the admin workspace."));
  }, [router]);

  async function saveSettings(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice("");
    setError("");
    try {
      setSettings(await saveSchoolSettings(settings));
      setNotice("Branding saved.");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to save branding");
    }
  }

  async function addInstructor(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget)) as Record<string, string>;
    try {
      const instructor = await createAdminInstructor({ name: values.name, email: values.email, password: values.password, school: values.school, location: values.location });
      setInstructors((current) => [...current, instructor]);
      event.currentTarget.reset();
      setNotice("Instructor added.");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to add instructor");
    }
  }

  async function removeInstructor(id: number) {
    if (!window.confirm("Remove this instructor account?")) return;
    try {
      await deleteAdminInstructor(id);
      setInstructors((current) => current.filter((instructor) => instructor.id !== id));
      setNotice("Instructor removed.");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to remove instructor");
    }
  }

  async function renameInstructor(instructor: AdminInstructor) {
    const name = window.prompt("Instructor name", instructor.name)?.trim();
    if (!name || name === instructor.name) return;
    try {
      const updated = await updateAdminInstructor(instructor.id, { name });
      setInstructors((current) => current.map((item) => item.id === updated.id ? updated : item));
      setNotice("Instructor updated.");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to update instructor");
    }
  }

  async function loginAsInstructor(instructor: AdminInstructor) {
    try {
      const adminToken = localStorage.getItem("roadwise_token");
      const response = await impersonateInstructor(instructor.id);
      if (!adminToken) throw new Error("Your admin session has expired");
      localStorage.setItem("roadwise_admin_token", adminToken);
      localStorage.setItem("roadwise_token", response.token);
      document.cookie = `roadwise_session=${response.token}; path=/; max-age=86400; samesite=lax`;
      router.push("/instructor");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to open instructor view");
    }
  }

  return (
    <main className="min-h-screen bg-background font-sans text-text">
      <div className="mx-auto max-w-300 px-5 py-8 sm:px-8 lg:px-12 lg:py-12">
        <header className="mb-10 flex items-start justify-between gap-5"><div><p className="mb-3 text-[10px] font-bold uppercase tracking-[0.18em] text-primary">Admin workspace</p><h1 className="font-display text-4xl font-semibold tracking-tight">Shape your school.</h1><p className="mt-3 max-w-xl text-sm leading-6 text-text-secondary">Manage the people and the visual identity behind {settings.school_name}.</p></div><button className="rounded-md border border-border bg-surface px-4 py-2.5 text-xs font-bold text-text-secondary" onClick={() => router.push("/login")} type="button">Sign out</button></header>
        {(notice || error) && <p className={`mb-6 rounded-md p-3 text-xs font-bold ${error ? "bg-error/10 text-error" : "bg-success/10 text-success"}`}>{error || notice}</p>}
        <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
          <section className="rounded-lg border border-border bg-surface p-6"><div className="mb-6 flex items-center gap-3"><span className="grid size-11 place-items-center rounded-md text-sm font-bold text-white" style={{ backgroundColor: settings.primary_color }}>{settings.logo_mark}</span><div><h2 className="font-display text-xl font-semibold">Branding</h2><p className="text-xs text-text-secondary">What students see across the school.</p></div></div><form className="grid gap-4" onSubmit={saveSettings}><label className="grid gap-2 text-xs font-bold">School name<input className="rounded-md border border-border px-3 py-2.5 text-sm font-normal outline-none focus:border-primary" value={settings.school_name} onChange={(event) => setSettings({ ...settings, school_name: event.target.value })} /></label><label className="grid gap-2 text-xs font-bold">Logo mark<input className="rounded-md border border-border px-3 py-2.5 text-sm font-normal outline-none focus:border-primary" maxLength={2} value={settings.logo_mark} onChange={(event) => setSettings({ ...settings, logo_mark: event.target.value })} /></label><div className="grid grid-cols-2 gap-4"><label className="grid gap-2 text-xs font-bold">Primary color<input className="h-11 w-full cursor-pointer rounded-md border border-border bg-surface p-1" type="color" value={settings.primary_color} onChange={(event) => setSettings({ ...settings, primary_color: event.target.value })} /></label><label className="grid gap-2 text-xs font-bold">Accent color<input className="h-11 w-full cursor-pointer rounded-md border border-border bg-surface p-1" type="color" value={settings.accent_color} onChange={(event) => setSettings({ ...settings, accent_color: event.target.value })} /></label></div><button className="mt-2 rounded-md px-4 py-3 text-xs font-bold text-white" style={{ backgroundColor: settings.primary_color }} type="submit">Save branding</button></form></section>
          <section className="rounded-lg border border-border bg-surface p-6"><div className="mb-6 flex items-center justify-between gap-4"><div><h2 className="font-display text-xl font-semibold">Instructors</h2><p className="text-xs text-text-secondary">Only admins can add, edit, or remove instructor accounts.</p></div><span className="rounded-full px-3 py-1 text-xs font-bold" style={{ backgroundColor: settings.accent_color, color: settings.primary_color }}>{instructors.length} active</span></div><div className="mb-8 grid gap-3">{instructors.map((instructor) => <div className="flex items-center justify-between gap-4 border-b border-border pb-4" key={instructor.id}><div><p className="text-sm font-bold">{instructor.name}</p><p className="mt-1 text-xs text-text-secondary">{instructor.email} · {instructor.location || "No location"}</p></div><div className="flex gap-2"><button className="rounded-md border border-border px-3 py-2 text-xs font-bold text-text-secondary" onClick={() => renameInstructor(instructor)} type="button">Edit</button><button className="rounded-md border border-error/30 px-3 py-2 text-xs font-bold text-error" onClick={() => removeInstructor(instructor.id)} type="button">Remove</button></div></div>)}</div><form className="grid gap-3 border-t border-border pt-6" onSubmit={addInstructor}><h3 className="text-xs font-bold uppercase tracking-[0.15em] text-text-secondary">Add instructor</h3><div className="grid gap-3 sm:grid-cols-2"><input className="rounded-md border border-border px-3 py-2.5 text-sm outline-none focus:border-primary" name="name" placeholder="Full name" required /><input className="rounded-md border border-border px-3 py-2.5 text-sm outline-none focus:border-primary" name="email" placeholder="Email address" type="email" required /><input className="rounded-md border border-border px-3 py-2.5 text-sm outline-none focus:border-primary" name="password" placeholder="Temporary password" type="password" required /><input className="rounded-md border border-border px-3 py-2.5 text-sm outline-none focus:border-primary" name="location" placeholder="Location" /><input className="rounded-md border border-border px-3 py-2.5 text-sm outline-none focus:border-primary sm:col-span-2" name="school" placeholder="School branch" /></div><button className="rounded-md bg-text px-4 py-3 text-xs font-bold text-white" type="submit">Add instructor</button></form></section>
        </div>
        <section className="mt-6 rounded-lg border border-primary/20 bg-primary-light p-5"><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center"><div><h2 className="font-display text-lg font-semibold text-primary">Instructor view</h2><p className="mt-1 text-xs text-primary/70">Open the full workspace as an instructor without losing your admin session.</p></div><div className="flex flex-wrap gap-2">{instructors.map((instructor) => <button className="rounded-md bg-primary px-3 py-2 text-xs font-bold text-white" key={instructor.id} onClick={() => loginAsInstructor(instructor)} type="button">Login as {instructor.name}</button>)}</div></div></section>
      </div>
    </main>
  );
}