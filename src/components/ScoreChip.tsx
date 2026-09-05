import { memo } from "react";

import Stack from "@mui/material/Stack";
import Chip from "@mui/material/Chip";

import { t } from "../i18n";

type ScoreChipProps = {
  score: number;
  recommended?: boolean;
};

function colorByScore(score: number): "success" | "warning" | "default" | "error" {
  if (score >= 50) return "success";
  if (score >= 20) return "warning";
  if (score >= 0) return "default";
  return "error";
}

function ScoreChip({ score, recommended = false }: ScoreChipProps) {
  const color = colorByScore(score);

  return (
    <Stack direction="row" spacing={0.75} alignItems="center">
      <Chip
        label={score}
        color={color}
        size="small"
        variant={color === "default" ? "outlined" : "filled"}
        sx={{
          minWidth: 54,
          justifyContent: "center",
          fontFamily: '"Roboto Mono", "SFMono-Regular", Consolas, monospace',
        }}
      />
      {recommended && (
        <Chip
          label={t("jobs.recommended")}
          color="secondary"
          size="small"
          variant="outlined"
          sx={{ backgroundColor: "rgba(68,84,111,0.06)" }}
        />
      )}
    </Stack>
  );
}

export default memo(ScoreChip);
