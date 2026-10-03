"use client";

import { useEffect, useState } from "react";

export type NotificationItem = {
  id: string;
  title: string;
  detail: string;
  tone: "primary" | "success" | "warning" | "error";
};

export function Notifications({ items }: { items: NotificationItem[] }) {
  const [open, setOpen] = useState(false);
  const [readIds, setReadIds] = useState<Set<string>>(() => {
    return new Set();
  });

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem("roadwise_read_notifications");
      const parsed: unknown = stored ? JSON.parse(stored) : [];
      if (Array.isArray(parsed)) {
        setReadIds(
          new Set(parsed.filter((id): id is string => typeof id === "string")),
        );
      }
    } catch {
      // Reading notifications still works when browser storage is unavailable.
    }
  }, []);

  const unreadCount = items.filter((item) => !readIds.has(item.id)).length;

  function markAsRead() {
    setReadIds((current) => {
      const next = new Set(current);
      items.forEach((item) => next.add(item.id));
      try {
        window.localStorage.setItem(
          "roadwise_read_notifications",
          JSON.stringify([...next].slice(-100)),
        );
      } catch {
        // The in-memory state still prevents the current list from reappearing as new.
      }
      return next;
    });
  }

  function toggleOpen() {
    const nextOpen = !open;
    setOpen(nextOpen);
    if (nextOpen && unreadCount > 0) {
      markAsRead();
    }
  }

  return (
    <div className="relative">
      <button
        className="relative grid size-10 place-items-center rounded-full border border-border bg-surface text-lg text-text-secondary shadow-sm transition hover:border-primary hover:text-primary"
        type="button"
        aria-label="Open notifications"
        aria-expanded={open}
        onClick={toggleOpen}
      >
        <span aria-hidden="true">◌</span>
        {unreadCount > 0 && (
          <span className="absolute right-0.5 top-0.5 grid size-4 place-items-center rounded-full bg-primary text-[9px] font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute top-12 z-20 w-80 overflow-hidden rounded-lg border border-border bg-surface shadow-xl shadow-black/10">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-primary">
                Activity
              </p>
              <h2 className="mt-1 font-display text-lg font-semibold">
                Recent updates
              </h2>
            </div>
            {unreadCount > 0 && (
              <span className="rounded-full bg-primary-light px-2 py-1 text-[10px] font-bold text-primary">
                {unreadCount}
              </span>
            )}
          </div>
          {items.length ? (
            <div className="max-h-80 divide-y divide-border overflow-y-auto">
              {items.map((item) => {
                const unread = !readIds.has(item.id);
                return (
                  <div
                    className={`flex gap-3 px-4 py-3 ${unread ? "bg-primary-light/20" : ""}`}
                    key={item.id}
                  >
                    <span
                      className={`mt-1 size-2 shrink-0 rounded-full ${unread ? toneClass[item.tone] : "bg-border"}`}
                    />
                    <div>
                      <p className="text-xs font-bold">{item.title}</p>
                      <p className="mt-1 text-[11px] leading-4 text-text-secondary">
                        {item.detail}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="px-4 py-8 text-center text-xs text-text-secondary">
              You&apos;re all caught up.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

const toneClass: Record<NotificationItem["tone"], string> = {
  primary: "bg-primary",
  success: "bg-success",
  warning: "bg-warning",
  error: "bg-error",
};
