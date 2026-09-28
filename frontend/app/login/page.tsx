"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authenticate } from "../lib/api";

export default function Login() {
  const router = useRouter();
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    const values = Object.fromEntries(new FormData(event.currentTarget));
    try {
      const response = await authenticate(
        isSignUp ? "/api/auth/signup" : "/api/auth/login",
        values as Record<string, string>,
      );
      localStorage.setItem("roadwise_token", response.token);
      document.cookie = `roadwise_session=${response.token}; path=/; max-age=86400; samesite=lax`;
      const requestedPath = new URLSearchParams(window.location.search).get("next");
      const defaultPath = response.user.role === "admin" ? "/instructor" : "/";
      router.replace(requestedPath?.startsWith("/") ? requestedPath : defaultPath);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to sign in");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="grid min-h-screen bg-background font-sans text-text lg:grid-cols-[0.85fr_1.15fr]">
      <section className="hidden bg-primary px-12 py-12 text-white lg:flex lg:flex-col lg:justify-between xl:px-20">
        <div className="flex items-center gap-2.5 font-display text-xl font-bold">
          <span className="grid size-8 place-items-center rounded-md bg-white text-sm text-primary">
            R
          </span>
          roadwise
        </div>
        <div className="max-w-md">
          <p className="mb-5 text-xs font-bold uppercase tracking-[0.2em] text-primary-light">
            One clear workspace
          </p>
          <h2 className="font-display text-5xl font-semibold leading-tight tracking-tight">
            Make every lesson count.
          </h2>
          <p className="mt-6 text-sm leading-6 text-primary-light">
            Connect students, instructors, and schedules without adding noise to
            the day.
          </p>
        </div>
        <p className="text-xs text-primary-light">
          Roadwise · Driving school operations
        </p>
      </section>
      <section className="flex items-center justify-center px-6 py-12 sm:px-12">
        <div className="w-full max-w-md">
          <div className="mb-14 flex items-center gap-2.5 font-display text-xl font-bold lg:hidden">
            <span className="grid size-8 place-items-center rounded-md bg-primary text-sm text-white">
              R
            </span>
            roadwise
          </div>
          <div className="mb-8">
            <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.18em] text-primary">
              {isSignUp ? "New workspace" : "Welcome back"}
            </p>
            <h1 className="font-display text-3xl font-semibold tracking-tight">
              {isSignUp ? "Create your account" : "Sign in to continue"}
            </h1>
            <p className="mt-2 text-sm text-text-secondary">
              {isSignUp
                ? "Choose the workspace that fits your role."
                : "Your school dashboard is waiting."}
            </p>
          </div>
          {error && (
            <p className="mb-5 rounded-md bg-error/10 p-3 text-xs font-bold text-error">
              {error}
            </p>
          )}
          <form className="grid gap-5" onSubmit={handleSubmit}>
            {isSignUp && (
              <label className="grid gap-2 text-xs font-bold">
                Full name
                <input
                  className="rounded-md border border-border bg-surface px-3.5 py-3 text-sm font-normal outline-none placeholder:text-text-secondary/60 focus:border-primary focus:ring-4 focus:ring-primary-light"
                  name="name"
                  placeholder="Alex Morgan"
                  required
                />
              </label>
            )}
            <label className="grid gap-2 text-xs font-bold">
              Email address
              <input
                className="rounded-md border border-border bg-surface px-3.5 py-3 text-sm font-normal outline-none placeholder:text-text-secondary/60 focus:border-primary focus:ring-4 focus:ring-primary-light"
                type="email"
                name="email"
                placeholder="you@school.com"
                required
              />
            </label>
            <label className="grid gap-2 text-xs font-bold">
              Password
              <input
                className="rounded-md border border-border bg-surface px-3.5 py-3 text-sm font-normal outline-none placeholder:text-text-secondary/60 focus:border-primary focus:ring-4 focus:ring-primary-light"
                type="password"
                name="password"
                placeholder="Enter your password"
                required
              />
            </label>
            {!isSignUp && (
              <button
                className="-mt-2 justify-self-end cursor-pointer text-xs font-bold text-primary"
                type="button"
              >
                Forgot password?
              </button>
            )}
            <button
              className="rounded-md cursor-pointer bg-primary px-4 py-3.5 text-xs font-bold text-white shadow-lg shadow-primary/20 transition hover:bg-[#3730a3]"
              type="submit"
              disabled={submitting}
            >
              {submitting ? "Connecting..." : isSignUp ? "Create account" : "Sign in"}
            </button>
          </form>
          <p className="mt-7 text-center text-xs text-text-secondary">
            {isSignUp ? "Already have an account?" : "New to Roadwise?"}{" "}
            <button
              className="font-bold cursor-pointer text-primary"
              type="button"
              onClick={() => setIsSignUp((current) => !current)}
            >
              {isSignUp ? "Sign in" : "Create an account"}
            </button>
          </p>
        </div>
      </section>
    </main>
  );
}
