"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getPendingInviteInfo,
  getPendingInviteToken,
} from "@/lib/invite";
import AuthLayout from "@/components/auth/AuthLayout";
import AsyncButton from "@/components/common/AsyncButton";
import { showErrorModal } from "@/providers/ErrorFeedbackModalProvider";

export function AcceptInviteForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [inviteInfo, setInviteInfo] = useState<{
    token: string;
    projectName: string;
  } | null>(null);

  useEffect(() => {
    // 저장된 초대 정보 확인
    const info = getPendingInviteInfo();
    const token = getPendingInviteToken();

    if (!info && !token) {
      // 초대 정보가 없으면 로그인 페이지로 이동
      router.replace("/login");
      return;
    }

    setInviteInfo({
      token: info?.token || token || "",
      projectName: info?.projectName || "",
    });
  }, [router]);

  // 본인인증 후 프로젝트 가입 페이지로 이동
  const handleVerification = async () => {
    if (!inviteInfo?.token) return;

    setIsSubmitting(true);
    try {
      // TODO: 실제 본인인증 서비스(PASS, NICE 등) 연동
      console.log("[AcceptInvite] 📱 본인인증 시작");
      
      // 임시: 본인인증 팝업/리다이렉트 시뮬레이션
      await new Promise((resolve) => setTimeout(resolve, 1500));
      
      console.log("[AcceptInvite] ✅ 본인인증 완료 → 프로젝트 가입 페이지로 이동");

      // 본인인증 완료 후 프로젝트 가입 페이지로 이동 (이름/전화번호 입력)
      // 초대 수락은 프로젝트 가입 완료 후 처리됨
      router.replace("/project-signup");
    } catch (err: unknown) {
      console.error("[AcceptInvite] 본인인증 실패:", err);
      showErrorModal({
        title: "오류 발생",
        headline: "본인인증에 실패했습니다. 잠시 후 다시 시도해주세요.",
        confirmText: "확인",
        cancelText: null,
        hideCancel: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // 건너뛰기 (본인인증 없이 프로젝트 가입 페이지로 이동)
  const handleSkip = () => {
    if (!inviteInfo?.token) return;

    console.log("[AcceptInvite] ⏭️ 본인인증 스킵 → 프로젝트 가입 페이지로 이동");
    // 본인인증 없이 프로젝트 가입 페이지로 이동
    router.replace("/project-signup");
  };

  if (!inviteInfo) {
    return null;
  }

  return (
    <AuthLayout ariaLabel="invite-accept-area">
      <h1 className="sr-only">초대 수락</h1>

      <div className="w-full">
        {/* 안내 문구 */}
        <div className="text-[#FDFDFD] text-[14px] font-medium text-center mb-[30px]">
          {inviteInfo.projectName ? (
            <>
              <span className="text-[#B9B9B9] text-[13px]">
                본인인증을 완료해주세요.
              </span>
            </>
          ) : (
            "본인인증을 완료해주세요."
          )}
        </div>

        {/* 본인인증 버튼 - 피그마 디자인 적용 */}
        <AsyncButton
          type="button"
          variant="auth"
          size="md"
          fullWidth
          loading={isSubmitting}
          loadingText="처리 중..."
          onClick={handleVerification}
          leftIcon={
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect
                x="5"
                y="2.5"
                width="10"
                height="15"
                rx="2"
                stroke="#B0B0B0"
                strokeWidth="1.5"
              />
              <line
                x1="8"
                y1="14.5"
                x2="12"
                y2="14.5"
                stroke="#B0B0B0"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          }
        >
          휴대폰 본인인증
        </AsyncButton>

        {/* 건너뛰기 - 피그마 디자인 적용 */}
        <div className="mt-6 flex justify-end">
          <button
            type="button"
            className="cursor-pointer text-[14px] text-[#808080] hover:text-[#BFBFBF] transition-colors flex items-center gap-1"
            onClick={handleSkip}
            disabled={isSubmitting}
          >
            <span>건너뛰기</span>
            <svg
              width="14"
              height="14"
              viewBox="0 0 14 14"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="text-[#808080]"
            >
              <path
                d="M5 3.5L8.5 7L5 10.5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M8.5 3.5L12 7L8.5 10.5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      </div>
    </AuthLayout>
  );
}

