import { memo } from "react";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import ListItemText from "@mui/material/ListItemText";
import MenuItem from "@mui/material/MenuItem";
import OutlinedInput from "@mui/material/OutlinedInput";
import Select from "@mui/material/Select";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";

import { JOB_STATUS_OPTIONS, WORK_STYLE_OPTIONS } from "../constants/jobOptions";
import { t } from "../i18n";
import type { JobStatus, WorkStyle } from "../types/job";
import OverflowTooltipText from "./OverflowTooltipText";

function normalizeMultiSelectValue(value: string[] | string) {
  return typeof value === "string" ? value.split(",") : value;
}

function summarizeStatuses(statuses: JobStatus[]) {
  return statuses.map((status) => t(`enums.job_status.${status}`)).join(", ");
}

function summarizeWorkStyles(workStyles: WorkStyle[]) {
  return workStyles.map((workStyle) => t(`enums.work_style.${workStyle}`)).join(", ");
}

type JobFiltersProps = {
  keyword: string;
  statuses: JobStatus[];
  workStyles: WorkStyle[];
  onKeywordChange: (value: string) => void;
  onStatusesChange: (values: JobStatus[]) => void;
  onWorkStylesChange: (values: WorkStyle[]) => void;
  onClearFilters: () => void;
  onExportCsv: () => void;
};

function JobFilters({
  keyword,
  statuses,
  workStyles,
  onKeywordChange,
  onStatusesChange,
  onWorkStylesChange,
  onClearFilters,
  onExportCsv,
}: JobFiltersProps) {
  const activeFilterCount = statuses.length + workStyles.length + (keyword.trim() ? 1 : 0);
  const activeFilterLabels = [
    ...statuses.map((status) => t(`enums.job_status.${status}`)),
    ...workStyles.map((workStyle) => t(`enums.work_style.${workStyle}`)),
    ...(keyword.trim() ? [`「${keyword.trim()}」`] : []),
  ];

  return (
    <Stack spacing={1.25}>
      <Box
        sx={{
          display: "grid",
          gap: 1.25,
          gridTemplateColumns: { xs: "1fr", lg: "minmax(0, 2fr) minmax(180px, 1fr) minmax(180px, 1fr) auto" },
          alignItems: "start",
        }}
      >
        <TextField
          label={t("filters.keyword")}
          value={keyword}
          onChange={(event) => onKeywordChange(event.target.value)}
          placeholder={t("filters.keyword_placeholder")}
          size="small"
          sx={{
            "& .MuiOutlinedInput-root": {
              backgroundColor: "#ffffff",
            },
          }}
        />

        <FormControl size="small">
          <InputLabel id="status-filter-label">{t("filters.status")}</InputLabel>
          <Select
            labelId="status-filter-label"
            multiple
            value={statuses}
            onChange={(event) => onStatusesChange(normalizeMultiSelectValue(event.target.value) as JobStatus[])}
            input={<OutlinedInput label={t("filters.status")} />}
            renderValue={(selected) => (
              <OverflowTooltipText text={summarizeStatuses(selected as JobStatus[])} />
            )}
          >
            {JOB_STATUS_OPTIONS.map((option) => (
              <MenuItem key={option} value={option}>
                <Checkbox checked={statuses.includes(option)} size="small" />
                <ListItemText primary={t(`enums.job_status.${option}`)} />
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl size="small">
          <InputLabel id="work-style-filter-label">{t("filters.work_style")}</InputLabel>
          <Select
            labelId="work-style-filter-label"
            multiple
            value={workStyles}
            onChange={(event) => onWorkStylesChange(normalizeMultiSelectValue(event.target.value) as WorkStyle[])}
            input={<OutlinedInput label={t("filters.work_style")} />}
            renderValue={(selected) => (
              <OverflowTooltipText text={summarizeWorkStyles(selected as WorkStyle[])} />
            )}
          >
            {WORK_STYLE_OPTIONS.map((option) => (
              <MenuItem key={option} value={option}>
                <Checkbox checked={workStyles.includes(option)} size="small" />
                <ListItemText primary={t(`enums.work_style.${option}`)} />
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1.25}
          alignItems="center"
          justifyContent="flex-end"
          sx={{ flexWrap: "nowrap", whiteSpace: "nowrap" }}
        >
          {activeFilterCount > 0 && (
            <Button variant="text" onClick={onClearFilters}>
              {t("actions.clear_filters")}
            </Button>
          )}
          <Button variant="outlined" onClick={onExportCsv}>
            {t("actions.export_csv")}
          </Button>
        </Stack>
      </Box>

      {activeFilterCount > 0 && (
        <Typography variant="caption" color="text.secondary">
          {t("filters.active_summary", { count: activeFilterCount })}: {activeFilterLabels.join(" / ")}
        </Typography>
      )}
    </Stack>
  );
}

export default memo(JobFilters);
