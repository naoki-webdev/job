import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import JobTable from "./JobTable";
import { buildJob } from "../test/fixtures";

const defaultProps = {
  jobs: [
    buildJob({ id: 1, company_name: "株式会社A", position: "バックエンドエンジニア", score: 80 }),
    buildJob({ id: 2, company_name: "株式会社B", position: "フロントエンドエンジニア", score: 45, work_style: "hybrid", status: "applied" }),
  ],
  page: 1,
  perPage: 10,
  totalCount: 2,
  sort: "score" as const,
  direction: "desc" as const,
  onSortChange: vi.fn(),
  onPageChange: vi.fn(),
  onPerPageChange: vi.fn(),
  onRowClick: vi.fn(),
};

describe("JobTable", () => {
  it("does not repeat the job-list panel heading", () => {
    render(<JobTable {...defaultProps} />);

    expect(screen.queryByText("求人一覧")).not.toBeInTheDocument();
  });

  it("renders all column headers", () => {
    render(<JobTable {...defaultProps} />);

    expect(screen.getByText("会社名")).toBeInTheDocument();
    expect(screen.getByText("職種")).toBeInTheDocument();
    expect(screen.getByText("選考状況")).toBeInTheDocument();
    expect(screen.getByText("働き方")).toBeInTheDocument();
    expect(screen.getByText("年収")).toBeInTheDocument();
    expect(screen.getByText("評価ポイント")).toBeInTheDocument();
    expect(screen.getByText("更新日時")).toBeInTheDocument();
  });

  it("renders job data in table rows", () => {
    render(<JobTable {...defaultProps} />);

    expect(screen.getByText("株式会社A")).toBeInTheDocument();
    expect(screen.getByText("株式会社B")).toBeInTheDocument();
    expect(screen.getByText("バックエンドエンジニア")).toBeInTheDocument();
    expect(screen.getByText("フロントエンドエンジニア")).toBeInTheDocument();
  });

  it("renders the company logo thumbnail next to the company name", () => {
    render(
      <JobTable
        {...defaultProps}
        jobs={[buildJob({ company_name: "ロゴ会社", company_logo_url: "http://localhost:3000/logo.png" })]}
      />,
    );

    expect(screen.getByRole("img", { name: "ロゴ会社 ロゴ" })).toBeInTheDocument();
  });

  it("renders the company initial when no logo is set", () => {
    render(<JobTable {...defaultProps} jobs={[buildJob({ company_name: "株式会社A" })]} />);

    expect(screen.getByText("株")).toBeInTheDocument();
  });

  it("renders translated status and work style", () => {
    render(<JobTable {...defaultProps} />);

    expect(screen.getByText("気になる")).toBeInTheDocument();
    expect(screen.getByText("応募済み")).toBeInTheDocument();
    expect(screen.getByText("フルリモート")).toBeInTheDocument();
    expect(screen.getByText("ハイブリッド")).toBeInTheDocument();
  });

  it("does not repeat the recommended badge in the job table", () => {
    render(<JobTable {...defaultProps} />);
    expect(screen.queryByText("上位候補")).not.toBeInTheDocument();
  });

  it("calls onRowClick with the job id when a row is clicked", async () => {
    const user = userEvent.setup();
    render(<JobTable {...defaultProps} />);

    await user.click(screen.getByText("株式会社A"));
    expect(defaultProps.onRowClick).toHaveBeenCalledWith(1);
  });

  it("opens a job row with the keyboard", async () => {
    const user = userEvent.setup();
    render(<JobTable {...defaultProps} />);

    await user.click(screen.getByRole("row", { name: /株式会社A/ }));
    await user.keyboard("{Enter}");

    expect(defaultProps.onRowClick).toHaveBeenCalledWith(1);
  });

  it("calls onSortChange when a column header is clicked", async () => {
    const onSortChange = vi.fn();
    const user = userEvent.setup();
    render(<JobTable {...defaultProps} onSortChange={onSortChange} />);

    await user.click(screen.getByText("会社名"));
    expect(onSortChange).toHaveBeenCalledWith("company_name", "asc");
  });

  it("toggles sort direction when the active sort column is clicked", async () => {
    const onSortChange = vi.fn();
    const user = userEvent.setup();
    render(<JobTable {...defaultProps} sort="score" direction="asc" onSortChange={onSortChange} />);

    await user.click(screen.getByText("評価ポイント"));
    expect(onSortChange).toHaveBeenCalledWith("score", "desc");
  });

  it("renders the empty state when there are no jobs", () => {
    render(<JobTable {...defaultProps} jobs={[]} totalCount={0} />);

    expect(screen.getByText("条件に一致する求人がありません。")).toBeInTheDocument();
    expect(screen.getByText("キーワードやフィルタ条件をゆるめて再検索してください。")).toBeInTheDocument();
  });

  it("does not render the table when the list is empty", () => {
    render(<JobTable {...defaultProps} jobs={[]} totalCount={0} />);
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });
});
