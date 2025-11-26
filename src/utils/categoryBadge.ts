// 카테고리 배지 스타일 정의 - 5가지 색상
export const BADGE_STYLES = [
  { bg: "bg-[#FFEBEB]", text: "text-[#D83232]" }, // 1. Red (부재, 중요, 긴급 등)
  { bg: "bg-[#FFF5D5]", text: "text-[#976400]" }, // 2. Yellow (재상담, 주의, 보류 등)
  { bg: "bg-[#E2E2E2]", text: "text-[#595959]" }, // 3. Gray (AS요청, 일반, 기타 등)
  { bg: "bg-[#D3E1FE]", text: "text-[#4D82F3]" }, // 4. Blue (안내, 양호, 승인 등)
  { bg: "bg-[#D6FAE8]", text: "text-[#00B55B]" }, // 5. Green (결제완료, 성공, 해결 등)
] as const;

export type BadgeStyle = (typeof BADGE_STYLES)[number];

/**
 * 카테고리 이름과 ID를 기반으로 배지 스타일을 반환
 * @param name 카테고리 이름
 * @param id 카테고리 ID (fallback용)
 */
export function getBadgeStyle(name: string, id: number): BadgeStyle {
  const n = name.trim();

  // 1. Red (부재)
  if (n.includes("부재") || n.includes("중요") || n.includes("긴급") || n.includes("에러") || n.includes("실패") || n.includes("취소")) {
    return BADGE_STYLES[0];
  }

  // 2. Yellow (재상담)
  if (n.includes("재상담") || n.includes("주의") || n.includes("경고") || n.includes("보류") || n.includes("대기")) {
    return BADGE_STYLES[1];
  }

  // 3. Gray (AS요청)
  if (n.includes("AS") || n.includes("보통") || n.includes("일반") || n.includes("기타")) {
    return BADGE_STYLES[2];
  }

  // 4. Blue (무료방안내)
  if (n.includes("방안내") || n.includes("안내") || n.includes("양호") || n.includes("승인")) {
    return BADGE_STYLES[3];
  }

  // 5. Green (결제완료)
  if (n.includes("결제") || n.includes("완료") || n.includes("성공") || n.includes("해결") || n.includes("필요") || n.includes("요청") || n.includes("문의")) {
    return BADGE_STYLES[4];
  }

  // Fallback: ID 기반 결정론적 매핑
  if (!id) return BADGE_STYLES[2]; // 기본값: Gray
  return BADGE_STYLES[id % BADGE_STYLES.length];
}

