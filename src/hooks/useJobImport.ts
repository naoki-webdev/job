import { useCallback, useEffect, useRef, useState } from "react";

import { createJobDraft, getApiErrorMessage } from "../api/jobs";
import { t } from "../i18n";
import type { JobDraftMode, JobDraftResponse, JobFormPayload } from "../types/job";
import { isAbortError } from "../utils/retry";

type AnalyzeImportParams = {
  mode: JobDraftMode;
  text: string;
  url: string;
};

type UseJobImportParams = {
  openCreateForm: (draft: Partial<JobFormPayload>) => void;
};

export function useJobImport({ openCreateForm }: UseJobImportParams) {
  const [importOpen, setImportOpen] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [importResult, setImportResult] = useState<JobDraftResponse | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const analysisRequestSequence = useRef(0);
  const analysisAbortController = useRef<AbortController | null>(null);

  const cancelAnalysis = useCallback(() => {
    analysisRequestSequence.current += 1;
    analysisAbortController.current?.abort();
    analysisAbortController.current = null;
  }, []);

  const handleOpenImport = useCallback(() => {
    cancelAnalysis();
    setImportResult(null);
    setImportError(null);
    setImportOpen(true);
  }, [cancelAnalysis]);

  const handleCloseImport = useCallback(() => {
    cancelAnalysis();
    setImportLoading(false);
    setImportOpen(false);
  }, [cancelAnalysis]);

  const handleAnalyzeImport = useCallback(async ({ mode, text, url }: AnalyzeImportParams) => {
    cancelAnalysis();
    const requestSequence = analysisRequestSequence.current;
    const abortController = new AbortController();
    analysisAbortController.current = abortController;
    setImportLoading(true);
    setImportError(null);

    try {
      const response = await createJobDraft(
        { mode, text, url },
        { signal: abortController.signal },
      );
      if (requestSequence !== analysisRequestSequence.current || abortController.signal.aborted) return;

      setImportResult(response);
    } catch (error) {
      if (requestSequence !== analysisRequestSequence.current || isAbortError(error)) return;

      setImportError(getApiErrorMessage(error, t("errors.import_job")));
    } finally {
      if (requestSequence === analysisRequestSequence.current) {
        analysisAbortController.current = null;
        setImportLoading(false);
      }
    }
  }, [cancelAnalysis]);

  const handleConfirmImport = useCallback(() => {
    if (!importResult) return;

    cancelAnalysis();
    const { draft } = importResult;
    const formDraft: Partial<JobFormPayload> = {
      company_name: draft.company_name ?? undefined,
      salary_min: draft.salary_min ?? undefined,
      salary_max: draft.salary_max ?? undefined,
      work_style: draft.work_style ?? undefined,
      tech_stack_ids: draft.tech_stack_ids,
      location_id: draft.location_id ?? undefined,
      source_url: draft.source_url ?? undefined,
    };

    setImportOpen(false);
    openCreateForm(formDraft);
  }, [cancelAnalysis, importResult, openCreateForm]);

  useEffect(() => cancelAnalysis, [cancelAnalysis]);

  return {
    importOpen,
    importLoading,
    importResult,
    importError,
    handleOpenImport,
    handleCloseImport,
    handleAnalyzeImport,
    handleConfirmImport,
  };
}
