import { t } from "../i18n";
import type { Job, ScoringPreference } from "../types/job";
import { buildScoreBreakdown } from "./scoreBreakdown";

export type PriorityLevel = "high" | "review" | "hold";

export type PriorityView = {
  level: PriorityLevel;
  label: string;
  color: "success" | "warning" | "default";
};

export type JobDecisionInsights = {
  strengths: string[];
  checks: string[];
};

const PRIORITY_THRESHOLDS = {
  high: 70,
  review: 50,
} as const;

function clampPercent(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function getPriorityView(score: number, status?: Job["status"]): PriorityView {
  if (status === "rejected") {
    return { level: "hold", label: t("decision.priority.rejected"), color: "default" };
  }

  if (score >= PRIORITY_THRESHOLDS.high) {
    return { level: "high", label: t("decision.priority.high"), color: "success" };
  }

  if (score >= PRIORITY_THRESHOLDS.review) {
    return { level: "review", label: t("decision.priority.review"), color: "warning" };
  }

  return { level: "hold", label: t("decision.priority.hold"), color: "default" };
}

export function getTopScoredJobs(jobs: Job[], limit = 3) {
  return [...jobs]
    .filter((job) => job.status !== "rejected")
    .sort((left, right) => right.score - left.score || left.id - right.id)
    .slice(0, limit);
}

export function calculateRate(numerator: number, denominator: number) {
  if (denominator <= 0) return 0;
  return clampPercent((numerator / denominator) * 100);
}

export function buildJobDecisionInsights(job: Job, preference: ScoringPreference | null): JobDecisionInsights {
  const breakdown = buildScoreBreakdown(job, preference);
  const strengths = breakdown
    .filter((item) => item.value > 0)
    .sort((left, right) => right.value - left.value)
    .map((item) => item.label)
    .slice(0, 5);
  const checks = breakdown
    .filter((item) => item.value < 0)
    .sort((left, right) => left.value - right.value)
    .map((item) => item.label)
    .slice(0, 5);

  return { strengths, checks };
}
