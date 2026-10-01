import { afterEach, describe, expect, it, vi } from "vitest";

import type { Job } from "../types/job";
import { requestJson } from "./client";
import { waitForJobAnalysis } from "./jobRequests";

vi.mock("./client", () => ({
  API_BASE_URL: "http://localhost:3000",
  buildQuery: vi.fn(),
  requestBlob: vi.fn(),
  requestJson: vi.fn(),
  requestVoid: vi.fn(),
}));

afterEach(() => {
  vi.useRealTimers();
  vi.clearAllMocks();
});

describe("waitForJobAnalysis", () => {
  it("removes the abort listener after each polling delay", async () => {
    vi.useFakeTimers();
    vi.mocked(requestJson).mockResolvedValue({ ai_analysis_status: "completed" } as Job);
    const signal = new AbortController().signal;
    const addListener = vi.spyOn(signal, "addEventListener");
    const removeListener = vi.spyOn(signal, "removeEventListener");

    const request = waitForJobAnalysis(1, { signal });
    await vi.advanceTimersByTimeAsync(500);

    await expect(request).resolves.toMatchObject({ ai_analysis_status: "completed" });
    expect(addListener).toHaveBeenCalledTimes(1);
    expect(removeListener).toHaveBeenCalledWith("abort", expect.any(Function));
  });
});
