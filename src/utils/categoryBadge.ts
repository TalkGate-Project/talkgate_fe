import {
  DEFAULT_STATUS_COLOR,
  getStatusColorTone,
  STATUS_COLOR_PALETTE,
} from "@/utils/statusColors";

export type BadgeStyle = {
  backgroundColor: string;
  color: string;
};

function getFallbackBackgroundColor(name: string, id: number): string {
  const normalizedName = name.trim();
  const fallbackPalette = [
    STATUS_COLOR_PALETTE[6].backgroundColor,
    STATUS_COLOR_PALETTE[4].backgroundColor,
    STATUS_COLOR_PALETTE[7].backgroundColor,
    STATUS_COLOR_PALETTE[2].backgroundColor,
    STATUS_COLOR_PALETTE[0].backgroundColor,
  ];

  if (
    normalizedName.includes("부재") ||
    normalizedName.includes("중요") ||
    normalizedName.includes("긴급") ||
    normalizedName.includes("에러") ||
    normalizedName.includes("실패") ||
    normalizedName.includes("취소")
  ) {
    return fallbackPalette[0];
  }

  if (
    normalizedName.includes("재상담") ||
    normalizedName.includes("주의") ||
    normalizedName.includes("경고") ||
    normalizedName.includes("보류") ||
    normalizedName.includes("대기")
  ) {
    return fallbackPalette[1];
  }

  if (
    normalizedName.includes("AS") ||
    normalizedName.includes("보통") ||
    normalizedName.includes("일반") ||
    normalizedName.includes("기타")
  ) {
    return fallbackPalette[2];
  }

  if (
    normalizedName.includes("방안내") ||
    normalizedName.includes("안내") ||
    normalizedName.includes("양호") ||
    normalizedName.includes("승인")
  ) {
    return fallbackPalette[3];
  }

  if (
    normalizedName.includes("결제") ||
    normalizedName.includes("완료") ||
    normalizedName.includes("성공") ||
    normalizedName.includes("해결") ||
    normalizedName.includes("필요") ||
    normalizedName.includes("요청") ||
    normalizedName.includes("문의")
  ) {
    return fallbackPalette[4];
  }

  if (!id) {
    return STATUS_COLOR_PALETTE[7].backgroundColor;
  }

  return fallbackPalette[id % fallbackPalette.length];
}

/**
 * 카테고리 이름, ID, 서버 배경색을 기반으로 배지 스타일을 반환
 * @param name 카테고리 이름
 * @param id 카테고리 ID (fallback용)
 * @param backgroundColor 서버에서 내려준 배경색
 */
export function getBadgeStyle(
  name: string,
  id: number,
  backgroundColor?: string | null
): BadgeStyle {
  const fallbackBackgroundColor = getFallbackBackgroundColor(name, id) || DEFAULT_STATUS_COLOR;
  const tone = getStatusColorTone(backgroundColor ?? fallbackBackgroundColor);

  return {
    backgroundColor: tone.backgroundColor,
    color: tone.textColor,
  };
}

