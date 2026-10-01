import { useCallback, useEffect, useState } from "react";

import type {
  EvaluationKeywordPayload,
  InterviewQuestionPayload,
  MasterDataPayload,
  ScoringPreferencePayload,
} from "../types/job";
import { useJobImport } from "./useJobImport";
import { useJobsList } from "./useJobsList";
import { useMasterData } from "./useMasterData";
import { useScoringPreference } from "./useScoringPreference";

export function useJobsDashboard() {
  const jobsList = useJobsList();
  const masterData = useMasterData();
  const scoring = useScoringPreference();
  const handleOpenCreateForm = useCallback((draft: Parameters<typeof jobsList.handleOpenCreateForm>[0] = null) => {
    void masterData.loadFormMasters();
    jobsList.handleOpenCreateForm(draft);
  }, [jobsList.handleOpenCreateForm, masterData.loadFormMasters]);
  const handleOpenEditForm = useCallback(() => {
    void masterData.loadFormMasters();
    jobsList.handleOpenEditForm();
  }, [jobsList.handleOpenEditForm, masterData.loadFormMasters]);
  const jobImport = useJobImport({ openCreateForm: handleOpenCreateForm });
  const [demoStateApplied, setDemoStateApplied] = useState(false);
  const {
    jobs,
    loading,
    loadJobs,
    refreshSelectedJob,
    handleRowClick,
  } = jobsList;
  const {
    handleOpenMasterData: openMasterData,
    handleCloseMasterData: closeMasterData,
    handleCreatePosition: createPosition,
    handleUpdatePosition: updatePosition,
    handleDeletePosition: deletePosition,
    handleCreateLocation: createLocation,
    handleUpdateLocation: updateLocation,
    handleDeleteLocation: deleteLocation,
    handleCreateTechStack: createTechStack,
    handleUpdateTechStack: updateTechStack,
    handleDeleteTechStack: deleteTechStack,
    handleCreatePositiveKeyword: createPositiveKeyword,
    handleUpdatePositiveKeyword: updatePositiveKeyword,
    handleDeletePositiveKeyword: deletePositiveKeyword,
    handleCreateNegativeKeyword: createNegativeKeyword,
    handleUpdateNegativeKeyword: updateNegativeKeyword,
    handleDeleteNegativeKeyword: deleteNegativeKeyword,
    handleCreateInterviewQuestion: createInterviewQuestion,
    handleUpdateInterviewQuestion: updateInterviewQuestion,
    handleDeleteInterviewQuestion: deleteInterviewQuestion,
  } = masterData;
  const { clearScoringError, handleSubmitScoring: submitScoring } = scoring;

  const handleOpenMasterData = useCallback(() => {
    clearScoringError();
    void masterData.loadMasters();
    void scoring.loadScoringPreference();
    openMasterData();
  }, [clearScoringError, masterData.loadMasters, openMasterData, scoring.loadScoringPreference]);

  useEffect(() => {
    void loadJobs();
  }, [loadJobs]);

  useEffect(() => {
    if (demoStateApplied || loading) return;

    const demoState = new URLSearchParams(window.location.search).get("demo");
    if (!demoState) return;

    if (demoState === "form") {
      handleOpenCreateForm();
      setDemoStateApplied(true);
      return;
    }

    if (demoState === "settings") {
      handleOpenMasterData();
      setDemoStateApplied(true);
      return;
    }

    if (demoState === "detail" && jobs[0]) {
      void handleRowClick(jobs[0].id);
      setDemoStateApplied(true);
    }
  }, [demoStateApplied, handleOpenCreateForm, handleOpenMasterData, handleRowClick, jobs, loading]);

  const reloadJobsAndSelection = useCallback(async () => {
    await loadJobs(true);
    await refreshSelectedJob();
  }, [loadJobs, refreshSelectedJob]);

  const handleCloseMasterData = useCallback(() => {
    clearScoringError();
    closeMasterData();
  }, [clearScoringError, closeMasterData]);

  const handleSubmitScoring = useCallback(async (payload: ScoringPreferencePayload) => {
    const updated = await submitScoring(payload);
    if (!updated) return;

    closeMasterData();
    await reloadJobsAndSelection();
  }, [closeMasterData, reloadJobsAndSelection, submitScoring]);

  const withMasterDataRefresh = useCallback(
    async (action: () => Promise<boolean>) => {
      const updated = await action();
      if (!updated) return;

      await reloadJobsAndSelection();
    },
    [reloadJobsAndSelection],
  );

  const handleCreatePosition = useCallback(async (payload: MasterDataPayload) => {
    await withMasterDataRefresh(() => createPosition(payload));
  }, [createPosition, withMasterDataRefresh]);

  const handleUpdatePosition = useCallback(async (id: number, payload: MasterDataPayload) => {
    await withMasterDataRefresh(() => updatePosition(id, payload));
  }, [updatePosition, withMasterDataRefresh]);

  const handleDeletePosition = useCallback(async (id: number) => {
    await withMasterDataRefresh(() => deletePosition(id));
  }, [deletePosition, withMasterDataRefresh]);

  const handleCreateLocation = useCallback(async (payload: MasterDataPayload) => {
    await withMasterDataRefresh(() => createLocation(payload));
  }, [createLocation, withMasterDataRefresh]);

  const handleUpdateLocation = useCallback(async (id: number, payload: MasterDataPayload) => {
    await withMasterDataRefresh(() => updateLocation(id, payload));
  }, [updateLocation, withMasterDataRefresh]);

  const handleDeleteLocation = useCallback(async (id: number) => {
    await withMasterDataRefresh(() => deleteLocation(id));
  }, [deleteLocation, withMasterDataRefresh]);

  const handleCreateTechStack = useCallback(async (payload: MasterDataPayload) => {
    await withMasterDataRefresh(() => createTechStack(payload));
  }, [createTechStack, withMasterDataRefresh]);

  const handleUpdateTechStack = useCallback(async (id: number, payload: MasterDataPayload) => {
    await withMasterDataRefresh(() => updateTechStack(id, payload));
  }, [updateTechStack, withMasterDataRefresh]);

  const handleDeleteTechStack = useCallback(async (id: number) => {
    await withMasterDataRefresh(() => deleteTechStack(id));
  }, [deleteTechStack, withMasterDataRefresh]);

  const handleCreatePositiveKeyword = useCallback(async (payload: EvaluationKeywordPayload) => {
    await withMasterDataRefresh(() => createPositiveKeyword(payload));
  }, [createPositiveKeyword, withMasterDataRefresh]);

  const handleUpdatePositiveKeyword = useCallback(async (id: number, payload: EvaluationKeywordPayload) => {
    await withMasterDataRefresh(() => updatePositiveKeyword(id, payload));
  }, [updatePositiveKeyword, withMasterDataRefresh]);

  const handleDeletePositiveKeyword = useCallback(async (id: number) => {
    await withMasterDataRefresh(() => deletePositiveKeyword(id));
  }, [deletePositiveKeyword, withMasterDataRefresh]);

  const handleCreateNegativeKeyword = useCallback(async (payload: EvaluationKeywordPayload) => {
    await withMasterDataRefresh(() => createNegativeKeyword(payload));
  }, [createNegativeKeyword, withMasterDataRefresh]);

  const handleUpdateNegativeKeyword = useCallback(async (id: number, payload: EvaluationKeywordPayload) => {
    await withMasterDataRefresh(() => updateNegativeKeyword(id, payload));
  }, [updateNegativeKeyword, withMasterDataRefresh]);

  const handleDeleteNegativeKeyword = useCallback(async (id: number) => {
    await withMasterDataRefresh(() => deleteNegativeKeyword(id));
  }, [deleteNegativeKeyword, withMasterDataRefresh]);

  const handleCreateInterviewQuestion = useCallback(async (payload: InterviewQuestionPayload) => {
    await withMasterDataRefresh(() => createInterviewQuestion(payload));
  }, [createInterviewQuestion, withMasterDataRefresh]);

  const handleUpdateInterviewQuestion = useCallback(async (id: number, payload: InterviewQuestionPayload) => {
    await withMasterDataRefresh(() => updateInterviewQuestion(id, payload));
  }, [updateInterviewQuestion, withMasterDataRefresh]);

  const handleDeleteInterviewQuestion = useCallback(async (id: number) => {
    await withMasterDataRefresh(() => deleteInterviewQuestion(id));
  }, [deleteInterviewQuestion, withMasterDataRefresh]);

  const error = jobsList.error ?? masterData.loadError ?? scoring.loadError;

  return {
    jobs: {
      items: jobsList.jobs,
      ranking: jobsList.rankingJobs,
      selected: jobsList.selectedJob,
      drawerOpen: jobsList.drawerOpen,
      formOpen: jobsList.formOpen,
      formMode: jobsList.formMode,
      formInitialDraft: jobsList.formInitialDraft,
      page: jobsList.page,
      perPage: jobsList.perPage,
      totalCount: jobsList.totalCount,
      sort: jobsList.sort,
      direction: jobsList.direction,
      loading: jobsList.loading,
      submittingForm: jobsList.submittingForm,
      deleting: jobsList.deletingJob,
      statusUpdating: jobsList.statusUpdating,
      analyzing: jobsList.analyzingJob ?? false,
      summaryItems: jobsList.summaryItems,
      recommendedIds: jobsList.recommendedJobIds,
    },
    filters: {
      keyword: jobsList.keyword,
      statuses: jobsList.statuses,
      workStyles: jobsList.workStyles,
    },
    masterData: {
      locations: masterData.locations,
      positions: masterData.positions,
      techStacks: masterData.techStacks,
      positiveKeywords: masterData.positiveKeywords,
      negativeKeywords: masterData.negativeKeywords,
      interviewQuestions: masterData.interviewQuestions,
      open: masterData.masterDataOpen,
      loading: masterData.loadingMasters,
      loadingForm: masterData.loadingFormMasters,
      submitting: masterData.submittingMasterData,
      error: masterData.masterDataError,
    },
    scoring: {
      preference: scoring.scoringPreference,
      loading: scoring.loadingScoringPreference,
      submitting: scoring.submittingScoring,
      error: scoring.scoringError,
    },
    import: {
      open: jobImport.importOpen,
      loading: jobImport.importLoading,
      result: jobImport.importResult,
      error: jobImport.importError,
    },
    errors: {
      global: error,
      form: jobsList.formError,
      scoring: scoring.scoringError,
      masterData: masterData.masterDataError,
    },
    actions: {
      handleKeywordChange: jobsList.handleKeywordChange,
      handleStatusesChange: jobsList.handleStatusesChange,
      handleWorkStylesChange: jobsList.handleWorkStylesChange,
      handleSortChange: jobsList.handleSortChange,
      handlePageChange: jobsList.handlePageChange,
      handlePerPageChange: jobsList.handlePerPageChange,
      handleClearFilters: jobsList.handleClearFilters,
      handleRowClick: jobsList.handleRowClick,
      handleCloseDrawer: jobsList.handleCloseDrawer,
      handleOpenCreateForm,
      handleOpenEditForm,
      handleCloseForm: jobsList.handleCloseForm,
      handleOpenImport: jobImport.handleOpenImport,
      handleCloseImport: jobImport.handleCloseImport,
      handleAnalyzeImport: jobImport.handleAnalyzeImport,
      handleConfirmImport: jobImport.handleConfirmImport,
      handleOpenMasterData,
      handleCloseMasterData,
      handleStatusChange: jobsList.handleStatusChange,
      handleSubmitForm: jobsList.handleSubmitForm,
      handleDeleteJob: jobsList.handleDeleteJob,
      handleAnalyzeJob: jobsList.handleAnalyzeJob ?? (async () => {}),
      handleSubmitScoring,
      handleCreatePosition,
      handleUpdatePosition,
      handleDeletePosition,
      handleCreateLocation,
      handleUpdateLocation,
      handleDeleteLocation,
      handleCreateTechStack,
      handleUpdateTechStack,
      handleDeleteTechStack,
      handleCreatePositiveKeyword,
      handleUpdatePositiveKeyword,
      handleDeletePositiveKeyword,
      handleCreateNegativeKeyword,
      handleUpdateNegativeKeyword,
      handleDeleteNegativeKeyword,
      handleCreateInterviewQuestion,
      handleUpdateInterviewQuestion,
      handleDeleteInterviewQuestion,
      handleExportCsv: jobsList.handleExportCsv,
    },
  };
}
