import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import JobListPanel from "./JobListPanel";

describe("JobListPanel", () => {
  it("renders one consolidated heading, count, filters, and table content", () => {
    render(
      <JobListPanel totalCount={40} filters={<div>filters</div>}>
        <div>table</div>
      </JobListPanel>,
    );

    expect(screen.getAllByRole("heading", { name: "求人一覧" })).toHaveLength(1);
    expect(screen.getByText("40件")).toBeInTheDocument();
    expect(screen.getByText("filters")).toBeInTheDocument();
    expect(screen.getByText("table")).toBeInTheDocument();
  });
});
