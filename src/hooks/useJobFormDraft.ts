import { useCallback, useEffect, useMemo, useState } from "react";

import { t } from "../i18n";
import type { Job, JobFormPayload, MasterDataItem } from "../types/job";

export type JobFormDraft = Omit<JobFormPayload, "position_id" | "location_id" | "salary_min" | "salary_max" | "source_url"> & {
  position_id: number | "";
  location_id: number | "";
  salary_min: number | "";
  salary_max: number | "";
  source_url: string;
  company_logo: File | null;
  remove_company_logo: boolean;
};

type JobFormDraftParams = {
  open: boolean;
  initialJob: Job | null;
  initialDraft?: Partial<JobFormPayload> | null;
  locations: MasterDataItem[];
  positions: MasterDataItem[];
  techStacks: MasterDataItem[];
};

export const emptyForm: JobFormDraft = {
  company_name: "",
  position_id: "",
  status: "interested",
  work_style: "hybrid",
  employment_type: "full_time",
  salary_min: 4_500_000,
  salary_max: 6_000_000,
  tech_stack_ids: [],
  location_id: "",
  notes: "",
  source_url: "",
  company_logo: null,
  remove_company_logo: false,
};

export function useJobFormDraft({
  open,
  initialJob,
  initialDraft,
  locations,
  positions,
  techStacks,
}: JobFormDraftParams) {
  const [formValues, setFormValues] = useState<JobFormDraft>(emptyForm);
  const [touchedFields, setTouchedFields] = useState<Partial<Record<keyof JobFormDraft, boolean>>>({});
  const [submitAttempted, setSubmitAttempted] = useState(false);

  useEffect(() => {
    if (!open) return;

    setFormValues(buildFormValues(initialJob, initialDraft));
    setTouchedFields({});
    setSubmitAttempted(false);
  }, [initialDraft, initialJob, open]);

  const handleChange = useCallback(<K extends keyof JobFormDraft>(key: K, value: JobFormDraft[K]) => {
    setFormValues((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleBlur = useCallback((key: keyof JobFormDraft) => {
    setTouchedFields((prev) => ({ ...prev, [key]: true }));
  }, []);

  const errors = useMemo(() => validateFormValues(formValues), [formValues]);
  const isValid = Object.keys(errors).length === 0;
  const getFieldError = useCallback(
    (key: keyof JobFormDraft) => (submitAttempted || touchedFields[key] ? errors[key] : undefined),
    [errors, submitAttempted, touchedFields],
  );
  const selectablePositions = useMemo(
    () => toSelectableItems(positions, formValues.position_id === "" ? [] : [formValues.position_id]),
    [formValues.position_id, positions],
  );
  const selectableLocations = useMemo(
    () => toSelectableItems(locations, formValues.location_id === "" ? [] : [formValues.location_id]),
    [formValues.location_id, locations],
  );
  const selectableTechStacks = useMemo(
    () => toSelectableItems(techStacks, formValues.tech_stack_ids),
    [formValues.tech_stack_ids, techStacks],
  );

  const submit = useCallback((onSubmit: (payload: JobFormPayload) => Promise<void> | void) => {
    setSubmitAttempted(true);
    if (!isValid) return;

    void onSubmit(toJobFormPayload(formValues));
  }, [formValues, isValid]);

  return {
    formValues,
    selectableLocations,
    selectablePositions,
    selectableTechStacks,
    getFieldError,
    handleBlur,
    handleChange,
    submit,
  };
}

export function buildFormValues(job: Job | null, draft?: Partial<JobFormPayload> | null): JobFormDraft {
  if (job) {
    return {
      company_name: job.company_name,
      position_id: job.position_id,
      status: job.status,
      work_style: job.work_style,
      employment_type: job.employment_type,
      salary_min: job.salary_min,
      salary_max: job.salary_max,
      tech_stack_ids: job.tech_stack_ids,
      location_id: job.location_id,
      notes: job.notes,
      source_url: job.source_url ?? "",
      company_logo: null,
      remove_company_logo: false,
    };
  }

  if (!draft) return emptyForm;

  return {
    ...emptyForm,
    company_name: draft.company_name ?? emptyForm.company_name,
    position_id: draft.position_id ?? emptyForm.position_id,
    status: draft.status ?? emptyForm.status,
    work_style: draft.work_style ?? emptyForm.work_style,
    employment_type: draft.employment_type ?? emptyForm.employment_type,
    salary_min: typeof draft.salary_min === "number" ? draft.salary_min : emptyForm.salary_min,
    salary_max: typeof draft.salary_max === "number" ? draft.salary_max : emptyForm.salary_max,
    tech_stack_ids: draft.tech_stack_ids ?? emptyForm.tech_stack_ids,
    location_id: draft.location_id ?? emptyForm.location_id,
    notes: draft.notes ?? emptyForm.notes,
    source_url: draft.source_url ?? emptyForm.source_url,
  };
}

export function parseNumericInput(value: string | number) {
  return value === "" ? "" : Number(value);
}

export function normalizeIdList(value: string[] | number[] | string) {
  const values = Array.isArray(value) ? value : value.split(",");
  return values.map((item) => Number(item)).filter((item) => Number.isFinite(item));
}

export function formatMasterDataName(item: MasterDataItem) {
  return item.active ? item.name : `${item.name} (${t("master_data.inactive_suffix")})`;
}

export function summarizeSelectedTechStacks(techStacks: MasterDataItem[], selectedIds: number[]) {
  return techStacks
    .filter((techStack) => selectedIds.includes(techStack.id))
    .map((techStack) => formatMasterDataName(techStack))
    .join(", ");
}

export function toJobFormPayload(values: JobFormDraft): JobFormPayload {
  const payload: JobFormPayload = {
    ...values,
    position_id: Number(values.position_id),
    location_id: Number(values.location_id),
    salary_min: Number(values.salary_min),
    salary_max: Number(values.salary_max),
    source_url: values.source_url.trim() || null,
  };

  if (!values.company_logo) delete payload.company_logo;
  if (!values.remove_company_logo) delete payload.remove_company_logo;

  return payload;
}

function toSelectableItems(items: MasterDataItem[], selectedIds: number[]) {
  const selectedIdSet = new Set(selectedIds);
  return items.filter((item) => item.active || selectedIdSet.has(item.id));
}

function validateFormValues(formValues: JobFormDraft) {
  const nextErrors: Partial<Record<keyof JobFormDraft, string>> = {};

  if (!formValues.company_name.trim()) nextErrors.company_name = t("validation.required");
  if (!formValues.position_id) nextErrors.position_id = t("validation.required");
  if (!formValues.tech_stack_ids.length) nextErrors.tech_stack_ids = t("validation.required");
  if (!formValues.location_id) nextErrors.location_id = t("validation.required");
  if (formValues.salary_min === "") nextErrors.salary_min = t("validation.required");
  if (formValues.salary_max === "") nextErrors.salary_max = t("validation.required");
  if (typeof formValues.salary_min === "number" && formValues.salary_min < 0) {
    nextErrors.salary_min = t("validation.non_negative");
  }
  if (typeof formValues.salary_max === "number" && formValues.salary_max < 0) {
    nextErrors.salary_max = t("validation.non_negative");
  }
  if (
    typeof formValues.salary_min === "number" &&
    typeof formValues.salary_max === "number" &&
    formValues.salary_max < formValues.salary_min
  ) {
    nextErrors.salary_max = t("validation.salary_range");
  }

  return nextErrors;
}
