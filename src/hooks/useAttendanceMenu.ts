"use client";

import { useEffect, useState } from "react";
import { getUseAttendanceMenu } from "@/lib/project";

export function useAttendanceMenu() {
  const [useAttendanceMenu, setUseAttendanceMenu] = useState<boolean>(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // 초기값 설정
    const initialValue = getUseAttendanceMenu();
    setUseAttendanceMenu(initialValue);
    setReady(true);

    // 커스텀 이벤트 리스너
    const handleChange = (event: Event) => {
      const detail = (event as CustomEvent<{ useAttendanceMenu: boolean }>).detail;
      if (detail && "useAttendanceMenu" in detail) {
        setUseAttendanceMenu(detail.useAttendanceMenu);
      }
    };

    // 프로젝트 변경 시에도 다시 로드
    const handleProjectChange = () => {
      const value = getUseAttendanceMenu();
      setUseAttendanceMenu(value);
    };

    window.addEventListener("tg:attendance-menu-change", handleChange);
    window.addEventListener("tg:selected-project-change", handleProjectChange);

    return () => {
      window.removeEventListener("tg:attendance-menu-change", handleChange);
      window.removeEventListener("tg:selected-project-change", handleProjectChange);
    };
  }, []);

  return [useAttendanceMenu, ready] as const;
}

