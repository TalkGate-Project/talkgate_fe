"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useMe } from "@/hooks/useMe";
import { usePersistentModal } from "@/providers/PersistentModalProvider";

/**
 * @deprecated 이 훅은 더 이상 사용되지 않습니다.
 * 대신 `src/components/common/TermsGuard.tsx` 컴포넌트를 레이아웃 레벨에서 사용하세요.
 * 
 * 약관 미동의 사용자를 감지하고 persistent 모달을 통해 /social-signup으로 리디렉션하는 훅
 * 
 * @description
 * - 사용자가 회원가입은 했지만 약관 동의를 하지 않은 경우
 * - /social-signup 페이지가 아닌 다른 페이지에 접근할 때
 * - Persistent 모달을 띄워서 약관 동의 페이지로 이동시킴
 * 
 * @example
 * ```tsx
 * // ❌ 더 이상 사용하지 않음
 * export default function MyPageContent() {
 *   useTermsGuard();
 *   // ...
 * }
 * 
 * // ✅ 레이아웃 레벨에서 처리 (app/layout.tsx)
 * <TermsGuard />
 * ```
 */
export function useTermsGuard() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading } = useMe();
  const persistentModal = usePersistentModal();

  useEffect(() => {
    // 로딩 중이면 체크하지 않음
    if (loading) return;

    // 사용자 정보가 없으면 체크하지 않음 (인증되지 않은 상태)
    if (!user) return;

    // 이미 약관 동의를 완료한 경우 체크하지 않음
    if (user.isAllowTerms) return;

    // /social-signup 페이지에 있으면 체크하지 않음 (무한 루프 방지)
    if (pathname === "/social-signup") return;

    // 약관 미동의 상태이고 다른 페이지에 접근한 경우 - persistent 모달 표시
    persistentModal.show({
      type: "system",
      title: "약관 동의 필요",
      headline: "서비스 이용을 위해 약관 동의가 필요합니다.",
      description: "약관 동의를 완료하시면 서비스를 이용하실 수 있습니다.",
      confirmText: "약관 동의하러 가기",
      cancelText: null,
      hideCancel: true,
      onConfirm: () => {
        router.push("/social-signup");
      },
    });
  }, [user, loading, pathname, router, persistentModal]);
}
