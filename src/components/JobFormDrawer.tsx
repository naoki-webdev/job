import { memo } from "react";

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import Drawer from "@mui/material/Drawer";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import ListItemText from "@mui/material/ListItemText";
import MenuItem from "@mui/material/MenuItem";
import OutlinedInput from "@mui/material/OutlinedInput";
import Select from "@mui/material/Select";
import type { SelectChangeEvent } from "@mui/material/Select";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";

import {
  EMPLOYMENT_TYPE_OPTIONS,
  isEmploymentType,
  isJobStatus,
  isWorkStyle,
  JOB_STATUS_OPTIONS,
  WORK_STYLE_OPTIONS,
} from "../constants/jobOptions";
import {
  formatMasterDataName,
  normalizeIdList,
  parseNumericInput,
  summarizeSelectedTechStacks,
  useJobFormDraft,
} from "../hooks/useJobFormDraft";
import { t } from "../i18n";
import type { Job, JobFormPayload, MasterDataItem } from "../types/job";
import CompanyLogoField from "./CompanyLogoField";
import OverflowTooltipText from "./OverflowTooltipText";

type JobFormDrawerProps = {
  open: boolean;
  mode: "create" | "edit";
  initialJob: Job | null;
  initialDraft?: Partial<JobFormPayload> | null;
  locations: MasterDataItem[];
  positions: MasterDataItem[];
  techStacks: MasterDataItem[];
  submitting: boolean;
  submitError?: string | null;
  onClose: () => void;
  onSubmit: (payload: JobFormPayload) => Promise<void> | void;
};

function JobFormDrawer({
  open,
  mode,
  initialJob,
  initialDraft,
  locations,
  positions,
  techStacks,
  submitting,
  submitError,
  onClose,
  onSubmit,
}: JobFormDrawerProps) {
  const {
    formValues,
    selectableLocations,
    selectablePositions,
    selectableTechStacks,
    getFieldError,
    handleBlur,
    handleChange,
    submit,
  } = useJobFormDraft({ open, initialJob, initialDraft, locations, positions, techStacks });

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      aria-labelledby="job-form-drawer-title"
      slotProps={{ backdrop: { sx: { backgroundColor: "rgba(9, 30, 66, 0.1)" } } }}
    >
      <Box
        sx={{
          width: { xs: "100vw", sm: 460 },
          px: { xs: 2, sm: 2.5 },
          py: 2.5,
          backgroundColor: "common.white",
          minHeight: "100%",
        }}
      >
        <Stack spacing={2.5}>
          <Box>
            <Typography id="job-form-drawer-title" variant="h6">
              {mode === "create" ? t("jobs.form.create_title") : t("jobs.form.edit_title")}
            </Typography>
          </Box>

          {submitError && (
            <Alert severity="error" role="alert" aria-live="assertive">
              {submitError}
            </Alert>
          )}

          <TextField
            label={t("jobs.form.company_name")}
            value={formValues.company_name}
            onChange={(event) => handleChange("company_name", event.target.value)}
            onBlur={() => handleBlur("company_name")}
            size="small"
            required
            error={Boolean(getFieldError("company_name"))}
            helperText={getFieldError("company_name")}
          />

          <CompanyLogoField
            companyName={formValues.company_name}
            currentLogoUrl={initialJob?.company_logo_url}
            currentLogoFilename={initialJob?.company_logo_filename}
            logoFile={formValues.company_logo}
            removeLogo={formValues.remove_company_logo}
            onLogoChange={(file) => handleChange("company_logo", file)}
            onRemoveLogoChange={(removeLogo) => handleChange("remove_company_logo", removeLogo)}
          />

          <FormControl size="small" error={Boolean(getFieldError("position_id"))}>
            <InputLabel id="job-form-position-label">{t("jobs.form.position")}</InputLabel>
            <Select
              labelId="job-form-position-label"
              label={t("jobs.form.position")}
              value={formValues.position_id || ""}
              onChange={(event) => handleChange("position_id", parseNumericInput(event.target.value))}
              onBlur={() => handleBlur("position_id")}
            >
              {selectablePositions.map((position) => (
                <MenuItem key={position.id} value={position.id}>
                  {formatMasterDataName(position)}
                </MenuItem>
              ))}
            </Select>
            <Typography variant="caption" color="error" sx={{ px: 1.75, pt: 0.5 }}>
              {getFieldError("position_id") ?? " "}
            </Typography>
          </FormControl>

          <FormControl size="small">
            <InputLabel id="job-form-status-label">{t("jobs.form.status")}</InputLabel>
            <Select
              labelId="job-form-status-label"
              label={t("jobs.form.status")}
              value={formValues.status}
              onChange={(event: SelectChangeEvent<string>) => {
                if (isJobStatus(event.target.value)) {
                  handleChange("status", event.target.value);
                }
              }}
            >
              {JOB_STATUS_OPTIONS.map((status) => (
                <MenuItem key={status} value={status}>
                  {t(`enums.job_status.${status}`)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small">
            <InputLabel id="job-form-work-style-label">{t("jobs.form.work_style")}</InputLabel>
            <Select
              labelId="job-form-work-style-label"
              label={t("jobs.form.work_style")}
              value={formValues.work_style}
              onChange={(event: SelectChangeEvent<string>) => {
                if (isWorkStyle(event.target.value)) {
                  handleChange("work_style", event.target.value);
                }
              }}
            >
              {WORK_STYLE_OPTIONS.map((workStyle) => (
                <MenuItem key={workStyle} value={workStyle}>
                  {t(`enums.work_style.${workStyle}`)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small">
            <InputLabel id="job-form-employment-type-label">{t("jobs.form.employment_type")}</InputLabel>
            <Select
              labelId="job-form-employment-type-label"
              label={t("jobs.form.employment_type")}
              value={formValues.employment_type}
              onChange={(event: SelectChangeEvent<string>) => {
                if (isEmploymentType(event.target.value)) {
                  handleChange("employment_type", event.target.value);
                }
              }}
            >
              {EMPLOYMENT_TYPE_OPTIONS.map((employmentType) => (
                <MenuItem key={employmentType} value={employmentType}>
                  {t(`enums.employment_type.${employmentType}`)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Stack direction="row" spacing={2}>
            <TextField
              label={t("jobs.form.salary_min")}
              type="number"
              fullWidth
              value={formValues.salary_min}
              onChange={(event) => handleChange("salary_min", parseNumericInput(event.target.value))}
              onBlur={() => handleBlur("salary_min")}
              size="small"
              required
              error={Boolean(getFieldError("salary_min"))}
              helperText={getFieldError("salary_min")}
            />
            <TextField
              label={t("jobs.form.salary_max")}
              type="number"
              fullWidth
              value={formValues.salary_max}
              onChange={(event) => handleChange("salary_max", parseNumericInput(event.target.value))}
              onBlur={() => handleBlur("salary_max")}
              size="small"
              required
              error={Boolean(getFieldError("salary_max"))}
              helperText={getFieldError("salary_max")}
            />
          </Stack>

          <FormControl size="small" error={Boolean(getFieldError("tech_stack_ids"))}>
            <InputLabel id="job-form-tech-stacks-label">{t("jobs.form.tech_stack")}</InputLabel>
            <Select
              labelId="job-form-tech-stacks-label"
              multiple
              value={formValues.tech_stack_ids}
              onChange={(event) =>
                handleChange("tech_stack_ids", normalizeIdList(event.target.value))
              }
              onBlur={() => handleBlur("tech_stack_ids")}
              input={<OutlinedInput label={t("jobs.form.tech_stack")} />}
              renderValue={(selected) => (
                <OverflowTooltipText text={summarizeSelectedTechStacks(techStacks, normalizeIdList(selected))} />
              )}
            >
              {selectableTechStacks.map((techStack) => (
                <MenuItem key={techStack.id} value={techStack.id}>
                  <Checkbox checked={formValues.tech_stack_ids.includes(techStack.id)} size="small" />
                  <ListItemText primary={formatMasterDataName(techStack)} />
                </MenuItem>
              ))}
            </Select>
            <Typography variant="caption" color="error" sx={{ px: 1.75, pt: 0.5 }}>
              {getFieldError("tech_stack_ids") ?? " "}
            </Typography>
          </FormControl>
          <FormControl size="small" error={Boolean(getFieldError("location_id"))}>
            <InputLabel id="job-form-location-label">{t("jobs.form.location")}</InputLabel>
            <Select
              labelId="job-form-location-label"
              label={t("jobs.form.location")}
              value={formValues.location_id || ""}
              onChange={(event) => handleChange("location_id", parseNumericInput(event.target.value))}
              onBlur={() => handleBlur("location_id")}
            >
              {selectableLocations.map((location) => (
                <MenuItem key={location.id} value={location.id}>
                  {formatMasterDataName(location)}
                </MenuItem>
              ))}
            </Select>
            <Typography variant="caption" color="error" sx={{ px: 1.75, pt: 0.5 }}>
              {getFieldError("location_id") ?? " "}
            </Typography>
          </FormControl>
          <TextField
            label={t("jobs.form.source_url")}
            placeholder={t("jobs.form.source_url_placeholder")}
            value={formValues.source_url}
            onChange={(event) => handleChange("source_url", event.target.value)}
            onBlur={() => handleBlur("source_url")}
            size="small"
            fullWidth
          />

          <TextField
            label={t("jobs.form.notes")}
            value={formValues.notes}
            onChange={(event) => handleChange("notes", event.target.value)}
            onBlur={() => handleBlur("notes")}
            multiline
            minRows={4}
            size="small"
          />

          <Stack direction="row" spacing={1.5} justifyContent="flex-end">
            <Button variant="text" onClick={onClose} disabled={submitting}>
              {t("actions.cancel")}
            </Button>
            <Button
              variant="contained"
              onClick={() => {
                submit(onSubmit);
              }}
              disabled={submitting}
            >
              {submitting ? t("actions.saving") : t("actions.save")}
            </Button>
          </Stack>
        </Stack>
      </Box>
    </Drawer>
  );
}

export default memo(JobFormDrawer);
