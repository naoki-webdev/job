import { memo, useEffect, useRef, useState } from "react";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Switch from "@mui/material/Switch";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";

import { t } from "../i18n";
import { requiredInputMessage, scrollToFirstInvalidField } from "../utils/formValidation";
import type { EvaluationKeywordItem, EvaluationKeywordPayload } from "../types/job";
import {
  type EvaluationKeywordDraft,
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
  const [attemptedRows, setAttemptedRows] = useState<Record<number, boolean>>({});
  const [newItemAttempted, setNewItemAttempted] = useState(false);
  const [scrollAttempt, setScrollAttempt] = useState(0);
  const rowRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const newItemRef = useRef<HTMLDivElement>(null);
  const scrollTargetRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (scrollAttempt > 0) scrollToFirstInvalidField(scrollTargetRef.current);
  }, [scrollAttempt]);

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
            <Box
              key={item.id}
              ref={(element: HTMLDivElement | null) => { rowRefs.current[item.id] = element; }}
              sx={{ py: 1.25, borderBottom: 1, borderColor: "divider" }}
            >
            <Stack spacing={1.25}>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                <TextField
                  size="small"
                  label={t("evaluation_keywords.pattern")}
                  value={draft.pattern}
                  onChange={(event) => updateDraft(item.id, "pattern", event.target.value)}
                  required
                  error={Boolean(attemptedRows[item.id] && !draft.pattern.trim())}
                  helperText={attemptedRows[item.id] && !draft.pattern.trim() ? requiredInputMessage(t("evaluation_keywords.pattern")) : " "}
                  data-field-error={attemptedRows[item.id] && !draft.pattern.trim() ? "true" : undefined}
                  sx={{ flex: 1 }}
                />
                <TextField
                  size="small"
                  label={t("evaluation_keywords.label")}
                  value={draft.label}
                  onChange={(event) => updateDraft(item.id, "label", event.target.value)}
                  required
                  error={Boolean(attemptedRows[item.id] && !draft.label.trim())}
                  helperText={attemptedRows[item.id] && !draft.label.trim() ? requiredInputMessage(t("evaluation_keywords.label")) : " "}
                  data-field-error={attemptedRows[item.id] && !draft.label.trim() ? "true" : undefined}
                  sx={{ flex: 1 }}
                />
                <TextField
                  size="small"
                  label={t("master_data.order")}
                  type="number"
                  value={draft.display_order}
                  onChange={(event) => updateDraft(item.id, "display_order", parseNumericInput(event.target.value))}
                  required
                  error={Boolean(attemptedRows[item.id] && draft.display_order === "")}
                  helperText={attemptedRows[item.id] && draft.display_order === "" ? requiredInputMessage(t("master_data.order")) : " "}
                  data-field-error={attemptedRows[item.id] && draft.display_order === "" ? "true" : undefined}
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
                      if (!payload) {
                        setAttemptedRows((prev) => ({ ...prev, [item.id]: true }));
                        scrollTargetRef.current = rowRefs.current[item.id] ?? null;
                        setScrollAttempt((attempt) => attempt + 1);
                        return;
                      }
                      setAttemptedRows((prev) => ({ ...prev, [item.id]: false }));
                      void onUpdate(item.id, payload);
                    }}
                    disabled={submitting}
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

      <Box ref={newItemRef} sx={{ pt: 0.25 }}>
        <Stack spacing={1.25}>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
            <TextField
              size="small"
              label={t("evaluation_keywords.pattern")}
              placeholder={t("evaluation_keywords.pattern_placeholder")}
              value={newItem.pattern}
              onChange={(event) => onNewItemChange({ ...newItem, pattern: event.target.value })}
              required
              error={Boolean(newItemAttempted && !newItem.pattern.trim())}
              helperText={newItemAttempted && !newItem.pattern.trim() ? requiredInputMessage(t("evaluation_keywords.pattern")) : " "}
              data-field-error={newItemAttempted && !newItem.pattern.trim() ? "true" : undefined}
              sx={{ flex: 1 }}
            />
            <TextField
              size="small"
              label={t("evaluation_keywords.label")}
              placeholder={t("evaluation_keywords.label_placeholder")}
              value={newItem.label}
              onChange={(event) => onNewItemChange({ ...newItem, label: event.target.value })}
              required
              error={Boolean(newItemAttempted && !newItem.label.trim())}
              helperText={newItemAttempted && !newItem.label.trim() ? requiredInputMessage(t("evaluation_keywords.label")) : " "}
              data-field-error={newItemAttempted && !newItem.label.trim() ? "true" : undefined}
              sx={{ flex: 1 }}
            />
            <TextField
              size="small"
              label={t("master_data.order")}
              type="number"
              value={newItem.display_order}
              onChange={(event) => onNewItemChange({ ...newItem, display_order: parseNumericInput(event.target.value) })}
              required
              error={Boolean(newItemAttempted && newItem.display_order === "")}
              helperText={newItemAttempted && newItem.display_order === "" ? requiredInputMessage(t("master_data.order")) : " "}
              data-field-error={newItemAttempted && newItem.display_order === "" ? "true" : undefined}
              sx={{ width: { xs: "100%", sm: 104 } }}
            />
          </Stack>
          <Stack direction="row" justifyContent="flex-end">
            <Button
              variant="contained"
              aria-label={t("evaluation_keywords.add_item", { section: title })}
              onClick={() => {
                const payload = toEvaluationKeywordPayload(newItem);
                if (!payload) {
                  setNewItemAttempted(true);
                  scrollTargetRef.current = newItemRef.current;
                  setScrollAttempt((attempt) => attempt + 1);
                  return;
                }
                setNewItemAttempted(false);
                void onCreate(payload);
              }}
              disabled={submitting}
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
