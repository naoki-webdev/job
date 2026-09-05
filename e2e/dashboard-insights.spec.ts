import { expect, test } from "@playwright/test";

import { login } from "./helpers/dashboard";

test.describe("jobs dashboard insights", () => {
  test("shows the ranking and decision panels on the dashboard and detail drawer", async ({ page }) => {
    await login(page);

    await expect(
      page.getByText("おすすめ求人", { exact: true }),
    ).toBeVisible();

    await page.getByTestId("ranking-job-card").first().click();

    const detailDrawer = page
      .locator(".MuiDrawer-paper")
      .filter({ has: page.getByRole("heading", { name: "評価" }) });

    await expect(detailDrawer.getByRole("heading", { name: "評価" })).toBeVisible();
    await expect(detailDrawer.getByRole("button", { name: "評価について" })).toBeVisible();
    await expect(detailDrawer.getByRole("heading", { name: "基本情報" })).toBeVisible();
    await expect(detailDrawer.getByRole("heading", { name: "メモ" })).toBeVisible();
  });

  test("filters the job list by keyword and can clear the filter", async ({ page }) => {
    await login(page);

    const keywordField = page.getByRole("textbox", { name: "キーワード" });

    await keywordField.fill("サンプル会社 12");

    await expect(
      page
        .getByRole("row")
        .filter({ has: page.getByText("サンプル会社 12", { exact: true }) })
        .first(),
    ).toBeVisible();
    await expect(
      page
        .getByRole("row")
        .filter({ has: page.getByText("サンプル会社 1", { exact: true }) })
        .first(),
    ).not.toBeVisible();

    await page.getByRole("button", { name: "絞り込みをクリア" }).click();

    await expect(
      page
        .getByRole("row")
        .filter({ has: page.getByText("サンプル会社 1", { exact: true }) })
        .first(),
    ).toBeVisible();
  });

  test("starts a CSV export download", async ({ page }) => {
    await login(page);

    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("button", { name: "CSV出力" }).click();
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toMatch(/^jobs-\d+\.csv$/);
  });
});
