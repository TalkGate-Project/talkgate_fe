"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams, useParams } from "next/navigation";
import { AuthService } from "@/services/auth";
import { getCallbackUrl } from "@/lib/oauth";

function OAuthCallbackPage() {
  const router = useRouter();
  const params = useParams<{ provider: string }>();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  const provider = (params?.provider || "").toString();
  const code = searchParams.get("code");

  useEffect(() => {
    document.title = "TalkGate - 로그인 중";
  }, []);

  const callbackUrl = useMemo(() => {
    if (!provider) return "";
    return getCallbackUrl(provider as any);
  }, [provider]);

  useEffect(() => {
    let mounted = true;
    async function exchange() {
      try {
        if (!code || !provider) throw new Error("missing code or provider");
        if (provider === "google") {
          await AuthService.loginGoogle({ code, callbackUrl });
        } else if (provider === "kakao") {
          await AuthService.loginKakao({ code, callbackUrl });
        } else if (provider === "naver") {
          await AuthService.loginNaver({ code, callbackUrl });
        } else {
          throw new Error("unsupported provider");
        }
        if (mounted) router.replace("/dashboard");
      } catch (e: any) {
        console.error("소셜 로그인 오류:", e);
        // 상세한 에러 메시지 표시 (개발 환경에서 디버깅용)
        const errorMessage = e?.data?.message || e?.message || "알 수 없는 오류";
        const errorCode = e?.data?.code || e?.status || "";
        if (mounted) {
          setError(`로그인에 실패했습니다. ${errorCode ? `(${errorCode})` : ""} ${errorMessage}`);
        }
      }
    }
    exchange();
    return () => {
      mounted = false;
    };
  }, [code, provider, callbackUrl, router]);

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#1a1a1a]">
      <div className="text-center text-white">
        {!error ? (
          <>
            <div className="text-lg">소셜 로그인 처리 중...</div>
            <div className="mt-4 animate-spin inline-block w-6 h-6 border-2 border-white border-t-transparent rounded-full" />
          </>
        ) : (
          <>
            <div className="text-red-400 mb-4">{error}</div>
            <button
              onClick={() => router.replace("/login")}
              className="px-4 py-2 bg-[#252525] text-[#D0D0D0] rounded-[5px] hover:bg-[#353535] transition-colors"
            >
              로그인 페이지로 돌아가기
            </button>
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
