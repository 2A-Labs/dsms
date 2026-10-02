export type Tab = "home" | "lessons" | "quiz" | "lectures" | "documents";

export type Instructor = {
  id: number;
  name: string;
  initials: string;
  school: string;
  location: string;
  slots: string[];
};

export type Lecture = {
  title: string;
  instructor: string;
  duration: string;
  color: string;
};
