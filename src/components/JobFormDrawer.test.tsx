import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import JobFormDrawer from "./JobFormDrawer";
import { buildJob } from "../test/fixtures";

const positions = [
  { id: 1, name: "バックエンドエンジニア", score_weight: 8, active: true, display_order: 0 },
  { id: 2, name: "テックリード", score_weight: 15, active: true, display_order: 1 },
  { id: 3, name: "アーカイブ済み職種", score_weight: 5, active: false, display_order: 2 },
];

const locations = [
  { id: 1, name: "東京", score_weight: 6, active: true, display_order: 0 },
  { id: 2, name: "リモート", score_weight: 12, active: true, display_order: 1 },
  { id: 3, name: "旧拠点", score_weight: 2, active: false, display_order: 2 },
];

const techStacks = [
  { id: 1, name: "Ruby on Rails", score_weight: 20, active: true, display_order: 0 },
  { id: 2, name: "TypeScript", score_weight: 15, active: true, display_order: 1 },
  { id: 3, name: "React", score_weight: 8, active: true, display_order: 2 },
  { id: 4, name: "旧技術", score_weight: 1, active: false, display_order: 3 },
];

const defaultProps = {
  open: true,
  mode: "create" as const,
  initialJob: null,
  positions,
  locations,
  techStacks,
  submitting: false,
  submitError: null,
  onClose: vi.fn(),
  onSubmit: vi.fn(),
};

async function openSelect(label: string) {
  fireEvent.mouseDown(screen.getByLabelText(label));
}

async function chooseSingleOption(user: ReturnType<typeof userEvent.setup>, label: string, option: string) {
  await openSelect(label);
  await user.click(await screen.findByRole("option", { name: option }));
}

async function chooseMultipleOptions(user: ReturnType<typeof userEvent.setup>, label: string, options: string[]) {
  await openSelect(label);
  for (const option of options) {
    await user.click(await screen.findByRole("option", { name: option }));
  }
  await user.keyboard("{Escape}");
}

describe("JobFormDrawer", () => {
  it("renders the create form with default values", () => {
    render(<JobFormDrawer {...defaultProps} />);

    expect(screen.getByRole("heading", { name: "求人を新規作成" })).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "会社名" })).toHaveValue("");
    expect(screen.getByLabelText("選考状況")).toHaveTextContent("気になる");
    expect(screen.getByLabelText("働き方")).toHaveTextContent("ハイブリッド");
    expect(screen.getByLabelText("雇用形態")).toHaveTextContent("正社員");
    expect(screen.getByRole("spinbutton", { name: "年収下限" })).toHaveValue(4_500_000);
    expect(screen.getByRole("spinbutton", { name: "年収上限" })).toHaveValue(6_000_000);
  });

  it("shows required validation errors and blocks submit when required fields are missing", async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();

    render(<JobFormDrawer {...defaultProps} onSubmit={onSubmit} />);

    await user.click(screen.getByRole("button", { name: "保存" }));

    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getAllByText("入力してください。")).toHaveLength(4);
  });

  it("submits a normalized payload from the form fields", async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();

    render(<JobFormDrawer {...defaultProps} onSubmit={onSubmit} />);

    fireEvent.change(screen.getByRole("textbox", { name: "会社名" }), {
      target: { value: "株式会社テスト" },
    });
    await chooseSingleOption(user, "職種", "テックリード");
    await chooseSingleOption(user, "働き方", "フルリモート");
    await chooseSingleOption(user, "雇用形態", "契約社員");

    const salaryMin = screen.getByRole("spinbutton", { name: "年収下限" });
    const salaryMax = screen.getByRole("spinbutton", { name: "年収上限" });
    fireEvent.change(salaryMin, { target: { value: "7000000" } });
    fireEvent.change(salaryMax, { target: { value: "9000000" } });

    await chooseMultipleOptions(user, "技術スタック", ["Ruby on Rails", "React"]);
    await chooseSingleOption(user, "勤務地", "リモート");
    fireEvent.change(screen.getByRole("textbox", { name: "メモ" }), {
      target: { value: "比較優先度が高い求人です。" },
    });

    await user.click(screen.getByRole("button", { name: "保存" }));

    expect(onSubmit).toHaveBeenCalledWith({
      company_name: "株式会社テスト",
      position_id: 2,
      status: "interested",
      work_style: "full_remote",
      employment_type: "contract",
      salary_min: 7_000_000,
      salary_max: 9_000_000,
      tech_stack_ids: [1, 3],
      location_id: 2,
      notes: "比較優先度が高い求人です。",
      source_url: null,
    });
  }, 10000);

  it("includes a selected company logo in the submit payload", async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    const logo = new File(["logo"], "logo.png", { type: "image/png" });

    render(<JobFormDrawer {...defaultProps} mode="edit" initialJob={buildJob()} onSubmit={onSubmit} />);

    await user.upload(screen.getByLabelText("画像を選択"), logo);
    await user.click(screen.getByRole("button", { name: "保存" }));

    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({
      company_logo: logo,
    }));
  });

  it("marks the existing company logo for removal", async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();

    render(
      <JobFormDrawer
        {...defaultProps}
        mode="edit"
        initialJob={buildJob({
          company_logo_url: "http://localhost:3000/rails/active_storage/blobs/redirect/logo",
          company_logo_filename: "logo.png",
        })}
        onSubmit={onSubmit}
      />,
    );

    await user.click(screen.getByRole("button", { name: "画像を削除" }));
    await user.click(screen.getByRole("button", { name: "保存" }));

    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({
      remove_company_logo: true,
    }));
  });

  it("applies the selected job values in edit mode", async () => {
    render(
      <JobFormDrawer
        {...defaultProps}
        mode="edit"
        initialJob={buildJob({
          company_name: "編集対象の会社",
          position_id: 2,
          position: "テックリード",
          work_style: "onsite",
          employment_type: "contract",
          salary_min: 6_200_000,
          salary_max: 8_100_000,
          tech_stack_ids: [2, 3],
          tech_stack: "TypeScript, React",
          location_id: 2,
          location: "リモート",
          notes: "既存メモ",
        })}
      />,
    );

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "求人を編集" })).toBeInTheDocument();
    });

    expect(screen.getByRole("textbox", { name: "会社名" })).toHaveValue("編集対象の会社");
    expect(screen.getByLabelText("職種")).toHaveTextContent("テックリード");
    expect(screen.getByLabelText("働き方")).toHaveTextContent("フル出社");
    expect(screen.getByLabelText("雇用形態")).toHaveTextContent("契約社員");
    expect(screen.getByRole("spinbutton", { name: "年収下限" })).toHaveValue(6_200_000);
    expect(screen.getByRole("spinbutton", { name: "年収上限" })).toHaveValue(8_100_000);
    expect(screen.getByLabelText("技術スタック")).toHaveTextContent("TypeScript, React");
    expect(screen.getByLabelText("勤務地")).toHaveTextContent("リモート");
    expect(screen.getByRole("textbox", { name: "メモ" })).toHaveValue("既存メモ");
  });

  it("keeps currently selected inactive master data available in edit mode", async () => {
    render(
      <JobFormDrawer
        {...defaultProps}
        mode="edit"
        initialJob={buildJob({
          position_id: 3,
          position: "アーカイブ済み職種",
          location_id: 3,
          location: "旧拠点",
          tech_stack_ids: [4],
          tech_stack: "旧技術",
        })}
      />,
    );

    await waitFor(() => {
      expect(screen.getByLabelText("職種")).toHaveTextContent("アーカイブ済み職種 (無効)");
    });

    expect(screen.getByLabelText("勤務地")).toHaveTextContent("旧拠点 (無効)");
    expect(screen.getByLabelText("技術スタック")).toHaveTextContent("旧技術 (無効)");
  });
});
