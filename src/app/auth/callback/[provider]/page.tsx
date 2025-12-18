"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams, useParams } from "next/navigation";
import { AuthService } from "@/services/auth";
import { getCallbackUrl } from "@/lib/oauth";
import { setRememberMePreference, getRememberMePreference } from "@/lib/token";
import { getSelectedProjectId } from "@/lib/project";
import { getPendingInviteInfo, clearPendingInviteInfo } from "@/lib/invite";
import {
  debugLog,
  markOAuthCallback,
  markLoginSuccess,
  markLoginError,
  printDebugLogs,
  getDebugState,
} from "@/lib/auth-utils";
import { showErrorModal } from "@/providers/ErrorFeedbackModalProvider";

function OAuthCallbackPage() {
  const router = useRouter();
  const params = useParams<{ provider: string }>();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string | null>(null);

  const provider = (params?.provider || "").toString();
  const code = searchParams.get("code");
  const oauthError = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");
  
  // 세션 스토리지에서 리디렉션 URL 가져오기 (로그인 페이지에서 저장됨)
  const [redirectUrl, setRedirectUrl] = useState<string | null>(null);
  
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedRedirectUrl = sessionStorage.getItem("tg_redirect_url");
      if (storedRedirectUrl) {
        setRedirectUrl(storedRedirectUrl);
        // 사용 후 삭제
        sessionStorage.removeItem("tg_redirect_url");
      }
    }
  }, []);

  useEffect(() => {
    document.title = "TalkGate - 로그인 중";

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
      setError(`소셜 로그인이 취소되었거나 오류가 발생했습니다. (${oauthError})`);
    }
  }, [oauthError, errorDescription]);

  const callbackUrl = useMemo(() => {
    if (!provider) return "";
    return getCallbackUrl(provider as any);
  }, [provider]);

  useEffect(() => {
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
        
        // 일반 로그인 성공
        const projectId = getSelectedProjectId();
        markLoginSuccess(provider, !!projectId);
        
        // 초대 플로우 확인 - localStorage에 초대 정보가 있는지 확인
        const pendingInvite = getPendingInviteInfo();
        
        if (pendingInvite?.token && pendingInvite?.email) {
          // 초대 플로우: 사용자 이메일 확인 필요
          debugLog("🎫 초대 플로우 감지 - 사용자 이메일 확인 시작");
          
          try {
            // 로그인한 사용자 정보 가져오기
            const meRes = await AuthService.me();
            const userData = (meRes as any)?.data?.data ?? (meRes as any)?.data;
            const loggedInEmail = userData?.email?.toLowerCase();
            const inviteEmail = pendingInvite.email.toLowerCase();
            
            debugLog("📧 이메일 비교", { loggedInEmail, inviteEmail });
            
            if (loggedInEmail === inviteEmail) {
              // 이메일 일치 → 초대 수락 페이지로 이동
              debugLog("✅ 초대 이메일 일치 → 초대 수락 페이지로 이동");
              if (mounted) {
                window.location.href = "/invite/accept";
              }
              return;
            } else {
              // 이메일 불일치 → 경고 후 프로젝트 페이지로
              debugLog("⚠️ 초대 이메일 불일치", { loggedInEmail, inviteEmail });
              clearPendingInviteInfo();
              showErrorModal({
                title: "알림",
                headline: "초대받은 이메일과 다른 계정입니다.",
                description: `초대받은 이메일(${pendingInvite.email})로 로그인해주세요.`,
                confirmText: "확인",
                cancelText: null,
                hideCancel: true,
              });
              if (mounted) {
                setTimeout(() => {
                  window.location.href = "/projects";
                }, 100);
              }
              return;
            }
          } catch (meError) {
            debugLog("⚠️ 사용자 정보 조회 실패", meError);
            // 사용자 정보 조회 실패 시 일반 플로우로 진행
          }
        }
        
        // redirectUrl이 절대 URL인 경우에만 해당 URL로 이동
        const isAbsoluteUrl = redirectUrl && (redirectUrl.startsWith('http://') || redirectUrl.startsWith('https://'));
        
        debugLog("🎯 리디렉션 결정", {
          hasProjectId: !!projectId,
          projectId,
          hasRedirectUrl: !!redirectUrl,
          isAbsoluteUrl,
          redirectUrl,
          destination: isAbsoluteUrl ? redirectUrl : "/projects",
        });
        
        if (mounted) {
          if (isAbsoluteUrl) {
            // 절대 URL인 경우에만 해당 URL로 이동 (랜딩 페이지 등)
            debugLog("🔗 절대 리디렉션 URL로 이동:", redirectUrl);
            window.location.href = redirectUrl;
          } else {
            // 상대 경로이거나 redirectUrl이 없는 경우
            // 인증된 플로우는 반드시 서브도메인이 필요하므로 /projects로 이동
            if (redirectUrl) {
              debugLog("⚠️ 상대 경로 redirectUrl 무시:", redirectUrl);
            }
            debugLog("✅ 로그인 성공 - 프로젝트 선택 페이지로 이동 (서브도메인 필수)");
            router.replace("/projects");
          }
        }
      } catch (e: any) {
        markLoginError(provider, e);
        
        // 상세한 에러 정보 수집
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
          setError(`로그인에 실패했습니다. ${errorCode ? `(${errorCode})` : ""} ${errorMessage}`);
          
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
  }, [code, provider, callbackUrl, router, oauthError, redirectUrl]);

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#1a1a1a]">
      <div className="text-center text-white max-w-md px-4">
        {!error ? (
          <>
            <div className="text-lg">소셜 로그인 처리 중...</div>
            <div className="mt-2 text-sm text-gray-400">
              {provider && `${provider.charAt(0).toUpperCase() + provider.slice(1)} 계정으로 로그인하고 있습니다.`}
            </div>
            <div className="mt-4 animate-spin inline-block w-6 h-6 border-2 border-white border-t-transparent rounded-full" />
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
                      description: "",
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

export default function OAuthCallbackPageWrapper() {
  return (
    <Suspense fallback={
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-center text-white">
          <div className="text-lg">소셜 로그인 처리 중...</div>
        </div>
      </main>
    }>
      <OAuthCallbackPage />
    </Suspense>
  );
}
