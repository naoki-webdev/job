import { memo, useEffect, useState } from "react";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Switch from "@mui/material/Switch";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";

import { t } from "../i18n";
import type { EvaluationKeywordItem, EvaluationKeywordPayload } from "../types/job";
import {
  type EvaluationKeywordDraft,
  isValidEvaluationKeywordDraft,
  parseNumericInput,
  toEvaluationKeywordPayload,
} from "./masterDataDrafts";

type EvaluationKeywordSectionProps = {
  title: string;
  items: EvaluationKeywordItem[];
  newItem: EvaluationKeywordDraft;
  submitting: boolean;
  onNewItemChange: (payload: EvaluationKeywordDraft) => void;
  onCreate: (payload: EvaluationKeywordPayload) => Promise<void> | void;
  onUpdate: (id: number, payload: EvaluationKeywordPayload) => Promise<void> | void;
  onDelete: (id: number) => Promise<void> | void;
};

function EvaluationKeywordSection({
  title,
  items,
  newItem,
  submitting,
  onNewItemChange,
  onCreate,
  onUpdate,
  onDelete,
}: EvaluationKeywordSectionProps) {
  const [drafts, setDrafts] = useState<Record<number, EvaluationKeywordDraft>>({});

  useEffect(() => {
    const nextDrafts: Record<number, EvaluationKeywordDraft> = {};
    items.forEach((item) => {
      nextDrafts[item.id] = {
        pattern: item.pattern,
        label: item.label,
        active: item.active,
        display_order: item.display_order,
      };
    });
    setDrafts(nextDrafts);
  }, [items]);

  const updateDraft = (
    id: number,
    key: keyof EvaluationKeywordDraft,
    value: EvaluationKeywordDraft[keyof EvaluationKeywordDraft],
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
      <Typography variant="subtitle2">{title}</Typography>
      <Box sx={{ borderTop: 1, borderColor: "divider" }}>
        {items.map((item) => {
          const draft = drafts[item.id] ?? {
            pattern: item.pattern,
            label: item.label,
            active: item.active,
            display_order: item.display_order,
          };

          return (
            <Box key={item.id} sx={{ py: 1.25, borderBottom: 1, borderColor: "divider" }}>
            <Stack spacing={1.25}>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                <TextField
                  size="small"
                  label={t("evaluation_keywords.pattern")}
                  value={draft.pattern}
                  onChange={(event) => updateDraft(item.id, "pattern", event.target.value)}
                  sx={{ flex: 1 }}
                />
                <TextField
                  size="small"
                  label={t("evaluation_keywords.label")}
                  value={draft.label}
                  onChange={(event) => updateDraft(item.id, "label", event.target.value)}
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
                    aria-label={t("evaluation_keywords.save_item", { name: draft.pattern || item.pattern })}
                    onClick={() => {
                      const payload = toEvaluationKeywordPayload(draft);
                      if (!payload) return;
                      void onUpdate(item.id, payload);
                    }}
                    disabled={submitting || !isValidEvaluationKeywordDraft(draft)}
                  >
                    {t("actions.save")}
                  </Button>
                  <Button
                    color="error"
                    variant="text"
                    aria-label={t("evaluation_keywords.delete_item", { name: item.pattern })}
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
              label={t("evaluation_keywords.pattern")}
              placeholder={t("evaluation_keywords.pattern_placeholder")}
              value={newItem.pattern}
              onChange={(event) => onNewItemChange({ ...newItem, pattern: event.target.value })}
              sx={{ flex: 1 }}
            />
            <TextField
              size="small"
              label={t("evaluation_keywords.label")}
              placeholder={t("evaluation_keywords.label_placeholder")}
              value={newItem.label}
              onChange={(event) => onNewItemChange({ ...newItem, label: event.target.value })}
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
              aria-label={t("evaluation_keywords.add_item", { section: title })}
              onClick={() => {
                const payload = toEvaluationKeywordPayload(newItem);
                if (!payload) return;
                void onCreate(payload);
              }}
              disabled={submitting || !isValidEvaluationKeywordDraft(newItem)}
            >
              {t("actions.add_master_data")}
            </Button>
          </Stack>
        </Stack>
      </Box>
    </Stack>
  );
}

export default memo(EvaluationKeywordSection);
