import { Suspense, lazy } from "react";

import Alert from "@mui/material/Alert";
import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";

import { useAuth } from "../auth/AuthContext";
import AiDiagnosisOverview from "../components/AiDiagnosisOverview";
import AppShell from "../components/AppShell";
import DashboardSummary from "../components/DashboardSummary";
import JobFilters from "../components/JobFilters";
import JobListPanel from "../components/JobListPanel";
import JobTable from "../components/JobTable";
import PageLoader from "../components/PageLoader";
import { useJobsDashboard } from "../hooks/useJobsDashboard";

const JobDetailDrawer = lazy(() => import("../components/JobDetailDrawer"));
const JobFormDrawer = lazy(() => import("../components/JobFormDrawer"));
const JobImportDrawer = lazy(() => import("../components/JobImportDrawer"));
const MasterDataDrawer = lazy(() => import("../components/MasterDataDrawer"));

export default function JobsPage() {
  const { user, signOut } = useAuth();
  const readOnly = user?.read_only ?? false;
  const dashboard = useJobsDashboard();
  const { jobs: jobState, filters, masterData, scoring, import: importState, errors, actions } = dashboard;
  const {
    items: jobs,
    ranking: rankingJobs,
    selected: selectedJob,
    drawerOpen,
    formOpen,
    formMode,
    formInitialDraft,
    page,
    perPage,
    totalCount,
    sort,
    direction,
    loading,
    submittingForm,
    deleting: deletingJob,
    statusUpdating,
    summaryItems,
    recommendedIds: recommendedJobIds,
  } = jobState;
  const { locations, positions, techStacks, positiveKeywords, negativeKeywords, interviewQuestions } = masterData;
  const { preference: scoringPreference } = scoring;
  const { open: masterDataOpen, submitting: submittingMasterData, error: masterDataError } = masterData;
  const { submitting: submittingScoring, error: scoringError } = scoring;
  const { open: importOpen, loading: importLoading, result: importResult, error: importError } = importState;
  const { global: error, form: formError } = errors;
  const {
    handleKeywordChange,
    handleStatusesChange,
    handleWorkStylesChange,
    handleSortChange,
    handlePageChange,
    handlePerPageChange,
    handleClearFilters,
    handleRowClick,
    handleCloseDrawer,
    handleOpenCreateForm,
    handleOpenEditForm,
    handleCloseForm,
    handleOpenMasterData,
    handleCloseMasterData,
    handleOpenImport,
    handleCloseImport,
    handleAnalyzeImport,
    handleConfirmImport,
    handleStatusChange,
    handleSubmitForm,
    handleDeleteJob,
    handleSubmitScoring,
    handleCreateLocation,
    handleUpdateLocation,
    handleDeleteLocation,
    handleCreatePosition,
    handleUpdatePosition,
    handleDeletePosition,
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
    handleExportCsv,
  } = actions;
  const { keyword, statuses, workStyles } = filters;

  return (
    <AppShell
      userName={user?.name}
      readOnly={readOnly}
      onCreateJob={handleOpenCreateForm}
      onImportJob={handleOpenImport}
      onOpenSettings={handleOpenMasterData}
              onSignOut={() => {
        void signOut();
      }}
    >
      <Container component="main" maxWidth="xl" sx={{ py: { xs: 1.5, md: 2 } }}>
        <Stack spacing={1.5}>
          <AiDiagnosisOverview
            jobs={rankingJobs}
            scoringPreference={scoringPreference}
            onSelectJob={(jobId) => {
              void handleRowClick(jobId);
            }}
          />

          <DashboardSummary items={summaryItems} />

          {error && <Alert severity="error">{error}</Alert>}

          <JobListPanel
            totalCount={totalCount}
            filters={
              <JobFilters
                keyword={keyword}
                statuses={statuses}
                workStyles={workStyles}
                onKeywordChange={handleKeywordChange}
                onStatusesChange={handleStatusesChange}
                onWorkStylesChange={handleWorkStylesChange}
                onClearFilters={handleClearFilters}
                onExportCsv={handleExportCsv}
              />
            }
          >
            {loading ? (
              <PageLoader />
            ) : (
              <JobTable
                jobs={jobs}
                page={page}
                perPage={perPage}
                totalCount={totalCount}
                sort={sort}
                direction={direction}
                onSortChange={handleSortChange}
                onPageChange={handlePageChange}
                onPerPageChange={handlePerPageChange}
                onRowClick={handleRowClick}
              />
            )}
          </JobListPanel>
        </Stack>

      {drawerOpen && (
        <Suspense fallback={null}>
          <JobDetailDrawer
            open={drawerOpen}
            job={selectedJob}
            recommended={selectedJob ? recommendedJobIds.includes(selectedJob.id) : false}
            scoringPreference={scoringPreference}
            readOnly={readOnly}
            onClose={handleCloseDrawer}
            onStatusChange={handleStatusChange}
            onEdit={handleOpenEditForm}
            onDelete={handleDeleteJob}
            deleting={deletingJob}
            statusUpdating={statusUpdating}
          />
        </Suspense>
      )}

      {formOpen && (
        <Suspense fallback={null}>
          <JobFormDrawer
            open={formOpen}
            mode={formMode}
            initialJob={formMode === "edit" ? selectedJob : null}
            initialDraft={formMode === "create" ? formInitialDraft : null}
            locations={locations}
            positions={positions}
            techStacks={techStacks}
            submitting={submittingForm}
            submitError={formError}
            onClose={handleCloseForm}
            onSubmit={handleSubmitForm}
          />
        </Suspense>
      )}

      {importOpen && (
        <Suspense fallback={null}>
          <JobImportDrawer
            open={importOpen}
            readOnly={readOnly}
            aiEnabled={user?.ai_enabled ?? false}
            result={importResult}
            loading={importLoading}
            error={importError}
            onClose={handleCloseImport}
            onAnalyze={handleAnalyzeImport}
            onConfirm={handleConfirmImport}
          />
        </Suspense>
      )}

      {masterDataOpen && (
        <Suspense fallback={null}>
          <MasterDataDrawer
            open={masterDataOpen}
            locations={locations}
            positions={positions}
            techStacks={techStacks}
            positiveKeywords={positiveKeywords}
            negativeKeywords={negativeKeywords}
            interviewQuestions={interviewQuestions}
            preference={scoringPreference}
            submittingScoring={submittingScoring}
            submittingMasterData={submittingMasterData}
            scoringError={scoringError}
            masterDataError={masterDataError}
            onClose={handleCloseMasterData}
            onSubmitScoring={handleSubmitScoring}
            onCreateLocation={handleCreateLocation}
            onUpdateLocation={handleUpdateLocation}
            onDeleteLocation={handleDeleteLocation}
            onCreatePosition={handleCreatePosition}
            onUpdatePosition={handleUpdatePosition}
            onDeletePosition={handleDeletePosition}
            onCreateTechStack={handleCreateTechStack}
            onUpdateTechStack={handleUpdateTechStack}
            onDeleteTechStack={handleDeleteTechStack}
            onCreatePositiveKeyword={handleCreatePositiveKeyword}
            onUpdatePositiveKeyword={handleUpdatePositiveKeyword}
            onDeletePositiveKeyword={handleDeletePositiveKeyword}
            onCreateNegativeKeyword={handleCreateNegativeKeyword}
            onUpdateNegativeKeyword={handleUpdateNegativeKeyword}
            onDeleteNegativeKeyword={handleDeleteNegativeKeyword}
            onCreateInterviewQuestion={handleCreateInterviewQuestion}
            onUpdateInterviewQuestion={handleUpdateInterviewQuestion}
            onDeleteInterviewQuestion={handleDeleteInterviewQuestion}
          />
        </Suspense>
      )}
      </Container>
    </AppShell>
  );
}
