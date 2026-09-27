export type Tab = "home" | "lessons" | "quiz" | "lectures";
export type QuizCategory = "theory" | "signs" | "intersections" | "final";

export type Question = {
  category: Exclude<QuizCategory, "final">;
  prompt: string;
  options: string[];
  answer: number;
};

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
