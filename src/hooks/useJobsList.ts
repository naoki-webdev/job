import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  createJob,
  deleteJob,
  downloadJobsCsv,
  fetchJob,
  fetchJobs,
  getApiErrorMessage,
  updateJob,
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

export function useJobsList() {
  const jobsRequestSequence = useRef(0);
  const jobsAbortController = useRef<AbortController | null>(null);
  const detailRequestSequence = useRef(0);
  const detailAbortController = useRef<AbortController | null>(null);
  const statusRequestSequence = useRef(0);
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
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [summaryCounts, setSummaryCounts] = useState({
    remote_friendly: 0,
    active_pipeline: 0,
    high_score: 0,
  });

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

  const rankingParams = useMemo<JobsListParams>(
    () => ({
      keyword,
      status: statuses,
      work_style: workStyles,
      sort: "score",
      direction: "desc",
      page: 1,
      per_page: 3,
    }),
    [keyword, statuses, workStyles],
  );

  const loadJobs = useCallback(async () => {
    const requestSequence = jobsRequestSequence.current + 1;
    jobsRequestSequence.current = requestSequence;
    jobsAbortController.current?.abort();

    const abortController = new AbortController();
    jobsAbortController.current = abortController;
    setLoading(true);
    setError(null);

    try {
      const [response, rankingResponse] = await Promise.all([
        fetchJobs(listParams, { signal: abortController.signal }),
        fetchJobs(rankingParams, { signal: abortController.signal }),
      ]);

      if (requestSequence !== jobsRequestSequence.current || abortController.signal.aborted) return;

      const lastPage = Math.max(1, Math.ceil(response.meta.total_count / perPage));
      if (page > lastPage) {
        setPage(lastPage);
        return;
      }

      setJobs(response.jobs);
      setRankingJobs(rankingResponse.jobs);
      setRecommendedJobIds(rankingResponse.meta.recommended_job_ids);
      setTotalCount(response.meta.total_count);
      setSummaryCounts(response.meta.summary);
    } catch (loadError) {
      if (requestSequence !== jobsRequestSequence.current || isAbortError(loadError)) return;

      setError(t("errors.fetch_jobs"));
    } finally {
      if (requestSequence === jobsRequestSequence.current) {
        setLoading(false);
      }
    }
  }, [listParams, page, perPage, rankingParams]);

  useEffect(() => {
    return () => {
      jobsRequestSequence.current += 1;
      jobsAbortController.current?.abort();
      detailRequestSequence.current += 1;
      detailAbortController.current?.abort();
    };
  }, []);

  const cancelDetailRequest = useCallback(() => {
    detailRequestSequence.current += 1;
    detailAbortController.current?.abort();
    detailAbortController.current = null;
  }, []);

  const refreshSelectedJob = useCallback(async () => {
    if (!selectedJob) return;

    cancelDetailRequest();
    const requestSequence = detailRequestSequence.current;
    const abortController = new AbortController();
    detailAbortController.current = abortController;

    try {
      const selectedJobId = selectedJob.id;
      const refreshed = await fetchJob(selectedJobId, { signal: abortController.signal });
      if (requestSequence !== detailRequestSequence.current || abortController.signal.aborted) return;

      setSelectedJob(refreshed);
      setJobs((prev) => prev.map((job) => (job.id === refreshed.id ? refreshed : job)));
      setRankingJobs((prev) => prev.map((job) => (job.id === refreshed.id ? refreshed : job)));
    } catch (refreshError) {
      if (requestSequence !== detailRequestSequence.current || isAbortError(refreshError)) return;

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
  }, [cancelDetailRequest]);

  const openJobPreview = useCallback((job: Job) => {
    statusRequestSequence.current += 1;
    setStatusUpdating(false);
    cancelDetailRequest();
    setSelectedJob(job);
    setDrawerOpen(true);
  }, [cancelDetailRequest]);

  const handleCloseDrawer = useCallback(() => {
    statusRequestSequence.current += 1;
    setStatusUpdating(false);
    cancelDetailRequest();
    setDrawerOpen(false);
  }, [cancelDetailRequest]);

  const handleOpenCreateForm = useCallback((draft: Partial<JobFormPayload> | null = null) => {
    setFormMode("create");
    setFormError(null);
    setFormInitialDraft(draft);
    setFormOpen(true);
  }, []);

  const handleOpenEditForm = useCallback(() => {
    if (!selectedJob) return;

    setFormMode("edit");
    setFormError(null);
    setFormInitialDraft(null);
    setDrawerOpen(false);
    setFormOpen(true);
  }, [selectedJob]);

  const handleCloseForm = useCallback(() => {
    setFormOpen(false);
    setFormError(null);
    setFormInitialDraft(null);
  }, []);

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
      await loadJobs();
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
    setSubmittingForm(true);
    setError(null);
    setFormError(null);

    try {
      if (formMode === "create") {
        await createJob(payload);
      } else if (selectedJob) {
        const updated = await updateJob(selectedJob.id, payload);
        setSelectedJob(updated);
        setDrawerOpen(true);
      }

      setFormOpen(false);
      await loadJobs();
    } catch (error) {
      setFormError(getApiErrorMessage(error, t(formMode === "create" ? "errors.create_job" : "errors.update_job")));
    } finally {
      setSubmittingForm(false);
    }
  }, [formMode, loadJobs, selectedJob]);

  const handleDeleteJob = useCallback(async () => {
    if (!selectedJob || !window.confirm(t("jobs.detail.delete_confirm"))) return;

    setDeletingJob(true);
    setError(null);

    try {
      await deleteJob(selectedJob.id);
      setDrawerOpen(false);
      setFormOpen(false);
      setSelectedJob(null);
      await loadJobs();
    } catch (error) {
      setError(getApiErrorMessage(error, t("errors.delete_job")));
    } finally {
      setDeletingJob(false);
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
    handleExportCsv,
  };
}
