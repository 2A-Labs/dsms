import type { Tab } from "./data/types";
import { BrandLogo } from "../../BrandingShell";
import { clearSession } from "../../lib/api";
import { Notifications, type NotificationItem } from "../Notifications";

type SidebarProps = {
  tab: Tab;
  studentName: string;
  onTabChange: (tab: Tab) => void;
  notifications: NotificationItem[];
};

export function Sidebar({
  tab,
  studentName,
  onTabChange,
  notifications,
}: SidebarProps) {
  const initials = studentName
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <aside className="w-full border-b border-border bg-surface px-5 py-5 lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col lg:border-b-0 lg:border-r lg:px-5 lg:py-7">
      <a href="/">
        <BrandLogo
          className="flex items-center gap-2.5 font-display text-xl font-bold tracking-tight"
          markClassName="grid size-8 place-items-center rounded-lg bg-primary text-sm text-white"
        />
      </a>
      <div className="mt-10 flex items-center gap-3 border-b border-border pb-5">
        <span className="grid size-9 place-items-center rounded-full bg-primary-light text-xs font-bold text-primary">
          {initials}
        </span>
        <div>
          <p className="text-xs font-bold">{studentName}</p>
          <p className="mt-0.5 text-[11px] text-text-secondary">Student</p>
        </div>
        <div className="ml-auto">
          <Notifications items={notifications} />
        </div>
      </div>
      <p className="mb-3 mt-7 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-text-secondary">
        Student workspace
      </p>
      <nav className="grid gap-1">
        <NavItem
          label="Overview"
          icon="⌂"
          active={tab === "home"}
          onClick={() => onTabChange("home")}
        />
        <NavItem
          label="Book a lesson"
          icon="◷"
          active={tab === "lessons"}
          onClick={() => onTabChange("lessons")}
        />
        <NavItem
          label="Quizzes"
          icon="✦"
          active={tab === "quiz"}
          onClick={() => onTabChange("quiz")}
        />
        <NavItem
          label="Lectures"
          icon="▶"
          active={tab === "lectures"}
          onClick={() => onTabChange("lectures")}
        />
        <NavItem
          label="Documents"
          icon="↓"
          active={tab === "documents"}
          onClick={() => onTabChange("documents")}
        />
        <NavItem
          label="AI assistant"
          icon="✦"
          active={tab === "assistant"}
          onClick={() => onTabChange("assistant")}
        />
      </nav>
      <button
        className="mt-auto cursor-pointer hidden border-t border-border pt-5 text-xs font-bold text-text-secondary lg:block"
        onClick={() => {
          clearSession();
          window.location.href = "/login";
        }}
        type="button"
      >
        Sign out
      </button>
    </aside>
  );
}

function NavItem({
  label,
  icon,
  active,
  onClick,
}: {
  label: string;
  icon: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className={`flex items-center gap-3 rounded-md px-3 py-3 text-left text-xs font-bold transition ${active ? "bg-primary-light text-primary" : "text-text-secondary hover:bg-background hover:text-text"}`}
      type="button"
      onClick={onClick}
    >
      <span className="w-4 text-center text-base">{icon}</span>
      {label}
    </button>
  );
}
