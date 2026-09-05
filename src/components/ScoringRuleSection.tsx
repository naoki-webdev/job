import { memo } from "react";

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";

import { t } from "../i18n";
import type { ScoringPreferencePayload } from "../types/job";
import { type ScoringPreferenceDraft, parseNumericInput } from "./masterDataDrafts";
import InfoTooltip from "./InfoTooltip";

type ScoringRuleSectionProps = {
  values: ScoringPreferenceDraft;
  error?: string | null;
  onChange: (key: keyof ScoringPreferenceDraft, value: number | "") => void;
};

function ScoringRuleSection({ values, error, onChange }: ScoringRuleSectionProps) {
  const renderScoringField = (key: keyof ScoringPreferencePayload) => (
    <TextField
      key={key}
      label={t(`scoring.${key}`)}
      type="number"
      value={values[key]}
      onChange={(event) => onChange(key, parseNumericInput(event.target.value))}
      size="small"
      fullWidth
    />
  );

  return (
    <Stack spacing={2}>
      <Stack direction="row" spacing={0.25} alignItems="center">
        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
          {t("settings.rules_title")}
        </Typography>
        <InfoTooltip label={t("settings.rules_title")} title={t("settings.rules_helper")} />
      </Stack>

      {error && <Alert severity="error">{error}</Alert>}

      <Box>
        <Typography variant="subtitle2" sx={{ mb: 1 }}>
          {t("scoring.remote_section")}
        </Typography>
        <Box sx={{ display: "grid", gap: 1, gridTemplateColumns: { xs: "1fr", sm: "repeat(3, minmax(0, 1fr))" } }}>
          {renderScoringField("full_remote_weight")}
          {renderScoringField("hybrid_weight")}
          {renderScoringField("onsite_weight")}
        </Box>
      </Box>

      <Divider />

      <Box>
        <Typography variant="subtitle2" sx={{ mb: 1 }}>
          {t("scoring.salary_section")}
        </Typography>
        <Box sx={{ display: "grid", gap: 1, gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))" } }}>
          {renderScoringField("high_salary_max_threshold")}
          {renderScoringField("high_salary_bonus")}
          {renderScoringField("low_salary_min_threshold")}
          {renderScoringField("low_salary_penalty")}
        </Box>
      </Box>
    </Stack>
  );
}

export default memo(ScoringRuleSection);
