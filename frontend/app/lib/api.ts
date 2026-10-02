const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export function clearSession(): void {
  localStorage.removeItem("roadwise_token");
  localStorage.removeItem("roadwise_admin_token");
  document.cookie = "roadwise_session=; path=/; max-age=0; samesite=lax";
  document.cookie = "roadwise_role=; path=/; max-age=0; samesite=lax";
}

export type ApiUser = {
  id: number;
  name: string;
  email: string;
  role: string;
  instructor_id: number | null;
  school?: string | null;
  location?: string | null;
};

export type AdminInstructor = ApiUser;

export type SchoolSettings = {
  id: number;
  school_name: string;
  logo_mark: string;
  logo_data: string | null;
  primary_color: string;
  accent_color: string;
};

export type ApiInstructor = {
  id: number;
  name: string;
  initials: string;
  school: string;
  location: string;
  slots: string[];
};

export type ApiBooking = {
  id: number;
  student_id: number;
  instructor_id: number;
  slot: string;
  status: string;
};

export type ApiLecture = {
  id: number;
  instructor_id: number;
  instructor_name: string;
  title: string;
  file_url: string;
  duration_seconds: number | null;
};

export type ApiDocument = {
  id: number;
  instructor_id: number;
  title: string;
  file_name: string;
  mime_type: string;
  file_url: string;
  created_at: string;
};

export type ApiStudent = {
  id: number;
  name: string;
  email: string;
};

export type ApiInstructorBooking = {
  id: number;
  student_id: number;
  student_name: string;
  slot: string;
  status: "Requested" | "Booked" | "Declined";
};

export type ApiInstructorSchedule = {
  bookable_slots: string[];
  bookings: ApiInstructorBooking[];
  booked_hours: number;
};

export type ApiQuizAnswer = {
  id: number;
  answer_text: string;
};

export type ApiQuiz = {
  id: number;
  name: string;
  description: string | null;
  is_active: boolean;
  question_count: number;
};

export type ApiQuizQuestion = {
  id: number;
  question_text: string;
  quiz_id: number;
  image_url: string | null;
  allow_multiple: boolean;
  answers: ApiQuizAnswer[];
};

export type ApiQuizManageAnswer = ApiQuizAnswer & { is_correct: boolean };

export type ApiQuizManageQuestion = {
  id: number;
  quiz_id: number;
  question_text: string;
  image_url: string | null;
  allow_multiple: boolean;
  is_active: boolean;
  answers: ApiQuizManageAnswer[];
};

export type ApiQuizReviewItem = {
  question_id: number;
  question_text: string;
  selected_answers: string[];
  correct_answers: string[];
  is_correct: boolean;
};

export type ApiQuizSubmission = {
  score: number;
  total: number;
  review: ApiQuizReviewItem[];
};

type AuthResponse = { token: string; user: ApiUser };

export type SetupStatus = { setup_required: boolean };

export type HeroImage = {
  image_url: string;
  photographer_name: string;
  photographer_url: string;
  unsplash_url: string;
};

export type AssistantMessage = {
  role: "user" | "assistant";
  content: string;
};

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token =
    typeof window === "undefined"
      ? null
      : localStorage.getItem("roadwise_token");
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      ...(init.body instanceof FormData
        ? {}
        : { "Content-Type": "application/json" }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
  });
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.detail ?? "The request could not be completed");
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export async function authenticate(
  path: "/api/auth/login" | "/api/auth/signup",
  payload: Record<string, string>,
): Promise<AuthResponse> {
  return request<AuthResponse>(path, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function getSetupStatus(): Promise<SetupStatus> {
  return request<SetupStatus>("/api/setup/status");
}

export function getHeroImage(): Promise<HeroImage> {
  return request<HeroImage>("/api/branding/hero-image");
}

export function setupApplication(payload: {
  name: string;
  email: string;
  password: string;
}): Promise<AuthResponse> {
  return request<AuthResponse>("/api/setup", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function chatWithAssistant(
  message: string,
  history: AssistantMessage[],
): Promise<{ reply: string }> {
  return request<{ reply: string }>("/api/assistant/chat", {
    method: "POST",
    body: JSON.stringify({ message, history }),
  });
}

export function getInstructors(): Promise<ApiInstructor[]> {
  return request<ApiInstructor[]>("/api/instructors");
}

export function getMe(): Promise<ApiUser> {
  return request<ApiUser>("/api/me");
}

export function getInstructorSchedule(): Promise<ApiInstructorSchedule> {
  return request<ApiInstructorSchedule>("/api/instructor/schedule");
}

export function updateInstructorAvailability(
  slot: string,
  isOpen: boolean,
): Promise<void> {
  return request<void>("/api/instructor/availability", {
    method: "PUT",
    body: JSON.stringify({ slot, is_open: isOpen }),
  });
}

export function updateInstructorBooking(
  id: number,
  status: ApiInstructorBooking["status"],
): Promise<ApiInstructorBooking> {
  return request<ApiInstructorBooking>(`/api/instructor/bookings/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export function assignInstructor(instructorId: number): Promise<ApiUser> {
  return request<ApiUser>("/api/me/instructor", {
    method: "PUT",
    body: JSON.stringify({ instructor_id: instructorId }),
  });
}

export function getAdminInstructors(): Promise<AdminInstructor[]> {
  return request<AdminInstructor[]>("/api/admin/instructors");
}

export function impersonateInstructor(id: number): Promise<AuthResponse> {
  return request<AuthResponse>(`/api/admin/instructors/${id}/impersonate`, {
    method: "POST",
  });
}

export function getSchoolSettings(): Promise<SchoolSettings> {
  return request<SchoolSettings>("/api/admin/settings");
}

export function saveSchoolSettings(
  settings: Omit<SchoolSettings, "id">,
): Promise<SchoolSettings> {
  return request<SchoolSettings>("/api/admin/settings", {
    method: "PUT",
    body: JSON.stringify(settings),
  });
}

export function createAdminInstructor(payload: {
  name: string;
  email: string;
  password: string;
  school: string;
  location: string;
}): Promise<AdminInstructor> {
  return request<AdminInstructor>("/api/admin/instructors", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateAdminInstructor(
  id: number,
  payload: Partial<{
    name: string;
    email: string;
    password: string;
    school: string;
    location: string;
  }>,
): Promise<AdminInstructor> {
  return request<AdminInstructor>(`/api/admin/instructors/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function deleteAdminInstructor(id: number): Promise<void> {
  await request<unknown>(`/api/admin/instructors/${id}`, { method: "DELETE" });
}

export function getMyBookings(): Promise<ApiBooking[]> {
  return request<ApiBooking[]>("/api/bookings/me");
}

export function getMyLectures(): Promise<ApiLecture[]> {
  return request<ApiLecture[]>("/api/lectures");
}

export function getMyDocuments(): Promise<ApiDocument[]> {
  return request<ApiDocument[]>("/api/documents");
}

export function getInstructorLectures(): Promise<ApiLecture[]> {
  return request<ApiLecture[]>("/api/instructor/lectures");
}

export function getInstructorDocuments(): Promise<ApiDocument[]> {
  return request<ApiDocument[]>("/api/instructor/documents");
}

export function createInstructorDocument(
  title: string,
  file: File,
): Promise<ApiDocument> {
  const formData = new FormData();
  formData.append("title", title);
  formData.append("file", file);
  return request<ApiDocument>("/api/instructor/documents", {
    method: "POST",
    body: formData,
    headers: {},
  });
}

export function deleteInstructorDocument(id: number): Promise<void> {
  return request<void>(`/api/instructor/documents/${id}`, { method: "DELETE" });
}

export function getInstructorStudents(): Promise<ApiStudent[]> {
  return request<ApiStudent[]>("/api/instructor/students");
}

export function updateInstructorStudent(
  id: number,
  payload: { name: string; email: string },
): Promise<ApiStudent> {
  return request<ApiStudent>(`/api/instructor/students/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function resetStudentPassword(id: number, password: string): Promise<void> {
  return request<void>(`/api/instructor/students/${id}/password`, {
    method: "PATCH",
    body: JSON.stringify({ password }),
  });
}

export function createInstructorLecture(
  title: string,
  file: File,
): Promise<ApiLecture> {
  const formData = new FormData();
  formData.append("title", title);
  formData.append("file", file);
  return request<ApiLecture>("/api/instructor/lectures", {
    method: "POST",
    body: formData,
    headers: {},
  });
}

export function deleteInstructorLecture(id: number): Promise<void> {
  return request<void>(`/api/instructor/lectures/${id}`, { method: "DELETE" });
}

export function createBooking(
  instructorId: number,
  slot: string,
): Promise<ApiBooking> {
  return request<ApiBooking>("/api/bookings", {
    method: "POST",
    body: JSON.stringify({ instructor_id: instructorId, slot }),
  });
}

export function getQuizzes(): Promise<ApiQuiz[]> {
  return request<ApiQuiz[]>("/api/quizzes");
}

export function getQuizQuestions(quizId?: number): Promise<ApiQuizQuestion[]> {
  return request<ApiQuizQuestion[]>(
    quizId ? `/api/quiz/questions?quiz_id=${quizId}` : "/api/quiz/questions",
  );
}

export function submitQuiz(
  answers: { question_id: number; answer_ids: number[] }[],
): Promise<ApiQuizSubmission> {
  return request<ApiQuizSubmission>("/api/quiz/submit", {
    method: "POST",
    body: JSON.stringify({ answers }),
  });
}

export function getManageQuizQuestions(): Promise<ApiQuizManageQuestion[]> {
  return request<ApiQuizManageQuestion[]>("/api/quiz/manage/questions");
}

export function getManageQuizzes(): Promise<ApiQuiz[]> {
  return request<ApiQuiz[]>("/api/quiz/manage/quizzes");
}

export function createManageQuiz(name: string, description: string): Promise<ApiQuiz> {
  return request<ApiQuiz>("/api/quiz/manage/quizzes", {
    method: "POST",
    body: JSON.stringify({ name, description, is_active: true }),
  });
}

export function deleteManageQuiz(id: number): Promise<void> {
  return request<void>(`/api/quiz/manage/quizzes/${id}`, { method: "DELETE" });
}

export function createManageQuizQuestion(payload: {
  quiz_id: number;
  question_text: string;
  image_url: string | null;
  allow_multiple: boolean;
  is_active: boolean;
  answers: { answer_text: string; is_correct: boolean }[];
}): Promise<ApiQuizManageQuestion> {
  return request<ApiQuizManageQuestion>("/api/quiz/manage/questions", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateManageQuizQuestion(
  id: number,
  payload: Parameters<typeof createManageQuizQuestion>[0],
): Promise<ApiQuizManageQuestion> {
  return request<ApiQuizManageQuestion>(`/api/quiz/manage/questions/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function deleteManageQuizQuestion(id: number): Promise<void> {
  return request<void>(`/api/quiz/manage/questions/${id}`, { method: "DELETE" });
}
