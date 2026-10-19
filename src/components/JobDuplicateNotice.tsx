import { useEffect, useState } from "react";
import Alert from "@mui/material/Alert";
import { API_BASE_URL, requestJson } from "../api/client";

export default function JobDuplicateNotice({ company, url, positionId, excludeId }: { company: string; url: string; positionId: number | ""; excludeId?: number }) {
  const [duplicates, setDuplicates] = useState<Array<{ id: number; company_name: string; position: string }>>([]);
  useEffect(() => {
    setDuplicates([]);
    if (!company.trim() && !url.trim()) return;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      const params = new URLSearchParams({ company_name: company, source_url: url, position_id: String(positionId), exclude_id: String(excludeId ?? "") });
      void requestJson<typeof duplicates>(API_BASE_URL + "/api/jobs/duplicates?" + params, { signal: controller.signal })
        .then((items) => { if (!controller.signal.aborted && Array.isArray(items)) setDuplicates(items); })
        .catch(() => {});
    }, 400);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [company, url, positionId, excludeId]);
  return duplicates.length ? <Alert severity="warning">登録済みの可能性があります：{duplicates.map((job) => job.company_name + " / " + job.position).join("、")}。同じ会社の別の求人なら、そのまま登録できます。</Alert> : null;
}
