import type { Job } from "../types/job";

export function buildJob(overrides: Partial<Job> = {}): Job {
  return {
    id: 1,
    company_name: "サンプル会社",
    position_id: 1,
    location_id: 1,
    position: "バックエンドエンジニア",
    status: "interested",
    work_style: "full_remote",
    employment_type: "full_time",
    salary_min: 4_500_000,
    salary_max: 8_500_000,
    tech_stack_ids: [1, 2],
    tech_stack: "Ruby on Rails, TypeScript",
    position_master: {
      id: 1,
      name: "バックエンドエンジニア",
      score_weight: 8,
      active: true,
      display_order: 0,
    },
    tech_stacks: [
      { id: 1, name: "Ruby on Rails", score_weight: 20, active: true, display_order: 0 },
      { id: 2, name: "TypeScript", score_weight: 15, active: true, display_order: 1 },
    ],
    location_master: {
      id: 1,
      name: "東京",
      score_weight: 6,
      active: true,
      display_order: 0,
    },
    location: "東京",
    notes: "",
    source_url: null,
    company_logo_url: null,
    company_logo_filename: null,
    score: 75,
    created_at: "2026-04-05T00:00:00.000Z",
    updated_at: "2026-04-05T00:00:00.000Z",
    ...overrides,
  };
}
