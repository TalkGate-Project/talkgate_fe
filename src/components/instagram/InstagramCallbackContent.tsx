"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import LoadingSpinner from "@/components/common/LoadingSpinner";

function InstagramCallbackContentInner() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const handleCallback = () => {
      // URL에서 code 파라미터 가져오기
      const code = searchParams.get("code");
      const error = searchParams.get("error");
      const errorDescription = searchParams.get("error_description");

      // 에러가 있는 경우
      if (error) {
        setStatus("error");
        setMessage(errorDescription || "인증에 실패했습니다.");
        
        // 부모 창으로 에러 메시지 전송
        if (window.opener) {
          window.opener.postMessage(
            {
              type: "INSTAGRAM_OAUTH_CALLBACK",
              error: errorDescription || error,
            },
            "*" // 부모 창에서 origin 검증 수행
          );
        }

        // 2초 후 창 닫기
        setTimeout(() => {
          window.close();
        }, 2000);
        return;
      }

      // code가 없는 경우
      if (!code) {
        setStatus("error");
        setMessage("인증 코드가 없습니다.");
        
        // 부모 창으로 에러 메시지 전송
        if (window.opener) {
          window.opener.postMessage(
            {
              type: "INSTAGRAM_OAUTH_CALLBACK",
              error: "인증 코드가 없습니다.",
            },
            "*" // 부모 창에서 origin 검증 수행
          );
        }

        // 2초 후 창 닫기
        setTimeout(() => {
          window.close();
        }, 2000);
        return;
      }

      // 성공: 부모 창으로 code 전송
      setStatus("success");
      setMessage("인증이 완료되었습니다. 잠시 후 창이 닫힙니다.");

      // 부모 창으로 성공 메시지 전송
      if (window.opener) {
        // postMessage의 targetOrigin 문제:
        // - 콜백 페이지: app-dev.talkgate.im (서브도메인 없음)
        // - 부모 창: project-xxx.app-dev.talkgate.im (서브도메인 있음)
        // targetOrigin을 특정 origin으로 지정하면 부모 창에서 받지 못할 수 있음
        // 따라서 '*'를 사용하되, 부모 창에서 origin 검증을 강화해야 함
        
        console.log("[Instagram Callback] postMessage 전송:", {
          code: code?.substring(0, 20) + "...",
          currentOrigin: window.location.origin,
          hasOpener: !!window.opener,
        });

        // '*'를 사용하여 모든 origin으로 전송 (부모 창에서 검증)
        window.opener.postMessage(
          {
            type: "INSTAGRAM_OAUTH_CALLBACK",
            code: code,
          },
          "*" // 부모 창에서 origin 검증 수행
        );
      } else {
        console.warn("[Instagram Callback] window.opener가 없습니다.");
      }

      // 1초 후 창 닫기
      setTimeout(() => {
        window.close();
      }, 1000);
    };

    handleCallback();
  }, [searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-10">
      <div className="bg-card rounded-[14px] shadow-lg p-8 max-w-md w-full mx-4">
        {status === "loading" && (
          <div className="text-center">
            <LoadingSpinner size="2xl" className="mb-4" />
            <h2 className="text-[18px] font-semibold text-foreground mb-2">
              인스타그램 연동 중...
            </h2>
            <p className="text-[14px] text-neutral-60">
              잠시만 기다려주세요.
            </p>
          </div>
        )}

        {status === "success" && (
          <div className="text-center">
            <div className="w-12 h-12 bg-primary-10 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M20 6L9 17L4 12"
                  stroke="#00E272"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <h2 className="text-[18px] font-semibold text-foreground mb-2">
              연동 완료
            </h2>
            <p className="text-[14px] text-neutral-60">{message}</p>
            <p className="text-[12px] text-neutral-50 mt-4">
              이 창은 자동으로 닫힙니다...
            </p>
          </div>
        )}

        {status === "error" && (
          <div className="text-center">
            <div className="w-12 h-12 bg-danger-10 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M18 6L6 18M6 6L18 18"
                  stroke="#D83232"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <h2 className="text-[18px] font-semibold text-foreground mb-2">
              연동 실패
            </h2>
            <p className="text-[14px] text-neutral-60">{message}</p>
            <p className="text-[12px] text-neutral-50 mt-4">
              이 창은 자동으로 닫힙니다...
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function InstagramCallbackContent() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-neutral-10">
        <div className="bg-card rounded-[14px] shadow-lg p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <LoadingSpinner size="2xl" className="mb-4" />
            <h2 className="text-[18px] font-semibold text-foreground mb-2">
              인스타그램 연동 중...
            </h2>
            <p className="text-[14px] text-neutral-60">
              잠시만 기다려주세요.
            </p>
          </div>
        </div>
      </div>
    }>
      <InstagramCallbackContentInner />
    </Suspense>
  );
}

