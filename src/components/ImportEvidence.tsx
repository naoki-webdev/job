import { useState } from "react";
import { Alert, Box, Button, Stack, Typography } from "@mui/material";
import { createLocation, createTechStack } from "../api/masterData";
import type { JobDraftResponse, MasterDataItem } from "../types/job";

export default function ImportEvidence({ result, readOnly, onAdd }: { result: JobDraftResponse; readOnly: boolean; onAdd?: (kind: "tech_stacks" | "location", item: MasterDataItem) => void }) {
  const [highlight, setHighlight] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const add = async (kind: "tech_stacks" | "location", name: string) => {
    setBusy(true); setError("");
    try {
      const payload = { name, score_weight: 0, active: true, display_order: 0 };
      const item = await (kind === "location" ? createLocation(payload) : createTechStack(payload));
      onAdd?.(kind, item);
    } catch { setError("マスタを追加できませんでした。登録済みか設定画面で確認してください。"); }
    finally { setBusy(false); }
  };
  const source = result.source_text ?? "";
  const offset = highlight ? source.indexOf(highlight) : -1;
  return <Stack spacing={1}>
    {error && <Alert severity="error">{error}</Alert>}
    {(result.unmatched?.tech_stacks ?? []).map((name) => <Box key={name}>未登録の技術：{name} {!readOnly && onAdd && <Button disabled={busy} onClick={() => void add("tech_stacks", name)}>マスタに追加</Button>}</Box>)}
    {result.unmatched?.location && <Box>未登録の勤務地：{result.unmatched.location} {!readOnly && onAdd && <Button disabled={busy} onClick={() => void add("location", result.unmatched!.location!)}>マスタに追加</Button>}</Box>}
    {Object.entries(result.evidence ?? {}).map(([key, lines]) => <Box key={key}><Typography variant="caption">{{ company_name: "会社名", salary_range: "年収", work_style: "働き方", location: "勤務地", tech_stacks: "技術" }[key] ?? key}の根拠</Typography>{lines.map((line) => <Button key={line} size="small" sx={{ textAlign: "left" }} onClick={() => { setHighlight(line); requestAnimationFrame(() => document.getElementById("import-evidence-highlight")?.scrollIntoView({ block: "nearest" })); }}>{line}</Button>)}</Box>)}
    {highlight && <Box component="pre" sx={{ maxHeight: 220, overflow: "auto", whiteSpace: "pre-wrap", fontSize: 13 }}>{offset >= 0 ? <>{source.slice(0, offset)}<mark id="import-evidence-highlight">{highlight}</mark>{source.slice(offset + highlight.length)}</> : source}</Box>}
  </Stack>;
}
