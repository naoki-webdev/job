import { ApiError } from "../api/client";

type RetryOptions = {
  retries?: number;
  delayMs?: number;
  shouldRetry?: (error: unknown) => boolean;
};

function wait(delayMs: number) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, delayMs);
  });
}

export function isAbortError(error: unknown) {
  return error instanceof Error && error.name === "AbortError";
}

export function isRetryableError(error: unknown) {
  if (isAbortError(error)) return false;
  return !(error instanceof ApiError) || error.status >= 500;
}

export async function retry<T>(
  action: () => Promise<T>,
  { retries = 2, delayMs = 300, shouldRetry = isRetryableError }: RetryOptions = {},
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      return await action();
    } catch (error) {
      lastError = error;

      if (attempt === retries || !shouldRetry(error)) {
        break;
      }

      await wait(delayMs * (attempt + 1));
    }
  }

  throw lastError;
}
