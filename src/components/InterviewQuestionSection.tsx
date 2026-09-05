import { memo, useEffect, useState } from "react";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Switch from "@mui/material/Switch";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";

import { t } from "../i18n";
import type { InterviewQuestionItem, InterviewQuestionPayload } from "../types/job";
import {
  type InterviewQuestionDraft,
  isValidInterviewQuestionDraft,
  parseNumericInput,
  toInterviewQuestionPayload,
} from "./masterDataDrafts";

type InterviewQuestionSectionProps = {
  items: InterviewQuestionItem[];
  newItem: InterviewQuestionDraft;
  submitting: boolean;
  onNewItemChange: (payload: InterviewQuestionDraft) => void;
  onCreate: (payload: InterviewQuestionPayload) => Promise<void> | void;
  onUpdate: (id: number, payload: InterviewQuestionPayload) => Promise<void> | void;
  onDelete: (id: number) => Promise<void> | void;
};

function InterviewQuestionSection({
  items,
  newItem,
  submitting,
  onNewItemChange,
  onCreate,
  onUpdate,
  onDelete,
}: InterviewQuestionSectionProps) {
  const [drafts, setDrafts] = useState<Record<number, InterviewQuestionDraft>>({});

  useEffect(() => {
    const nextDrafts: Record<number, InterviewQuestionDraft> = {};
    items.forEach((item) => {
      nextDrafts[item.id] = {
        body: item.body,
        active: item.active,
        display_order: item.display_order,
      };
    });
    setDrafts(nextDrafts);
  }, [items]);

  const updateDraft = (
    id: number,
    key: keyof InterviewQuestionDraft,
    value: InterviewQuestionDraft[keyof InterviewQuestionDraft],
  ) => {
    setDrafts((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        [key]: value,
      },
    }));
  };

  return (
    <Stack spacing={1.25}>
      <Typography variant="subtitle2">{t("interview_questions.title")}</Typography>
      <Box sx={{ borderTop: 1, borderColor: "divider" }}>
        {items.map((item) => {
          const draft = drafts[item.id] ?? {
            body: item.body,
            active: item.active,
            display_order: item.display_order,
          };

          return (
            <Box key={item.id} sx={{ py: 1.25, borderBottom: 1, borderColor: "divider" }}>
            <Stack spacing={1.25}>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                <TextField
                  size="small"
                  label={t("interview_questions.body")}
                  value={draft.body}
                  onChange={(event) => updateDraft(item.id, "body", event.target.value)}
                  sx={{ flex: 1 }}
                />
                <TextField
                  size="small"
                  label={t("master_data.order")}
                  type="number"
                  value={draft.display_order}
                  onChange={(event) => updateDraft(item.id, "display_order", parseNumericInput(event.target.value))}
                  sx={{ width: { xs: "100%", sm: 104 } }}
                />
              </Stack>

              <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
                <Stack direction="row" spacing={0.75} alignItems="center">
                  <Typography variant="caption" color="text.secondary">
                    {t("master_data.active")}
                  </Typography>
                  <Switch
                    checked={draft.active}
                    onChange={(_event, checked) => updateDraft(item.id, "active", checked)}
                  />
                </Stack>

                <Stack direction="row" spacing={1}>
                  <Button
                    variant="outlined"
                    aria-label={t("interview_questions.save_item", { name: draft.body || item.body })}
                    onClick={() => {
                      const payload = toInterviewQuestionPayload(draft);
                      if (!payload) return;
                      void onUpdate(item.id, payload);
                    }}
                    disabled={submitting || !isValidInterviewQuestionDraft(draft)}
                  >
                    {t("actions.save")}
                  </Button>
                  <Button
                    color="error"
                    variant="text"
                    aria-label={t("interview_questions.delete_item", { name: item.body })}
                    onClick={() => void onDelete(item.id)}
                    disabled={submitting}
                  >
                    {t("common.delete")}
                  </Button>
                </Stack>
              </Stack>
            </Stack>
            </Box>
          );
        })}
      </Box>

      <Box sx={{ pt: 0.25 }}>
        <Stack spacing={1.25}>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
            <TextField
              size="small"
              label={t("interview_questions.body")}
              placeholder={t("interview_questions.body_placeholder")}
              value={newItem.body}
              onChange={(event) => onNewItemChange({ ...newItem, body: event.target.value })}
              sx={{ flex: 1 }}
            />
            <TextField
              size="small"
              label={t("master_data.order")}
              type="number"
              value={newItem.display_order}
              onChange={(event) => onNewItemChange({ ...newItem, display_order: parseNumericInput(event.target.value) })}
              sx={{ width: { xs: "100%", sm: 104 } }}
            />
          </Stack>
          <Stack direction="row" justifyContent="flex-end">
            <Button
              variant="contained"
              aria-label={t("interview_questions.add_item")}
              onClick={() => {
                const payload = toInterviewQuestionPayload(newItem);
                if (!payload) return;
                void onCreate(payload);
              }}
              disabled={submitting || !isValidInterviewQuestionDraft(newItem)}
            >
              {t("actions.add_master_data")}
            </Button>
          </Stack>
        </Stack>
      </Box>
    </Stack>
  );
}

export default memo(InterviewQuestionSection);
