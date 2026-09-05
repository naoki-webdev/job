import { memo, useMemo } from "react";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import InfoTooltip from "./InfoTooltip";

import { t } from "../i18n";
import type { Job, ScoringPreference } from "../types/job";
import { getTopScoredJobs } from "../utils/jobDashboardInsights";
import { buildScoreBreakdown } from "../utils/scoreBreakdown";
import ScoreChip from "./ScoreChip";

type AiDiagnosisOverviewProps = {
  jobs: Job[];
  scoringPreference?: ScoringPreference | null;
  onSelectJob: (jobId: number) => void;
};

function AiDiagnosisOverview({ jobs, scoringPreference = null, onSelectJob }: AiDiagnosisOverviewProps) {
  const topJobs = useMemo(() => getTopScoredJobs(jobs, 3), [jobs]);

  return (
    <Paper
      variant="outlined"
      sx={{
        borderRadius: 2,
        overflow: "hidden",
        backgroundColor: "rgba(255,255,255,0.98)",
      }}
    >
      <Stack
        direction={{ xs: "column", lg: "row" }}
        spacing={1.25}
        alignItems={{ xs: "stretch", lg: "center" }}
        sx={{ px: { xs: 1.5, md: 2 }, py: 1.25, backgroundColor: "rgba(247,248,250,0.72)" }}
      >
        <Stack direction="row" spacing={0.25} alignItems="center" sx={{ flexShrink: 0 }}>
          <Typography variant="subtitle2" fontWeight={850}>
            {t("diagnosis.recommendations_title")}
          </Typography>
          <InfoTooltip
            label={t("diagnosis.recommendations_title")}
            title={t("diagnosis.recommendations_tooltip")}
          />
        </Stack>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          {topJobs.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              {t("diagnosis.ranking_empty")}
            </Typography>
          ) : (
            <Box
              data-testid="ranking-job-group"
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", md: `repeat(${topJobs.length}, minmax(0, 1fr))` },
                border: 1,
                borderColor: "divider",
                borderRadius: 2,
                overflow: "hidden",
                backgroundColor: "rgba(255,255,255,0.92)",
              }}
            >
              {topJobs.map((job, index) => {
                const breakdown = buildScoreBreakdown(job, scoringPreference);
                const strongestReason = breakdown
                  .filter((item) => item.value > 0)
                  .sort((left, right) => right.value - left.value)[0];

                return (
                  <Button
                    key={job.id}
                    data-testid="ranking-job-card"
                    variant="text"
                    color="inherit"
                    onClick={() => onSelectJob(job.id)}
                    sx={{
                      justifyContent: "stretch",
                      minWidth: 0,
                      p: 1,
                      borderRadius: 0,
                      color: "text.primary",
                      textAlign: "left",
                      textTransform: "none",
                      borderColor: "divider",
                      borderRight: { xs: 0, md: index < topJobs.length - 1 ? 1 : 0 },
                      borderBottom: { xs: index < topJobs.length - 1 ? 1 : 0, md: 0 },
                      "&:hover": { backgroundColor: "rgba(12,102,228,0.05)" },
                    }}
                  >
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ width: "100%", minWidth: 0 }}>
                      <Box
                        sx={{
                          width: 18,
                          flexShrink: 0,
                          color: "primary.main",
                        }}
                      >
                        <Typography variant="caption" fontWeight={900}>
                          {index + 1}
                        </Typography>
                      </Box>
                      <Stack spacing={0.1} sx={{ flex: 1, minWidth: 0, alignItems: "flex-start" }}>
                        <Typography variant="body2" fontWeight={800} noWrap>
                          {job.company_name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" noWrap>
                          {strongestReason ? `◎ ${strongestReason.label}` : job.position}
                        </Typography>
                      </Stack>
                      <ScoreChip score={job.score} />
                    </Stack>
                  </Button>
                );
              })}
            </Box>
          )}
        </Box>
      </Stack>
    </Paper>
  );
}

export default memo(AiDiagnosisOverview);
