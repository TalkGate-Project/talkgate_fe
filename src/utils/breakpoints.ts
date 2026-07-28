/**
 * 화면 폭 브레이크포인트. `globals.css`의 `@theme inline`에 정의된 `--breakpoint-*`와
 * 반드시 같은 값을 유지해야 한다.
 *
 * 이 프로젝트는 Tailwind 기본값(640/768/1024/1280)을 쓰지 않는다. JS에서 화면 폭을
 * 판정할 때 기본값을 하드코딩하면 CSS의 `md:`/`lg:` 클래스와 최소 12px 어긋나고,
 * 그 구간에서 "레이아웃은 모바일인데 JS는 데스크톱으로 판단"하는 불일치가 생긴다.
 * 실제로 고객 상세 모달에서 버그로 터진 전례가 있다 —
 * `docs/RESPONSIVE_BREAKPOINT_DRIFT_TASKS.md` 참고.
 */
export const BREAKPOINTS = {
	sm: 375,
	md: 780,
	lg: 1080,
	xl: 1920,
} as const;

export type BreakpointName = keyof typeof BREAKPOINTS;

/**
 * 해당 브레이크포인트 "미만"을 뜻하는 media query 문자열.
 * CSS의 `md:` 유틸리티가 `min-width: 780px`에서 발동하므로, 그 반대 구간은
 * `max-width: 779px`가 되어 경계에서 정확히 맞물린다.
 */
export function belowBreakpointQuery(breakpoint: BreakpointName): string {
	return `(max-width: ${BREAKPOINTS[breakpoint] - 1}px)`;
}
