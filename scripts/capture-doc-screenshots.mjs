import { chromium } from "@playwright/test";

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3100";
const email = process.env.E2E_EMAIL ?? "e2e@example.com";
const password = process.env.E2E_PASSWORD ?? "password";
const demoEmail = process.env.DEMO_EMAIL ?? "demo@example.com";
const demoPassword = process.env.DEMO_PASSWORD ?? "password";
const viewportPreset = process.env.SCREENSHOT_VIEWPORT ?? "desktop";
const viewportPresets = {
  desktop: { width: 1440, height: 980 },
  mobile: { width: 390, height: 844 },
};
const viewportName = viewportPreset in viewportPresets ? viewportPreset : "desktop";
const viewport = viewportPresets[viewportName];
const filenameSuffix = viewportName === "desktop" ? "" : `-${viewportName}`;

async function save(page, name, target = page) {
  await page.waitForTimeout(350);
  const options = {
    path: `docs/screenshots/${name}${filenameSuffix}.jpg`,
    type: "jpeg",
    quality: 82,
  };
  if (target === page) options.fullPage = false;
  await target.screenshot(options);
}

async function saveDrawer(page, name, heading) {
  const drawer = page.locator(".MuiDrawer-paper").filter({
    has: page.getByRole("heading", { name: heading }),
  });
  await drawer.waitFor();
  await save(page, name, drawer);
}

async function login(page, loginEmail, loginPassword) {
  await page.goto(baseURL);
  await page.getByRole("textbox", { name: "メールアドレス" }).fill(loginEmail);
  await page.getByLabel("パスワード").fill(loginPassword);
  await page.getByRole("button", { name: "ログイン", exact: true }).click();
  await page.getByRole("heading", { name: "求人比較" }).waitFor();
}

const browser = await chromium.launch();
const page = await browser.newPage({ viewport, deviceScaleFactor: 1 });

try {
  await page.goto(baseURL);
  await save(page, "login");

  await login(page, demoEmail, demoPassword);
  await page.getByText("サンプル会社 1", { exact: true }).waitFor();
  await save(page, "dashboard-list");

  await page.getByRole("row").filter({ has: page.getByText("サンプル会社 1", { exact: true }) }).first().click();
  await page.getByRole("heading", { name: "評価" }).waitFor();
  await save(page, "dashboard-detail");
  await page.keyboard.press("Escape");

  await page.getByRole("button", { name: "ログアウト" }).click();
  await page.getByRole("textbox", { name: "メールアドレス" }).waitFor();
  await login(page, email, password);

  await page.getByRole("button", { name: "新規求人を追加" }).click();
  await page.getByRole("heading", { name: "求人を新規作成" }).waitFor();
  await saveDrawer(page, "dashboard-form", "求人を新規作成");
  await page.keyboard.press("Escape");

  await page.getByRole("button", { name: "求人本文から取り込み" }).first().click();
  await page.getByRole("heading", { name: "求人本文から取り込み" }).waitFor();
  await saveDrawer(page, "job-import-input", "求人本文から取り込み");

  await page.getByLabel("求人本文").fill(`
会社名: 株式会社サンプルテック
職種: フルスタックエンジニア
勤務地: リモート
年収: 650万円〜900万円
技術: Ruby on Rails, React, TypeScript
自社サービスの開発チームで、チーム体制と評価制度を確認したい求人です。
  `.trim());
  await page.getByRole("button", { name: "分析する" }).click();
  await page.getByText("求人情報", { exact: true }).waitFor();
  await saveDrawer(page, "job-import-result", "求人本文から取り込み");
  await page.keyboard.press("Escape");

  await page.getByRole("button", { name: "スコア設定" }).click();
  await page.getByRole("heading", { name: "スコア設定" }).waitFor();
  await page.getByText("評価キーワード（加点）").scrollIntoViewIfNeeded();
  await saveDrawer(page, "dashboard-settings", "スコア設定");
} finally {
  await browser.close();
}
