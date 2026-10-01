import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  createJob,
  deleteJob,
  downloadJobsCsv,
  analyzeJob,
  fetchJob,
  fetchJobs,
  getApiErrorMessage,
  updateJob,
  waitForJobAnalysis,
} from "../api/jobs";
import { t } from "../i18n";
import type {
  Job,
  JobFormPayload,
  JobSortKey,
  JobStatus,
  JobsListParams,
  SortDirection,
  WorkStyle,
} from "../types/job";
import { isAbortError } from "../utils/retry";

type CachedJobsMetadata = {
  totalCount: number;
  summary: {
    remote_friendly: number;
    active_pipeline: number;
    high_score: number;
  };
  recommendedJobIds: number[];
};

const JOBS_METADATA_CACHE_LIMIT = 40;

function rememberJobsMetadata(cache: Map<string, CachedJobsMetadata>, key: string, value: CachedJobsMetadata) {
  if (!cache.has(key) && cache.size >= JOBS_METADATA_CACHE_LIMIT) {
    const oldestKey = cache.keys().next().value;
    if (oldestKey !== undefined) cache.delete(oldestKey);
  }

  cache.set(key, value);
}

export function useJobsList() {
  const jobsRequestSequence = useRef(0);
  const jobsAbortController = useRef<AbortController | null>(null);
  const detailRequestSequence = useRef(0);
  const detailAbortController = useRef<AbortController | null>(null);
  const deleteRequestSequence = useRef(0);
  const formRequestSequence = useRef(0);
  const statusRequestSequence = useRef(0);
  const analysisRequestSequence = useRef(0);
  const analysisAbortController = useRef<AbortController | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [rankingJobs, setRankingJobs] = useState<Job[]>([]);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [formInitialDraft, setFormInitialDraft] = useState<Partial<JobFormPayload> | null>(null);
  const [keyword, setKeyword] = useState("");
  const [statuses, setStatuses] = useState<JobStatus[]>([]);
  const [workStyles, setWorkStyles] = useState<WorkStyle[]>([]);
  const [sort, setSort] = useState<JobSortKey>("score");
  const [direction, setDirection] = useState<SortDirection>("desc");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);
  const [recommendedJobIds, setRecommendedJobIds] = useState<number[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [submittingForm, setSubmittingForm] = useState(false);
  const [deletingJob, setDeletingJob] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [analyzingJob, setAnalyzingJob] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [summaryCounts, setSummaryCounts] = useState({
    remote_friendly: 0,
    active_pipeline: 0,
    high_score: 0,
  });
  const selectedJobRef = useRef<Job | null>(null);
  const rankingJobsRef = useRef<Job[]>([]);
  const rankingFiltersKey = JSON.stringify({
    keyword: keyword.trim(),
    statuses: [...statuses].sort(),
    workStyles: [...workStyles].sort(),
  });
  const rankingFiltersKeyRef = useRef(rankingFiltersKey);
  const cachedRankingFiltersKey = useRef<string | null>(null);
  const jobsMetadataByFilters = useRef(new Map<string, CachedJobsMetadata>());
  selectedJobRef.current = selectedJob;
  rankingFiltersKeyRef.current = rankingFiltersKey;

  const listParams = useMemo<JobsListParams>(
    () => ({
      keyword,
      status: statuses,
      work_style: workStyles,
      sort,
      direction,
      page,
      per_page: perPage,
    }),
    [direction, keyword, page, perPage, sort, statuses, workStyles],
  );

  const listParamsRef = useRef(listParams);
  const rankingParamsRef = useRef<JobsListParams>({
    keyword,
    status: statuses,
    work_style: workStyles,
    sort: "score",
    direction: "desc",
    page: 1,
    per_page: 3,
  });
  listParamsRef.current = listParams;
  rankingParamsRef.current = {
    keyword,
    status: statuses,
    work_style: workStyles,
    sort: "score",
    direction: "desc",
    page: 1,
    per_page: 3,
  };

  const loadJobs = useCallback(async (refreshRanking = false) => {
    const currentListParams = listParamsRef.current;
    const currentRankingParams = rankingParamsRef.current;
    const currentRankingFiltersKey = rankingFiltersKeyRef.current;
    if (refreshRanking) jobsMetadataByFilters.current.clear();
    const cachedMetadata = jobsMetadataByFilters.current.get(currentRankingFiltersKey) ?? null;
    const includeMetadata = refreshRanking || cachedMetadata === null;
    const listContainsRanking = currentListParams.sort === "score" &&
      currentListParams.direction === "desc" &&
      currentListParams.page === 1 &&
      (currentListParams.per_page ?? 20) >= 3;
    const shouldFetchRanking = !listContainsRanking &&
      (refreshRanking || cachedRankingFiltersKey.current !== currentRankingFiltersKey);
    const requestSequence = jobsRequestSequence.current + 1;
    jobsRequestSequence.current = requestSequence;
    jobsAbortController.current?.abort();

    const abortController = new AbortController();
    jobsAbortController.current = abortController;
    setLoading(true);
    setError(null);

    try {
      const [response, rankingResponse] = await Promise.all([
        fetchJobs({ ...currentListParams, include_metadata: includeMetadata }, { signal: abortController.signal }),
        shouldFetchRanking
          ? fetchJobs({ ...currentRankingParams, include_metadata: false }, { signal: abortController.signal })
          : Promise.resolve(null),
      ]);

      if (requestSequence !== jobsRequestSequence.current || abortController.signal.aborted) return;

      const responseMetadata = response.meta.total_count !== undefined &&
        response.meta.summary !== undefined &&
        response.meta.recommended_job_ids !== undefined
        ? {
            totalCount: response.meta.total_count,
            summary: response.meta.summary,
            recommendedJobIds: response.meta.recommended_job_ids,
          }
        : cachedMetadata;
      if (!responseMetadata) throw new Error("Jobs metadata was not returned.");
      rememberJobsMetadata(jobsMetadataByFilters.current, currentRankingFiltersKey, responseMetadata);

      const currentPage = currentListParams.page ?? 1;
      const currentPerPage = currentListParams.per_page ?? 20;
      const lastPage = Math.max(1, Math.ceil(responseMetadata.totalCount / currentPerPage));
      if (currentPage > lastPage) {
        setPage(lastPage);
        return;
      }

      const nextRankingJobs = response.ranking_jobs ?? (
        listContainsRanking
          ? response.jobs.slice(0, 3)
          : rankingResponse?.jobs ?? rankingJobsRef.current
      );
      if (listContainsRanking || rankingResponse) {
        rankingJobsRef.current = nextRankingJobs;
        cachedRankingFiltersKey.current = currentRankingFiltersKey;
      }
      setJobs(response.jobs);
      setRankingJobs(nextRankingJobs);
      setRecommendedJobIds(responseMetadata.recommendedJobIds);
      setTotalCount(responseMetadata.totalCount);
      setSummaryCounts(responseMetadata.summary);
    } catch (loadError) {
      if (requestSequence !== jobsRequestSequence.current || isAbortError(loadError)) return;

      setError(t("errors.fetch_jobs"));
    } finally {
      if (requestSequence === jobsRequestSequence.current) {
        setLoading(false);
      }
    }
  }, [cachedRankingFiltersKey, listParams]);

  useEffect(() => {
    return () => {
      jobsRequestSequence.current += 1;
      jobsAbortController.current?.abort();
      detailRequestSequence.current += 1;
      detailAbortController.current?.abort();
      statusRequestSequence.current += 1;
      analysisRequestSequence.current += 1;
      analysisAbortController.current?.abort();
      deleteRequestSequence.current += 1;
      formRequestSequence.current += 1;
    };
  }, []);

  const cancelDetailRequest = useCallback(() => {
    detailRequestSequence.current += 1;
    detailAbortController.current?.abort();
    detailAbortController.current = null;
    analysisRequestSequence.current += 1;
    analysisAbortController.current?.abort();
    analysisAbortController.current = null;
    setAnalyzingJob(false);
  }, []);

  const invalidateDeleteRequest = useCallback(() => {
    deleteRequestSequence.current += 1;
    setDeletingJob(false);
  }, []);

  const invalidateFormRequest = useCallback(() => {
    formRequestSequence.current += 1;
    setSubmittingForm(false);
    setFormOpen(false);
    setFormError(null);
    setFormInitialDraft(null);
  }, []);

  const refreshSelectedJob = useCallback(async () => {
    if (!selectedJob) return;
    const selectedJobId = selectedJob.id;
    if (selectedJobRef.current?.id !== selectedJobId) return;

    cancelDetailRequest();
    const requestSequence = detailRequestSequence.current;
    const abortController = new AbortController();
    detailAbortController.current = abortController;

    try {
      const refreshed = await fetchJob(selectedJobId, { signal: abortController.signal });
      if (requestSequence !== detailRequestSequence.current || abortController.signal.aborted || selectedJobRef.current?.id !== selectedJobId) return;

      setSelectedJob(refreshed);
      setJobs((prev) => prev.map((job) => (job.id === refreshed.id ? refreshed : job)));
      setRankingJobs((prev) => prev.map((job) => (job.id === refreshed.id ? refreshed : job)));
    } catch (refreshError) {
      if (requestSequence !== detailRequestSequence.current || isAbortError(refreshError) || selectedJobRef.current?.id !== selectedJob.id) return;

      setError(t("errors.fetch_job_detail"));
    } finally {
      if (requestSequence === detailRequestSequence.current) {
        detailAbortController.current = null;
      }
    }
  }, [cancelDetailRequest, selectedJob]);

  const handleKeywordChange = useCallback((value: string) => {
    setPage(1);
    setKeyword(value);
  }, []);

  const handleStatusesChange = useCallback((values: JobStatus[]) => {
    setPage(1);
    setStatuses(values);
  }, []);

  const handleWorkStylesChange = useCallback((values: WorkStyle[]) => {
    setPage(1);
    setWorkStyles(values);
  }, []);

  const handleSortChange = useCallback((nextSort: JobSortKey, nextDirection: SortDirection) => {
    setSort(nextSort);
    setDirection(nextDirection);
    setPage(1);
  }, []);

  const handlePageChange = useCallback((nextPage: number) => {
    setPage(nextPage);
  }, []);

  const handlePerPageChange = useCallback((value: number) => {
    setPerPage(value);
    setPage(1);
  }, []);

  const handleClearFilters = useCallback(() => {
    setKeyword("");
    setStatuses([]);
    setWorkStyles([]);
    setPage(1);
  }, []);

  const handleRowClick = useCallback(async (jobId: number) => {
    invalidateDeleteRequest();
    invalidateFormRequest();
    statusRequestSequence.current += 1;
    setStatusUpdating(false);
    cancelDetailRequest();
    const requestSequence = detailRequestSequence.current;
    const abortController = new AbortController();
    detailAbortController.current = abortController;

    try {
      const job = await fetchJob(jobId, { signal: abortController.signal });

      if (requestSequence !== detailRequestSequence.current || abortController.signal.aborted) return;

      setSelectedJob(job);
      setDrawerOpen(true);
    } catch (detailError) {
      if (requestSequence !== detailRequestSequence.current || isAbortError(detailError)) return;

      setError(t("errors.fetch_job_detail"));
    } finally {
      if (requestSequence === detailRequestSequence.current) {
        detailAbortController.current = null;
      }
    }
  }, [invalidateDeleteRequest, invalidateFormRequest, cancelDetailRequest]);

  const openJobPreview = useCallback((job: Job) => {
    invalidateDeleteRequest();
    invalidateFormRequest();
    statusRequestSequence.current += 1;
    setStatusUpdating(false);
    cancelDetailRequest();
    setSelectedJob(job);
    setDrawerOpen(true);
  }, [invalidateDeleteRequest, invalidateFormRequest, cancelDetailRequest]);

  const handleCloseDrawer = useCallback(() => {
    invalidateDeleteRequest();
    invalidateFormRequest();
    statusRequestSequence.current += 1;
    setStatusUpdating(false);
    cancelDetailRequest();
    setDrawerOpen(false);
  }, [invalidateDeleteRequest, invalidateFormRequest, cancelDetailRequest]);

  const handleOpenCreateForm = useCallback((draft: Partial<JobFormPayload> | null = null) => {
    invalidateDeleteRequest();
    invalidateFormRequest();
    setFormMode("create");
    setFormError(null);
    setFormInitialDraft(draft);
    setFormOpen(true);
  }, [invalidateDeleteRequest, invalidateFormRequest]);

  const handleOpenEditForm = useCallback(() => {
    if (!selectedJob) return;

    invalidateDeleteRequest();
    invalidateFormRequest();
    cancelDetailRequest();
    setFormMode("edit");
    setFormError(null);
    setFormInitialDraft(null);
    setDrawerOpen(false);
    setFormOpen(true);
  }, [invalidateDeleteRequest, cancelDetailRequest, invalidateFormRequest, selectedJob]);

  const handleCloseForm = useCallback(() => {
    invalidateFormRequest();
    setFormOpen(false);
    setFormError(null);
    setFormInitialDraft(null);
  }, [invalidateFormRequest]);

  const handleStatusChange = useCallback(async (status: JobStatus) => {
    setError(null);

    if (!selectedJob) return;

    const jobId = selectedJob.id;
    const requestSequence = statusRequestSequence.current + 1;
    statusRequestSequence.current = requestSequence;
    setStatusUpdating(true);

    try {
      const updated = await updateJob(jobId, { status });
      if (requestSequence !== statusRequestSequence.current || selectedJob?.id !== jobId) return;

      setSelectedJob(updated);
      await loadJobs(true);
    } catch (error) {
      if (requestSequence !== statusRequestSequence.current) return;

      setError(getApiErrorMessage(error, t("errors.update_status")));
    } finally {
      if (requestSequence === statusRequestSequence.current) {
        setStatusUpdating(false);
      }
    }
  }, [loadJobs, selectedJob]);

  const handleSubmitForm = useCallback(async (payload: JobFormPayload) => {
    cancelDetailRequest();
    statusRequestSequence.current += 1;
    setStatusUpdating(false);
    const requestSequence = ++formRequestSequence.current;
    const editingJobId = selectedJob?.id;
    setSubmittingForm(true);
    setError(null);
    setFormError(null);

    try {
      if (formMode === "create") {
        await createJob(payload);
      } else if (editingJobId) {
        const updated = await updateJob(editingJobId, payload);
        if (requestSequence === formRequestSequence.current) {
          setSelectedJob(updated);
          setDrawerOpen(true);
        }
      }

      if (requestSequence === formRequestSequence.current) setFormOpen(false);
      await loadJobs(true);
    } catch (error) {
      if (requestSequence === formRequestSequence.current) {
        setFormError(getApiErrorMessage(error, t(formMode === "create" ? "errors.create_job" : "errors.update_job")));
      }
    } finally {
      if (requestSequence === formRequestSequence.current) setSubmittingForm(false);
    }
  }, [cancelDetailRequest, formMode, loadJobs, selectedJob]);

  const handleDeleteJob = useCallback(async () => {
    if (!selectedJob || !window.confirm(t("jobs.detail.delete_confirm"))) return;

    const jobId = selectedJob.id;
    const requestSequence = ++deleteRequestSequence.current;
    statusRequestSequence.current += 1;
    invalidateFormRequest();
    cancelDetailRequest();
    setDeletingJob(true);
    setError(null);

    try {
      await deleteJob(jobId);
      if (requestSequence === deleteRequestSequence.current && selectedJob?.id === jobId) {
        setDrawerOpen(false);
        setFormOpen(false);
        setSelectedJob(null);
      }
      await loadJobs(true);
    } catch (error) {
      if (requestSequence === deleteRequestSequence.current && selectedJob?.id === jobId) {
        setError(getApiErrorMessage(error, t("errors.delete_job")));
      }
    } finally {
      if (requestSequence === deleteRequestSequence.current) {
        setDeletingJob(false);
      }
    }
  }, [cancelDetailRequest, invalidateFormRequest, loadJobs, selectedJob]);

  const handleAnalyzeJob = useCallback(async () => {
    if (!selectedJob) return;

    const jobId = selectedJob.id;
    const requestSequence = ++analysisRequestSequence.current;
    analysisAbortController.current?.abort();
    const abortController = new AbortController();
    analysisAbortController.current = abortController;
    setAnalyzingJob(true);
    setError(null);

    try {
      let analyzed = await analyzeJob(jobId, { signal: abortController.signal });
      if (requestSequence !== analysisRequestSequence.current) return;

      setSelectedJob(analyzed);
      setJobs((prev) => prev.map((job) => (job.id === jobId ? analyzed : job)));
      setRankingJobs((prev) => prev.map((job) => (job.id === jobId ? analyzed : job)));

      if (analyzed.ai_analysis_status === "queued" || analyzed.ai_analysis_status === "running") {
        analyzed = await waitForJobAnalysis(jobId, { signal: abortController.signal });
      }
      if (requestSequence !== analysisRequestSequence.current) return;

      if (analyzed.ai_analysis_status === "queued" || analyzed.ai_analysis_status === "running") {
        throw new Error(t("errors.analyze_job"));
      }

      if (analyzed.ai_analysis_status === "failed") {
        setSelectedJob(analyzed);
        throw new Error(t("errors.analyze_job"));
      }

      setSelectedJob(analyzed);
      setJobs((prev) => prev.map((job) => (job.id === jobId ? analyzed : job)));
      setRankingJobs((prev) => prev.map((job) => (job.id === jobId ? analyzed : job)));
      await loadJobs();
    } catch (error) {
      if (requestSequence !== analysisRequestSequence.current) return;
      setError(getApiErrorMessage(error, t("errors.analyze_job")));
    } finally {
      if (requestSequence === analysisRequestSequence.current) setAnalyzingJob(false);
      if (requestSequence === analysisRequestSequence.current) analysisAbortController.current = null;
    }
  }, [loadJobs, selectedJob]);

  const handleExportCsv = useCallback(async () => {
    setError(null);

    try {
      const { blob, filename } = await downloadJobsCsv(listParams);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      setError(getApiErrorMessage(error, t("errors.export_csv")));
    }
  }, [listParams]);

  const summaryItems = useMemo(
    () => [
      {
        key: "total" as const,
        value: totalCount,
        caption: t("summary.total_caption"),
      },
      {
        key: "remote_friendly" as const,
        value: summaryCounts.remote_friendly,
        caption: t("summary.remote_friendly_caption"),
      },
      {
        key: "active_pipeline" as const,
        value: summaryCounts.active_pipeline,
        caption: t("summary.active_pipeline_caption"),
      },
      {
        key: "high_score" as const,
        value: summaryCounts.high_score,
        caption: t("summary.high_score_caption"),
      },
    ],
    [summaryCounts.active_pipeline, summaryCounts.high_score, summaryCounts.remote_friendly, totalCount],
  );

  return {
    jobs,
    rankingJobs,
    selectedJob,
    drawerOpen,
    formOpen,
    formMode,
    formInitialDraft,
    keyword,
    statuses,
    workStyles,
    sort,
    direction,
    page,
    perPage,
    totalCount,
    loading,
    submittingForm,
    deletingJob,
    statusUpdating,
    analyzingJob,
    error,
    formError,
    summaryItems,
    recommendedJobIds,
    loadJobs,
    refreshSelectedJob,
    handleKeywordChange,
    handleStatusesChange,
    handleWorkStylesChange,
    handleSortChange,
    handlePageChange,
    handlePerPageChange,
    handleClearFilters,
    handleRowClick,
    openJobPreview,
    handleCloseDrawer,
    handleOpenCreateForm,
    handleOpenEditForm,
    handleCloseForm,
    handleStatusChange,
    handleSubmitForm,
    handleDeleteJob,
    handleAnalyzeJob,
    handleExportCsv,
  };
}
