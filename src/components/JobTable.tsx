import { memo } from "react";

import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TablePagination from "@mui/material/TablePagination";
import TableRow from "@mui/material/TableRow";
import TableSortLabel from "@mui/material/TableSortLabel";

import { t } from "../i18n";
import type { Job, JobSortKey, SortDirection } from "../types/job";
import { formatDateTime, formatSalaryRange } from "../utils/jobFormat";
import CompanyLogoAvatar from "./CompanyLogoAvatar";
import OverflowTooltipText from "./OverflowTooltipText";
import ScoreChip from "./ScoreChip";

type JobTableProps = {
  jobs: Job[];
  page: number;
  perPage: number;
  totalCount: number;
  sort: JobSortKey;
  direction: SortDirection;
  onSortChange: (sort: JobSortKey, direction: SortDirection) => void;
  onPageChange: (page: number) => void;
  onPerPageChange: (perPage: number) => void;
  onRowClick: (jobId: number) => void;
};

const columns: Array<{ key: JobSortKey; labelKey: string }> = [
  { key: "company_name", labelKey: "jobs.table.company" },
  { key: "position", labelKey: "jobs.table.position" },
  { key: "status", labelKey: "jobs.table.status" },
  { key: "work_style", labelKey: "jobs.table.work_style" },
  { key: "salary_max", labelKey: "jobs.table.salary" },
  { key: "score", labelKey: "jobs.table.score" },
  { key: "updated_at", labelKey: "jobs.table.updated_at" },
];

function statusColor(status: Job["status"]): "default" | "warning" | "primary" | "success" | "error" {
  if (status === "interested") return "default";
  if (status === "applied") return "primary";
  if (status === "interviewing") return "warning";
  if (status === "offer") return "success";
  return "error";
}

function JobTable({
  jobs,
  page,
  perPage,
  totalCount,
  sort,
  direction,
  onSortChange,
  onPageChange,
  onPerPageChange,
  onRowClick,
}: JobTableProps) {
  const handleSort = (key: JobSortKey) => {
    const nextDirection: SortDirection = sort === key && direction === "asc" ? "desc" : "asc";
    onSortChange(key, nextDirection);
  };

  if (jobs.length === 0) {
    return (
      <Box
        sx={{
          px: 4,
          py: 5,
          textAlign: "center",
          background: "linear-gradient(180deg, rgba(255,255,255,0.98), rgba(244,245,247,0.95))",
        }}
      >
        <Stack spacing={1}>
          <Typography variant="h6">{t("jobs.empty")}</Typography>
          <Typography variant="body2" color="text.secondary">
            {t("jobs.empty_hint")}
          </Typography>
        </Stack>
      </Box>
    );
  }

  return (
    <Box>
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ backgroundColor: "rgba(250,251,252,1)" }}>
              {columns.map((column) => (
                <TableCell key={column.key} sx={{ py: 1.5, fontWeight: 700, whiteSpace: "nowrap" }}>
                  <TableSortLabel
                    active={sort === column.key}
                    direction={sort === column.key ? direction : "asc"}
                    onClick={() => handleSort(column.key)}
                  >
                    {t(column.labelKey)}
                  </TableSortLabel>
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {jobs.map((job) => (
              <TableRow
                key={job.id}
                hover
                tabIndex={0}
                aria-label={job.company_name}
                sx={{
                  cursor: "pointer",
                  "&:last-child td": { borderBottom: 0 },
                  "&:hover": { backgroundColor: "rgba(238,242,247,0.7)" },
                }}
                onClick={() => onRowClick(job.id)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    onRowClick(job.id);
                  }
                }}
              >
                <TableCell sx={{ py: 1.85, minWidth: 220 }}>
                  <Stack direction="row" spacing={1.25} alignItems="center" sx={{ minWidth: 0 }}>
                    <CompanyLogoAvatar companyName={job.company_name} logoUrl={job.company_logo_url} />
                    <Stack spacing={0.25} sx={{ minWidth: 0 }}>
                      <Typography variant="body2" fontWeight={700} sx={{ maxWidth: 240 }}>
                        <OverflowTooltipText text={job.company_name} />
                      </Typography>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ fontFamily: '"Roboto Mono", "SFMono-Regular", Consolas, monospace' }}
                      >
                        #{job.id}
                      </Typography>
                    </Stack>
                  </Stack>
                </TableCell>
                <TableCell sx={{ minWidth: 180, maxWidth: 240 }}>
                  <Typography variant="body2">
                    <OverflowTooltipText text={job.position} />
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip size="small" color={statusColor(job.status)} label={t(`enums.job_status.${job.status}`)} />
                </TableCell>
                <TableCell>
                  <Chip size="small" variant="outlined" label={t(`enums.work_style.${job.work_style}`)} />
                </TableCell>
                <TableCell>{formatSalaryRange(job.salary_min, job.salary_max)}</TableCell>
                <TableCell>
                  <ScoreChip score={job.score} />
                </TableCell>
                <TableCell>{formatDateTime(job.updated_at)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        component="div"
        rowsPerPageOptions={[10, 20, 50]}
        count={totalCount}
        rowsPerPage={perPage}
        page={Math.max(page - 1, 0)}
        onPageChange={(_event, nextPage) => onPageChange(nextPage + 1)}
        onRowsPerPageChange={(event) => onPerPageChange(Number(event.target.value))}
        sx={{
          borderTop: "1px solid rgba(9,30,66,0.08)",
          backgroundColor: "rgba(244,245,247,0.9)",
        }}
      />
    </Box>
  );
}

export default memo(JobTable);
