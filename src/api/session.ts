import type { SessionResponse } from "../types/job";
import { API_BASE_URL, requestJson, requestVoid } from "./client";

export async function createSession(email: string, password: string): Promise<Required<SessionResponse>> {
  return requestJson<Required<SessionResponse>>(`${API_BASE_URL}/api/session`, {
    method: "POST",
    body: JSON.stringify({ session: { email, password } }),
  });
}

export async function fetchCurrentSession(): Promise<SessionResponse> {
  return requestJson<SessionResponse>(`${API_BASE_URL}/api/session`);
}

export async function deleteSession(): Promise<void> {
  return requestVoid(`${API_BASE_URL}/api/session`, { method: "DELETE" });
}
