import type { EvaluationKeywordPayload, InterviewQuestionPayload, MasterDataPayload, ScoringPreferencePayload } from "../types/job";

export type MasterDataDraft = Omit<MasterDataPayload, "score_weight" | "display_order"> & {
  score_weight: number | "";
  display_order: number | "";
};

export type ScoringPreferenceDraft = {
  [Key in keyof ScoringPreferencePayload]: number | "";
};

export type EvaluationKeywordDraft = Omit<EvaluationKeywordPayload, "display_order"> & {
  display_order: number | "";
};

export type InterviewQuestionDraft = Omit<InterviewQuestionPayload, "display_order"> & {
  display_order: number | "";
};

export const emptyMasterData: MasterDataDraft = {
  name: "",
  score_weight: 0,
  active: true,
  display_order: 0,
};

export const emptyEvaluationKeyword: EvaluationKeywordDraft = {
  pattern: "",
  label: "",
  active: true,
  display_order: 0,
};

export const emptyInterviewQuestion: InterviewQuestionDraft = {
  body: "",
  active: true,
  display_order: 0,
};

export const emptyScoringValues: ScoringPreferenceDraft = {
  full_remote_weight: 30,
  hybrid_weight: 15,
  onsite_weight: 0,
  high_salary_max_threshold: 8_000_000,
  high_salary_bonus: 10,
  low_salary_min_threshold: 4_000_000,
  low_salary_penalty: -10,
};

export function parseNumericInput(value: string) {
  return value === "" ? "" : Number(value);
}

export function isValidMasterDataDraft(draft: MasterDataDraft) {
  return draft.name.trim() !== "" && draft.score_weight !== "" && draft.display_order !== "";
}

export function toMasterDataPayload(draft: MasterDataDraft): MasterDataPayload | null {
  if (!isValidMasterDataDraft(draft)) return null;

  return {
    ...draft,
    score_weight: Number(draft.score_weight),
    display_order: Number(draft.display_order),
  };
}

export function isValidEvaluationKeywordDraft(draft: EvaluationKeywordDraft) {
  return draft.pattern.trim() !== "" && draft.label.trim() !== "" && draft.display_order !== "";
}

export function toEvaluationKeywordPayload(draft: EvaluationKeywordDraft): EvaluationKeywordPayload | null {
  if (!isValidEvaluationKeywordDraft(draft)) return null;

  return {
    ...draft,
    display_order: Number(draft.display_order),
  };
}

export function isValidInterviewQuestionDraft(draft: InterviewQuestionDraft) {
  return draft.body.trim() !== "" && draft.display_order !== "";
}

export function toInterviewQuestionPayload(draft: InterviewQuestionDraft): InterviewQuestionPayload | null {
  if (!isValidInterviewQuestionDraft(draft)) return null;

  return {
    ...draft,
    display_order: Number(draft.display_order),
  };
}

export function hasEmptyScoringField(values: ScoringPreferenceDraft) {
  return Object.values(values).some((value) => value === "");
}

export function toScoringPreferencePayload(values: ScoringPreferenceDraft): ScoringPreferencePayload | null {
  if (hasEmptyScoringField(values)) return null;

  return {
    full_remote_weight: Number(values.full_remote_weight),
    hybrid_weight: Number(values.hybrid_weight),
    onsite_weight: Number(values.onsite_weight),
    high_salary_max_threshold: Number(values.high_salary_max_threshold),
    high_salary_bonus: Number(values.high_salary_bonus),
    low_salary_min_threshold: Number(values.low_salary_min_threshold),
    low_salary_penalty: Number(values.low_salary_penalty),
  };
}
