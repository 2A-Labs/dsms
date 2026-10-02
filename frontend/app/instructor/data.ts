export type PlannerDay = {
  key: string;
  label: string;
  isToday: boolean;
};

function dateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getPlannerDays(start = new Date()): PlannerDay[] {
  return Array.from({ length: 15 }, (_, index) => {
    const date = new Date(start);
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() + index);
    return {
      key: dateKey(date),
      label: new Intl.DateTimeFormat("en", {
        weekday: "short",
        day: "2-digit",
        month: "short",
      }).format(date),
      isToday: index === 0,
    };
  });
}

export function isPlannerSlotPast(dayKey: string, hour: string): boolean {
  const [hoursPart, minutesPart] = hour.split(":").map(Number);
  const now = new Date();
  const slot = new Date(`${dayKey}T00:00:00`);
  slot.setHours(hoursPart, minutesPart, 0, 0);
  return slot <= now;
}

export const hours = [
  "08:00",
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
];
