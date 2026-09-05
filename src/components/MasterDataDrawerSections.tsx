import Alert from "@mui/material/Alert";
import Divider from "@mui/material/Divider";
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
} from "../types/job";
import EvaluationKeywordSection from "./EvaluationKeywordSection";
import InfoTooltip from "./InfoTooltip";
import InterviewQuestionSection from "./InterviewQuestionSection";
import MasterDataSection from "./MasterDataSection";
import type { EvaluationKeywordDraft, InterviewQuestionDraft, MasterDataDraft } from "./masterDataDrafts";

type MasterDataDrawerSectionsProps = {
  locations: MasterDataItem[];
  positions: MasterDataItem[];
  techStacks: MasterDataItem[];
  positiveKeywords: EvaluationKeywordItem[];
  negativeKeywords: EvaluationKeywordItem[];
  interviewQuestions: InterviewQuestionItem[];
  newLocation: MasterDataDraft;
  newPosition: MasterDataDraft;
  newTechStack: MasterDataDraft;
  newPositiveKeyword: EvaluationKeywordDraft;
  newNegativeKeyword: EvaluationKeywordDraft;
  newInterviewQuestion: InterviewQuestionDraft;
  submitting: boolean;
  error?: string | null;
  onNewLocationChange: (draft: MasterDataDraft) => void;
  onNewPositionChange: (draft: MasterDataDraft) => void;
  onNewTechStackChange: (draft: MasterDataDraft) => void;
  onNewPositiveKeywordChange: (draft: EvaluationKeywordDraft) => void;
  onNewNegativeKeywordChange: (draft: EvaluationKeywordDraft) => void;
  onNewInterviewQuestionChange: (draft: InterviewQuestionDraft) => void;
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

export default function MasterDataDrawerSections({
  locations,
  positions,
  techStacks,
  positiveKeywords,
  negativeKeywords,
  interviewQuestions,
  newLocation,
  newPosition,
  newTechStack,
  newPositiveKeyword,
  newNegativeKeyword,
  newInterviewQuestion,
  submitting,
  error,
  onNewLocationChange,
  onNewPositionChange,
  onNewTechStackChange,
  onNewPositiveKeywordChange,
  onNewNegativeKeywordChange,
  onNewInterviewQuestionChange,
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
}: MasterDataDrawerSectionsProps) {
  return (
    <Stack spacing={2.25}>
      <Stack direction="row" spacing={0.25} alignItems="center">
        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
          {t("settings.items_title")}
        </Typography>
        <InfoTooltip label={t("settings.items_title")} title={t("settings.items_helper")} />
      </Stack>
      <Typography variant="caption" color="text.secondary">
        {t("master_data.delete_hint")}
      </Typography>

      {error && <Alert severity="error">{error}</Alert>}

      <MasterDataSection
        title={t("master_data.locations")}
        nameLabel={t("master_data.location_name")}
        namePlaceholder={t("master_data.location_placeholder")}
        items={locations}
        newItem={newLocation}
        submitting={submitting}
        onNewItemChange={onNewLocationChange}
        onCreate={onCreateLocation}
        onUpdate={onUpdateLocation}
        onDelete={onDeleteLocation}
      />
      <Divider />
      <MasterDataSection
        title={t("master_data.positions")}
        nameLabel={t("master_data.position_name")}
        namePlaceholder={t("master_data.position_placeholder")}
        items={positions}
        newItem={newPosition}
        submitting={submitting}
        onNewItemChange={onNewPositionChange}
        onCreate={onCreatePosition}
        onUpdate={onUpdatePosition}
        onDelete={onDeletePosition}
      />
      <Divider />
      <MasterDataSection
        title={t("master_data.tech_stacks")}
        nameLabel={t("master_data.tech_stack_name")}
        namePlaceholder={t("master_data.tech_stack_placeholder")}
        items={techStacks}
        newItem={newTechStack}
        submitting={submitting}
        onNewItemChange={onNewTechStackChange}
        onCreate={onCreateTechStack}
        onUpdate={onUpdateTechStack}
        onDelete={onDeleteTechStack}
      />
      <Divider />
      <EvaluationKeywordSection
        title={t("evaluation_keywords.positive_title")}
        items={positiveKeywords}
        newItem={newPositiveKeyword}
        submitting={submitting}
        onNewItemChange={onNewPositiveKeywordChange}
        onCreate={onCreatePositiveKeyword}
        onUpdate={onUpdatePositiveKeyword}
        onDelete={onDeletePositiveKeyword}
      />
      <Divider />
      <EvaluationKeywordSection
        title={t("evaluation_keywords.negative_title")}
        items={negativeKeywords}
        newItem={newNegativeKeyword}
        submitting={submitting}
        onNewItemChange={onNewNegativeKeywordChange}
        onCreate={onCreateNegativeKeyword}
        onUpdate={onUpdateNegativeKeyword}
        onDelete={onDeleteNegativeKeyword}
      />
      <Divider />
      <InterviewQuestionSection
        items={interviewQuestions}
        newItem={newInterviewQuestion}
        submitting={submitting}
        onNewItemChange={onNewInterviewQuestionChange}
        onCreate={onCreateInterviewQuestion}
        onUpdate={onUpdateInterviewQuestion}
        onDelete={onDeleteInterviewQuestion}
      />
    </Stack>
  );
}
