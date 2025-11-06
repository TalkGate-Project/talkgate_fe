import { format } from "date-fns";

export function formatTimeFromISO(iso?: string | null): string {
  if (!iso) return "-";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "-";
  return format(date, "HH:mm");
}


