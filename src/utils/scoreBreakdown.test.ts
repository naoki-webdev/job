import { describe, expect, it } from "vitest";

import { buildJob } from "../test/fixtures";
import type { ScoringPreference } from "../types/job";
import { buildScoreBreakdown } from "./scoreBreakdown";

const preference: ScoringPreference = {
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

describe("buildScoreBreakdown", () => {
  it("builds a detailed breakdown for a high-scoring remote job", () => {
    const items = buildScoreBreakdown(buildJob(), preference);

    expect(items).toEqual([
      { label: "フルリモート", value: 30 },
      { label: "バックエンドエンジニア", value: 8 },
      { label: "東京", value: 6 },
      { label: "Ruby on Rails", value: 20 },
      { label: "TypeScript", value: 15 },
      { label: "高年収条件", value: 10 },
    ]);
  });

  it("includes low-salary and onsite weights when those conditions apply", () => {
    const items = buildScoreBreakdown(
      buildJob({
        work_style: "onsite",
        salary_min: 3_500_000,
        salary_max: 5_500_000,
      }),
      preference,
    );

    expect(items).toContainEqual({ label: "フル出社", value: 0 });
    expect(items).toContainEqual({ label: "低年収条件", value: -10 });
  });
});
