import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import AppShell from "./AppShell";

describe("AppShell", () => {
  it("keeps the app title and settings navigation without redundant current-page labels", () => {
    render(
      <AppShell
        readOnly={false}
        onCreateJob={vi.fn()}
        onImportJob={vi.fn()}
        onOpenSettings={vi.fn()}
        onSignOut={vi.fn()}
      >
        <main>コンテンツ</main>
      </AppShell>,
    );

    expect(screen.getByRole("heading", { name: "求人比較", level: 1 })).toBeInTheDocument();
    expect(screen.queryByText("求人比較ワークスペース")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "求人一覧" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "スコア設定" })).toBeInTheDocument();
  });
});
