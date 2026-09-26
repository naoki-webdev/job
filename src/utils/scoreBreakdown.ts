import type { Job } from "../types/job";
import { t } from "../i18n";

export type ScoreBreakdownItem = {
  label: string;
  value: number;
};

export function buildScoreBreakdown(
  job: Job,
): ScoreBreakdownItem[] {
  return job.score_breakdown.map(({ key, label, value }) => ({
    label: label ?? t(`jobs.score_breakdown.${key}`),
    value,
  }));
}
