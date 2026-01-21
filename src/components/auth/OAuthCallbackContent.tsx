"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthService } from "@/services/auth";
import { getCallbackUrl } from "@/lib/oauth";
import { setRememberMePreference, getRememberMePreference } from "@/lib/token";
import { getSelectedProjectId } from "@/lib/project";
import {
  debugLog,
  markOAuthCallback,
  markLoginSuccess,
  markLoginError,
  printDebugLogs,
  getDebugState,
} from "@/lib/auth-utils";
import { showErrorModal } from "@/providers/ErrorFeedbackModalProvider";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import { getPendingInviteInfo, savePendingInviteInfo, type PendingInviteInfo } from "@/lib/invite";
import { getAuthErrorMessage } from "@/utils/errorMessages";

interface OAuthCallbackContentInnerProps {
  provider: string;
}

function OAuthCallbackContentInner({ provider }: OAuthCallbackContentInnerProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string | null>(null);

  const code = searchParams.get("code");
  const oauthError = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");
  const stateParam = searchParams.get("state");
  
  // 리디렉션 URL (OAuth state 파라미터 또는 세션 스토리지에서 가져오기)
  const [redirectUrl, setRedirectUrl] = useState<string | null>(null);
  // 초대 플로우 확인
  const [isInviteFlow, setIsInviteFlow] = useState(false);
  // 초기화 완료 여부 (초대 정보 복구 등)
  const [isInitialized, setIsInitialized] = useState(false);
  
  useEffect(() => {
    if (typeof window !== "undefined") {
      // 1. OAuth state 파라미터에서 returnUrl 추출 (우선순위 높음)
      let extractedReturnUrl: string | null = null;
      if (stateParam) {
        try {
          const stateData = JSON.parse(decodeURIComponent(stateParam));
          if (stateData?.returnUrl) {
            extractedReturnUrl = stateData.returnUrl;
            console.log("[OAuthCallback] 📍 OAuth state에서 returnUrl 추출:", extractedReturnUrl);
          }
        } catch (e) {
          // JSON 파싱 실패 시 기존 방식 유지 (하위 호환성)
          console.log("[OAuthCallback] ⚠️ state 파라미터 파싱 실패, 기존 방식 사용");
        }
      }
      
      // 2. 세션 스토리지에서 리디렉션 URL 가져오기 (fallback, 하위 호환성)
      const storedRedirectUrl = sessionStorage.getItem("tg_redirect_url");
      
      // state에서 추출한 URL이 있으면 우선 사용, 없으면 sessionStorage 사용
      const finalRedirectUrl = extractedReturnUrl || storedRedirectUrl;
      if (finalRedirectUrl) {
        setRedirectUrl(finalRedirectUrl);
        // 사용 후 삭제
        if (storedRedirectUrl) {
          sessionStorage.removeItem("tg_redirect_url");
        }
      }
      
      // 초대 정보 복구 (소셜 로그인 전 LoginForm에서 백업됨)
      const inviteBackup = sessionStorage.getItem("tg_invite_backup");
      if (inviteBackup) {
        try {
          const inviteInfo = JSON.parse(inviteBackup) as PendingInviteInfo;
          // localStorage에 복구
          savePendingInviteInfo(inviteInfo);
          console.log("[OAuthCallback] 🔄 초대 정보 복구됨:", inviteInfo);
          setIsInviteFlow(true);
        } catch (e) {
          console.error("[OAuthCallback] 초대 정보 복구 실패:", e);
        }
        // 백업 삭제
        sessionStorage.removeItem("tg_invite_backup");
      } else {
        // localStorage에 이미 초대 정보가 있는지 확인
        const existingInvite = getPendingInviteInfo();
        if (existingInvite?.token) {
          console.log("[OAuthCallback] ℹ️ 기존 초대 정보 감지:", existingInvite);
          setIsInviteFlow(true);
        }
      }
      
      // 초기화 완료
      setIsInitialized(true);
    }
  }, []);

  useEffect(() => {
    // 컴팩트 모드(zoom: 0.8) 사용 시, body 컨텐츠가 줄어들면서 하단에 흰 여백이 생길 수 있음
    // 이를 방지하기 위해 body 자체의 배경색을 페이지 배경색과 동일하게 설정
    const originalBg = document.body.style.backgroundColor;
    document.body.style.backgroundColor = "#1a1a1a";

    return () => {
      document.body.style.backgroundColor = originalBg;
    };
  }, []);

  // OAuth 에러 파라미터 처리 (예: 사용자가 취소한 경우)
  useEffect(() => {
    if (oauthError) {
      debugLog("❌ OAuth 에러 파라미터 감지", { error: oauthError, description: errorDescription });
      // 사용자 친화적인 메시지로 변환
      if (oauthError === "access_denied" || oauthError === "user_cancelled") {
        setError("소셜 로그인이 취소되었습니다.");
      } else {
        setError("소셜 로그인 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
      }
    }
  }, [oauthError, errorDescription]);

  const callbackUrl = useMemo(() => {
    if (!provider) return "";
    return getCallbackUrl(provider as any);
  }, [provider]);

  useEffect(() => {
    // 초기화 완료 전에는 실행하지 않음
    if (!isInitialized) return;
    // OAuth 에러가 있으면 API 호출 건너뛰기
    if (oauthError) return;

    let mounted = true;
    async function exchange() {
      try {
        // 콜백 도착 로깅
        markOAuthCallback(provider, !!code);
        
        // 이전 플로우 상태 확인
        const prevState = getDebugState();
        debugLog("📥 콜백 페이지 로드", {
          provider,
          hasCode: !!code,
          codePreview: code?.slice(0, 20) + "...",
          callbackUrl,
          prevState,
        });
        
        if (!code || !provider) {
          throw new Error("인가 코드 또는 제공자 정보가 없습니다.");
        }
        
        // 🔧 소셜 로그인은 기본적으로 자동 로그인(Remember Me) 활성화
        const prevRememberMe = getRememberMePreference();
        setRememberMePreference(true);
        debugLog("⚙️ Remember Me 설정", { before: prevRememberMe, after: true });
        
        // API 호출
        let result: Awaited<ReturnType<typeof AuthService.loginGoogle>>;
        if (provider === "google") {
          debugLog("🔵 Google API 호출 시작");
          result = await AuthService.loginGoogle({ code, callbackUrl });
        } else if (provider === "kakao") {
          debugLog("🟡 Kakao API 호출 시작");
          result = await AuthService.loginKakao({ code, callbackUrl });
        } else if (provider === "naver") {
          debugLog("🟢 Naver API 호출 시작");
          result = await AuthService.loginNaver({ code, callbackUrl });
        } else {
          throw new Error(`지원하지 않는 소셜 로그인 제공자: ${provider}`);
        }
        
        debugLog("📦 API 응답 수신", {
          success: result.success,
          requiresTwoFactor: result.requiresTwoFactor,
          hasTwoFactorToken: !!result.twoFactorToken,
          isNewUser: result.isNewUser,
        });
        
        // 2FA가 필요한 경우
        if (result.requiresTwoFactor && result.twoFactorToken) {
          debugLog("🔐 2FA 인증 필요 - 2FA 페이지로 이동", {
            twoFactorTokenPreview: result.twoFactorToken.slice(0, 20) + "...",
          });
          
          if (mounted) {
            router.push(`/login/two-factor?token=${result.twoFactorToken}`);
          }
          return;
        }
        
        // 쿠키 설정 안정화를 위한 짧은 지연
        const stabilizeDelay = () => new Promise(resolve => setTimeout(resolve, 100));
        
        // 신규 사용자인 경우 → 소셜 회원가입 페이지로 이동 (약관 동의 → 본인인증 → 프로젝트 가입)
        if (result.isNewUser) {
          debugLog("🆕 신규 사용자 감지 - 소셜 회원가입 페이지로 이동");
          // returnUrl이 있으면 sessionStorage에 저장 (회원가입 플로우 후 /projects에서 사용)
          if (redirectUrl && typeof window !== "undefined") {
            sessionStorage.setItem("tg_redirect_url", redirectUrl);
            debugLog("💾 returnUrl을 sessionStorage에 저장 (회원가입 플로우 후 사용):", redirectUrl);
          }
          // 초대 플로우인 경우 소셜 로그인 플랫폼 정보를 sessionStorage에 저장 (계정 불일치 시 안내용)
          if (isInviteFlow && typeof window !== "undefined") {
            sessionStorage.setItem("tg_last_social_provider", provider);
          }
          if (mounted) {
            await stabilizeDelay();
            window.location.replace("/social-signup");
          }
          return;
        }
        
        // 기존 사용자인데 초대 플로우인 경우 → 프로젝트 가입 페이지로 이동
        // (약관 동의/본인인증은 이미 완료되어 있으므로 프로젝트 가입만 진행)
        if (isInviteFlow) {
          debugLog("📨 기존 사용자 + 초대 플로우 - 프로젝트 가입 페이지로 이동");
          // 소셜 로그인 플랫폼 정보를 sessionStorage에 저장 (계정 불일치 시 안내용)
          if (typeof window !== "undefined") {
            sessionStorage.setItem("tg_last_social_provider", provider);
          }
          if (mounted) {
            await stabilizeDelay();
            window.location.replace("/project-signup");
          }
          return;
        }
        
        // 일반 로그인 성공 (기존 사용자, 초대 없음)
        const projectId = getSelectedProjectId();
        markLoginSuccess(provider, !!projectId);
        
        // redirectUrl이 절대 URL인 경우에만 해당 URL로 이동
        const isAbsoluteUrl = redirectUrl && (redirectUrl.startsWith('http://') || redirectUrl.startsWith('https://'));
        
        debugLog("🎯 리디렉션 결정", {
          hasProjectId: !!projectId,
          projectId,
          hasRedirectUrl: !!redirectUrl,
          isAbsoluteUrl,
          redirectUrl,
          isInviteFlow,
          destination: isAbsoluteUrl ? redirectUrl : "/projects",
        });
        
        if (mounted) {
          if (isAbsoluteUrl) {
            // 절대 URL인 경우에만 해당 URL로 이동 (랜딩 페이지 등)
            // window.location.replace() 사용하여 히스토리에서 OAuth 콜백 페이지 제거 (뒤로가기 방지)
            debugLog("🔗 절대 리디렉션 URL로 이동:", redirectUrl);
            window.location.replace(redirectUrl);
          } else {
            // 상대 경로이거나 redirectUrl이 없는 경우
            // 인증된 플로우는 반드시 서브도메인이 필요하므로 /projects로 이동
            // window.location.replace() 사용하여 히스토리에서 OAuth 콜백 페이지 제거 (뒤로가기 방지)
            if (redirectUrl) {
              debugLog("⚠️ 상대 경로 redirectUrl 무시:", redirectUrl);
            }
            debugLog("✅ 로그인 성공 - 프로젝트 선택 페이지로 이동 (서브도메인 필수)");
            window.location.replace("/projects");
          }
        }
      } catch (e: any) {
        markLoginError(provider, e);
        
        // 상세한 에러 정보 수집 (로그용)
        const errorMessage = e?.data?.message || e?.message || "알 수 없는 오류";
        const errorCode = e?.data?.code || e?.status || "";
        
        debugLog("❌ 로그인 처리 실패", {
          error: errorMessage,
          code: errorCode,
          status: e?.status,
          data: e?.data,
          stack: e?.stack,
        });
        
        // 개발 환경에서 디버그 로그 출력
        if (process.env.NODE_ENV === "development") {
          printDebugLogs();
        }
        
        if (mounted) {
          // 사용자 친화적인 에러 메시지로 변환
          const userFriendlyMessage = getAuthErrorMessage(e);
          setError(userFriendlyMessage);
          
          // 개발 환경에서 디버그 정보 표시
          if (process.env.NODE_ENV === "development") {
            setDebugInfo(`개발자 정보: window.tgAuthDebug.printLogs() 로 상세 로그 확인`);
          }
        }
      }
    }
    exchange();
    return () => {
      mounted = false;
    };
  }, [code, provider, callbackUrl, router, oauthError, redirectUrl, isInitialized, isInviteFlow]);

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#1a1a1a]">
      <div className="text-center text-white max-w-md px-4">
        {!error ? (
          <>
            <div className="text-lg">소셜 로그인 처리 중...</div>
            <div className="mt-2 text-sm text-gray-400">
              {provider && `${provider.charAt(0).toUpperCase() + provider.slice(1)} 계정으로 로그인하고 있습니다.`}
            </div>
            <div className="flex justify-center">
              <LoadingSpinner size="sm" className="mt-4" />
            </div>
          </>
        ) : (
          <>
            <div className="text-red-400 mb-4 break-words">{error}</div>
            {debugInfo && (
              <div className="text-xs text-gray-500 mb-4 p-2 bg-gray-800 rounded">
                {debugInfo}
              </div>
            )}
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => router.replace("/login")}
                className="px-4 py-2 bg-[#252525] text-[#D0D0D0] rounded-[5px] hover:bg-[#353535] transition-colors"
              >
                로그인 페이지로 돌아가기
              </button>
              {process.env.NODE_ENV === "development" && (
                <button
                  onClick={() => {
                    printDebugLogs();
                    showErrorModal({
                      title: "알림",
                      headline: "콘솔에서 디버그 로그를 확인하세요.",
                      confirmText: "확인",
                      cancelText: null,
                      hideCancel: true,
                    });
                  }}
                  className="px-4 py-2 bg-[#3a3a3a] text-[#888] rounded-[5px] hover:bg-[#454545] transition-colors text-sm"
                >
                  디버그 로그
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </main>
  );
}

interface OAuthCallbackContentProps {
  provider: string;
}

export default function OAuthCallbackContent({ provider }: OAuthCallbackContentProps) {
  return (
    <Suspense fallback={
      <main className="min-h-screen flex items-center justify-center bg-[#1a1a1a]">
        <div className="text-center text-white">
          <div className="text-lg">소셜 로그인 처리 중...</div>
        </div>
      </main>
    }>
      <OAuthCallbackContentInner provider={provider} />
    </Suspense>
  );
}

