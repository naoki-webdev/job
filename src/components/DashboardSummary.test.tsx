import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import DashboardSummary from "./DashboardSummary";

const items = [
  { key: "total" as const, value: 40, caption: "現在の検索条件に一致する求人件数" },
  { key: "remote_friendly" as const, value: 25, caption: "フルリモート・ハイブリッドの合計" },
  { key: "active_pipeline" as const, value: 30, caption: "気になる・応募済み・面接中の合計" },
  { key: "high_score" as const, value: 12, caption: "評価ポイント50以上の件数" },
];

describe("DashboardSummary", () => {
  it("renders all summary values in one segmented summary bar", () => {
    render(<DashboardSummary items={items} />);

    expect(screen.getByTestId("dashboard-summary")).toBeInTheDocument();
    expect(screen.getAllByTestId("dashboard-summary-item")).toHaveLength(4);
    expect(screen.getByText("40")).toBeInTheDocument();
    expect(screen.getByText("25")).toBeInTheDocument();
    expect(screen.getByText("30")).toBeInTheDocument();
    expect(screen.getByText("12")).toBeInTheDocument();
  });

  it("renders translated labels for each card", () => {
    render(<DashboardSummary items={items} />);

    expect(screen.getAllByText("求人件数").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("リモート").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("選考中").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("高評価").length).toBeGreaterThanOrEqual(1);
  });

  it("exposes summary explanations through help buttons", () => {
    render(<DashboardSummary items={items} />);

    expect(screen.getByRole("button", { name: "求人件数について" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "リモートについて" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "選考中について" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "高評価について" })).toBeInTheDocument();
  });

  it("renders an empty grid when no items are provided", () => {
    const { container } = render(<DashboardSummary items={[]} />);
    const cards = container.querySelectorAll(".MuiTypography-h5");
    expect(cards).toHaveLength(0);
    expect(screen.getByTestId("dashboard-summary")).toBeInTheDocument();
  });
});
