"use client";

import { useEffect, useState } from "react";
import type { SchoolSettings } from "./lib/api";

const defaultSettings: SchoolSettings = {
  id: 0,
  school_name: "Roadwise",
  logo_mark: "R",
  primary_color: "#4f46e5",
  accent_color: "#e0e7ff",
};

export function BrandingShell({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState(defaultSettings);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"}/api/settings`)
      .then((response) => response.ok ? response.json() : null)
      .then((loadedSettings) => loadedSettings && setSettings(loadedSettings))
      .catch(() => undefined);
  }, []);

  return (
    <div
      style={{
        "--color-primary": settings.primary_color,
        "--color-primary-light": settings.accent_color,
      } as React.CSSProperties}
    >
      {children}
    </div>
  );
}