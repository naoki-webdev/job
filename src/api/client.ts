import type { JobsListParams } from "../types/job";

const viteEnv = (import.meta as { env?: { DEV?: boolean; VITE_API_BASE_URL?: string } }).env;

export const API_BASE_URL = viteEnv?.VITE_API_BASE_URL ?? (viteEnv?.DEV ? "http://localhost:3000" : "");

type ApiErrorBody = {
  errors?: string[];
  code?: string;
  request_id?: string;
};

export class ApiError extends Error {
  status: number;
  errors: string[];
  code?: string;
  requestId?: string;

  constructor(status: number, message: string, errors: string[] = [], code?: string, requestId?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.errors = errors;
    this.code = code;
    this.requestId = requestId;
  }
}

export function getApiErrorMessage(error: unknown, fallbackMessage: string) {
  if (error instanceof ApiError && error.errors.length > 0) {
    return error.errors.join(" / ");
  }

  return fallbackMessage;
}

export function buildQuery(params: JobsListParams = {}): string {
  const searchParams = new URLSearchParams();

  if (params.keyword) searchParams.set("keyword", params.keyword);
  if (params.status?.length) searchParams.set("status", params.status.join(","));
  if (params.work_style?.length) {
    searchParams.set("work_style", params.work_style.join(","));
  }
  if (params.position_id?.length) searchParams.set("position_id", params.position_id.join(","));
  if (params.location_id?.length) searchParams.set("location_id", params.location_id.join(","));
  if (params.sort) searchParams.set("sort", params.sort);
  if (params.direction) searchParams.set("direction", params.direction);
  if (params.page) searchParams.set("page", String(params.page));
  if (params.per_page) searchParams.set("per_page", String(params.per_page));

  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

export async function requestJson<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const isFormDataBody = typeof FormData !== "undefined" && init?.body instanceof FormData;
  const headers = buildRequestHeaders(init, !isFormDataBody);

  const response = await fetch(input, {
    ...init,
    credentials: init?.credentials ?? "include",
    headers,
  });

  if (!response.ok) {
    throw await buildApiError(response);
  }

  return (await response.json()) as T;
}

export async function requestVoid(input: RequestInfo, init?: RequestInit): Promise<void> {
  const response = await fetch(input, {
    ...init,
    credentials: init?.credentials ?? "include",
    headers: buildRequestHeaders(init, false),
  });

  if (!response.ok) {
    throw await buildApiError(response);
  }
}

export async function requestBlob(input: RequestInfo, init?: RequestInit): Promise<{ blob: Blob; filename: string }> {
  const response = await fetch(input, {
    ...init,
    credentials: init?.credentials ?? "include",
    headers: buildRequestHeaders(init, false),
  });

  if (!response.ok) {
    throw await buildApiError(response);
  }

  return {
    blob: await response.blob(),
    filename: filenameFromContentDisposition(response.headers.get("Content-Disposition")) ?? "jobs.csv",
  };
}

async function buildApiError(response: Response): Promise<ApiError> {
  const text = await response.text();
  let errors: string[] = [];
  let code: string | undefined;
  let requestId: string | undefined;

  if (text) {
    try {
      const body = JSON.parse(text) as ApiErrorBody;
      if (Array.isArray(body.errors)) {
        errors = body.errors.map((error) => String(error));
      }
      code = typeof body.code === "string" ? body.code : undefined;
      requestId = typeof body.request_id === "string" ? body.request_id : undefined;
    } catch {
      errors = [];
    }
  }

  const message = errors.length > 0
    ? errors.join(" / ")
    : `Request failed: ${response.status} ${response.statusText}${text ? ` - ${text}` : ""}`;

  return new ApiError(response.status, message, errors, code, requestId);
}

function buildRequestHeaders(init: RequestInit | undefined, jsonBody: boolean) {
  const headers = new Headers(init?.headers);

  if (jsonBody && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  return headers;
}

function filenameFromContentDisposition(contentDisposition: string | null) {
  if (!contentDisposition) return null;

  const utf8Filename = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i)?.[1];
  if (utf8Filename) return decodeURIComponent(utf8Filename);

  const filename = contentDisposition.match(/filename="?([^";]+)"?/i)?.[1];
  return filename ?? null;
}
