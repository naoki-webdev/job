import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import FormControl from "@mui/material/FormControl";
import FormControlLabel from "@mui/material/FormControlLabel";
import FormLabel from "@mui/material/FormLabel";
import InputAdornment from "@mui/material/InputAdornment";
import LinearProgress from "@mui/material/LinearProgress";
import Radio from "@mui/material/Radio";
import RadioGroup from "@mui/material/RadioGroup";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";

import { t } from "../i18n";
import type { JobDraftMode } from "../types/job";
import InfoTooltip from "./InfoTooltip";

type JobImportInputPaneProps = {
  mode: JobDraftMode;
  aiEnabled: boolean;
  aiUnavailable: boolean;
  text: string;
  url: string;
  textError: string | null;
  loading: boolean;
  error: string | null;
  readOnly: boolean;
  onModeChange: (mode: JobDraftMode) => void;
  onTextChange: (text: string) => void;
  onUrlChange: (url: string) => void;
  onClose: () => void;
  onAnalyze: (payload: { mode: JobDraftMode; text: string; url: string }) => void;
  onSubmitAttempt: () => void;
};

const MODE_OPTIONS: ReadonlyArray<{ value: JobDraftMode; labelKey: string }> = [
  { value: "rule", labelKey: "import.mode_rule" },
  { value: "ai", labelKey: "import.mode_ai" },
];

export default function JobImportInputPane({
  mode,
  aiEnabled,
  aiUnavailable,
  text,
  url,
  textError,
  loading,
  error,
  readOnly,
  onModeChange,
  onTextChange,
  onUrlChange,
  onClose,
  onAnalyze,
  onSubmitAttempt,
}: JobImportInputPaneProps) {
  return (
    <Box sx={{ p: { xs: 1.5, sm: 2 }, borderColor: "divider", borderRight: { md: 1 }, borderBottom: { xs: 1, md: 0 } }}>
      <Stack spacing={2}>
        <Typography variant="subtitle2">{t("import.before_title")}</Typography>

        <FormControl>
          <FormLabel sx={{ fontSize: "0.8rem", fontWeight: 600 }}>{t("import.mode_label")}</FormLabel>
          <RadioGroup row value={mode} onChange={(event) => onModeChange(event.target.value as JobDraftMode)}>
            {MODE_OPTIONS.map((option) => (
              <FormControlLabel
                key={option.value}
                value={option.value}
                control={<Radio size="small" />}
                label={t(option.labelKey)}
                disabled={option.value === "ai" && !aiEnabled}
              />
            ))}
          </RadioGroup>
          {!aiEnabled && (
            <Typography variant="caption" color="text.secondary">
              {t("import.mode_ai_master_only")}
            </Typography>
          )}
          {aiUnavailable && (
            <Typography variant="caption" color="warning.main">
              {t("import.mode_ai_unavailable")}
            </Typography>
          )}
        </FormControl>

        <TextField
          label={t("import.url_label")}
          placeholder={t("import.url_placeholder")}
          value={url}
          onChange={(event) => onUrlChange(event.target.value)}
          size="small"
          fullWidth
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <InfoTooltip label={t("import.url_label")} title={t("import.url_tooltip")} />
              </InputAdornment>
            ),
          }}
        />

        <TextField
          label={t("import.text_label")}
          placeholder={t("import.text_placeholder")}
          value={text}
          onChange={(event) => onTextChange(event.target.value)}
          multiline
          minRows={12}
          size="small"
          fullWidth
          error={Boolean(textError)}
          inputProps={{ maxLength: 8000 }}
          helperText={
            textError ??
            t("import.text_counter", {
              count: text.length.toLocaleString("ja-JP"),
              limit: "8,000",
            })
          }
        />

        {error && (
          <Alert severity="error" role="alert" aria-live="assertive">
            {error}
          </Alert>
        )}
        {readOnly && <Alert severity="info">{t("import.read_only_hint")}</Alert>}
        {loading && <LinearProgress />}

        <Stack direction="row" spacing={1.5} justifyContent="flex-end">
          <Button variant="text" onClick={onClose} disabled={loading}>
            {t("actions.cancel")}
          </Button>
          <Button
            variant="contained"
            onClick={() => {
              onSubmitAttempt();
              if (!text.trim()) return;
              onAnalyze({ mode, text, url });
            }}
            disabled={loading}
          >
            {loading ? t("import.analyzing") : t("import.analyze")}
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
}
