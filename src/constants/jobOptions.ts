import type { EmploymentType, JobStatus, WorkStyle } from "../types/job";

export const JOB_STATUS_OPTIONS: JobStatus[] = ["interested", "applied", "interviewing", "offer", "rejected"];
export const WORK_STYLE_OPTIONS: WorkStyle[] = ["full_remote", "hybrid", "onsite"];
export const EMPLOYMENT_TYPE_OPTIONS: EmploymentType[] = ["full_time", "contract"];
export const ACTIVE_PIPELINE_STATUSES: JobStatus[] = ["interested", "applied", "interviewing"];

export function isJobStatus(value: string): value is JobStatus {
  return JOB_STATUS_OPTIONS.some((option) => option === value);
}

export function isWorkStyle(value: string): value is WorkStyle {
  return WORK_STYLE_OPTIONS.some((option) => option === value);
}

export function isEmploymentType(value: string): value is EmploymentType {
  return EMPLOYMENT_TYPE_OPTIONS.some((option) => option === value);
}
