export function formatDetailDate(dt: string) {
  try {
    const d = new Date(dt);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const da = String(d.getDate()).padStart(2, "0");
    const hh = String(d.getHours()).padStart(2, "0");
    const mm = String(d.getMinutes()).padStart(2, "0");
    return `${y}. ${m}. ${da}`;
  } catch {
    return dt;
  }
}

// 상담 내용 기록(메모) 타임스탬프: 날짜 + 시간을 항상 한국 시간(KST) 기준으로 표시
export function formatConsultationNoteDateTime(dt: string) {
  try {
    const d = new Date(dt);
    const parts = new Intl.DateTimeFormat("ko-KR", {
      timeZone: "Asia/Seoul",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).formatToParts(d);
    const get = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
    const y = get("year");
    const m = get("month");
    const da = get("day");
    const hh = get("hour") === "24" ? "00" : get("hour");
    const mm = get("minute");
    return `${y}. ${m}. ${da} ${hh}:${mm}`;
  } catch {
    return dt;
  }
}



