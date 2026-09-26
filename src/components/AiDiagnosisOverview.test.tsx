import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { buildJob } from "../test/fixtures";
import AiDiagnosisOverview from "./AiDiagnosisOverview";

describe("AiDiagnosisOverview", () => {
  it("renders a compact overview and ranking without the three-step explanation", () => {
    render(
      <AiDiagnosisOverview
        jobs={[
          buildJob({ id: 1, company_name: "A社", score: 58 }),
          buildJob({ id: 2, company_name: "B社", score: 86 }),
        ]}
        onSelectJob={vi.fn()}
      />,
    );

    expect(screen.getByText("おすすめ求人")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "おすすめ求人について" })).toBeInTheDocument();
    expect(screen.getByText("B社")).toBeInTheDocument();
    expect(screen.queryByText("求人票を入力")).not.toBeInTheDocument();
    expect(screen.queryByText("求人情報の整理")).not.toBeInTheDocument();
    expect(screen.getByTestId("ranking-job-group")).toBeInTheDocument();
    expect(screen.getAllByTestId("ranking-job-card")).toHaveLength(2);
  });

  it("opens selected ranking jobs from the panel", async () => {
    const user = userEvent.setup();
    const onSelectJob = vi.fn();

    render(
      <AiDiagnosisOverview
        jobs={[buildJob({ id: 9, company_name: "選択対象", score: 92 })]}
        onSelectJob={onSelectJob}
      />,
    );

    await user.click(screen.getByRole("button", { name: /選択対象/ }));

    expect(onSelectJob).toHaveBeenCalledWith(9);
  });

  it("shows the strongest score reason on ranking cards", () => {
    render(
      <AiDiagnosisOverview
        jobs={[buildJob({ id: 9, company_name: "理由付き求人" })]}
        onSelectJob={vi.fn()}
      />,
    );

    expect(screen.getByText("◎ フルリモート")).toBeInTheDocument();
    expect(screen.queryByText("◎ Ruby on Rails")).not.toBeInTheDocument();
  });

  it("does not render a duplicated import action", () => {
    render(
      <AiDiagnosisOverview
        jobs={[]}
        onSelectJob={vi.fn()}
      />,
    );

    expect(screen.queryByRole("button", { name: "求人本文から取り込み" })).not.toBeInTheDocument();
  });
});
