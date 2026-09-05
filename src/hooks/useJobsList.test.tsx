import { useEffect } from "react";
import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { buildJob } from "../test/fixtures";
import type { JobFormPayload } from "../types/job";
import { useJobsList } from "./useJobsList";
import {
  ApiError,
  createJob,
  deleteJob,
  downloadJobsCsv,
  fetchJob,
  fetchJobs,
  updateJob,
} from "../api/jobs";

vi.mock("../api/jobs", async () => {
  const actual = await vi.importActual<typeof import("../api/jobs")>("../api/jobs");

  return {
    ...actual,
    createJob: vi.fn(),
    deleteJob: vi.fn(),
    downloadJobsCsv: vi.fn(),
    fetchJob: vi.fn(),
    fetchJobs: vi.fn(),
    updateJob: vi.fn(),
  };
});

const mockedCreateJob = vi.mocked(createJob);
const mockedDeleteJob = vi.mocked(deleteJob);
const mockedDownloadJobsCsv = vi.mocked(downloadJobsCsv);
const mockedFetchJob = vi.mocked(fetchJob);
const mockedFetchJobs = vi.mocked(fetchJobs);
const mockedUpdateJob = vi.mocked(updateJob);

const response = {
  jobs: [buildJob(), buildJob({ id: 2, company_name: "別の会社", score: 48 })],
  meta: {
    page: 1,
    per_page: 20,
    total_count: 2,
    summary: {
      remote_friendly: 2,
      active_pipeline: 1,
      high_score: 1,
    },
    recommended_job_ids: [],
  },
};

const payload: JobFormPayload = {
  company_name: "株式会社テスト",
  position_id: 1,
  status: "interested",
  work_style: "hybrid",
  employment_type: "full_time",
  salary_min: 5_000_000,
  salary_max: 7_000_000,
  tech_stack_ids: [1, 2],
  location_id: 1,
  notes: "テスト用メモ",
};

beforeEach(() => {
  mockedFetchJobs.mockResolvedValue(response);
  mockedFetchJob.mockResolvedValue(buildJob());
  mockedCreateJob.mockResolvedValue(buildJob({ id: 3, company_name: "株式会社テスト" }));
  mockedUpdateJob.mockResolvedValue(buildJob({ status: "offer" }));
  mockedDeleteJob.mockResolvedValue(undefined);
  mockedDownloadJobsCsv.mockResolvedValue({ blob: new Blob(["csv"], { type: "text/csv" }), filename: "jobs.csv" });
  vi.spyOn(window, "confirm").mockReturnValue(true);
  Object.defineProperty(window.URL, "createObjectURL", { configurable: true, value: vi.fn(() => "blob:jobs") });
  Object.defineProperty(window.URL, "revokeObjectURL", { configurable: true, value: vi.fn() });
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.clearAllMocks();
});

describe("useJobsList", () => {
  it("loads jobs and updates list state", async () => {
    const { result } = renderHook(() => useJobsList());

    await act(async () => {
      await result.current.loadJobs();
    });

    expect(mockedFetchJobs).toHaveBeenNthCalledWith(1, {
      keyword: "",
      status: [],
      work_style: [],
      sort: "score",
      direction: "desc",
      page: 1,
      per_page: 20,
    }, expect.objectContaining({ signal: expect.any(AbortSignal) }));
    expect(mockedFetchJobs).toHaveBeenNthCalledWith(2, {
      keyword: "",
      status: [],
      work_style: [],
      sort: "score",
      direction: "desc",
      page: 1,
      per_page: 3,
    }, expect.objectContaining({ signal: expect.any(AbortSignal) }));
    expect(mockedFetchJobs).toHaveBeenCalledTimes(2);
    expect(result.current.jobs).toHaveLength(2);
    expect(result.current.totalCount).toBe(2);
    expect(result.current.summaryItems[1].value).toBe(2);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("keeps the ranking independent from table sorting and pagination", async () => {
    mockedFetchJobs
      .mockResolvedValueOnce({
        ...response,
        jobs: [buildJob({ id: 1, company_name: "一覧の求人", score: 40 })],
        meta: { ...response.meta, total_count: 4 },
      })
      .mockResolvedValueOnce({
        ...response,
        jobs: [
          buildJob({ id: 10, company_name: "最高スコア", score: 99 }),
          buildJob({ id: 11, company_name: "次点", score: 88 }),
          buildJob({ id: 12, company_name: "三番手", score: 80 }),
          buildJob({ id: 13, company_name: "見送り", score: 100, status: "rejected" }),
        ],
        meta: { ...response.meta, total_count: 4, recommended_job_ids: [10] },
      });

    const { result } = renderHook(() => useJobsList());

    await act(async () => {
      await result.current.loadJobs();
    });

    expect(result.current.jobs[0].id).toBe(1);
    expect(result.current.rankingJobs.map((job) => job.id)).toEqual([10, 11, 12, 13]);
    expect(result.current.recommendedJobIds).toEqual([10]);
    expect(mockedFetchJobs).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ sort: "score", direction: "desc", page: 1, per_page: 3 }),
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
  });

  it("ignores stale responses when filters change during a request", async () => {
    let resolveFirstList!: (value: typeof response) => void;
    let resolveFirstRanking!: (value: typeof response) => void;
    const firstList = new Promise<typeof response>((resolve) => {
      resolveFirstList = resolve;
    });
    const firstRanking = new Promise<typeof response>((resolve) => {
      resolveFirstRanking = resolve;
    });
    const latestList = {
      ...response,
      jobs: [buildJob({ id: 20, company_name: "reactの求人" })],
    };
    const latestRanking = {
      ...response,
      jobs: [buildJob({ id: 20, company_name: "reactの求人", score: 99 })],
    };

    mockedFetchJobs
      .mockReturnValueOnce(firstList)
      .mockReturnValueOnce(firstRanking)
      .mockResolvedValueOnce(latestList)
      .mockResolvedValueOnce(latestRanking);

    const { result } = renderHook(() => useJobsList());
    const firstLoad = result.current.loadJobs();

    await act(async () => {
      result.current.handleKeywordChange("react");
    });

    const secondLoad = result.current.loadJobs();
    await act(async () => {
      await secondLoad;
    });

    resolveFirstList(response);
    resolveFirstRanking(response);
    await act(async () => {
      await firstLoad;
    });

    expect(result.current.jobs.map((job) => job.company_name)).toEqual(["reactの求人"]);
    expect(result.current.rankingJobs.map((job) => job.company_name)).toEqual(["reactの求人"]);
    expect(result.current.error).toBeNull();
    expect(mockedFetchJobs.mock.calls[0][1]).toEqual(expect.objectContaining({ signal: expect.any(AbortSignal) }));
    expect((mockedFetchJobs.mock.calls[0][1] as RequestInit).signal?.aborted).toBe(true);
  });

  it("ignores stale detail responses when rows are clicked quickly", async () => {
    let resolveFirst!: (value: ReturnType<typeof buildJob>) => void;
    const firstDetail = new Promise<ReturnType<typeof buildJob>>((resolve) => {
      resolveFirst = resolve;
    });
    const latestJob = buildJob({ id: 2, company_name: "最新の求人" });

    mockedFetchJob.mockReturnValueOnce(firstDetail).mockResolvedValueOnce(latestJob);

    const { result } = renderHook(() => useJobsList());
    const firstClick = result.current.handleRowClick(1);

    await act(async () => {
      await result.current.handleRowClick(2);
    });

    resolveFirst(buildJob({ id: 1, company_name: "古い求人" }));
    await act(async () => {
      await firstClick;
    });

    expect(result.current.selectedJob?.id).toBe(2);
    expect(result.current.selectedJob?.company_name).toBe("最新の求人");
    expect(mockedFetchJob.mock.calls[0][1]).toEqual(expect.objectContaining({ signal: expect.any(AbortSignal) }));
    expect((mockedFetchJob.mock.calls[0][1] as RequestInit).signal?.aborted).toBe(true);
  });

  it("does not apply a stale status update after selecting another job", async () => {
    let resolveStatus!: (value: ReturnType<typeof buildJob>) => void;
    const statusUpdate = new Promise<ReturnType<typeof buildJob>>((resolve) => {
      resolveStatus = resolve;
    });
    const nextJob = buildJob({ id: 2, company_name: "別の選択" });

    mockedUpdateJob.mockReturnValueOnce(statusUpdate);
    mockedFetchJob.mockResolvedValueOnce(nextJob);

    const { result } = renderHook(() => useJobsList());

    act(() => {
      result.current.openJobPreview(buildJob({ id: 1, company_name: "更新対象" }));
    });

    let statusPromise!: Promise<void>;
    await act(async () => {
      statusPromise = result.current.handleStatusChange("offer");
    });
    expect(result.current.statusUpdating).toBe(true);

    await act(async () => {
      await result.current.handleRowClick(2);
    });

    resolveStatus(buildJob({ id: 1, status: "offer" }));
    await act(async () => {
      await statusPromise;
    });

    expect(result.current.selectedJob?.id).toBe(2);
    expect(result.current.statusUpdating).toBe(false);
  });

  it("stores an error when loading jobs fails", async () => {
    mockedFetchJobs.mockRejectedValueOnce(new Error("boom"));

    const { result } = renderHook(() => useJobsList());

    await act(async () => {
      await result.current.loadJobs();
    });

    expect(result.current.error).toBe("求人一覧の取得に失敗しました。");
    expect(result.current.loading).toBe(false);
  });

  it("creates a job and reloads the list", async () => {
    const { result } = renderHook(() => useJobsList());

    act(() => {
      result.current.handleOpenCreateForm();
    });

    await act(async () => {
      await result.current.handleSubmitForm(payload);
    });

    expect(mockedCreateJob).toHaveBeenCalledWith(payload);
    expect(mockedFetchJobs).toHaveBeenCalledTimes(2);
    expect(result.current.formOpen).toBe(false);
    expect(result.current.formError).toBeNull();
  });

  it("updates a selected job from the edit form and reopens the detail drawer", async () => {
    const selectedJob = buildJob({ id: 9, company_name: "編集対象" });
    const updatedJob = buildJob({ id: 9, company_name: "編集対象", status: "offer", score: 88 });
    mockedUpdateJob.mockResolvedValueOnce(updatedJob);

    const { result } = renderHook(() => useJobsList());

    act(() => {
      result.current.openJobPreview(selectedJob);
    });

    act(() => {
      result.current.handleOpenEditForm();
    });

    await act(async () => {
      await result.current.handleSubmitForm(payload);
    });

    expect(mockedUpdateJob).toHaveBeenCalledWith(9, payload);
    expect(result.current.selectedJob?.status).toBe("offer");
    expect(result.current.drawerOpen).toBe(true);
    expect(result.current.formOpen).toBe(false);
  });

  it("surfaces API validation errors from form submit", async () => {
    mockedCreateJob.mockRejectedValueOnce(new ApiError(422, "Company name can't be blank", ["Company name can't be blank"]));

    const { result } = renderHook(() => useJobsList());

    act(() => {
      result.current.handleOpenCreateForm();
    });

    await act(async () => {
      await result.current.handleSubmitForm(payload);
    });

    expect(result.current.formError).toBe("Company name can't be blank");
  });

  it("deletes the selected job and clears the current selection", async () => {
    const selectedJob = buildJob({ id: 11, company_name: "削除対象" });
    const { result } = renderHook(() => useJobsList());

    act(() => {
      result.current.openJobPreview(selectedJob);
      result.current.handleOpenCreateForm();
    });

    await act(async () => {
      await result.current.handleDeleteJob();
    });

    expect(window.confirm).toHaveBeenCalled();
    expect(mockedDeleteJob).toHaveBeenCalledWith(11);
    expect(mockedFetchJobs).toHaveBeenCalledTimes(2);
    expect(result.current.selectedJob).toBeNull();
    expect(result.current.drawerOpen).toBe(false);
    expect(result.current.formOpen).toBe(false);
  });

  it.each([20, 0])("reloads a valid page after deletion leaves %i jobs", async (remainingCount) => {
    let deleted = false;
    const lastJob = buildJob({ id: 21 });
    const remainingJobs = remainingCount === 0 ? [] : response.jobs;
    mockedDeleteJob.mockImplementation(async () => { deleted = true; });
    mockedFetchJobs.mockImplementation(async (params) => ({
      ...response,
      jobs: params?.page === 2 ? (deleted ? [] : [lastJob]) : (deleted ? remainingJobs : response.jobs),
      meta: { ...response.meta, page: params?.page ?? 1, total_count: deleted ? remainingCount : 21 },
    }));

    const { result } = renderHook(() => {
      const list = useJobsList();
      useEffect(() => { void list.loadJobs(); }, [list.loadJobs]);
      return list;
    });
    await waitFor(() => expect(result.current.totalCount).toBe(21));
    act(() => { result.current.handlePageChange(2); });
    await waitFor(() => expect(result.current.jobs).toEqual([lastJob]));
    act(() => { result.current.openJobPreview(lastJob); });

    await act(async () => { await result.current.handleDeleteJob(); });

    await waitFor(() => expect(result.current.page).toBe(1));
    await waitFor(() => expect(result.current.jobs).toEqual(remainingJobs));
    expect(result.current.totalCount).toBe(remainingCount);
    expect(result.current.loading).toBe(false);
  });

  it("exports the current filter params as a CSV download", async () => {
    const { result } = renderHook(() => useJobsList());

    act(() => {
      result.current.handleKeywordChange("Rails");
    });

    await act(async () => {
      await result.current.handleExportCsv();
    });

    expect(mockedDownloadJobsCsv).toHaveBeenCalledWith({
      keyword: "Rails",
      status: [],
      work_style: [],
      sort: "score",
      direction: "desc",
      page: 1,
      per_page: 20,
    });
    expect(window.URL.createObjectURL).toHaveBeenCalledTimes(1);
    expect(window.URL.revokeObjectURL).toHaveBeenCalledWith("blob:jobs");
  });
});
