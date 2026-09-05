import { memo, useEffect, useState } from "react";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Switch from "@mui/material/Switch";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";

import { t } from "../i18n";
import type { MasterDataItem, MasterDataPayload } from "../types/job";
import {
  type MasterDataDraft,
  isValidMasterDataDraft,
  parseNumericInput,
  toMasterDataPayload,
} from "./masterDataDrafts";

type MasterDataSectionProps = {
  title: string;
  nameLabel: string;
  namePlaceholder: string;
  items: MasterDataItem[];
  newItem: MasterDataDraft;
  submitting: boolean;
  onNewItemChange: (payload: MasterDataDraft) => void;
  onCreate: (payload: MasterDataPayload) => Promise<void> | void;
  onUpdate: (id: number, payload: MasterDataPayload) => Promise<void> | void;
  onDelete: (id: number) => Promise<void> | void;
};

function MasterDataSection({
  title,
  nameLabel,
  namePlaceholder,
  items,
  newItem,
  submitting,
  onNewItemChange,
  onCreate,
  onUpdate,
  onDelete,
}: MasterDataSectionProps) {
  const [drafts, setDrafts] = useState<Record<number, MasterDataDraft>>({});

  useEffect(() => {
    const nextDrafts: Record<number, MasterDataDraft> = {};
    items.forEach((item) => {
      nextDrafts[item.id] = {
        name: item.name,
        score_weight: item.score_weight,
        active: item.active,
        display_order: item.display_order,
      };
    });
    setDrafts(nextDrafts);
  }, [items]);

  const updateDraft = (id: number, key: keyof MasterDataDraft, value: MasterDataDraft[keyof MasterDataDraft]) => {
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
            name: item.name,
            score_weight: item.score_weight,
            active: item.active,
            display_order: item.display_order,
          };

          return (
            <Box key={item.id} sx={{ py: 1.25, borderBottom: 1, borderColor: "divider" }}>
            <Stack spacing={1.25}>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                <TextField
                  size="small"
                  label={nameLabel}
                  placeholder={namePlaceholder}
                  value={draft.name}
                  onChange={(event) => updateDraft(item.id, "name", event.target.value)}
                  sx={{ flex: 1 }}
                />
                <TextField
                  size="small"
                  label={t("master_data.weight")}
                  type="number"
                  value={draft.score_weight}
                  onChange={(event) => updateDraft(item.id, "score_weight", parseNumericInput(event.target.value))}
                  sx={{ width: { xs: "100%", sm: 116 } }}
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
                    aria-label={t("master_data.save_item", { name: draft.name || item.name })}
                    onClick={() => {
                      const payload = toMasterDataPayload(draft);
                      if (!payload) return;
                      void onUpdate(item.id, payload);
                    }}
                    disabled={submitting || !isValidMasterDataDraft(draft)}
                  >
                    {t("actions.save")}
                  </Button>
                  <Button
                    color="error"
                    variant="text"
                    aria-label={t("master_data.delete_or_disable", { name: item.name })}
                    onClick={() => void onDelete(item.id)}
                    disabled={submitting}
                  >
                    {t("master_data.delete_or_disable_action")}
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
              label={nameLabel}
              placeholder={namePlaceholder}
              value={newItem.name}
              onChange={(event) => onNewItemChange({ ...newItem, name: event.target.value })}
              sx={{ flex: 1 }}
            />
            <TextField
              size="small"
              label={t("master_data.weight")}
              type="number"
              value={newItem.score_weight}
              onChange={(event) => onNewItemChange({ ...newItem, score_weight: parseNumericInput(event.target.value) })}
              sx={{ width: { xs: "100%", sm: 116 } }}
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
              aria-label={t("master_data.add_item", { section: title })}
              onClick={() => {
                const payload = toMasterDataPayload(newItem);
                if (!payload) return;
                void onCreate(payload);
              }}
              disabled={submitting || !isValidMasterDataDraft(newItem)}
            >
              {t("actions.add_master_data")}
            </Button>
          </Stack>
        </Stack>
      </Box>
    </Stack>
  );
}

export default memo(MasterDataSection);
