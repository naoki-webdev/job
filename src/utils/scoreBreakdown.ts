import type { Job, ScoringPreference } from "../types/job";
import { t } from "../i18n";

export type ScoreBreakdownItem = {
  label: string;
  value: number;
};

export function buildScoreBreakdown(
  job: Job,
  preference: ScoringPreference | null,
): ScoreBreakdownItem[] {
  if (!preference) return [];

  const items: ScoreBreakdownItem[] = [];

  if (job.work_style === "full_remote") {
    items.push({ label: t("jobs.score_breakdown.full_remote"), value: preference.full_remote_weight });
  }

  if (job.work_style === "hybrid") {
    items.push({ label: t("jobs.score_breakdown.hybrid"), value: preference.hybrid_weight });
  }

  if (job.work_style === "onsite") {
    items.push({ label: t("jobs.score_breakdown.onsite"), value: preference.onsite_weight });
  }

  items.push({ label: job.position_master.name, value: job.position_master.score_weight });

  if (job.location_master) {
    items.push({ label: job.location_master.name, value: job.location_master.score_weight });
  }

  job.tech_stacks.forEach((techStack) => {
    items.push({ label: techStack.name, value: techStack.score_weight });
  });

  if (job.salary_max >= preference.high_salary_max_threshold) {
    items.push({ label: t("jobs.score_breakdown.high_salary"), value: preference.high_salary_bonus });
  }

  if (job.salary_min < preference.low_salary_min_threshold) {
    items.push({ label: t("jobs.score_breakdown.low_salary"), value: preference.low_salary_penalty });
  }

  return items;
}
