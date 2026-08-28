/** 영업메모 최대 길이. 요약정보·자산현황·고객성향·거절사유·특이사항을 통합한 필드라 넉넉하게 잡는다. */
export const SALES_MEMO_MAX_LENGTH = 10000;

/** 영업메모 textarea 최소 높이(px). 5줄 기준. */
const SALES_MEMO_MIN_HEIGHT_PX = 102;

/**
 * 내용 길이에 맞춰 textarea 높이를 늘린다. scrollHeight를 읽기 전에 height를 auto로
 * 되돌려야 줄어드는 방향으로도 동작한다.
 */
export function resizeSalesMemoTextarea(
  textarea: HTMLTextAreaElement,
  minimumHeight = SALES_MEMO_MIN_HEIGHT_PX
) {
  textarea.style.height = "auto";
  textarea.style.height = `${Math.max(textarea.scrollHeight, minimumHeight)}px`;
}
