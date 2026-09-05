import { t } from "../i18n";

export function formatSalaryRange(min: number, max: number) {
  return t("jobs.salary_range", {
    min: min.toLocaleString("ja-JP"),
    max: max.toLocaleString("ja-JP"),
  });
}

export function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(value));
}
