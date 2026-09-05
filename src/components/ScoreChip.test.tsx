import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import ScoreChip from "./ScoreChip";

describe("ScoreChip", () => {
  it("renders the score value", () => {
    render(<ScoreChip score={75} />);
    expect(screen.getByText("75")).toBeInTheDocument();
  });

  it("shows the recommended badge when recommended is true", () => {
    render(<ScoreChip score={60} recommended />);
    expect(screen.getByText("60")).toBeInTheDocument();
    expect(screen.getByText("上位候補")).toBeInTheDocument();
  });

  it("does not show the recommended badge by default", () => {
    render(<ScoreChip score={30} />);
    expect(screen.queryByText("上位候補")).not.toBeInTheDocument();
  });

  it("applies success color for score >= 50", () => {
    const { container } = render(<ScoreChip score={50} />);
    const chip = container.querySelector(".MuiChip-colorSuccess");
    expect(chip).toBeInTheDocument();
  });

  it("applies warning color for score >= 20 and < 50", () => {
    const { container } = render(<ScoreChip score={35} />);
    const chip = container.querySelector(".MuiChip-colorWarning");
    expect(chip).toBeInTheDocument();
  });

  it("applies default color for score >= 0 and < 20", () => {
    const { container } = render(<ScoreChip score={10} />);
    const chip = container.querySelector(".MuiChip-colorDefault");
    expect(chip).toBeInTheDocument();
  });

  it("applies error color for negative score", () => {
    const { container } = render(<ScoreChip score={-5} />);
    const chip = container.querySelector(".MuiChip-colorError");
    expect(chip).toBeInTheDocument();
  });
});
