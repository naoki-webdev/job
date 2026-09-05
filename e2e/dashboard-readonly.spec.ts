import { expect, test } from "@playwright/test";

import { authHeaders, login, loginAsDemo } from "./helpers/dashboard";

test.describe("jobs dashboard read-only and list", () => {
  test("shows seeded jobs in the dashboard list", async ({ page }) => {
    await login(page);

    await expect(page.getByRole("heading", { name: "求人比較" })).toBeVisible();
    await expect(page.getByText("サンプル会社 1", { exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: "求人一覧", level: 2 })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "会社名" })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "評価ポイント" })).toBeVisible();
  });

  test("keeps read-only demo users from writing data through the UI and API", async ({ page }) => {
    await loginAsDemo(page);

    await expect(page.getByRole("button", { name: "新規求人を追加" })).not.toBeVisible();
    await expect(page.getByRole("button", { name: "求人本文から取り込み" })).not.toBeVisible();
    await expect(page.getByRole("button", { name: "スコア設定" })).not.toBeVisible();

    const headers = await authHeaders(page);
    const beforeResponse = await page.request.get("/api/jobs?per_page=1", { headers });
    expect(beforeResponse.ok()).toBeTruthy();
    const beforeBody = await beforeResponse.json();
    const targetJob = beforeBody.jobs[0];
    const beforeTotal = beforeBody.meta.total_count;
    const beforeStatus = targetJob.status;

    const createResponse = await page.request.post("/api/jobs", {
      headers,
      data: {
        job: {
          company_name: "Read Only E2E Company",
          position_id: targetJob.position_id,
          status: "interested",
          work_style: targetJob.work_style,
          employment_type: targetJob.employment_type,
          salary_min: targetJob.salary_min,
          salary_max: targetJob.salary_max,
          tech_stack_ids: targetJob.tech_stack_ids,
          location_id: targetJob.location_id,
          notes: "read-only E2E",
        },
      },
    });
    expect(createResponse.status()).toBe(403);

    const updateResponse = await page.request.patch(`/api/jobs/${targetJob.id}`, {
      headers,
      data: { job: { status: beforeStatus === "offer" ? "interested" : "offer" } },
    });
    expect(updateResponse.status()).toBe(403);

    const deleteResponse = await page.request.delete(`/api/jobs/${targetJob.id}`, { headers });
    expect(deleteResponse.status()).toBe(403);

    const afterResponse = await page.request.get("/api/jobs?per_page=1", { headers });
    expect(afterResponse.ok()).toBeTruthy();
    const afterBody = await afterResponse.json();
    expect(afterBody.meta.total_count).toBe(beforeTotal);
    expect(afterBody.jobs[0].id).toBe(targetJob.id);
    expect(afterBody.jobs[0].status).toBe(beforeStatus);
  });
});
