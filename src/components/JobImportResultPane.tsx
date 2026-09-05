import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import { t } from "../i18n";
import type { JobDraftResponse, WorkStyle } from "../types/job";
import { formatSalaryRange } from "../utils/jobFormat";

type JobImportResultPaneProps = {
  result: JobDraftResponse | null;
  fellBackToRule: boolean;
  readOnly: boolean;
  onConfirm: () => void;
};

function renderList(items: string[]) {
  if (items.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        {t("import.empty_list")}
      </Typography>
    );
  }

  return (
    <Stack component="ul" spacing={0.75} sx={{ pl: 2.5, m: 0 }}>
      {items.map((item, index) => (
        <Typography key={`${item}-${index}`} component="li" variant="body2">
          {item}
        </Typography>
      ))}
    </Stack>
  );
}

function workStyleLabel(value: WorkStyle | null) {
  if (!value) return t("import.fields.unknown");
  return t(`enums.work_style.${value}`);
}

function buildDraftSummary(result: JobDraftResponse) {
  const draft = result.draft;
  return [
    { key: "company_name", label: t("import.fields.company_name"), value: draft.company_name ?? t("import.fields.unknown") },
    {
      key: "salary_range",
      label: t("import.fields.salary_range"),
      value: draft.salary_min !== null && draft.salary_max !== null
        ? formatSalaryRange(draft.salary_min, draft.salary_max)
        : t("import.fields.unknown"),
    },
    { key: "work_style", label: t("import.fields.work_style"), value: workStyleLabel(draft.work_style) },
    { key: "location", label: t("import.fields.location"), value: draft.location_name ?? t("import.fields.unknown") },
    {
      key: "tech_stacks",
      label: t("import.fields.tech_stacks"),
      value: draft.tech_stack_names.length > 0 ? draft.tech_stack_names.join(", ") : t("import.fields.unknown"),
    },
    { key: "source_url", label: t("import.fields.source_url"), value: draft.source_url ?? t("import.fields.unknown") },
  ];
}

export default function JobImportResultPane({ result, fellBackToRule, readOnly, onConfirm }: JobImportResultPaneProps) {
  const draftSummary = result ? buildDraftSummary(result) : null;

  return (
    <Box sx={{ p: { xs: 1.5, sm: 2 }, minWidth: 0 }}>
      <Stack spacing={2}>
        <Stack direction="row" spacing={1} alignItems="center" useFlexGap flexWrap="wrap">
          <Typography variant="subtitle2">{t("import.after_title")}</Typography>
          {result && (
            <Chip
              size="small"
              color={result.mode === "ai" ? "primary" : "default"}
              variant={result.mode === "ai" ? "filled" : "outlined"}
              label={result.mode === "ai" ? t("import.actual_mode_ai") : t("import.actual_mode_rule")}
            />
          )}
        </Stack>

        {fellBackToRule && (
          <Typography variant="caption" color="warning.main">
            {t("import.fallback_to_rule")}
          </Typography>
        )}

        {!result || !draftSummary ? (
          <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
            {t("import.after_empty")}
          </Typography>
        ) : (
          <Stack spacing={2}>
            <Box>
              <Typography variant="caption" color="text.secondary" fontWeight={700}>
                {t("import.draft_section")}
              </Typography>
              <Stack spacing={1} sx={{ mt: 1 }}>
                {draftSummary.map((row) => (
                  <Stack key={row.key} direction="row" justifyContent="space-between" spacing={1.5}>
                    <Typography variant="caption" color="text.secondary">
                      {row.label}
                    </Typography>
                    <Typography variant="body2" sx={{ textAlign: "right", maxWidth: "62%", wordBreak: "break-word" }}>
                      {row.value}
                    </Typography>
                  </Stack>
                ))}
              </Stack>
            </Box>

            <Divider />

            <Box>
              <Typography variant="caption" color="text.secondary" fontWeight={700}>
                {t("import.insights_section")}
              </Typography>
              {result.insights.score_estimate !== null && (
                <Stack direction="row" alignItems="baseline" spacing={1} sx={{ mt: 0.75, mb: 1.5 }}>
                  <Typography variant="caption" color="text.secondary">
                    {t("import.score_label")}
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 900, lineHeight: 1 }}>
                    {result.insights.score_estimate}
                  </Typography>
                </Stack>
              )}

              <Stack spacing={1.5}>
                <Box>
                  <Typography variant="caption" color="success.main" sx={{ fontWeight: 700 }}>
                    {t("import.pros_label")}
                  </Typography>
                  {renderList(result.insights.pros)}
                </Box>
                <Box>
                  <Typography variant="caption" color="error.main" sx={{ fontWeight: 700 }}>
                    {t("import.cons_label")}
                  </Typography>
                  {renderList(result.insights.cons)}
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                    {t("import.questions_label")}
                  </Typography>
                  {renderList(result.insights.questions)}
                </Box>
              </Stack>
            </Box>

            {!readOnly && (
              <Button variant="contained" size="large" onClick={onConfirm}>
                {t("import.confirm")}
              </Button>
            )}
          </Stack>
        )}
      </Stack>
    </Box>
  );
}
