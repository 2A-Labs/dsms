const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

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

export type ApiQuizAnswer = {
  id: number;
  answer_text: string;
};

export type ApiQuizQuestion = {
  id: number;
  question_text: string;
  answers: ApiQuizAnswer[];
};

export type ApiQuizReviewItem = {
  question_id: number;
  question_text: string;
  selected_answer: string | null;
  correct_answer: string;
  is_correct: boolean;
};

export type ApiQuizSubmission = {
  score: number;
  total: number;
  review: ApiQuizReviewItem[];
};

type AuthResponse = { token: string; user: ApiUser };

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token =
    typeof window === "undefined"
      ? null
      : localStorage.getItem("roadwise_token");
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
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

export function getInstructors(): Promise<ApiInstructor[]> {
  return request<ApiInstructor[]>("/api/instructors");
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

export function createBooking(
  instructorId: number,
  slot: string,
): Promise<ApiBooking> {
  return request<ApiBooking>("/api/bookings", {
    method: "POST",
    body: JSON.stringify({ instructor_id: instructorId, slot }),
  });
}

export function getQuizQuestions(): Promise<ApiQuizQuestion[]> {
  return request<ApiQuizQuestion[]>("/api/quiz/questions");
}

export function submitQuiz(
  answers: { question_id: number; answer_id: number }[],
): Promise<ApiQuizSubmission> {
  return request<ApiQuizSubmission>("/api/quiz/submit", {
    method: "POST",
    body: JSON.stringify({ answers }),
  });
}
