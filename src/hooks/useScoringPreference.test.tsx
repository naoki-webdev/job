import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ApiError } from "../api/jobs";
import type { ScoringPreferencePayload } from "../types/job";
import { useScoringPreference } from "./useScoringPreference";
import { fetchScoringPreference, updateScoringPreference } from "../api/jobs";

vi.mock("../api/jobs", async () => {
  const actual = await vi.importActual<typeof import("../api/jobs")>("../api/jobs");

  return {
    ...actual,
    fetchScoringPreference: vi.fn(),
    updateScoringPreference: vi.fn(),
  };
});

const mockedFetchScoringPreference = vi.mocked(fetchScoringPreference);
const mockedUpdateScoringPreference = vi.mocked(updateScoringPreference);

const scoringPreference = {
  id: 1,
  full_remote_weight: 30,
  hybrid_weight: 15,
  onsite_weight: 0,
  high_salary_max_threshold: 8_000_000,
  high_salary_bonus: 10,
  low_salary_min_threshold: 4_000_000,
  low_salary_penalty: -10,
  created_at: "2026-04-05T00:00:00.000Z",
  updated_at: "2026-04-05T00:00:00.000Z",
};

const payload: ScoringPreferencePayload = {
  full_remote_weight: 35,
  hybrid_weight: 20,
  onsite_weight: 0,
  high_salary_max_threshold: 8_500_000,
  high_salary_bonus: 12,
  low_salary_min_threshold: 4_000_000,
  low_salary_penalty: -8,
};

beforeEach(() => {
  mockedFetchScoringPreference.mockResolvedValue(scoringPreference);
  mockedUpdateScoringPreference.mockResolvedValue({ ...scoringPreference, ...payload });
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("useScoringPreference", () => {
  it("loads the scoring preference on mount", async () => {
    const { result } = renderHook(() => useScoringPreference());

    await waitFor(() => {
      expect(result.current.scoringPreference).toEqual(scoringPreference);
    });

    expect(result.current.loadError).toBeNull();
  });

  it("updates the scoring preference and stores the latest values", async () => {
    const { result } = renderHook(() => useScoringPreference());

    await waitFor(() => expect(mockedFetchScoringPreference).toHaveBeenCalledTimes(1));

    let updated;
    await act(async () => {
      updated = await result.current.handleSubmitScoring(payload);
    });

    expect(mockedUpdateScoringPreference).toHaveBeenCalledWith(payload);
    expect(updated).toEqual({ ...scoringPreference, ...payload });
    expect(result.current.scoringPreference).toEqual({ ...scoringPreference, ...payload });
    expect(result.current.scoringError).toBeNull();
  });

  it("stores and clears submit errors", async () => {
    mockedUpdateScoringPreference.mockRejectedValueOnce(new ApiError(422, "Hybrid weight can't be blank", ["Hybrid weight can't be blank"]));

    const { result } = renderHook(() => useScoringPreference());

    await waitFor(() => expect(mockedFetchScoringPreference).toHaveBeenCalledTimes(1));

    await act(async () => {
      await result.current.handleSubmitScoring(payload);
    });

    expect(result.current.scoringError).toBe("Hybrid weight can't be blank");

    act(() => {
      result.current.clearScoringError();
    });

    expect(result.current.scoringError).toBeNull();
  });

  it("keeps the submitted preference when the initial load resolves later", async () => {
    let resolveInitial!: (value: typeof scoringPreference) => void;
    const initialLoad = new Promise<typeof scoringPreference>((resolve) => {
      resolveInitial = resolve;
    });
    mockedFetchScoringPreference.mockReturnValueOnce(initialLoad);

    const { result } = renderHook(() => useScoringPreference());

    await act(async () => {
      await result.current.handleSubmitScoring(payload);
    });

    const updatedPreference = { ...scoringPreference, ...payload };
    expect(result.current.scoringPreference).toEqual(updatedPreference);

    resolveInitial(scoringPreference);
    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.scoringPreference).toEqual(updatedPreference);
    expect(mockedFetchScoringPreference.mock.calls[0][0]).toEqual(
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
    expect((mockedFetchScoringPreference.mock.calls[0][0] as RequestInit).signal?.aborted).toBe(true);
  });
});
