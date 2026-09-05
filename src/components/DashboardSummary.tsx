import { memo } from "react";

import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import { t } from "../i18n";
import InfoTooltip from "./InfoTooltip";

type SummaryItem = {
  key: "total" | "remote_friendly" | "active_pipeline" | "high_score";
  value: number;
  caption: string;
};

type DashboardSummaryProps = {
  items: SummaryItem[];
};

function DashboardSummary({ items }: DashboardSummaryProps) {
  return (
    <Paper
      data-testid="dashboard-summary"
      variant="outlined"
      sx={{
        display: "grid",
        gridTemplateColumns: { xs: "repeat(2, minmax(0, 1fr))", md: "repeat(4, minmax(0, 1fr))" },
        borderRadius: 2,
        overflow: "hidden",
        backgroundColor: "rgba(255,255,255,0.96)",
      }}
    >
      {items.map((item, index) => (
        <Box
          key={item.key}
          data-testid="dashboard-summary-item"
          sx={{
            minWidth: 0,
            px: { xs: 1.5, md: 2 },
            py: { xs: 1.25, md: 1.5 },
            borderColor: "divider",
            borderRight: { xs: index % 2 === 0 ? 1 : 0, md: index < items.length - 1 ? 1 : 0 },
            borderBottom: { xs: index < 2 ? 1 : 0, md: 0 },
          }}
        >
          <Stack direction="row" spacing={0.25} alignItems="center">
            <Typography variant="body2" sx={{ color: "text.secondary", fontWeight: 750 }}>
              {t(`summary.${item.key}`)}
            </Typography>
            <InfoTooltip label={t(`summary.${item.key}`)} title={item.caption} />
          </Stack>
          <Typography variant="h4" sx={{ mt: 0.25, fontWeight: 850, lineHeight: 1.1 }}>
            {item.value}
          </Typography>
        </Box>
      ))}
    </Paper>
  );
}

export default memo(DashboardSummary);
