"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { getBodyZoom } from "@/utils/zoom";

/** 패널이 뷰포트 좌우 끝에 닿지 않도록 두는 여백(px) */
const VIEWPORT_EDGE_PADDING = 16;

/**
 * 아래로 열었을 때 "기술적으로는 들어가지만 여유가 전혀 없이 빠듯한" 경우를 방지하는
 * 여유 마진(화면 px). 아래 공간이 패널 높이에 이 마진만큼도 못 미치면, 위쪽에 그만큼
 * 여유가 있는 한 위로 띄운다. 값이 여러 파일에 흩어지지 않도록 여기서만 정의하고
 * filterFields/ColorPalettePopover 등 아직 이 훅으로 옮기지 못한 곳에서도 가져다 쓴다.
 */
export const FLIP_COMFORT_MARGIN = 24;

export type AnchoredPanelPosition = { top: number; left: number };

export type UseAnchoredPanelOptions = {
	/** 패널이 열려 있는지. false면 리스너를 모두 해제한다 */
	open: boolean;
	/** 바깥 클릭 또는 Escape로 닫아야 할 때 호출된다. 매 렌더 새로 만들어도 안전하다 */
	onClose: () => void;
	/** 패널 너비(레이아웃 px). 실제 렌더 폭과 반드시 같은 값을 넘길 것 */
	panelWidth: number;
	/** 패널이 아직 렌더되기 전 첫 계산에 쓸 높이 추정치(레이아웃 px) */
	estimatedPanelHeight?: number;
	/**
	 * 앵커와 패널 사이 세로 간격(px). **화면 px 기준이다** — panelWidth/estimatedPanelHeight가
	 * 레이아웃 px인 것과 다르니 주의. zoom 0.8에서도 화면상 간격은 이 값 그대로 유지된다
	 * (2026-07-28 브라우저 실측으로 확인). 리팩터링 이전 동작과 동일하며 의도된 것이다.
	 */
	offsetY?: number;
	/** 가로 정렬 기준. start=앵커 왼쪽 모서리, center=앵커 중앙 */
	align?: "start" | "center";
	/**
	 * 패널 높이가 달라지는 내부 상태(예: 일/월/연도 모드). 값이 바뀌면 위치를 다시 계산한다.
	 */
	recalcKey?: unknown;
};

/**
 * 인풋 같은 앵커 요소에 붙여 `position: fixed`로 띄우는 플로팅 패널의 위치를 계산하고,
 * 바깥 클릭·Escape로 닫는 동작까지 담당한다. DatePicker/MonthPicker/TimePicker가 각자
 * 복붙해 쓰던 로직을 하나로 모은 것 — 복붙본이 갈라져 MonthPicker에만 zoom 보정이
 * 빠져 있던 사고가 있었다(2026-07-28).
 *
 * 좌표 규칙은 `docs/ZOOM_SUBPIXEL_PLAYBOOK.md` §4-4를 따른다. 계산은 전부 화면 px
 * 공간에서 하고, state에 넣기 직전 한 번만 zoom으로 나눠 레이아웃 px로 되돌린다.
 *
 * 반환된 `panelPos`는 첫 계산 전까지 null이므로, 패널은 `open && panelPos`일 때만
 * 렌더해야 위치가 정해지지 않은 상태로 깜빡이지 않는다.
 */
export function useAnchoredPanel<TAnchor extends HTMLElement = HTMLElement>(
	options: UseAnchoredPanelOptions
) {
	const {
		open,
		onClose,
		panelWidth,
		estimatedPanelHeight = 320,
		offsetY = 8,
		align = "start",
		recalcKey,
	} = options;

	const rootRef = useRef<HTMLDivElement | null>(null);
	const anchorRef = useRef<TAnchor | null>(null);
	const panelRef = useRef<HTMLDivElement | null>(null);
	const [panelPos, setPanelPos] = useState<AnchoredPanelPosition | null>(null);

	// onClose가 매 렌더 새 함수여도 리스너를 재등록하지 않도록 ref에 담아 쓴다.
	const onCloseRef = useRef(onClose);
	useLayoutEffect(() => {
		onCloseRef.current = onClose;
	});

	const updatePosition = useCallback(() => {
		const anchor = anchorRef.current;
		if (!anchor) return;

		const rect = anchor.getBoundingClientRect();
		const zoom = getBodyZoom();

		// offsetHeight와 panelWidth는 레이아웃 px이므로 화면 px로 환산해 비교한다.
		const visualPanelHeight = (panelRef.current?.offsetHeight || estimatedPanelHeight) * zoom;
		const visualPanelWidth = panelWidth * zoom;

		const viewportWidth = window.innerWidth;
		const viewportHeight = window.innerHeight;

		// 아래 공간이 여유 마진(FLIP_COMFORT_MARGIN)까지 포함해 부족하고, 위에는 그만큼
		// 충분할 때 위로 띄운다. 딱 들어맞기만 하는 빠듯한 배치보다 위로 올리는 편을 우선한다.
		const spaceBelow = viewportHeight - rect.bottom;
		const spaceAbove = rect.top;
		const requiredSpace = visualPanelHeight + offsetY + FLIP_COMFORT_MARGIN;
		const shouldFlipUp = spaceBelow < requiredSpace && spaceAbove > requiredSpace;
		const top = shouldFlipUp
			? rect.top - visualPanelHeight - offsetY
			: rect.bottom + offsetY;

		const preferredLeft =
			align === "center" ? rect.left + (rect.width - visualPanelWidth) / 2 : rect.left;
		const maxLeft = viewportWidth - visualPanelWidth - VIEWPORT_EDGE_PADDING;
		const left = Math.max(VIEWPORT_EDGE_PADDING, Math.min(preferredLeft, maxLeft));

		setPanelPos({ top: top / zoom, left: left / zoom });
	}, [align, estimatedPanelHeight, offsetY, panelWidth]);

	useEffect(() => {
		if (!open) {
			setPanelPos(null);
			return;
		}

		updatePosition();
		// 첫 계산 시점에는 panelRef가 아직 비어 추정 높이를 쓴다. 패널이 실제로
		// 그려진 뒤 한 번 더 계산해 위로 띄우는 경우의 높이를 정확히 반영한다.
		const timer = setTimeout(updatePosition, 0);

		window.addEventListener("resize", updatePosition);
		window.addEventListener("scroll", updatePosition, true);
		return () => {
			clearTimeout(timer);
			window.removeEventListener("resize", updatePosition);
			window.removeEventListener("scroll", updatePosition, true);
		};
	}, [open, updatePosition, recalcKey]);

	useEffect(() => {
		if (!open) return;

		function onDocumentMouseDown(event: MouseEvent) {
			const target = event.target as Node;
			const insideRoot = !!rootRef.current?.contains(target);
			const insidePanel = !!panelRef.current?.contains(target);
			if (!insideRoot && !insidePanel) onCloseRef.current();
		}
		function onKeyDown(event: KeyboardEvent) {
			if (event.key === "Escape") onCloseRef.current();
		}

		document.addEventListener("mousedown", onDocumentMouseDown, true);
		document.addEventListener("keydown", onKeyDown, true);
		return () => {
			document.removeEventListener("mousedown", onDocumentMouseDown, true);
			document.removeEventListener("keydown", onKeyDown, true);
		};
	}, [open]);

	return { rootRef, anchorRef, panelRef, panelPos, updatePosition };
}
