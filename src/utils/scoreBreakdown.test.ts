import { describe, expect, it } from "vitest";

import { buildJob } from "../test/fixtures";
import { buildScoreBreakdown } from "./scoreBreakdown";

describe("buildScoreBreakdown", () => {
  it("builds a detailed breakdown for a high-scoring remote job", () => {
    const items = buildScoreBreakdown(buildJob());

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
    const items = buildScoreBreakdown(buildJob({
      work_style: "onsite",
      salary_min: 3_500_000,
      salary_max: 5_500_000,
      score_breakdown: [
        { category: "work_style", key: "onsite", label: null, value: 0 },
        { category: "master", key: "position", label: "バックエンドエンジニア", value: 8 },
        { category: "master", key: "location", label: "東京", value: 6 },
        { category: "master", key: "tech_stack", label: "Ruby on Rails", value: 20 },
        { category: "master", key: "tech_stack", label: "TypeScript", value: 15 },
        { category: "salary", key: "low_salary", label: null, value: -10 },
      ],
    }));

    expect(items).toContainEqual({ label: "フル出社", value: 0 });
    expect(items).toContainEqual({ label: "低年収条件", value: -10 });
  });
});
