export const TOKENS = {
  colors: {
    primary: "#00B55B",
    primaryLight: "#D6FAE8",
    secondary: "#4D82F3",
    secondaryLight: "#D3E1FE",
    light: {
      0: "#FFFFFF",
      30: "#E2E2E2",
      40: "#D0D0D0",
      50: "#B0B0B0",
      60: "#808080",
      90: "#252525",
      100: "#000000",
    },
  },
  node: {
    leader: { w: 153, h: 44, avatar: 28 },
    member: { w: 153, h: 44, avatar: 28 },
    badge: { w: 66, h: 22 },
  },
  connector: {
    color: "#E2E2E2", // neutral-30 (kept as design token, use border-neutral-30 in JSX)
    width: 1,
    borderRadius: 9999,
  },
  spacing: {
    vertical: 20,
    horizontal: 16,
    badgeOffset: 26,
  },
} as const;

/**
 * 계층형 리스트 뷰(TeamListView, AssignCustomersModal 등)에서 공유하는 스타일 상수
 * - indent: depth별 들여쓰기 간격 (px)
 * - connector: 구분선 관련 스타일
 */
export const HIERARCHY_LIST_TOKENS = {
  /** depth당 margin-left 증가값 (px) */
  indentPerLevel: 50,
  connector: {
    /** 가로 구분선의 top 위치 (px) */
    horizontalTop: 25,
    /** 가로 구분선의 너비 (px) */
    horizontalWidth: 50,
    /** 첫 번째 아이템의 세로선 상단 오프셋 (px) */
    firstItemTopOffset: -8,
  },
} as const;

/** depth에 따른 들여쓰기(margin-left) 계산 */
export function getIndent(level: number): number {
  return level * HIERARCHY_LIST_TOKENS.indentPerLevel;
}

/** depth에 따른 세로 구분선 left 위치 계산 */
export function getConnectorLeft(level: number): number {
  return (level - 1) * HIERARCHY_LIST_TOKENS.indentPerLevel;
}
