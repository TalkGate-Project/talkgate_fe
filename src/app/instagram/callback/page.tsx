"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { MessengerIntegrationService } from "@/services/messengerIntegration";

function InstagramCallbackContent() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // URL에서 code 파라미터 가져오기
        const code = searchParams.get("code");
        
        if (!code) {
          setStatus("error");
          setMessage("인증 코드가 없습니다.");
          return;
        }

        // localStorage에서 projectId 가져오기 (부모 창에서 설정해야 함)
        const projectId = localStorage.getItem("selectedProjectId");
        
        if (!projectId) {
          setStatus("error");
          setMessage("프로젝트 ID가 없습니다.");
          return;
        }

        // 인스타그램 연동 API 호출
        await MessengerIntegrationService.instagram(
          { code },
          { "x-project-id": projectId }
        );

        setStatus("success");
        setMessage("인스타그램 연동이 완료되었습니다.");

        // 1초 후 부모 창 새로고침 및 현재 창 닫기
        setTimeout(() => {
          if (window.opener) {
            window.opener.location.reload();
          }
          window.close();
        }, 1000);
      } catch (error: any) {
        console.error("Instagram integration failed:", error);
        setStatus("error");
        setMessage(
          error?.data?.message || "인스타그램 연동에 실패했습니다."
        );
        
        // 3초 후 창 닫기
        setTimeout(() => {
          window.close();
        }, 3000);
      }
    };

    handleCallback();
  }, [searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-10">
      <div className="bg-card rounded-[14px] shadow-lg p-8 max-w-md w-full mx-4">
        {status === "loading" && (
          <div className="text-center">
            <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-neutral-20 border-t-primary-60 mb-4" />
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

export default function InstagramCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-neutral-10">
        <div className="bg-card rounded-[14px] shadow-lg p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-neutral-20 border-t-primary-60 mb-4" />
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
      <InstagramCallbackContent />
    </Suspense>
  );
}


