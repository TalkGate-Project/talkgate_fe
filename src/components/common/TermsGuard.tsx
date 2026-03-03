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
  
  // auth 관련 경로에서는 useMe 훅을 호출하지 않음 (인증 토큰이 없어서 401 발생 가능)
  const isAuthRoute = pathname?.startsWith("/login") || 
                      pathname?.startsWith("/auth/callback") || 
                      pathname?.startsWith("/social-signup") || 
                      pathname?.startsWith("/project-signup") || 
                      pathname?.startsWith("/signup") ||
                      pathname?.startsWith("/invite") ||
                      pathname?.startsWith("/forgot-password") ||
                      false;
  
  // useMe 훅은 항상 호출 (React Hooks 규칙 준수)
  // 하지만 useMe 훅 내부에서 enabled: !isAuthRoute로 설정되어 있어 요청은 발생하지 않음
  const { user, loading, refetch } = useMe();
  const queryClient = useQueryClient();
  const hasShownModalRef = useRef(false);
  const previousPathnameRef = useRef<string | null>(null);
  // 약관/가입 플로우에서 막 전환된 직후에는 refetch 완료까지 모달 표시 스킵 (캐시 스테일 이슈 방지)
  const skipTermsModalUntilRefetchRef = useRef(false);

  const signupFlowPaths = ["/social-signup", "/project-signup"] as const;

  useEffect(() => {
    if (isAuthRoute) {
      previousPathnameRef.current = pathname ?? null;
      return;
    }
    // pathname이 변경되었을 때 (약관 동의 완료 후 페이지 이동 등) 캐시 무효화 및 refetch
    if (previousPathnameRef.current !== null && previousPathnameRef.current !== pathname) {
      const fromSignupFlow = signupFlowPaths.some((p) => previousPathnameRef.current === p);
      // /social-signup 또는 /project-signup에서 다른 페이지로 이동한 경우 (약관 동의 완료·프로젝트 가입 완료 가능성)
      if (fromSignupFlow && pathname !== "/social-signup" && pathname !== "/project-signup") {
        queryClient.invalidateQueries({ queryKey: ["auth", "user"] });
        skipTermsModalUntilRefetchRef.current = true;
        refetch().finally(() => {
          skipTermsModalUntilRefetchRef.current = false;
        });
        hasShownModalRef.current = false; // 모달 표시 플래그 리셋
      }
    }
    previousPathnameRef.current = pathname;
  }, [isAuthRoute, pathname, queryClient, refetch]);

  useEffect(() => {
    if (isAuthRoute) return;
    // signup 플로우에서 막 전환된 직후 refetch 대기 중이면 모달 스킵 (약관 동의 후 프로젝트 페이지 진입 시 스테일 캐시로 모달 재노출 방지)
    if (skipTermsModalUntilRefetchRef.current) return;
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
  }, [isAuthRoute, user, loading, pathname, router]);

  return null;
}
