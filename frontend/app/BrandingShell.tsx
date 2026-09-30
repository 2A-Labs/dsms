"use client";

import { useEffect, useState } from "react";
import { createContext, useContext } from "react";
import type { SchoolSettings } from "./lib/api";

const defaultSettings: SchoolSettings = {
  id: 0,
  school_name: "Roadwise",
  logo_mark: "R",
  logo_data: null,
  primary_color: "#4f46e5",
  accent_color: "#e0e7ff",
};

const BrandingContext = createContext(defaultSettings);

export function useBranding() {
  return useContext(BrandingContext);
}

export function BrandLogo({
  className,
  markClassName,
  nameClassName,
  hideName = false,
}: {
  className?: string;
  markClassName?: string;
  nameClassName?: string;
  hideName?: boolean;
}) {
  const settings = useBranding();
  return (
    <div className={className}>
      <span className={markClassName}>
        {settings.logo_data ? (
          <img className="size-full object-contain" src={settings.logo_data} alt="" />
        ) : (
          settings.logo_mark
        )}
      </span>
      {!hideName && <span className={nameClassName}>{settings.school_name}</span>}
    </div>
  );
}

export function BrandingShell({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState(defaultSettings);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"}/api/settings`)
      .then((response) => response.ok ? response.json() : null)
      .then((loadedSettings) => loadedSettings && setSettings(loadedSettings))
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    document.title = `${settings.school_name} | Driving school operations`;
  }, [settings.school_name]);

  return (
    <div
      style={{
        "--color-primary": settings.primary_color,
        "--color-primary-light": settings.accent_color,
      } as React.CSSProperties}
    >
      <BrandingContext.Provider value={settings}>{children}</BrandingContext.Provider>
    </div>
  );
}