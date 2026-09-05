import { renderHook, waitFor, act } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { buildJob } from "../test/fixtures";
import type { MasterDataPayload, ScoringPreferencePayload } from "../types/job";
import { useJobsDashboard } from "./useJobsDashboard";
import { useJobsList } from "./useJobsList";
import { useMasterData } from "./useMasterData";
import { useScoringPreference } from "./useScoringPreference";

vi.mock("./useJobsList", () => ({ useJobsList: vi.fn() }));
vi.mock("./useMasterData", () => ({ useMasterData: vi.fn() }));
vi.mock("./useScoringPreference", () => ({ useScoringPreference: vi.fn() }));

const mockedUseJobsList = vi.mocked(useJobsList);
const mockedUseMasterData = vi.mocked(useMasterData);
const mockedUseScoringPreference = vi.mocked(useScoringPreference);

function buildJobsListMock(overrides = {}) {
  return {
    jobs: [buildJob()],
    rankingJobs: [buildJob()],
    selectedJob: buildJob(),
    drawerOpen: false,
    formOpen: false,
    formMode: "create" as const,
    formInitialDraft: null,
    keyword: "",
    statuses: [],
    workStyles: [],
    sort: "score" as const,
    direction: "desc" as const,
    page: 1,
    perPage: 20,
    totalCount: 1,
    loading: false,
    submittingForm: false,
    deletingJob: false,
    statusUpdating: false,
    error: null,
    formError: null,
    summaryItems: [],
    recommendedJobIds: [1],
    loadJobs: vi.fn().mockResolvedValue(undefined),
    refreshSelectedJob: vi.fn().mockResolvedValue(undefined),
    handleKeywordChange: vi.fn(),
    handleStatusesChange: vi.fn(),
    handleWorkStylesChange: vi.fn(),
    handleSortChange: vi.fn(),
    handlePageChange: vi.fn(),
    handlePerPageChange: vi.fn(),
    handleClearFilters: vi.fn(),
    handleRowClick: vi.fn(),
    openJobPreview: vi.fn(),
    handleCloseDrawer: vi.fn(),
    handleOpenCreateForm: vi.fn(),
    handleOpenEditForm: vi.fn(),
    handleCloseForm: vi.fn(),
    handleStatusChange: vi.fn(),
    handleSubmitForm: vi.fn(),
    handleDeleteJob: vi.fn(),
    handleExportCsv: vi.fn(),
    ...overrides,
  };
}

function buildMasterDataMock(overrides = {}) {
  return {
    locations: [],
    positions: [],
    techStacks: [],
    positiveKeywords: [],
    negativeKeywords: [],
    interviewQuestions: [],
    masterDataOpen: false,
    submittingMasterData: false,
    loadError: null,
    masterDataError: null,
    loadMasters: vi.fn().mockResolvedValue(undefined),
    handleOpenMasterData: vi.fn(),
    handleCloseMasterData: vi.fn(),
    handleCreatePosition: vi.fn().mockResolvedValue(true),
    handleUpdatePosition: vi.fn().mockResolvedValue(true),
    handleDeletePosition: vi.fn().mockResolvedValue(true),
    handleCreateLocation: vi.fn().mockResolvedValue(true),
    handleUpdateLocation: vi.fn().mockResolvedValue(true),
    handleDeleteLocation: vi.fn().mockResolvedValue(true),
    handleCreateTechStack: vi.fn().mockResolvedValue(true),
    handleUpdateTechStack: vi.fn().mockResolvedValue(true),
    handleDeleteTechStack: vi.fn().mockResolvedValue(true),
    handleCreatePositiveKeyword: vi.fn().mockResolvedValue(true),
    handleUpdatePositiveKeyword: vi.fn().mockResolvedValue(true),
    handleDeletePositiveKeyword: vi.fn().mockResolvedValue(true),
    handleCreateNegativeKeyword: vi.fn().mockResolvedValue(true),
    handleUpdateNegativeKeyword: vi.fn().mockResolvedValue(true),
    handleDeleteNegativeKeyword: vi.fn().mockResolvedValue(true),
    handleCreateInterviewQuestion: vi.fn().mockResolvedValue(true),
    handleUpdateInterviewQuestion: vi.fn().mockResolvedValue(true),
    handleDeleteInterviewQuestion: vi.fn().mockResolvedValue(true),
    ...overrides,
  };
}

function buildScoringMock(overrides = {}) {
  return {
    scoringPreference: null,
    submittingScoring: false,
    loadError: null,
    scoringError: null,
    loadScoringPreference: vi.fn().mockResolvedValue(undefined),
    clearScoringError: vi.fn(),
    handleSubmitScoring: vi.fn().mockResolvedValue({ id: 1 }),
    ...overrides,
  };
}

afterEach(() => {
  vi.clearAllMocks();
  window.history.replaceState({}, "", "/");
});

describe("useJobsDashboard", () => {
  it("loads jobs on the initial render", async () => {
    const jobsList = buildJobsListMock();

    mockedUseJobsList.mockReturnValue(jobsList);
    mockedUseMasterData.mockReturnValue(buildMasterDataMock());
    mockedUseScoringPreference.mockReturnValue(buildScoringMock());

    renderHook(() => useJobsDashboard());

    await waitFor(() => {
      expect(jobsList.loadJobs).toHaveBeenCalledTimes(1);
    });
  });

  it("reloads jobs and the selected job after a successful master-data create", async () => {
    const payload: MasterDataPayload = { name: "新しい職種", score_weight: 9, active: true, display_order: 3 };
    const jobsList = buildJobsListMock();
    const masterData = buildMasterDataMock();

    mockedUseJobsList.mockReturnValue(jobsList);
    mockedUseMasterData.mockReturnValue(masterData);
    mockedUseScoringPreference.mockReturnValue(buildScoringMock());

    const { result } = renderHook(() => useJobsDashboard());

    await waitFor(() => expect(jobsList.loadJobs).toHaveBeenCalledTimes(1));
    jobsList.loadJobs.mockClear();
    jobsList.refreshSelectedJob.mockClear();

    await act(async () => {
      await result.current.actions.handleCreatePosition(payload);
    });

    expect(masterData.handleCreatePosition).toHaveBeenCalledWith(payload);
    expect(jobsList.loadJobs).toHaveBeenCalledTimes(1);
    expect(jobsList.refreshSelectedJob).toHaveBeenCalledTimes(1);
  });

  it("reloads jobs and the selected job after a successful master-data update", async () => {
    const payload: MasterDataPayload = { name: "大阪", score_weight: 5, active: true, display_order: 1 };
    const jobsList = buildJobsListMock();
    const masterData = buildMasterDataMock();

    mockedUseJobsList.mockReturnValue(jobsList);
    mockedUseMasterData.mockReturnValue(masterData);
    mockedUseScoringPreference.mockReturnValue(buildScoringMock());

    const { result } = renderHook(() => useJobsDashboard());

    await waitFor(() => expect(jobsList.loadJobs).toHaveBeenCalledTimes(1));
    jobsList.loadJobs.mockClear();
    jobsList.refreshSelectedJob.mockClear();

    await act(async () => {
      await result.current.actions.handleUpdateLocation(2, payload);
    });

    expect(masterData.handleUpdateLocation).toHaveBeenCalledWith(2, payload);
    expect(jobsList.loadJobs).toHaveBeenCalledTimes(1);
    expect(jobsList.refreshSelectedJob).toHaveBeenCalledTimes(1);
  });

  it("reloads jobs and the selected job after a successful master-data delete", async () => {
    const jobsList = buildJobsListMock();
    const masterData = buildMasterDataMock();

    mockedUseJobsList.mockReturnValue(jobsList);
    mockedUseMasterData.mockReturnValue(masterData);
    mockedUseScoringPreference.mockReturnValue(buildScoringMock());

    const { result } = renderHook(() => useJobsDashboard());

    await waitFor(() => expect(jobsList.loadJobs).toHaveBeenCalledTimes(1));
    jobsList.loadJobs.mockClear();
    jobsList.refreshSelectedJob.mockClear();

    await act(async () => {
      await result.current.actions.handleDeleteTechStack(3);
    });

    expect(masterData.handleDeleteTechStack).toHaveBeenCalledWith(3);
    expect(jobsList.loadJobs).toHaveBeenCalledTimes(1);
    expect(jobsList.refreshSelectedJob).toHaveBeenCalledTimes(1);
  });

  it("aggregates the top-level error state from jobs, master data, and scoring", () => {
    mockedUseJobsList.mockReturnValue(buildJobsListMock({ error: "求人一覧の取得に失敗しました。" }));
    mockedUseMasterData.mockReturnValue(buildMasterDataMock({ loadError: "マスタデータの取得に失敗しました。" }));
    mockedUseScoringPreference.mockReturnValue(buildScoringMock({ loadError: "スコア設定の取得に失敗しました。" }));

    const { result, rerender } = renderHook(() => useJobsDashboard());

    expect(result.current.errors.global).toBe("求人一覧の取得に失敗しました。");

    mockedUseJobsList.mockReturnValue(buildJobsListMock({ error: null }));
    mockedUseMasterData.mockReturnValue(buildMasterDataMock({ loadError: "マスタデータの取得に失敗しました。" }));
    mockedUseScoringPreference.mockReturnValue(buildScoringMock({ loadError: "スコア設定の取得に失敗しました。" }));
    rerender();

    expect(result.current.errors.global).toBe("マスタデータの取得に失敗しました。");

    mockedUseMasterData.mockReturnValue(buildMasterDataMock({ loadError: null }));
    mockedUseScoringPreference.mockReturnValue(buildScoringMock({ loadError: "スコア設定の取得に失敗しました。" }));
    rerender();

    expect(result.current.errors.global).toBe("スコア設定の取得に失敗しました。");
  });

  it("closes the settings drawer and reloads data after a successful scoring update", async () => {
    const payload: ScoringPreferencePayload = {
      full_remote_weight: 30,
      hybrid_weight: 15,
      onsite_weight: 0,
      high_salary_max_threshold: 8_000_000,
      high_salary_bonus: 10,
      low_salary_min_threshold: 4_000_000,
      low_salary_penalty: -10,
    };
    const jobsList = buildJobsListMock();
    const masterData = buildMasterDataMock();
    const scoring = buildScoringMock();

    mockedUseJobsList.mockReturnValue(jobsList);
    mockedUseMasterData.mockReturnValue(masterData);
    mockedUseScoringPreference.mockReturnValue(scoring);

    const { result } = renderHook(() => useJobsDashboard());

    await waitFor(() => expect(jobsList.loadJobs).toHaveBeenCalledTimes(1));
    jobsList.loadJobs.mockClear();
    jobsList.refreshSelectedJob.mockClear();

    await act(async () => {
      await result.current.actions.handleSubmitScoring(payload);
    });

    expect(scoring.handleSubmitScoring).toHaveBeenCalledWith(payload);
    expect(masterData.handleCloseMasterData).toHaveBeenCalledTimes(1);
    expect(jobsList.loadJobs).toHaveBeenCalledTimes(1);
    expect(jobsList.refreshSelectedJob).toHaveBeenCalledTimes(1);
  });
});
