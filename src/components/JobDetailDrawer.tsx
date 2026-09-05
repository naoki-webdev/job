import { memo } from "react";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import Drawer from "@mui/material/Drawer";
import FormControl from "@mui/material/FormControl";
import IconButton from "@mui/material/IconButton";
import Link from "@mui/material/Link";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import { isJobStatus, JOB_STATUS_OPTIONS } from "../constants/jobOptions";
import { t } from "../i18n";
import type { Job, JobStatus, ScoringPreference } from "../types/job";
import { formatDateTime, formatSalaryRange } from "../utils/jobFormat";
import { getPriorityView } from "../utils/jobDashboardInsights";
import { buildScoreBreakdown } from "../utils/scoreBreakdown";
import CompanyLogoAvatar from "./CompanyLogoAvatar";
import InfoTooltip from "./InfoTooltip";
import ScoreChip from "./ScoreChip";

type JobDetailDrawerProps = {
  open: boolean;
  job: Job | null;
  recommended: boolean;
  scoringPreference: ScoringPreference | null;
  readOnly?: boolean;
  onClose: () => void;
  onStatusChange: (status: JobStatus) => void;
  onEdit: () => void;
  onDelete: () => void;
  deleting: boolean;
  statusUpdating?: boolean;
};

function SectionHeading({ children }: { children: string }) {
  return (
    <Typography component="h3" variant="subtitle1" fontWeight={700}>
      {children}
    </Typography>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <Stack direction="row" spacing={2} alignItems="flex-start">
      <Typography variant="body2" color="text.secondary" sx={{ width: 88, flexShrink: 0 }}>
        {label}
      </Typography>
      <Typography variant="body2" sx={{ minWidth: 0, overflowWrap: "anywhere" }}>
        {value}
      </Typography>
    </Stack>
  );
}

function formatScoreValue(value: number) {
  return value > 0 ? `+${value}` : String(value);
}

function JobDetailDrawer({
  open,
  job,
  recommended,
  scoringPreference,
  readOnly = false,
  onClose,
  onStatusChange,
  onEdit,
  onDelete,
  deleting,
  statusUpdating = false,
}: JobDetailDrawerProps) {
  const scoreBreakdown = job ? buildScoreBreakdown(job, scoringPreference) : [];
  const priority = job ? getPriorityView(job.score, job.status) : null;

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      aria-labelledby="job-detail-drawer-title"
      slotProps={{ backdrop: { invisible: true } }}
    >
      <Box
        sx={{
          width: { xs: "100vw", sm: 480 },
          height: "100%",
          backgroundColor: "common.white",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {!job ? (
          <Box sx={{ p: 3 }}>
            <Typography variant="body2" color="text.secondary">
              {t("jobs.detail.empty")}
            </Typography>
          </Box>
        ) : (
          <>
            <Box component="header" sx={{ px: 2.5, py: 2, borderBottom: 1, borderColor: "divider" }}>
              <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2}>
                <Stack direction="row" spacing={1.5} alignItems="center" sx={{ minWidth: 0 }}>
                  <CompanyLogoAvatar companyName={job.company_name} logoUrl={job.company_logo_url} size={48} />
                  <Box sx={{ minWidth: 0 }}>
                    <Typography id="job-detail-drawer-title" variant="h6" noWrap>
                      {job.company_name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" noWrap>
                      {job.position}
                    </Typography>
                    <Box sx={{ mt: 0.75 }}>
                      <ScoreChip score={job.score} recommended={recommended} />
                    </Box>
                  </Box>
                </Stack>
                <IconButton aria-label={t("actions.close")} title={t("actions.close")} size="small" onClick={onClose}>
                  <Typography component="span" aria-hidden="true" sx={{ fontSize: "1.5rem", lineHeight: 1 }}>
                    ×
                  </Typography>
                </IconButton>
              </Stack>
            </Box>

            <Box sx={{ flex: 1, minHeight: 0, overflowY: "auto" }}>
              <Box component="section" sx={{ px: 2.5, py: 2 }}>
                <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
                  <Typography variant="body2" fontWeight={700}>
                    {t("jobs.detail.status")}
                  </Typography>
                  <FormControl size="small" sx={{ width: 180 }}>
                    <Select
                      value={job.status}
                      inputProps={{ "aria-label": t("jobs.detail.status") }}
                      disabled={readOnly || statusUpdating}
                      aria-busy={statusUpdating}
                      onChange={(event) => {
                        if (isJobStatus(event.target.value)) {
                          onStatusChange(event.target.value);
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
                </Stack>
              </Box>

              <Divider />

              <Box component="section" sx={{ px: 2.5, py: 2.25 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2}>
                  <Stack direction="row" spacing={0.25} alignItems="center">
                    <SectionHeading>{t("jobs.detail.evaluation_title")}</SectionHeading>
                    <InfoTooltip
                      label={t("jobs.detail.evaluation_title")}
                      title={t("jobs.detail.evaluation_tooltip")}
                    />
                  </Stack>
                  {priority && <Chip size="small" color={priority.color} variant="outlined" label={priority.label} />}
                </Stack>

                <Stack spacing={1} sx={{ mt: 1.5 }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="baseline">
                    <Typography variant="body2" color="text.secondary">
                      {t("jobs.detail.total_score")}
                    </Typography>
                    <Typography variant="h6" fontWeight={800}>
                      {job.score}
                    </Typography>
                  </Stack>
                  <Divider />
                  {scoreBreakdown.length > 0 ? (
                    scoreBreakdown.map((item) => (
                      <Stack
                        key={`${item.label}-${item.value}`}
                        direction="row"
                        justifyContent="space-between"
                        spacing={2}
                      >
                        <Typography variant="body2" color="text.secondary" noWrap>
                          {item.label}
                        </Typography>
                        <Typography
                          variant="body2"
                          fontWeight={700}
                          color={item.value > 0 ? "success.main" : item.value < 0 ? "error.main" : "text.secondary"}
                        >
                          {formatScoreValue(item.value)}
                        </Typography>
                      </Stack>
                    ))
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      {t("jobs.detail.score_hint")}
                    </Typography>
                  )}
                </Stack>
              </Box>

              <Divider />

              <Box component="section" sx={{ px: 2.5, py: 2.25 }}>
                <SectionHeading>{t("jobs.detail.basic_information_title")}</SectionHeading>
                <Stack spacing={1.25} sx={{ mt: 1.5 }}>
                  <InfoRow label={t("jobs.detail.work_style")} value={t(`enums.work_style.${job.work_style}`)} />
                  <InfoRow
                    label={t("jobs.detail.employment_type")}
                    value={t(`enums.employment_type.${job.employment_type}`)}
                  />
                  <InfoRow label={t("jobs.detail.salary")} value={formatSalaryRange(job.salary_min, job.salary_max)} />
                  <InfoRow label={t("jobs.detail.tech_stack")} value={job.tech_stack} />
                  <InfoRow label={t("jobs.detail.location")} value={job.location} />
                </Stack>
              </Box>

              <Divider />

              <Box component="section" sx={{ px: 2.5, py: 2.25 }}>
                <SectionHeading>{t("jobs.detail.notes")}</SectionHeading>
                <Typography
                  variant="body2"
                  color={job.notes ? "text.primary" : "text.secondary"}
                  sx={{ mt: 1.25, whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}
                >
                  {job.notes || t("common.no_data")}
                </Typography>
                {job.source_url && (
                  <Stack direction="row" spacing={2} alignItems="flex-start" sx={{ mt: 1.5 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ width: 88, flexShrink: 0 }}>
                      {t("jobs.detail.source_url")}
                    </Typography>
                    <Link
                      href={job.source_url}
                      target="_blank"
                      rel="noreferrer"
                      variant="body2"
                      sx={{ overflowWrap: "anywhere" }}
                    >
                      {job.source_url}
                    </Link>
                  </Stack>
                )}
                <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1.5 }}>
                  {t("jobs.detail.updated_at")}: {formatDateTime(job.updated_at)}
                </Typography>
              </Box>
            </Box>

            {!readOnly && (
              <Box component="footer" sx={{ px: 2.5, py: 1.75, borderTop: 1, borderColor: "divider" }}>
                <Stack direction="row" justifyContent="space-between" spacing={1.5}>
                  <Button variant="contained" onClick={onEdit}>
                    {t("actions.edit_job")}
                  </Button>
                  <Button color="error" variant="outlined" onClick={onDelete} disabled={deleting}>
                    {t("actions.delete_job")}
                  </Button>
                </Stack>
              </Box>
            )}
          </>
        )}
      </Box>
    </Drawer>
  );
}

export default memo(JobDetailDrawer);
