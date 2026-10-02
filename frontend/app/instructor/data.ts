import type { BookingRequest, Lecture, Lesson } from "./types";

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

export const initialBookable = new Set([
  "Mon 28-09:00",
  "Mon 28-11:00",
  "Tue 29-10:00",
  "Wed 30-14:00",
  "Thu 01-09:00",
  "Fri 02-13:00",
  "Sat 03-10:00",
]);

export const initialRequests: BookingRequest[] = [
  {
    id: 1,
    student: "Maya Patel",
    day: "Tue 29",
    time: "10:00",
    detail: "Practical lesson · B Licence",
    status: "Requested",
  },
  {
    id: 2,
    student: "Noah Williams",
    day: "Thu 01",
    time: "09:00",
    detail: "Practical lesson · B Licence",
    status: "Requested",
  },
  {
    id: 3,
    student: "Sofia Chen",
    day: "Sat 03",
    time: "10:00",
    detail: "City driving practice",
    status: "Booked",
  },
];

const lessonsByInstructor: Record<string, Lesson[]> = {
  "Jamie Carter": [
    {
      day: "Mon 28",
      time: "09:00",
      student: "Liam Johnson",
      detail: "Practical lesson · B Licence",
      status: "Complete",
    },
    {
      day: "Tue 29",
      time: "13:00",
      student: "Sofia Chen",
      detail: "Practical lesson · City driving",
      status: "Next up",
    },
    {
      day: "Thu 01",
      time: "15:00",
      student: "Daniel Brooks",
      detail: "Assessment · B Licence",
      status: "Upcoming",
    },
  ],
  "Priya Shah": [
    {
      day: "Mon 28",
      time: "11:00",
      student: "Maya Patel",
      detail: "Practical lesson · B Licence",
      status: "Complete",
    },
    {
      day: "Wed 30",
      time: "10:00",
      student: "Noah Williams",
      detail: "Practical lesson · B Licence",
      status: "Next up",
    },
    {
      day: "Fri 02",
      time: "14:00",
      student: "Sofia Chen",
      detail: "City driving practice",
      status: "Upcoming",
    },
  ],
  "Marcus Green": [
    {
      day: "Tue 29",
      time: "10:00",
      student: "Maya Patel",
      detail: "Practical lesson · B Licence",
      status: "Complete",
    },
    {
      day: "Thu 01",
      time: "09:00",
      student: "Noah Williams",
      detail: "Practical lesson · B Licence",
      status: "Next up",
    },
    {
      day: "Sat 03",
      time: "11:00",
      student: "Sofia Chen",
      detail: "City driving practice",
      status: "Upcoming",
    },
  ],
};

export function getLessonsForInstructor(
  instructorName: string,
  day: string,
): Lesson[] {
  return (lessonsByInstructor[instructorName] ?? []).filter(
    (lesson) => lesson.day === day,
  );
}

export const initialLectures: Lecture[] = [
  { id: 1, title: "Mirror, signal, manoeuvre", file: "mirror-signal.mp4" },
  { id: 2, title: "Roundabouts made simple", file: "roundabouts.mp4" },
  { id: 3, title: "A calm approach to junctions", file: "junctions.mp4" },
];
