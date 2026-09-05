import { useCallback, useEffect, useRef, useState } from "react";

import { fetchScoringPreference, getApiErrorMessage, updateScoringPreference } from "../api/jobs";
import { t } from "../i18n";
import type { ScoringPreference, ScoringPreferencePayload } from "../types/job";
import { isAbortError, isRetryableError, retry } from "../utils/retry";

export function useScoringPreference() {
  const [scoringPreference, setScoringPreference] = useState<ScoringPreference | null>(null);
  const [submittingScoring, setSubmittingScoring] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [scoringError, setScoringError] = useState<string | null>(null);
  const loadRequestSequence = useRef(0);
  const loadAbortController = useRef<AbortController | null>(null);

  const cancelLoad = useCallback(() => {
    loadRequestSequence.current += 1;
    loadAbortController.current?.abort();
    loadAbortController.current = null;
  }, []);

  const loadScoringPreference = useCallback(async () => {
    cancelLoad();
    const requestSequence = loadRequestSequence.current;
    const abortController = new AbortController();
    loadAbortController.current = abortController;
    setLoadError(null);

    try {
      const preference = await retry(
        () => fetchScoringPreference({ signal: abortController.signal }),
        { shouldRetry: isRetryableError },
      );
      if (requestSequence !== loadRequestSequence.current || abortController.signal.aborted) return;

      setScoringPreference(preference);
    } catch (error) {
      if (requestSequence !== loadRequestSequence.current || isAbortError(error)) return;

      setLoadError(t("errors.fetch_scoring"));
    } finally {
      if (requestSequence === loadRequestSequence.current) {
        loadAbortController.current = null;
      }
    }
  }, [cancelLoad]);

  useEffect(() => {
    void loadScoringPreference();
    return cancelLoad;
  }, [cancelLoad, loadScoringPreference]);

  const clearScoringError = useCallback(() => {
    setScoringError(null);
  }, []);

  const handleSubmitScoring = useCallback(async (payload: ScoringPreferencePayload) => {
    cancelLoad();
    setSubmittingScoring(true);
    setScoringError(null);

    try {
      const updated = await updateScoringPreference(payload);
      setScoringPreference(updated);
      return updated;
    } catch (error) {
      setScoringError(getApiErrorMessage(error, t("errors.update_scoring")));
      return null;
    } finally {
      setSubmittingScoring(false);
    }
  }, [cancelLoad]);

  return {
    scoringPreference,
    submittingScoring,
    loadError,
    scoringError,
    loadScoringPreference,
    clearScoringError,
    handleSubmitScoring,
  };
}
