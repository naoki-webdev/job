import { useEffect, useState } from "react";

import Box from "@mui/material/Box";
import Drawer from "@mui/material/Drawer";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import { t } from "../i18n";
import type { JobDraftMode, JobDraftResponse } from "../types/job";
import JobImportInputPane from "./JobImportInputPane";
import JobImportResultPane from "./JobImportResultPane";

type JobImportDrawerProps = {
  open: boolean;
  readOnly?: boolean;
  aiEnabled?: boolean;
  result: JobDraftResponse | null;
  loading: boolean;
  error: string | null;
  onClose: () => void;
  onAnalyze: (payload: { mode: JobDraftMode; text: string; url: string }) => Promise<void>;
  onConfirm: () => void;
};

export default function JobImportDrawer({
  open,
  readOnly = false,
  aiEnabled = false,
  result,
  loading,
  error,
  onClose,
  onAnalyze,
  onConfirm,
}: JobImportDrawerProps) {
  const [mode, setMode] = useState<JobDraftMode>("rule");
  const [text, setText] = useState("");
  const [url, setUrl] = useState("");
  const [submitAttempted, setSubmitAttempted] = useState(false);

  useEffect(() => {
    if (open) setSubmitAttempted(false);
  }, [open]);

  useEffect(() => {
    if (!aiEnabled && mode === "ai") setMode("rule");
  }, [aiEnabled, mode]);

  const textError = submitAttempted && !text.trim() ? t("import.text_required") : null;
  const aiUnavailable = mode === "ai" && aiEnabled && result?.ai_available === false;
  const fellBackToRule = mode === "ai" && aiEnabled && result?.mode === "rule";

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      aria-labelledby="job-import-drawer-title"
      slotProps={{ backdrop: { sx: { backgroundColor: "rgba(9, 30, 66, 0.1)" } } }}
    >
      <Box sx={{ width: { xs: "100vw", sm: 760 }, backgroundColor: "common.white", minHeight: "100%" }}>
        <Stack spacing={2} sx={{ px: { xs: 2, sm: 2.5 }, py: 2.5 }}>
          <Typography id="job-import-drawer-title" variant="h6">
            {t("import.title")}
          </Typography>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "minmax(0, 1fr) minmax(0, 0.95fr)" },
              alignItems: "start",
              border: 1,
              borderColor: "divider",
              borderRadius: 2,
              overflow: "hidden",
            }}
          >
            <JobImportInputPane
              mode={mode}
              aiEnabled={aiEnabled}
              aiUnavailable={aiUnavailable}
              text={text}
              url={url}
              textError={textError}
              loading={loading}
              error={error}
              readOnly={readOnly}
              onModeChange={setMode}
              onTextChange={setText}
              onUrlChange={setUrl}
              onClose={onClose}
              onSubmitAttempt={() => setSubmitAttempted(true)}
              onAnalyze={(payload) => void onAnalyze(payload)}
            />
            <JobImportResultPane
              result={result}
              fellBackToRule={fellBackToRule}
              readOnly={readOnly}
              onConfirm={onConfirm}
            />
          </Box>
        </Stack>
      </Box>
    </Drawer>
  );
}
