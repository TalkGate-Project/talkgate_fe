import { formatPhoneNumber } from "@/utils/format";
import type { CustomerDetail } from "@/types/customers";

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

/**
 * 헤더에 노출할 고객 요약 — 이름은 타이틀, 연락처는 보조 텍스트로 분리해 돌려준다.
 *
 * `showIdentity: false`면 이름·연락처를 빼고 "고객정보"만 남긴다. 모바일 폭(<780px)에서는
 * 헤더에 넣을 자리가 없어 제외하기로 한 결정이라, 태블릿·PC에서만 true로 넘긴다.
 */
export function buildHeaderIdentity(
  detail: CustomerDetail | null | undefined,
  { showIdentity = true }: { showIdentity?: boolean } = {}
) {
  const name = showIdentity ? detail?.name?.trim() : undefined;
  const title = name ? `${name}님 고객정보` : "고객정보";
  const contact = showIdentity && detail?.contact1 ? formatPhoneNumber(detail.contact1) : "";
  return { title, contact, ariaLabel: [title, contact].filter(Boolean).join(" ") };
}
