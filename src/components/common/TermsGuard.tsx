"use client";

import { useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useMe } from "@/hooks/useMe";
import { showErrorModal } from "@/lib/errorModalEvents";
import { useQueryClient } from "@tanstack/react-query";

/**
 * 약관 미동의 사용자를 감지하고 info 타입 모달을 통해 /social-signup으로 리디렉션하는 가드 컴포넌트
 * 
 * @description
 * - 레이아웃 레벨에서 전역적으로 적용되어 모든 페이지에 자동으로 가드 적용
 * - 사용자가 회원가입은 했지만 약관 동의를 하지 않은 경우
 * - /social-signup 페이지가 아닌 다른 페이지에 접근할 때
 * - ErrorFeedbackModalProvider의 info 타입 모달을 띄워서 약관 동의 페이지로 이동시킴
 * 
 * @example
 * ```tsx
 * // app/layout.tsx
 * <TermsGuard />
 * ```
 */
export default function TermsGuard() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading, refetch } = useMe();
  const queryClient = useQueryClient();
  const hasShownModalRef = useRef(false);
  const previousPathnameRef = useRef<string | null>(null);

  useEffect(() => {
    // pathname이 변경되었을 때 (약관 동의 완료 후 페이지 이동 등) 캐시 무효화 및 refetch
    if (previousPathnameRef.current !== null && previousPathnameRef.current !== pathname) {
      // /social-signup에서 다른 페이지로 이동한 경우 (약관 동의 완료 가능성)
      if (previousPathnameRef.current === "/social-signup" && pathname !== "/social-signup") {
        console.log("[TermsGuard] 약관 동의 페이지에서 이동 감지, 사용자 정보 refetch");
        queryClient.invalidateQueries({ queryKey: ["auth", "user"] });
        refetch();
        hasShownModalRef.current = false; // 모달 표시 플래그 리셋
      }
    }
    previousPathnameRef.current = pathname;
  }, [pathname, queryClient, refetch]);

  useEffect(() => {
    // 로딩 중이면 체크하지 않음
    if (loading) return;

    // 사용자 정보가 없으면 체크하지 않음 (인증되지 않은 상태)
    if (!user) return;

    // 이미 약관 동의를 완료한 경우 체크하지 않음
    if (user.isAllowTerms) {
      // 약관 동의 완료 시 모달 표시 플래그 리셋 (다음 미동의 상태 대비)
      hasShownModalRef.current = false;
      return;
    }

    // /social-signup 페이지에 있으면 체크하지 않음 (무한 루프 방지)
    if (pathname === "/social-signup") {
      hasShownModalRef.current = false;
      return;
    }

    // 이미 모달을 표시한 경우 중복 표시 방지
    if (hasShownModalRef.current) return;

    // 약관 미동의 상태이고 다른 페이지에 접근한 경우
    console.log("[TermsGuard] 약관 미동의 사용자 감지, info 타입 모달 표시");
    hasShownModalRef.current = true;
    
    showErrorModal({
      type: "info",
      title: "약관 동의 필요",
      headline: "서비스 이용을 위해 약관 동의가 필요합니다.",
      description: "약관 동의를 완료하시면 서비스를 이용하실 수 있습니다.",
      confirmText: "약관 동의하러 가기",
      hideCancel: true,
      persistent: true,
      hideCloseButton: true,
      onConfirm: () => {
        hasShownModalRef.current = false;
        router.push("/social-signup");
      },
    });
  }, [user, loading, pathname, router]);

  return null;
}
