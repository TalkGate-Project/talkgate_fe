"use client";

import { useEffect, useState } from "react";
import { BREAKPOINTS, belowBreakpointQuery, type BreakpointName } from "@/utils/breakpoints";

/**
 * 화면 폭이 주어진 브레이크포인트 미만인지 여부. 기본값 `md`(780px)는 CSS의 `md:`
 * 유틸리티가 발동하는 시점과 정확히 일치한다.
 *
 * 서버 렌더와 최초 클라이언트 렌더에서는 항상 `false`를 반환하고 마운트 직후 실제
 * 값으로 맞춘다. 렌더 중에 `window`를 읽으면 hydration 불일치가 나기 때문이다
 * (토글·설정 컴포넌트를 false로 시작시키는 프로젝트 규칙과 같은 이유).
 *
 * resize 대신 `matchMedia`의 change 이벤트를 쓴다. 경계를 넘을 때만 콜백이 돌아
 * 드래그로 창 크기를 바꿔도 리렌더가 폭발하지 않는다.
 */
export function useIsMobile(breakpoint: BreakpointName = "md"): boolean {
	const [isMobile, setIsMobile] = useState(false);

	useEffect(() => {
		const mediaQuery = window.matchMedia(belowBreakpointQuery(breakpoint));
		const sync = () => setIsMobile(mediaQuery.matches);

		sync();
		mediaQuery.addEventListener("change", sync);
		return () => mediaQuery.removeEventListener("change", sync);
	}, [breakpoint]);

	return isMobile;
}

export { BREAKPOINTS };
