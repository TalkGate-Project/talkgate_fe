/**
 * 클래스명을 병합하는 유틸리티 함수
 * 조건부 클래스명과 배열을 지원합니다.
 */
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

