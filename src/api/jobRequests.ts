import type {
  Job,
  JobFormPayload,
  JobsListParams,
  JobsListResponse,
  JobUpdatePayload,
} from "../types/job";
import { API_BASE_URL, buildQuery, requestBlob, requestJson, requestVoid } from "./client";

function hasJobFilePayload(job: JobFormPayload | JobUpdatePayload) {
  return Boolean(job.company_logo || job.remove_company_logo);
}

function buildJobFormData(job: JobFormPayload | JobUpdatePayload) {
  const formData = new FormData();

  Object.entries(job).forEach(([key, value]) => {
    if (value === undefined || value === null || value === false) return;

    if (Array.isArray(value)) {
      value.forEach((item) => formData.append(`job[${key}][]`, String(item)));
      return;
    }

    if (typeof File !== "undefined" && value instanceof File) {
      formData.append(`job[${key}]`, value);
      return;
    }

    formData.append(`job[${key}]`, value === true ? "1" : String(value));
  });

  return formData;
}

function buildJobRequestInit(method: "POST" | "PATCH", job: JobFormPayload | JobUpdatePayload): RequestInit {
  if (hasJobFilePayload(job)) {
    return {
      method,
      body: buildJobFormData(job),
    };
  }

  return {
    method,
    body: JSON.stringify({ job }),
  };
}

export async function fetchJobs(params: JobsListParams = {}, init?: RequestInit): Promise<JobsListResponse> {
  const query = buildQuery(params);
  return requestJson<JobsListResponse>(`${API_BASE_URL}/api/jobs${query}`, init);
}

export async function fetchJob(id: number, init?: RequestInit): Promise<Job> {
  return requestJson<Job>(`${API_BASE_URL}/api/jobs/${id}`, init);
}

export async function createJob(job: JobFormPayload): Promise<Job> {
  return requestJson<Job>(`${API_BASE_URL}/api/jobs`, buildJobRequestInit("POST", job));
}

export async function updateJob(id: number, job: JobUpdatePayload): Promise<Job> {
  return requestJson<Job>(`${API_BASE_URL}/api/jobs/${id}`, buildJobRequestInit("PATCH", job));
}

export async function deleteJob(id: number): Promise<void> {
  return requestVoid(`${API_BASE_URL}/api/jobs/${id}`, { method: "DELETE" });
}

export function buildJobsExportUrl(params: JobsListParams = {}): string {
  const query = buildQuery(params);
  return `${API_BASE_URL}/api/jobs/export${query}`;
}

export async function downloadJobsCsv(params: JobsListParams = {}): Promise<{ blob: Blob; filename: string }> {
  return requestBlob(buildJobsExportUrl(params));
}
