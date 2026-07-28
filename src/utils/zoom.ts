/**
 * body에 적용된 zoom 배율. 데스크톱 컴팩트 모드에서 0.8, 그 외 1.
 * (`src/app/layout.tsx`가 초기값을 심고 `UiScaleToggle`이 갱신한다)
 *
 * 이 값이 필요한 이유와 좌표 변환 규칙은 `docs/ZOOM_SUBPIXEL_PLAYBOOK.md` §4-4 참고.
 * 요약: `getBoundingClientRect`/`innerWidth`는 zoom이 곱해진 "화면 px", `offsetHeight`와
 * CSS 상수는 곱해지기 전 "레이아웃 px"이다. 둘을 한 식에서 섞으면 안 된다.
 */
export function getBodyZoom(): number {
	if (typeof document === "undefined") return 1;
	const raw = String(((document.body.style as { zoom?: string }).zoom ?? "")).trim();
	const parsed = Number.parseFloat(raw);
	return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}
