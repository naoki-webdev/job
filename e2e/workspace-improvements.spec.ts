import { expect, test } from "@playwright/test";
import { drawerWithHeading, login } from "./helpers/dashboard";

test("restores an unfinished form and preserves filters across a reload", async ({ page }) => {
  await login(page);
  await page.getByRole("button",{ name:"新規求人を追加" }).click();
  const form = drawerWithHeading(page,"求人を新規作成");
  await form.getByLabel("会社名").fill("保存中の下書き");
  await form.getByRole("button",{ name:"キャンセル",exact:true }).click();
  await page.reload();
  await page.getByRole("button",{ name:"新規求人を追加" }).click();
  await expect(form.getByLabel("会社名")).toHaveValue("保存中の下書き");
  await form.getByRole("button",{ name:"キャンセル",exact:true }).click();
  const field = page.getByRole("textbox",{ name:"キーワード",exact:true });
  await field.fill("サンプル");
  await expect.poll(() => new URL(page.url()).searchParams.get("keyword")).toBe(JSON.stringify("サンプル"));
  await page.reload();
  await expect(page.getByRole("textbox",{ name:"キーワード",exact:true })).toHaveValue("サンプル");
});

test("compares multiple jobs including their AI concerns", async ({ page }) => {
  await login(page);
  await page.getByRole("button",{ name:"比較する求人を選ぶ" }).click();
  const comparison = page.locator(".MuiPaper-root").filter({ has:page.getByText("求人を比較（最大3件）",{ exact:true }) });
  await comparison.getByRole("checkbox").nth(0).check();
  await expect(comparison.getByRole("checkbox").nth(1)).toBeEnabled();
  await comparison.getByRole("checkbox").nth(1).check();
  await expect(comparison.getByRole("table")).toBeVisible();
  await expect(comparison.getByRole("cell",{ name:"AIの懸念点",exact:true })).toBeVisible();
  await expect(comparison.getByRole("button",{ name:/を比較から外す/ })).toHaveCount(2);
});
