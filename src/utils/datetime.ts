import { format } from "date-fns";

export function formatTimeFromISO(iso?: string | null): string {
  if (!iso) return "-";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "-";
  return format(date, "HH:mm");
}

export function formatMonthDay(dateInput: string | Date): string {
  const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  if (Number.isNaN(date.getTime())) return typeof dateInput === "string" ? dateInput : "-";
  return format(date, "MM.dd");
}


