"use client";

import { useEffect, useRef } from "react";
import { getMainDomain } from "@/lib/env";
import {
  clearProjectType,
  clearSelectedProjectId,
  clearUseAttendanceMenu,
} from "@/lib/project";
import {
  resetProjectAccessRestriction,
  subscribeProjectAccessRestricted,
} from "@/lib/projectAccessRestriction";
import { showErrorModal } from "@/providers/ErrorFeedbackModalProvider";

function getProjectSelectionUrl(): string {
  const currentHost = window.location.host;
  const currentHostname = window.location.hostname;
  const isLocalhost =
    currentHostname === "localhost" ||
    currentHostname === "127.0.0.1" ||
    /^\d+\.\d+\.\d+\.\d+$/.test(currentHostname);
  const targetHost = isLocalhost ? currentHost : getMainDomain();
  return `${window.location.protocol}//${targetHost}/projects`;
}

function clearProjectContext(): void {
  clearSelectedProjectId();
  clearUseAttendanceMenu();
  clearProjectType();
}

export default function ProjectAccessRestrictionGuard() {
  const isHandlingRef = useRef(false);

  useEffect(() => {
    let modalTimer: number | undefined;

    const unsubscribe = subscribeProjectAccessRestricted(() => {
      if (isHandlingRef.current || window.location.pathname === "/projects") return;
      isHandlingRef.current = true;

      // 호출부의 일반 오류 처리보다 뒤에 표시해 프로젝트 접근 제한 안내가 최종 안내가 되게 한다.
      modalTimer = window.setTimeout(() => {
        showErrorModal({
          type: "error",
          title: "접근 제한",
          headline: "이 프로젝트에 접속할 수 없습니다.",
          description:
            "현재 접속 중인 IP는 이 프로젝트의 허용 목록에 포함되어 있지 않습니다.\n접속 가능한 프로젝트를 다시 선택해주세요.",
          confirmText: "프로젝트 선택",
          hideCancel: true,
          persistent: true,
          hideCloseButton: true,
          onConfirm: () => {
            clearProjectContext();
            resetProjectAccessRestriction();
            window.location.replace(getProjectSelectionUrl());
          },
        });
      }, 0);
    });

    return () => {
      unsubscribe();
      if (modalTimer !== undefined) window.clearTimeout(modalTimer);
    };
  }, []);

  return null;
}
