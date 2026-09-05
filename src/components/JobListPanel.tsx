import type { ReactNode } from "react";

import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import { t } from "../i18n";

type JobListPanelProps = {
  totalCount: number;
  filters: ReactNode;
  children: ReactNode;
};

export default function JobListPanel({ totalCount, filters, children }: JobListPanelProps) {
  return (
    <Paper
      variant="outlined"
      sx={{
        borderRadius: 2,
        overflow: "hidden",
        backgroundColor: "rgba(255,255,255,0.98)",
      }}
    >
      <Stack spacing={1.25} sx={{ px: { xs: 1.5, md: 2 }, py: 1.5 }}>
        <Stack direction="row" spacing={1.5} alignItems="center" justifyContent="space-between">
          <Typography component="h2" variant="h6" fontWeight={850}>
            {t("jobs.section_title")}
          </Typography>
          <Chip
            size="small"
            variant="outlined"
            color="primary"
            label={t("jobs.count", { count: totalCount })}
            sx={{ flexShrink: 0, fontWeight: 750 }}
          />
        </Stack>
        {filters}
      </Stack>

      <Divider sx={{ borderColor: "rgba(9,30,66,0.08)" }} />
      {children}
    </Paper>
  );
}
