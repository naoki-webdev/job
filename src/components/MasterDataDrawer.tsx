import { memo, useEffect, useState } from "react";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Drawer from "@mui/material/Drawer";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import { t } from "../i18n";
import type {
  EvaluationKeywordItem,
  EvaluationKeywordPayload,
  InterviewQuestionItem,
  InterviewQuestionPayload,
  MasterDataItem,
  MasterDataPayload,
  ScoringPreference,
  ScoringPreferencePayload,
} from "../types/job";
import MasterDataDrawerSections from "./MasterDataDrawerSections";
import {
  emptyEvaluationKeyword,
  emptyInterviewQuestion,
  emptyMasterData,
  emptyScoringValues,
  hasEmptyScoringField,
  type EvaluationKeywordDraft,
  type InterviewQuestionDraft,
  type MasterDataDraft,
  type ScoringPreferenceDraft,
  toScoringPreferencePayload,
} from "./masterDataDrafts";
import ScoringRuleSection from "./ScoringRuleSection";

type MasterDataDrawerProps = {
  open: boolean;
  preference: ScoringPreference | null;
  locations: MasterDataItem[];
  positions: MasterDataItem[];
  techStacks: MasterDataItem[];
  positiveKeywords: EvaluationKeywordItem[];
  negativeKeywords: EvaluationKeywordItem[];
  interviewQuestions: InterviewQuestionItem[];
  submittingScoring: boolean;
  submittingMasterData: boolean;
  scoringError?: string | null;
  masterDataError?: string | null;
  onClose: () => void;
  onSubmitScoring: (payload: ScoringPreferencePayload) => Promise<void> | void;
  onCreateLocation: (payload: MasterDataPayload) => Promise<void> | void;
  onUpdateLocation: (id: number, payload: MasterDataPayload) => Promise<void> | void;
  onDeleteLocation: (id: number) => Promise<void> | void;
  onCreatePosition: (payload: MasterDataPayload) => Promise<void> | void;
  onUpdatePosition: (id: number, payload: MasterDataPayload) => Promise<void> | void;
  onDeletePosition: (id: number) => Promise<void> | void;
  onCreateTechStack: (payload: MasterDataPayload) => Promise<void> | void;
  onUpdateTechStack: (id: number, payload: MasterDataPayload) => Promise<void> | void;
  onDeleteTechStack: (id: number) => Promise<void> | void;
  onCreatePositiveKeyword: (payload: EvaluationKeywordPayload) => Promise<void> | void;
  onUpdatePositiveKeyword: (id: number, payload: EvaluationKeywordPayload) => Promise<void> | void;
  onDeletePositiveKeyword: (id: number) => Promise<void> | void;
  onCreateNegativeKeyword: (payload: EvaluationKeywordPayload) => Promise<void> | void;
  onUpdateNegativeKeyword: (id: number, payload: EvaluationKeywordPayload) => Promise<void> | void;
  onDeleteNegativeKeyword: (id: number) => Promise<void> | void;
  onCreateInterviewQuestion: (payload: InterviewQuestionPayload) => Promise<void> | void;
  onUpdateInterviewQuestion: (id: number, payload: InterviewQuestionPayload) => Promise<void> | void;
  onDeleteInterviewQuestion: (id: number) => Promise<void> | void;
};

function MasterDataDrawer({
  open,
  preference,
  locations,
  positions,
  techStacks,
  positiveKeywords,
  negativeKeywords,
  interviewQuestions,
  submittingScoring,
  submittingMasterData,
  scoringError,
  masterDataError,
  onClose,
  onSubmitScoring,
  onCreateLocation,
  onUpdateLocation,
  onDeleteLocation,
  onCreatePosition,
  onUpdatePosition,
  onDeletePosition,
  onCreateTechStack,
  onUpdateTechStack,
  onDeleteTechStack,
  onCreatePositiveKeyword,
  onUpdatePositiveKeyword,
  onDeletePositiveKeyword,
  onCreateNegativeKeyword,
  onUpdateNegativeKeyword,
  onDeleteNegativeKeyword,
  onCreateInterviewQuestion,
  onUpdateInterviewQuestion,
  onDeleteInterviewQuestion,
}: MasterDataDrawerProps) {
  const [newLocation, setNewLocation] = useState<MasterDataDraft>(emptyMasterData);
  const [newPosition, setNewPosition] = useState<MasterDataDraft>(emptyMasterData);
  const [newTechStack, setNewTechStack] = useState<MasterDataDraft>(emptyMasterData);
  const [newPositiveKeyword, setNewPositiveKeyword] = useState<EvaluationKeywordDraft>(emptyEvaluationKeyword);
  const [newNegativeKeyword, setNewNegativeKeyword] = useState<EvaluationKeywordDraft>(emptyEvaluationKeyword);
  const [newInterviewQuestion, setNewInterviewQuestion] = useState<InterviewQuestionDraft>(emptyInterviewQuestion);
  const [scoringValues, setScoringValues] = useState<ScoringPreferenceDraft>(emptyScoringValues);

  useEffect(() => {
    if (open) {
      setNewLocation({ ...emptyMasterData, display_order: locations.length });
      setNewPosition({ ...emptyMasterData, display_order: positions.length });
      setNewTechStack({ ...emptyMasterData, display_order: techStacks.length });
      setNewPositiveKeyword({ ...emptyEvaluationKeyword, display_order: positiveKeywords.length });
      setNewNegativeKeyword({ ...emptyEvaluationKeyword, display_order: negativeKeywords.length });
      setNewInterviewQuestion({ ...emptyInterviewQuestion, display_order: interviewQuestions.length });
    }
  }, [
    open,
    interviewQuestions.length,
    locations.length,
    negativeKeywords.length,
    positions.length,
    positiveKeywords.length,
    techStacks.length,
  ]);

  useEffect(() => {
    if (open && preference) {
      setScoringValues({
        full_remote_weight: preference.full_remote_weight,
        hybrid_weight: preference.hybrid_weight,
        onsite_weight: preference.onsite_weight,
        high_salary_max_threshold: preference.high_salary_max_threshold,
        high_salary_bonus: preference.high_salary_bonus,
        low_salary_min_threshold: preference.low_salary_min_threshold,
        low_salary_penalty: preference.low_salary_penalty,
      });
    }
  }, [open, preference]);

  const handleScoringChange = (key: keyof ScoringPreferenceDraft, value: number | "") => {
    setScoringValues((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      aria-labelledby="master-data-drawer-title"
      slotProps={{ backdrop: { sx: { backgroundColor: "rgba(9, 30, 66, 0.1)" } } }}
    >
      <Box
        sx={{
          width: { xs: "100vw", sm: 620 },
          backgroundColor: "common.white",
          minHeight: "100%",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Box sx={{ flex: 1, overflowY: "auto", px: { xs: 2, sm: 2.5 }, py: 2.5 }}>
          <Stack spacing={2.25}>
            <Box sx={{ pb: 0.25 }}>
              <Typography id="master-data-drawer-title" variant="h6">
                {t("settings.title")}
              </Typography>
            </Box>

            <ScoringRuleSection
              values={scoringValues}
              error={scoringError}
              onChange={handleScoringChange}
            />

            <MasterDataDrawerSections
              locations={locations}
              positions={positions}
              techStacks={techStacks}
              positiveKeywords={positiveKeywords}
              negativeKeywords={negativeKeywords}
              interviewQuestions={interviewQuestions}
              newLocation={newLocation}
              newPosition={newPosition}
              newTechStack={newTechStack}
              newPositiveKeyword={newPositiveKeyword}
              newNegativeKeyword={newNegativeKeyword}
              newInterviewQuestion={newInterviewQuestion}
              submitting={submittingMasterData}
              error={masterDataError}
              onNewLocationChange={setNewLocation}
              onNewPositionChange={setNewPosition}
              onNewTechStackChange={setNewTechStack}
              onNewPositiveKeywordChange={setNewPositiveKeyword}
              onNewNegativeKeywordChange={setNewNegativeKeyword}
              onNewInterviewQuestionChange={setNewInterviewQuestion}
              onCreateLocation={async (payload) => {
                await onCreateLocation(payload);
                setNewLocation({ ...emptyMasterData, display_order: locations.length + 1 });
              }}
              onUpdateLocation={onUpdateLocation}
              onDeleteLocation={onDeleteLocation}
              onCreatePosition={async (payload) => {
                await onCreatePosition(payload);
                setNewPosition({ ...emptyMasterData, display_order: positions.length + 1 });
              }}
              onUpdatePosition={onUpdatePosition}
              onDeletePosition={onDeletePosition}
              onCreateTechStack={async (payload) => {
                await onCreateTechStack(payload);
                setNewTechStack({ ...emptyMasterData, display_order: techStacks.length + 1 });
              }}
              onUpdateTechStack={onUpdateTechStack}
              onDeleteTechStack={onDeleteTechStack}
              onCreatePositiveKeyword={async (payload) => {
                await onCreatePositiveKeyword(payload);
                setNewPositiveKeyword({ ...emptyEvaluationKeyword, display_order: positiveKeywords.length + 1 });
              }}
              onUpdatePositiveKeyword={onUpdatePositiveKeyword}
              onDeletePositiveKeyword={onDeletePositiveKeyword}
              onCreateNegativeKeyword={async (payload) => {
                await onCreateNegativeKeyword(payload);
                setNewNegativeKeyword({ ...emptyEvaluationKeyword, display_order: negativeKeywords.length + 1 });
              }}
              onUpdateNegativeKeyword={onUpdateNegativeKeyword}
              onDeleteNegativeKeyword={onDeleteNegativeKeyword}
              onCreateInterviewQuestion={async (payload) => {
                await onCreateInterviewQuestion(payload);
                setNewInterviewQuestion({ ...emptyInterviewQuestion, display_order: interviewQuestions.length + 1 });
              }}
              onUpdateInterviewQuestion={onUpdateInterviewQuestion}
              onDeleteInterviewQuestion={onDeleteInterviewQuestion}
            />
          </Stack>
        </Box>

        <Box
          sx={{
            position: "sticky",
            bottom: 0,
            backgroundColor: "rgba(255,255,255,0.96)",
            borderTop: "1px solid rgba(15, 23, 42, 0.08)",
            px: { xs: 2, sm: 2.5 },
            py: 1.5,
            backdropFilter: "blur(8px)",
          }}
        >
          <Stack direction="row" justifyContent="flex-end" spacing={1}>
            <Button variant="text" onClick={onClose}>
              {t("actions.close")}
            </Button>
            <Button
              variant="contained"
              onClick={() => {
                const payload = toScoringPreferencePayload(scoringValues);
                if (!payload) return;
                void onSubmitScoring(payload);
              }}
              disabled={submittingScoring || hasEmptyScoringField(scoringValues)}
            >
              {submittingScoring ? t("actions.saving") : t("actions.save_scoring")}
            </Button>
          </Stack>
        </Box>
      </Box>
    </Drawer>
  );
}

export default memo(MasterDataDrawer);
