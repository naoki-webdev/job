import { describe, expect, it, vi } from "vitest";

import { ApiError, buildJobsExportUrl, getApiErrorMessage, requestJson } from "./jobs";

describe("buildJobsExportUrl", () => {
  it("builds an export url with the current filters", () => {
    const url = buildJobsExportUrl({
      keyword: "Rails",
      status: ["interested", "applied"],
      work_style: ["full_remote"],
      sort: "score",
      direction: "desc",
      page: 2,
      per_page: 50,
    });

    expect(url).toBe(
      "http://localhost:3000/api/jobs/export?keyword=Rails&status=interested%2Capplied&work_style=full_remote&sort=score&direction=desc&page=2&per_page=50",
    );
  });

  it("omits the query string when there are no filters", () => {
    expect(buildJobsExportUrl()).toBe("http://localhost:3000/api/jobs/export");
  });
});

describe("getApiErrorMessage", () => {
  it("uses API validation and authorization messages when present", () => {
    const error = new ApiError(
      403,
      "Forbidden",
      [ "公開デモではデータの追加・更新・削除はできません。" ],
      "READ_ONLY_DEMO",
      "request-123",
    );

    expect(getApiErrorMessage(error, "保存に失敗しました。")).toBe(
      "公開デモではデータの追加・更新・削除はできません。",
    );
    expect(error.code).toBe("READ_ONLY_DEMO");
    expect(error.requestId).toBe("request-123");
  });

  it("falls back to the provided message when the API error has no details", () => {
    const error = new ApiError(500, "Internal Server Error");

    expect(getApiErrorMessage(error, "保存に失敗しました。")).toBe("保存に失敗しました。");
  });

  it("keeps the API error code and request id for diagnostics", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            code: "JOB_VALIDATION_FAILED",
            errors: [ "会社名を入力してください。" ],
            request_id: "request-456",
          }),
          { status: 422, headers: { "Content-Type": "application/json" } },
        ),
      ),
    );

    await expect(requestJson("/api/jobs", { method: "POST" })).rejects.toMatchObject({
      status: 422,
      code: "JOB_VALIDATION_FAILED",
      requestId: "request-456",
      errors: [ "会社名を入力してください。" ],
    });

    vi.unstubAllGlobals();
  });
});
