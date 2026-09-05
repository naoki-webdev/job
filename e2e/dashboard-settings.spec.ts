import { expect, test } from "@playwright/test";

import { drawerWithHeading, login } from "./helpers/dashboard";

test.describe("jobs dashboard settings", () => {
  test("updates master data from the settings drawer", async ({ page }) => {
    await login(page);

    await page.getByRole("button", { name: "スコア設定" }).click();

    const settingsDrawer = drawerWithHeading(page, "スコア設定");
    const positionNameInput = settingsDrawer.getByLabel("職種名").first();
    const positionCard = positionNameInput.locator("xpath=ancestor::div[.//button[normalize-space()='保存']][1]");
    const updatedName = "バックエンドエンジニア E2E";

    await positionNameInput.fill(updatedName);
    await positionCard.getByRole("button", { name: "保存" }).click();

    await expect(positionNameInput).toHaveValue(updatedName);
  });
});
