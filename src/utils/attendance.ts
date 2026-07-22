export function formatHm(iso?: string | null) {
  if (!iso) return "-";
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function computeWorkTime(att?: string | null, leave?: string | null) {
  if (!att || !leave) return "";
  const diffMs = new Date(leave).getTime() - new Date(att).getTime();
  if (diffMs <= 0) return "";
  const mins = Math.floor(diffMs / 60000);
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h}시간 ${m}분`;
}

export function formatDate(dateString: string) {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const weekdays = ["일", "월", "화", "수", "목", "금", "토"];
  const weekday = weekdays[date.getDay()];

  return `${year} - ${month} - ${day} (${weekday})`;
}

