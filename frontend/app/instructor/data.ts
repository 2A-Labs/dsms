import type { BookingRequest, Lecture, Lesson } from "./types";

export const days = [
  "Mon 28",
  "Tue 29",
  "Wed 30",
  "Thu 01",
  "Fri 02",
  "Sat 03",
];

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
