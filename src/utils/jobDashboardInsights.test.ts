import { describe, expect, it } from "vitest";

import { buildJob } from "../test/fixtures";
import type { ScoringPreference } from "../types/job";
import {
  buildJobDecisionInsights,
  calculateRate,
  getPriorityView,
  getTopScoredJobs,
} from "./jobDashboardInsights";

const scoringPreference: ScoringPreference = {
  id: 1,
  full_remote_weight: 30,
  hybrid_weight: 15,
  onsite_weight: 0,
  high_salary_max_threshold: 8_000_000,
  high_salary_bonus: 10,
  low_salary_min_threshold: 4_000_000,
  low_salary_penalty: -10,
  created_at: "2026-04-05T00:00:00.000Z",
  updated_at: "2026-04-05T00:00:00.000Z",
};

describe("jobDashboardInsights", () => {
  it("sorts jobs by score for the ranking panel", () => {
    const jobs = [
      buildJob({ id: 1, company_name: "A社", score: 55 }),
      buildJob({ id: 2, company_name: "B社", score: 88 }),
      buildJob({ id: 3, company_name: "C社", score: 71 }),
    ];

    expect(getTopScoredJobs(jobs, 2).map((job) => job.company_name)).toEqual(["B社", "C社"]);
  });

  it("does not mutate the source list while sorting", () => {
    const jobs = [
      buildJob({ id: 1, score: 55 }),
      buildJob({ id: 2, score: 88 }),
    ];

    getTopScoredJobs(jobs);

    expect(jobs.map((job) => job.id)).toEqual([1, 2]);
  });

  it("excludes jobs already marked as rejected from the ranking", () => {
    const jobs = [
      buildJob({ id: 1, company_name: "見送り済み", score: 99, status: "rejected" }),
      buildJob({ id: 2, company_name: "応募候補", score: 80, status: "interested" }),
    ];

    expect(getTopScoredJobs(jobs, 3).map((job) => job.company_name)).toEqual(["応募候補"]);
  });

  it("maps score values to priority labels", () => {
    expect(getPriorityView(80).label).toBe("応募推奨");
    expect(getPriorityView(60).label).toBe("条件確認");
    expect(getPriorityView(20).label).toBe("要検討");
    expect(getPriorityView(80, "rejected").label).toBe("見送り済み");
  });

  it("splits positive and check items from score breakdown", () => {
    const insights = buildJobDecisionInsights(
      buildJob({ salary_min: 3_500_000, salary_max: 5_000_000 }),
      scoringPreference,
    );

    expect(insights.strengths).toContain("フルリモート");
    expect(insights.checks).toContain("低年収条件");
  });

  it("calculates a rounded percentage rate", () => {
    expect(calculateRate(3, 4)).toBe(75);
    expect(calculateRate(1, 0)).toBe(0);
  });
});
