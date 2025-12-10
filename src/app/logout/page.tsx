"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { clearSelectedProjectId, clearUseAttendanceMenu } from "@/lib/project";

/**
 * 로그아웃 페이지
 * 
 * 클라이언트 사이드에서 로그아웃 API를 호출하고 리다이렉트합니다.
 * 서브도메인에서도 확실히 작동하도록 클라이언트 사이드에서 처리합니다.
 */
export default function LogoutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const performLogout = async () => {
      try {
        console.log("[Logout Page] 🚪 로그아웃 시작");

        // ✅ 새로운 로그아웃 API 호출
        const response = await fetch('/api/auth/logout', {
          method: 'POST',
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error('로그아웃 실패');
        }

        console.log("[Logout Page] ✅ 로그아웃 API 호출 성공");

        // 클라이언트 사이드 정리
        clearSelectedProjectId();
        clearUseAttendanceMenu();

        // 리다이렉트 URL 결정
        const redirectUrl = searchParams.get('redirect');
        const host = window.location.host;
        const hostWithoutPort = host.split(':')[0];
        let mainDomain = host;

        // 서브도메인인 경우 메인 도메인으로 변환
        if (hostWithoutPort.includes('.talkgate.im')) {
          if (hostWithoutPort.includes('app.talkgate.im') && !hostWithoutPort.includes('app-dev')) {
            mainDomain = 'app.talkgate.im';
          } else {
            mainDomain = 'app-dev.talkgate.im';
          }
        }

        const protocol = window.location.protocol;
        const finalUrl = redirectUrl || `${protocol}//${mainDomain}/login?logout=success`;

        console.log("[Logout Page] 🔄 리다이렉트:", finalUrl);
        window.location.href = finalUrl;
      } catch (error) {
        console.error('[Logout Page] ❌ 로그아웃 실패:', error);
        
        // 에러가 발생해도 로그인 페이지로 이동
        const host = window.location.host;
        const hostWithoutPort = host.split(':')[0];
        let mainDomain = host;
        if (hostWithoutPort.includes('.talkgate.im')) {
          if (hostWithoutPort.includes('app.talkgate.im') && !hostWithoutPort.includes('app-dev')) {
            mainDomain = 'app.talkgate.im';
          } else {
            mainDomain = 'app-dev.talkgate.im';
          }
        }
        const protocol = window.location.protocol;
        window.location.href = `${protocol}//${mainDomain}/login?logout=success`;
      }
    };

    performLogout();
  }, [router, searchParams]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <p className="text-lg text-gray-600">로그아웃 중...</p>
      </div>
    </div>
  );
}

