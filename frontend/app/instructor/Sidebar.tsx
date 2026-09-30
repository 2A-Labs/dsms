import type { View } from "./types";
import { BrandLogo } from "../BrandingShell";

type SidebarProps = {
  view: View;
  pendingCount: number;
  onViewChange: (view: View) => void;
  onReturnToAdmin?: () => void;
};

export function Sidebar({ view, pendingCount, onViewChange, onReturnToAdmin }: SidebarProps) {
  return (
    <aside className="w-full border-b border-border bg-surface px-5 py-5 lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col lg:border-b-0 lg:border-r lg:px-5 lg:py-7">
      <a href="/"><BrandLogo className="flex items-center gap-2.5 font-display text-xl font-bold" markClassName="grid size-8 place-items-center rounded-md bg-primary text-sm text-white" /></a>
      <div className="mt-10 flex items-center gap-3 border-b border-border pb-5">
        <span className="grid size-9 place-items-center rounded-full bg-primary-light text-xs font-bold text-primary">
          JC
        </span>
        <div>
          <p className="text-xs font-bold">Jamie Carter</p>
          <p className="mt-0.5 text-[11px] text-text-secondary">Instructor</p>
        </div>
      </div>
      <p className="mb-3 mt-7 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-text-secondary">
        Instructor tools
      </p>
      <nav className="grid gap-1">
        <SidebarItem
          icon="⌂"
          label="Home"
          active={view === "home"}
          onClick={() => onViewChange("home")}
        />
        <SidebarItem
          icon="▦"
          label="Week planner"
          active={view === "planner"}
          badge={pendingCount || undefined}
          onClick={() => onViewChange("planner")}
        />
        <SidebarItem
          icon="▶"
          label="Lectures"
          active={view === "lectures"}
          onClick={() => onViewChange("lectures")}
        />
      </nav>
      <div className="mt-7 hidden rounded-md bg-primary-light p-4 lg:block">
        <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-primary">
          This week
        </p>
        <p className="mt-2 font-display text-2xl font-semibold text-primary">
          12 hours
        </p>
        <p className="mt-1 text-[11px] text-primary/70">
          7 bookable slots open
        </p>
      </div>
      {onReturnToAdmin && (
        <button
          className="mt-auto hidden border-t border-border pt-5 text-left text-xs font-bold text-primary lg:block"
          onClick={onReturnToAdmin}
          type="button"
        >
          ← Return to admin
        </button>
      )}
    </aside>
  );
}

function SidebarItem({
  icon,
  label,
  badge,
  active,
  onClick,
}: {
  icon: string;
  label: string;
  badge?: number;
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
      {badge && (
        <span className="ml-auto grid size-5 place-items-center rounded-full bg-warning text-[10px] text-white">
          {badge}
        </span>
      )}
    </button>
  );
}
