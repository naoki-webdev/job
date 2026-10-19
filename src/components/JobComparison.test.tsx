import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import JobComparison from "./JobComparison";
import { fetchJob } from "../api/jobRequests";
import { buildJob } from "../test/fixtures";
import type { Job } from "../types/job";

vi.mock("../api/jobRequests", () => ({ fetchJob: vi.fn() }));
const job = buildJob();
function deferred() {
  let resolve!: (job: Job) => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<Job>((res, rej) => { resolve = res; reject = rej; });
  return { promise, resolve, reject };
}
function open() {
  render(<JobComparison jobs={[job]} />);
  fireEvent.click(screen.getByRole("button", { name: "比較する求人を選ぶ" }));
  return screen.getByRole("checkbox");
}
beforeEach(() => vi.resetAllMocks());
describe("JobComparison", () => {
  it("checks immediately while the detail request is pending, then fills the detail", async () => {
    const request = deferred();
    vi.mocked(fetchJob).mockReturnValue(request.promise);
    const checkbox = open();
    fireEvent.click(checkbox);
    expect(checkbox).toBeChecked();
    await act(async () => request.resolve(buildJob({ next_action: "面接日を決める" })));
    expect(screen.getByText("面接日を決める")).toBeInTheDocument();
  });
  it("rolls back the selection and reports a failed request", async () => {
    const request = deferred();
    vi.mocked(fetchJob).mockReturnValue(request.promise);
    const checkbox = open();
    fireEvent.click(checkbox);
    await act(async () => request.reject(new Error("offline")));
    expect(checkbox).not.toBeChecked();
    expect(screen.getByRole("alert")).toHaveTextContent("比較用の求人を取得できませんでした。");
  });
  it("does not restore a selection cleared during a pending request", async () => {
    const request = deferred();
    vi.mocked(fetchJob).mockReturnValue(request.promise);
    const checkbox = open();
    fireEvent.click(checkbox);
    fireEvent.click(screen.getByRole("button", { name: "比較を解除" }));
    await act(async () => request.resolve(job));
    expect(checkbox).not.toBeChecked();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });
  it("ignores an older failure after the same job is selected again", async () => {
    const oldRequest = deferred();
    const newRequest = deferred();
    vi.mocked(fetchJob).mockReturnValueOnce(oldRequest.promise).mockReturnValueOnce(newRequest.promise);
    const checkbox = open();
    fireEvent.click(checkbox);
    fireEvent.click(checkbox);
    fireEvent.click(checkbox);
    await act(async () => newRequest.resolve(buildJob({ next_action: "応募する" })));
    await act(async () => oldRequest.reject(new Error("old request")));
    expect(checkbox).toBeChecked();
    expect(screen.getByText("応募する")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});
