// 카테고리 배지 스타일 정의 - 5가지 색상
// 라이트 모드와 다크 모드 색상을 모두 지원
// opacity는 8자리 hex 값(#RRGGBBAA)으로 처리
// 텍스트 opacity 0.8 = CC, 배경 opacity 0.9 (다크모드만) = E6
export const BADGE_STYLES = [
  { 
    // 1. Red (부재, 중요, 긴급 등)
    bg: "bg-[#FFEBEB] dark:!bg-[#FFEBEBE6]", 
    text: "text-[#D83232CC] dark:!text-[#8C0000CC]" 
  },
  { 
    // 2. Yellow (재상담, 주의, 보류 등)
    bg: "bg-[#FFF5D5] dark:!bg-[#FFF5D5E6]", 
    text: "text-[#976400CC] dark:!text-[#724B00CC]" 
  },
  { 
    // 3. Gray (AS요청, 일반, 기타 등)
    bg: "bg-[#E2E2E2] dark:!bg-[#B9B9B9]", 
    text: "text-[#595959CC] dark:!text-[#333333CC]" 
  },
  { 
    // 4. Blue (안내, 양호, 승인 등)
    bg: "bg-[#D3E1FE] dark:!bg-[#D3E1FEE6]", 
    text: "text-[#4D82F3CC] dark:!text-[#0037B3CC]" 
  },
  { 
    // 5. Green (결제완료, 성공, 해결 등)
    bg: "bg-[#D6FAE8] dark:!bg-[#D6FAE8E6]", 
    text: "text-[#00B55BCC] dark:!text-[#004824CC]" 
  },
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

