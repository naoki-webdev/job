import { useCallback, useEffect, useRef, useState } from "react";

import { fetchScoringPreference, getApiErrorMessage, updateScoringPreference } from "../api/jobs";
import { t } from "../i18n";
import type { ScoringPreference, ScoringPreferencePayload } from "../types/job";
import { isAbortError, isRetryableError, retry } from "../utils/retry";

export function useScoringPreference() {
  const [scoringPreference, setScoringPreference] = useState<ScoringPreference | null>(null);
  const [loadingScoringPreference, setLoadingScoringPreference] = useState(false);
  const [submittingScoring, setSubmittingScoring] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [scoringError, setScoringError] = useState<string | null>(null);
  const loadRequestSequence = useRef(0);
  const loadAbortController = useRef<AbortController | null>(null);
  const preferenceLoaded = useRef(false);
  const loadPromise = useRef<Promise<void> | null>(null);

  const cancelLoad = useCallback(() => {
    loadRequestSequence.current += 1;
    loadAbortController.current?.abort();
    loadAbortController.current = null;
  }, []);

  const loadScoringPreference = useCallback(async (force = false) => {
    if (preferenceLoaded.current && !force) return;
    if (loadPromise.current && !force) return loadPromise.current;

    cancelLoad();
    const requestSequence = loadRequestSequence.current;
    const abortController = new AbortController();
    loadAbortController.current = abortController;
    setLoadError(null);
    setLoadingScoringPreference(true);

    const currentLoad = (async () => {
      try {
        const preference = await retry(
          () => fetchScoringPreference({ signal: abortController.signal }),
          { shouldRetry: isRetryableError },
        );
        if (requestSequence !== loadRequestSequence.current || abortController.signal.aborted) return;

        setScoringPreference(preference);
        preferenceLoaded.current = true;
      } catch (error) {
        if (requestSequence !== loadRequestSequence.current || isAbortError(error)) return;

        setLoadError(t("errors.fetch_scoring"));
      } finally {
        if (requestSequence === loadRequestSequence.current) {
          loadAbortController.current = null;
          loadPromise.current = null;
          setLoadingScoringPreference(false);
        }
      }
    })();
    loadPromise.current = currentLoad;
    return currentLoad;
  }, [cancelLoad]);

  useEffect(() => {
    return cancelLoad;
  }, [cancelLoad]);

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
      preferenceLoaded.current = true;
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
    loadingScoringPreference,
    submittingScoring,
    loadError,
    scoringError,
    loadScoringPreference,
    clearScoringError,
    handleSubmitScoring,
  };
}
