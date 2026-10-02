import { t } from "../i18n";

export function scrollToFirstInvalidField(container: HTMLElement | null) {
  const field = container?.querySelector<HTMLElement>('[data-field-error="true"]');
  if (!field) return;

  field.scrollIntoView?.({ behavior: "smooth", block: "center" });
  const focusTarget = field.matches("input, textarea, [role='combobox'], button")
    ? field
    : field.querySelector<HTMLElement>("input, textarea, [role='combobox'], button");
  focusTarget?.focus({ preventScroll: true });
}

export function requiredInputMessage(field: string) {
  return t("validation.required_input", { field });
}

export function requiredSelectionMessage(field: string) {
  return t("validation.required_selection", { field });
}

export function nonNegativeMessage(field: string) {
  return t("validation.non_negative_field", { field });
}
