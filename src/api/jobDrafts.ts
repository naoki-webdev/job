import type { JobDraftRequest, JobDraftResponse } from "../types/job";
import { API_BASE_URL, requestJson } from "./client";

export async function createJobDraft(payload: JobDraftRequest, init?: RequestInit): Promise<JobDraftResponse> {
  return requestJson<JobDraftResponse>(`${API_BASE_URL}/api/job_drafts`, {
    ...init,
    method: "POST",
    body: JSON.stringify({ job_draft: payload }),
  });
}
