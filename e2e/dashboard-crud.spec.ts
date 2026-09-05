import { expect, test } from "@playwright/test";

import { drawerWithHeading, login, selectOptionByLabel, writableDetailDrawer } from "./helpers/dashboard";

test.describe("jobs dashboard CRUD", () => {
  test.describe.configure({ mode: "serial" });

  test("creates a new job from the form drawer", async ({ page }) => {
    await login(page);

    const companyName = "E2E確認用会社";

    await page.getByRole("button", { name: "新規求人を追加" }).click();

    const formDrawer = drawerWithHeading(page, "求人を新規作成");

    await expect(formDrawer.getByRole("heading", { name: "求人を新規作成" })).toBeVisible();
    await formDrawer.getByLabel("会社名").fill(companyName);
    await selectOptionByLabel(formDrawer, page, "職種", "テックリード");
    await selectOptionByLabel(formDrawer, page, "働き方", "フルリモート");
    await selectOptionByLabel(formDrawer, page, "雇用形態", "正社員");
    await formDrawer.getByLabel("年収下限").fill("8000000");
    await formDrawer.getByLabel("年収上限").fill("9500000");

    await formDrawer.getByLabel("技術スタック").click();
    await page.getByRole("option", { name: "Ruby on Rails", exact: true }).click();
    await page.getByRole("option", { name: "TypeScript", exact: true }).click();
    await page.getByRole("option", { name: "React", exact: true }).click();
    await page.keyboard.press("Escape");

    await selectOptionByLabel(formDrawer, page, "勤務地", "リモート");
    await formDrawer.getByLabel("メモ").fill("Playwright で作成した求人です。");
    await formDrawer.getByRole("button", { name: "保存" }).click();

    await expect(formDrawer).not.toBeVisible();
    await expect(
      page
        .getByRole("row")
        .filter({ has: page.getByText(companyName, { exact: true }) })
        .first(),
    ).toBeVisible();
  });

  test("creates a job from the rule-based import drawer without calling Gemini", async ({ page }) => {
    await login(page);

    const companyName = "株式会社AI取込E2E";
    await page.getByRole("button", { name: "求人本文から取り込み" }).first().click();

    const importDrawer = drawerWithHeading(page, "求人本文から取り込み");

    await expect(importDrawer.getByText("抽出結果")).toBeVisible();
    await importDrawer.getByLabel("求人URL", { exact: true }).fill("https://example.com/e2e-import");
    await importDrawer.getByLabel("求人本文").fill(`
${companyName}
勤務地: 東京
年収: 650万円〜900万円
技術: Ruby on Rails, React, TypeScript
自社サービスの開発チームです。チーム体制と評価制度を確認したいです。
    `.trim());

    await importDrawer.getByRole("button", { name: "分析する" }).click();

    await expect(importDrawer.getByText(companyName, { exact: true }).last()).toBeVisible();
    await expect(importDrawer.getByText(/React/).last()).toBeVisible();
    await expect(importDrawer.getByText("東京", { exact: true }).last()).toBeVisible();
    await expect(importDrawer.getByText("ルールベース", { exact: true }).last()).toBeVisible();

    await importDrawer.getByRole("button", { name: "この内容で新規作成" }).click();

    const formDrawer = drawerWithHeading(page, "求人を新規作成");

    await expect(formDrawer.getByLabel("会社名")).toHaveValue(companyName);
    await expect(formDrawer.getByLabel("年収下限")).toHaveValue("6500000");
    await expect(formDrawer.getByLabel("年収上限")).toHaveValue("9000000");
    await expect(formDrawer.getByLabel("求人URL", { exact: true })).toHaveValue("https://example.com/e2e-import");
    await expect(formDrawer.getByLabel("技術スタック")).toContainText("React");
    await expect(formDrawer.getByLabel("勤務地")).toContainText("東京");

    await selectOptionByLabel(formDrawer, page, "職種", "フルスタックエンジニア");
    await formDrawer.getByRole("button", { name: "保存" }).click();

    await expect(formDrawer).not.toBeVisible();
    await expect(
      page
        .getByRole("row")
        .filter({ has: page.getByText(companyName, { exact: true }) })
        .first(),
    ).toBeVisible();
  });

  test("updates a job status from the detail drawer", async ({ page }) => {
    await login(page);

    const targetRow = page
      .getByRole("row")
      .filter({ has: page.getByText("サンプル会社 1", { exact: true }) })
      .first();

    await targetRow.click();

    const detailDrawer = writableDetailDrawer(page);

    await expect(detailDrawer.getByRole("button", { name: "求人を編集" })).toBeVisible();
    await detailDrawer.getByLabel("選考状況").click();
    await page.getByRole("option", { name: "内定", exact: true }).click();

    await expect(detailDrawer.getByLabel("選考状況")).toContainText("内定");

    await page.keyboard.press("Escape");
    await expect(detailDrawer).not.toBeVisible();
    await expect(
      page
        .getByRole("row")
        .filter({ has: page.getByText("サンプル会社 1", { exact: true }) })
        .first(),
    ).toContainText("内定");
  });

  test("deletes a job from the detail drawer", async ({ page }) => {
    await login(page);

    page.once("dialog", async (dialog) => {
      await dialog.accept();
    });

    await page.getByRole("textbox", { name: "キーワード" }).fill("サンプル会社 40");

    const targetRow = page
      .getByRole("row")
      .filter({ has: page.getByText("サンプル会社 40", { exact: true }) })
      .first();

    await targetRow.click();

    const detailDrawer = writableDetailDrawer(page);

    await detailDrawer.getByRole("button", { name: "削除" }).click();

    await expect(detailDrawer).not.toBeVisible();
    await expect(page.getByText("サンプル会社 40", { exact: true })).not.toBeVisible();
  });
});
