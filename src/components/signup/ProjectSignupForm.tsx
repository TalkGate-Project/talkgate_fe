"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import AuthLayout from "@/components/auth/AuthLayout";
import AsyncButton from "@/components/common/AsyncButton";
import { MembersService } from "@/services/members";
import { getPendingInviteInfo, clearPendingInviteInfo } from "@/lib/invite";
import { showErrorModal } from "@/providers/ErrorFeedbackModalProvider";

export function ProjectSignupForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 초대 플로우 확인
  const pendingInvite = getPendingInviteInfo();
  const isInviteFlow = !!pendingInvite?.token;

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // 초대 수락 API 호출
  const acceptInvitation = async () => {
    if (!pendingInvite?.token) return;

    try {
      await MembersService.acceptInvitation({
        token: pendingInvite.token,
      });
      console.log("[ProjectSignup] ✅ 초대 수락 완료");
      clearPendingInviteInfo();
    } catch (err: any) {
      const errorCode = err?.data?.code;
      
      // 이미 수락된 초대인 경우 - 정상 처리
      if (errorCode === "INVITATION_ALREADY_ACCEPTED") {
        console.log("[ProjectSignup] ℹ️ 이미 수락된 초대 - 정상 진행");
        clearPendingInviteInfo();
        return;
      }
      
      // 그 외 에러는 throw
      throw err;
    }
  };

  // 완료 버튼 클릭
  const handleComplete = async () => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      // 멤버 프로필 업데이트 (이름/전화번호가 입력된 경우에만)
      if (name.trim() || phone.trim()) {
        await MembersService.updateSelf({
          name: name.trim() || undefined,
          phone: phone.trim() || undefined,
        });
        console.log("[ProjectSignup] ✅ 프로필 업데이트 완료");
      }

      // 초대 플로우인 경우 → 초대 수락 API 호출
      if (isInviteFlow) {
        console.log("[ProjectSignup] 🎉 초대 플로우 - 초대 수락 API 호출");
        await acceptInvitation();
      }

      // 프로젝트 선택 페이지로 이동
      console.log("[ProjectSignup] 🎉 완료 - 프로젝트 선택으로 이동");
      router.replace("/projects");
    } catch (error: any) {
      console.error("[ProjectSignup] 처리 실패:", error);
      showErrorModal({
        title: "오류 발생",
        headline: "처리에 실패했습니다. 잠시 후 다시 시도해주세요.",
        confirmText: "확인",
        cancelText: null,
        hideCancel: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // 나중에 하기 버튼 클릭
  const handleSkip = async () => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      // 초대 플로우인 경우 → 초대 수락 API 호출 (프로필 입력 없이)
      if (isInviteFlow) {
        console.log("[ProjectSignup] ⏭️ 나중에 하기 - 초대 수락 API 호출");
        await acceptInvitation();
      }

      // 프로젝트 선택 페이지로 이동
      console.log("[ProjectSignup] ⏭️ 나중에 하기 - 프로젝트 선택으로 이동");
      router.replace("/projects");
    } catch (error: any) {
      console.error("[ProjectSignup] 처리 실패:", error);
      showErrorModal({
        title: "오류 발생",
        headline: "처리에 실패했습니다. 잠시 후 다시 시도해주세요.",
        confirmText: "확인",
        cancelText: null,
        hideCancel: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout ariaLabel="project-signup-area">
      <h1 className="sr-only">프로젝트 가입</h1>

      <div className="w-full space-y-6">
        {/* 안내 문구 */}
        <div className="text-center">
          <p className="text-white text-[14px] mb-1">
            프로젝트에서 사용할 정보를 입력해주세요
          </p>
        </div>

        {/* 초대 플로우 안내 */}
        {isInviteFlow && pendingInvite?.projectName && (
          <div className="mb-4 p-3 rounded-lg bg-[#1a3a2a] border border-[#00E272]/30">
            <p className="text-[#00E272] text-[14px] text-center">
              "{pendingInvite.projectName}" 프로젝트 초대
            </p>
          </div>
        )}

        {/* 이름 입력 */}
        <div>
          <label className="block text-[12px] mb-1 text-[#CECECE]">이름</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="이름을 입력하세요"
            className="w-full h-[40px] rounded-[5px] border border-[#555555] bg-transparent px-3 text-white placeholder-[#808080] focus:outline-none focus:border-[#00E272]"
            autoComplete="name"
          />
        </div>

        {/* 전화번호 입력 */}
        <div>
          <label className="block text-[12px] mb-1 text-[#CECECE]">핸드폰 번호</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="핸드폰 번호를 입력하세요"
            className="w-full h-[40px] rounded-[5px] border border-[#555555] bg-transparent px-3 text-white placeholder-[#808080] focus:outline-none focus:border-[#00E272]"
            autoComplete="tel"
          />
        </div>

        {/* 버튼 영역 */}
        <div className="flex gap-3 pt-2">
          <AsyncButton
            type="button"
            variant="secondary"
            size="md"
            onClick={handleSkip}
            loading={isSubmitting}
            loadingText="처리 중..."
            className="flex-1 !bg-[#252525] !text-[#D0D0D0] hover:!bg-[#353535]"
          >
            나중에 하기
          </AsyncButton>
          <AsyncButton
            type="button"
            variant="auth"
            size="md"
            onClick={handleComplete}
            loading={isSubmitting}
            loadingText="처리 중..."
            className="flex-1"
          >
            완료
          </AsyncButton>
        </div>
      </div>
    </AuthLayout>
  );
}

