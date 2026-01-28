"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { showErrorModal } from "@/lib/errorModalEvents";
import { isPublicRoute, performLogout } from "@/lib/logout";
import { useAuthSession } from "@/hooks/useAuthSession";

export default function AuthSessionWatcher() {
  const pathname = usePathname();
  const { status } = useAuthSession();
  const hasShownRef = useRef(false);

  useEffect(() => {
    if (status !== "expired") {
      hasShownRef.current = false;
      return;
    }

    if (!pathname || isPublicRoute(pathname)) return;
    if (hasShownRef.current) return;

    hasShownRef.current = true;
    showErrorModal({
      type: "info",
      title: "",
      headline: "로그인 세션이 만료되었습니다.",
      description: "보안을 위해 다시 로그인해주세요.",
      confirmText: "로그인하기",
      hideCloseButton: true,
      persistent: true,
      hideCancel: true,
      onConfirm: () => {
        performLogout({ redirectUrl: window.location.href });
      },
    });
  }, [status, pathname]);

  return null;
}
