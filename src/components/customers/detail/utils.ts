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
 *
 * `customerId`는 지금 열려 있는 고객의 id다. 다른 고객으로 모달을 다시 열면 새 응답이
 * 도착할 때까지 `detail`에 직전 고객이 남아 있어서, 넘기지 않으면 헤더에 남의 이름이
 * 잠깐 스친다. id가 맞을 때만 이름·연락처를 쓴다.
 *
 * 아직 도착하지 않았으면 `isIdentityPending`이 true다 — 이름 자리에 스켈레톤을 깔라는 뜻이다
 * (`CustomerHeaderIdentity`). 이름을 아예 안 쓰는 모바일 폭에서는 기다릴 것이 없어 false다.
 */
export function buildHeaderIdentity(
  detail: CustomerDetail | null | undefined,
  {
    showIdentity = true,
    customerId,
  }: { showIdentity?: boolean; customerId?: number | null } = {}
) {
  const isDetailForRequestedCustomer = customerId == null || detail?.id === customerId;
  const canShowIdentity = showIdentity && isDetailForRequestedCustomer;
  const name = canShowIdentity ? detail?.name?.trim() : undefined;
  const title = name ? `${name}님 고객정보` : "고객정보";
  const contact = canShowIdentity && detail?.contact1 ? formatPhoneNumber(detail.contact1) : "";
  return {
    title,
    contact,
    isIdentityPending: showIdentity && !isDetailForRequestedCustomer,
    ariaLabel: [title, contact].filter(Boolean).join(" "),
  };
}

export type CustomerHeaderIdentityValue = ReturnType<typeof buildHeaderIdentity>;
