import { execSync } from "node:child_process";
import * as http from "node:http";

function request(url: string) {
  return new Promise<number>((resolve, reject) => {
    const req = http.get(url, (response) => {
      resolve(response.statusCode ?? 500);
      response.resume();
    });

    req.on("error", reject);
  });
}

async function waitForServer(url: string, attempts = 60) {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      const status = await request(url);
      if (status >= 200 && status < 400) return;
    } catch {
      // コンテナ上のRailsサーバーが起動するまで待ちます。
    }

    await new Promise((resolve) => setTimeout(resolve, 1_000));
  }

  throw new Error(`Server did not become ready: ${url}`);
}

export default async function globalSetup() {
  // サーバーやseedをPlaywrightの外部で管理する場合は、PLAYWRIGHT_SKIP_DOCKER=1を設定します。
  // たとえば、Docker CLIのないコンテナ内でテストを実行する場合に使います。
  if (process.env.PLAYWRIGHT_SKIP_DOCKER !== "1") {
    execSync("docker compose up -d db e2e_web", { stdio: "inherit" });
  }
  const baseUrl = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3100";
  await waitForServer(`${baseUrl}/up`);
  if (process.env.PLAYWRIGHT_SKIP_DOCKER !== "1") {
    execSync("docker compose exec -T e2e_web ruby bin/rails db:seed", { stdio: "inherit" });
  }
}
