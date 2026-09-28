const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export type ApiUser = {
  id: number;
  name: string;
  email: string;
  role: string;
  instructor_id: number | null;
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

type AuthResponse = { token: string; user: ApiUser };

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = typeof window === "undefined" ? null : localStorage.getItem("roadwise_token");
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

export function getMyBookings(): Promise<ApiBooking[]> {
  return request<ApiBooking[]>("/api/bookings/me");
}

export function createBooking(instructorId: number, slot: string): Promise<ApiBooking> {
  return request<ApiBooking>("/api/bookings", {
    method: "POST",
    body: JSON.stringify({ instructor_id: instructorId, slot }),
  });
}
