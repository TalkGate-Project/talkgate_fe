"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams, useParams } from "next/navigation";
import { AuthService } from "@/services/auth";
import { getCallbackUrl } from "@/lib/oauth";

export default function OAuthCallbackPage() {
  const router = useRouter();
  const params = useParams<{ provider: string }>();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  const provider = (params?.provider || "").toString();
  const code = searchParams.get("code");

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
        if (mounted) router.replace("/projects");
      } catch (e: any) {
        if (mounted) setError("로그인에 실패했습니다. 다시 시도해주세요.");
      }
    }
    exchange();
    return () => {
      mounted = false;
    };
  }, [code, provider, callbackUrl, router]);

  return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="text-center text-white">
        <div className="text-lg">소셜 로그인 처리 중...</div>
        {error ? (
          <div className="mt-2 text-red-400">{error}</div>
        ) : null}
      </div>
    </main>
  );
}


