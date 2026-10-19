import { useRef, useState } from "react";
import { Alert, Button, Collapse, Checkbox, FormControlLabel, Paper, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from "@mui/material";
import { fetchJob } from "../api/jobRequests";
import type { Job } from "../types/job";
import { formatSalaryRange } from "../utils/jobFormat";
import { t } from "../i18n";

export default function JobComparison({ jobs }: { jobs: Job[] }) {
  const [choosing, setChoosing] = useState(false);
  const [selected, setSelected] = useState<Job[]>([]);
  const requests = useRef(new Map<number, symbol>());
  const [error, setError] = useState("");
  const remove = (id: number) => {
    requests.current.delete(id);
    setSelected((items) => items.filter((item) => item.id !== id));
  };
  const toggle = async (job: Job) => {
    if (selected.some((item) => item.id === job.id)) { remove(job.id); return; }
    if (selected.length >= 3) return;
    const request = Symbol();
    requests.current.set(job.id, request);
    setSelected((items) => [...items, job]);
    setError("");
    try {
      const detail = await fetchJob(job.id);
      if (requests.current.get(job.id) !== request) return;
      setSelected((items) => items.map((item) => item.id === job.id ? detail : item));
    } catch {
      if (requests.current.get(job.id) !== request) return;
      remove(job.id);
      setError("比較用の求人を取得できませんでした。");
    } finally {
      if (requests.current.get(job.id) === request) requests.current.delete(job.id);
    }
  };
  return <Paper variant="outlined" sx={{ p: 2 }}>
    <Typography fontWeight={700}>求人を比較（最大3件）</Typography>
    <Button onClick={() => setChoosing((open) => !open)}>{choosing ? "求人の選択を閉じる" : "比較する求人を選ぶ"}</Button>
    <Collapse in={choosing} unmountOnExit><Stack direction="row" useFlexGap flexWrap="wrap">{jobs.map((job) => <FormControlLabel key={job.id} label={job.company_name} control={<Checkbox size="small" checked={selected.some((item) => item.id === job.id)} disabled={selected.length >= 3 && !selected.some((item) => item.id === job.id)} onChange={() => void toggle(job)} />} />)}</Stack></Collapse>
    {error && <Alert severity="error">{error}</Alert>}
    {selected.length > 0 && <><Button onClick={() => { requests.current.clear(); setSelected([]); }}>比較を解除</Button><TableContainer><Table size="small"><TableHead><TableRow><TableCell>項目</TableCell>{selected.map((job) => <TableCell key={job.id}>{job.company_name}<Button size="small" aria-label={job.company_name + "を比較から外す"} onClick={() => void toggle(job)}>外す</Button></TableCell>)}</TableRow></TableHead><TableBody>{[
      ["年収", (job: Job) => formatSalaryRange(job.salary_min, job.salary_max)],
      ["働き方", (job: Job) => t(["enums", "work_style", job.work_style].join("."))],
      ["技術", (job: Job) => job.tech_stack],
      ["スコア", (job: Job) => String(job.score)],
      ["AIの懸念点", (job: Job) => job.ai_evaluation?.conflicts.map((finding) => finding.reason).join(" / ") || "判定なし・該当なし"],
      ["次の対応", (job: Job) => [job.next_action, job.action_due_on].filter(Boolean).join(" / ") || "未設定"],
    ].map(([label, value]) => <TableRow key={String(label)}><TableCell>{String(label)}</TableCell>{selected.map((job) => <TableCell key={job.id}>{(value as (job: Job) => string)(job)}</TableCell>)}</TableRow>)}</TableBody></Table></TableContainer></>}
  </Paper>;
}
