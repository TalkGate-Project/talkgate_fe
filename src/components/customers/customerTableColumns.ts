import type { CustomerSortType } from "@/hooks/useCustomersFilters";

export type CustomerTableVariant = "dataProvider" | "general";

export type CustomerColumnKey =
  | "rowNumber"
  | "name"
  | "contact"
  | "ip"
  | "mediaCompany"
  | "site"
  | "applicationRoute"
  | "keyword"
  | "category"
  | "assignedMember"
  | "applicationTime"
  | "confirm";

export type CustomerColumnDefinition = {
  key: CustomerColumnKey;
  label: string;
  /** 기본 너비(레이아웃 px). 사용자가 너비를 조정하기 전에는 이 비율로 표 폭을 채운다 */
  defaultWidth: number;
  /** 드래그로 줄일 수 있는 최소 너비(레이아웃 px) */
  minWidth: number;
  /** false면 표시 항목 설정에서 숨길 수 없다 */
  hideable: boolean;
};

/** 체크박스 열은 설정 대상이 아니라 항상 맨 앞에 고정 폭으로 둔다 */
export const CHECKBOX_COLUMN_WIDTH = 56;
export const COLUMN_MAX_WIDTH = 800;

// 연락처: 번호(약 102px) + 중복 "+N" 버튼 + 간격 + 좌우 패딩이 말줄임 없이 들어가는 폭.
// 이름: 진행 단계·미팅중 배지가 붙어도 이름이 가려지지 않는 폭.
const DATA_PROVIDER_COLUMNS: CustomerColumnDefinition[] = [
  { key: "rowNumber", label: "번호", defaultWidth: 64, minWidth: 48, hideable: true },
  { key: "name", label: "이름", defaultWidth: 180, minWidth: 120, hideable: false },
  { key: "contact", label: "연락처", defaultWidth: 200, minWidth: 140, hideable: true },
  { key: "ip", label: "IP", defaultWidth: 170, minWidth: 100, hideable: true },
  { key: "mediaCompany", label: "매체사", defaultWidth: 100, minWidth: 60, hideable: true },
  { key: "site", label: "사이트", defaultWidth: 100, minWidth: 60, hideable: true },
  { key: "applicationRoute", label: "신청경로", defaultWidth: 90, minWidth: 60, hideable: true },
  { key: "keyword", label: "키워드", defaultWidth: 100, minWidth: 60, hideable: true },
  { key: "applicationTime", label: "신청시간", defaultWidth: 140, minWidth: 110, hideable: true },
];

const GENERAL_COLUMNS: CustomerColumnDefinition[] = [
  { key: "rowNumber", label: "번호", defaultWidth: 64, minWidth: 48, hideable: true },
  { key: "name", label: "이름", defaultWidth: 180, minWidth: 120, hideable: false },
  { key: "contact", label: "연락처", defaultWidth: 200, minWidth: 140, hideable: true },
  { key: "mediaCompany", label: "매체사", defaultWidth: 90, minWidth: 60, hideable: true },
  { key: "site", label: "사이트", defaultWidth: 90, minWidth: 60, hideable: true },
  { key: "applicationRoute", label: "신청경로", defaultWidth: 90, minWidth: 60, hideable: true },
  { key: "category", label: "카테고리", defaultWidth: 110, minWidth: 80, hideable: true },
  { key: "assignedMember", label: "담당자", defaultWidth: 150, minWidth: 90, hideable: true },
  { key: "applicationTime", label: "신청시간", defaultWidth: 130, minWidth: 110, hideable: true },
  { key: "confirm", label: "전체확인", defaultWidth: 100, minWidth: 90, hideable: true },
];

export function getCustomerColumnDefinitions(
  variant: CustomerTableVariant
): CustomerColumnDefinition[] {
  return variant === "dataProvider" ? DATA_PROVIDER_COLUMNS : GENERAL_COLUMNS;
}

/** 정렬 기준이 어느 열에 붙어 있는지. 그 열을 숨기면 정렬을 기본값으로 되돌린다 */
export const SORT_TYPE_COLUMN: Record<CustomerSortType, CustomerColumnKey> = {
  applicationDate: "applicationTime",
  lastNoteDate: "applicationTime",
  category: "category",
  assignedMember: "assignedMember",
};

/** 너비 목록을 비율대로 늘려 합이 정확히 target(정수)이 되게 한다. 소수점 오차는 마지막 열이 흡수한다 */
export function scaleWidthsToTotal(widths: number[], target: number): number[] {
  const sum = widths.reduce((total, width) => total + width, 0);
  if (widths.length === 0 || sum <= 0) return widths;
  const scaled = widths.map((width) => Math.floor((width * target) / sum));
  const remainder = Math.round(target) - scaled.reduce((total, width) => total + width, 0);
  scaled[scaled.length - 1] += remainder;
  return scaled;
}

/**
 * 표가 화면 폭보다 좁아지지 않게 열 너비를 맞춘다. 합이 남는 폭보다 작으면 비율대로 늘리고
 * (숨긴 열 자리도 이렇게 나머지 열에 나뉜다), 크면 그대로 두고 가로 스크롤에 맡긴다.
 * availableWidth는 체크박스 열을 포함한 표 전체가 쓸 수 있는 레이아웃 px다.
 */
export function fitColumnWidths(baseWidths: number[], availableWidth: number): number[] {
  const room = availableWidth - CHECKBOX_COLUMN_WIDTH;
  const sum = baseWidths.reduce((total, width) => total + width, 0);
  if (availableWidth <= 0 || sum >= room) return baseWidths;
  return scaleWidthsToTotal(baseWidths, room);
}

/**
 * 드래그 중인 열(index)을 targetWidth로 바꿨을 때 전체 열 너비. 줄여서 생긴 폭은 오른쪽 열들에
 * 비율대로 나눠 주고(마지막 열이면 왼쪽 열들에), 늘릴 때는 다른 열을 줄이지 않고 표를 넓힌다.
 * 오른쪽 열에 나눠 주는 동안 드래그 중인 경계는 커서를 그대로 따라간다.
 */
export function resizeColumnWithinFit(
  startWidths: number[],
  index: number,
  targetWidth: number,
  availableWidth: number
): number[] {
  const room = availableWidth - CHECKBOX_COLUMN_WIDTH;
  const next = [...startWidths];
  next[index] = targetWidth;
  const hasRightColumns = index < startWidths.length - 1;
  const absorberIndexes = startWidths
    .map((_, itemIndex) => itemIndex)
    .filter((itemIndex) => (hasRightColumns ? itemIndex > index : itemIndex < index));
  const fixedSum = next.reduce(
    (total, width, itemIndex) => (absorberIndexes.includes(itemIndex) ? total : total + width),
    0
  );
  const absorberStart = absorberIndexes.map((itemIndex) => startWidths[itemIndex]);
  const absorberStartSum = absorberStart.reduce((total, width) => total + width, 0);
  const absorberRoom = room - fixedSum;
  if (availableWidth <= 0 || absorberIndexes.length === 0 || absorberRoom <= absorberStartSum) {
    return next;
  }
  scaleWidthsToTotal(absorberStart, absorberRoom).forEach((width, position) => {
    next[absorberIndexes[position]] = width;
  });
  return next;
}

export function clampColumnWidth(
  column: CustomerColumnDefinition,
  width: number
): number {
  return Math.round(Math.min(COLUMN_MAX_WIDTH, Math.max(column.minWidth, width)));
}
