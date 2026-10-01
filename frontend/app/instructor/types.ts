export type View = "home" | "planner" | "lectures";
export type RequestStatus = "Requested" | "Booked" | "Declined";

export type BookingRequest = {
  id: number;
  student: string;
  day: string;
  time: string;
  detail: string;
  status: RequestStatus;
};

export type Lecture = {
  id: number;
  title: string;
  file: string;
  fileUrl?: string;
};

export type Lesson = {
  day: string;
  time: string;
  student: string;
  detail: string;
  status: "Complete" | "Next up" | "Upcoming";
};
