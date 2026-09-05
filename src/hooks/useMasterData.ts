import { useCallback, useEffect, useRef, useState } from "react";

import {
  createInterviewQuestion,
  createLocation,
  createNegativeKeyword,
  createPositiveKeyword,
  createPosition,
  createTechStack,
  deleteInterviewQuestion,
  deleteLocation,
  deleteNegativeKeyword,
  deletePositiveKeyword,
  deletePosition,
  deleteTechStack,
  fetchInterviewQuestions,
  fetchLocations,
  fetchNegativeKeywords,
  fetchPositiveKeywords,
  fetchPositions,
  fetchTechStacks,
  getApiErrorMessage,
  updateInterviewQuestion,
  updateLocation,
  updateNegativeKeyword,
  updatePositiveKeyword,
  updatePosition,
  updateTechStack,
} from "../api/jobs";
import { t } from "../i18n";
import type {
  EvaluationKeywordItem,
  EvaluationKeywordPayload,
  InterviewQuestionItem,
  InterviewQuestionPayload,
  MasterDataItem,
  MasterDataPayload,
} from "../types/job";
import { isAbortError, isRetryableError, retry } from "../utils/retry";

export function useMasterData() {
  const [locations, setLocations] = useState<MasterDataItem[]>([]);
  const [positions, setPositions] = useState<MasterDataItem[]>([]);
  const [techStacks, setTechStacks] = useState<MasterDataItem[]>([]);
  const [positiveKeywords, setPositiveKeywords] = useState<EvaluationKeywordItem[]>([]);
  const [negativeKeywords, setNegativeKeywords] = useState<EvaluationKeywordItem[]>([]);
  const [interviewQuestions, setInterviewQuestions] = useState<InterviewQuestionItem[]>([]);
  const [masterDataOpen, setMasterDataOpen] = useState(false);
  const [submittingMasterData, setSubmittingMasterData] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [masterDataError, setMasterDataError] = useState<string | null>(null);
  const loadRequestSequence = useRef(0);
  const loadAbortController = useRef<AbortController | null>(null);

  const cancelLoad = useCallback(() => {
    loadRequestSequence.current += 1;
    loadAbortController.current?.abort();
    loadAbortController.current = null;
  }, []);

  const loadMasters = useCallback(async () => {
    cancelLoad();
    const requestSequence = loadRequestSequence.current;
    const abortController = new AbortController();
    loadAbortController.current = abortController;
    setLoadError(null);

    try {
      const [
        locationItems,
        positionItems,
        techStackItems,
        positiveKeywordItems,
        negativeKeywordItems,
        interviewQuestionItems,
      ] = await retry(
        () =>
          Promise.all([
            fetchLocations({ signal: abortController.signal }),
            fetchPositions({ signal: abortController.signal }),
            fetchTechStacks({ signal: abortController.signal }),
            fetchPositiveKeywords({ signal: abortController.signal }),
            fetchNegativeKeywords({ signal: abortController.signal }),
            fetchInterviewQuestions({ signal: abortController.signal }),
          ]),
        { shouldRetry: isRetryableError },
      );
      if (requestSequence !== loadRequestSequence.current || abortController.signal.aborted) return;

      setLocations(locationItems);
      setPositions(positionItems);
      setTechStacks(techStackItems);
      setPositiveKeywords(positiveKeywordItems);
      setNegativeKeywords(negativeKeywordItems);
      setInterviewQuestions(interviewQuestionItems);
    } catch (error) {
      if (requestSequence !== loadRequestSequence.current || isAbortError(error)) return;

      setLoadError(t("errors.fetch_master_data"));
    } finally {
      if (requestSequence === loadRequestSequence.current) {
        loadAbortController.current = null;
      }
    }
  }, [cancelLoad]);

  useEffect(() => {
    void loadMasters();
    return cancelLoad;
  }, [cancelLoad, loadMasters]);

  const handleOpenMasterData = useCallback(() => {
    setMasterDataError(null);
    setMasterDataOpen(true);
  }, []);

  const handleCloseMasterData = useCallback(() => {
    setMasterDataOpen(false);
    setMasterDataError(null);
  }, []);

  const runMutation = useCallback(async (action: () => Promise<void>) => {
    setSubmittingMasterData(true);
    setMasterDataError(null);

    try {
      await action();
      await loadMasters();
      return true;
    } catch (error) {
      setMasterDataError(getApiErrorMessage(error, t("errors.update_master_data")));
      return false;
    } finally {
      setSubmittingMasterData(false);
    }
  }, [loadMasters]);

  const runCreateMutation = useCallback(
    <Payload,>(mutation: (payload: Payload) => Promise<unknown>, payload: Payload) =>
      runMutation(async () => { await mutation(payload); }),
    [runMutation],
  );
  const runUpdateMutation = useCallback(
    <Payload,>(mutation: (id: number, payload: Payload) => Promise<unknown>, id: number, payload: Payload) =>
      runMutation(async () => { await mutation(id, payload); }),
    [runMutation],
  );
  const runDeleteMutation = useCallback(
    (mutation: (id: number) => Promise<unknown>, id: number) =>
      runMutation(async () => { await mutation(id); }),
    [runMutation],
  );

  const handleCreatePosition = useCallback(
    (payload: MasterDataPayload) => runCreateMutation(createPosition, payload),
    [runCreateMutation],
  );
  const handleUpdatePosition = useCallback(
    (id: number, payload: MasterDataPayload) => runUpdateMutation(updatePosition, id, payload),
    [runUpdateMutation],
  );
  const handleDeletePosition = useCallback(
    (id: number) => runDeleteMutation(deletePosition, id),
    [runDeleteMutation],
  );
  const handleCreateLocation = useCallback(
    (payload: MasterDataPayload) => runCreateMutation(createLocation, payload),
    [runCreateMutation],
  );
  const handleUpdateLocation = useCallback(
    (id: number, payload: MasterDataPayload) => runUpdateMutation(updateLocation, id, payload),
    [runUpdateMutation],
  );
  const handleDeleteLocation = useCallback(
    (id: number) => runDeleteMutation(deleteLocation, id),
    [runDeleteMutation],
  );
  const handleCreateTechStack = useCallback(
    (payload: MasterDataPayload) => runCreateMutation(createTechStack, payload),
    [runCreateMutation],
  );
  const handleUpdateTechStack = useCallback(
    (id: number, payload: MasterDataPayload) => runUpdateMutation(updateTechStack, id, payload),
    [runUpdateMutation],
  );
  const handleDeleteTechStack = useCallback(
    (id: number) => runDeleteMutation(deleteTechStack, id),
    [runDeleteMutation],
  );
  const handleCreatePositiveKeyword = useCallback(
    (payload: EvaluationKeywordPayload) => runCreateMutation(createPositiveKeyword, payload),
    [runCreateMutation],
  );
  const handleUpdatePositiveKeyword = useCallback(
    (id: number, payload: EvaluationKeywordPayload) => runUpdateMutation(updatePositiveKeyword, id, payload),
    [runUpdateMutation],
  );
  const handleDeletePositiveKeyword = useCallback(
    (id: number) => runDeleteMutation(deletePositiveKeyword, id),
    [runDeleteMutation],
  );
  const handleCreateNegativeKeyword = useCallback(
    (payload: EvaluationKeywordPayload) => runCreateMutation(createNegativeKeyword, payload),
    [runCreateMutation],
  );
  const handleUpdateNegativeKeyword = useCallback(
    (id: number, payload: EvaluationKeywordPayload) => runUpdateMutation(updateNegativeKeyword, id, payload),
    [runUpdateMutation],
  );
  const handleDeleteNegativeKeyword = useCallback(
    (id: number) => runDeleteMutation(deleteNegativeKeyword, id),
    [runDeleteMutation],
  );
  const handleCreateInterviewQuestion = useCallback(
    (payload: InterviewQuestionPayload) => runCreateMutation(createInterviewQuestion, payload),
    [runCreateMutation],
  );
  const handleUpdateInterviewQuestion = useCallback(
    (id: number, payload: InterviewQuestionPayload) => runUpdateMutation(updateInterviewQuestion, id, payload),
    [runUpdateMutation],
  );
  const handleDeleteInterviewQuestion = useCallback(
    (id: number) => runDeleteMutation(deleteInterviewQuestion, id),
    [runDeleteMutation],
  );

  return {
    locations,
    positions,
    techStacks,
    positiveKeywords,
    negativeKeywords,
    interviewQuestions,
    masterDataOpen,
    submittingMasterData,
    loadError,
    masterDataError,
    loadMasters,
    handleOpenMasterData,
    handleCloseMasterData,
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
  };
}
