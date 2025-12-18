"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MembersService } from "@/services/members";
import {
  getPendingInviteInfo,
  getPendingInviteToken,
  clearPendingInviteInfo,
} from "@/lib/invite";
import AuthLayout from "@/components/auth/AuthLayout";
import { showErrorModal } from "@/providers/ErrorFeedbackModalProvider";

export function AcceptInviteForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
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

  const handleSubmit = async () => {
    if (!inviteInfo?.token) return;

    setIsSubmitting(true);
    try {
      // 초대 수락 API 호출
      await MembersService.acceptInvitation({
        token: inviteInfo.token,
        name: name || undefined,
        phone: phone || undefined,
      });

      // 성공 시 초대 정보 삭제
      clearPendingInviteInfo();

      // 프로젝트 선택 페이지로 이동
      router.replace("/projects");
    } catch (err: any) {
      console.error("[AcceptInvite] 초대 수락 실패:", err);
      showErrorModal({
        title: "오류 발생",
        headline: "초대 수락에 실패했습니다.",
        description:
          err?.data?.message || "잠시 후 다시 시도해주세요.",
        confirmText: "확인",
        cancelText: null,
        hideCancel: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = async () => {
    if (!inviteInfo?.token) return;

    setIsSubmitting(true);
    try {
      // 이름/연락처 없이 초대 수락
      await MembersService.acceptInvitation({
        token: inviteInfo.token,
      });

      // 성공 시 초대 정보 삭제
      clearPendingInviteInfo();

      // 프로젝트 선택 페이지로 이동
      router.replace("/projects");
    } catch (err: any) {
      console.error("[AcceptInvite] 초대 수락 실패:", err);
      showErrorModal({
        title: "오류 발생",
        headline: "초대 수락에 실패했습니다.",
        description:
          err?.data?.message || "잠시 후 다시 시도해주세요.",
        confirmText: "확인",
        cancelText: null,
        hideCancel: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!inviteInfo) {
    return null;
  }

  return (
    <AuthLayout ariaLabel="invite-accept-area">
      <h1 className="sr-only">초대 수락</h1>

      <form
        className="w-full space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit();
        }}
      >
        {/* 안내 문구 */}
        <div className="text-[#FDFDFD] text-[14px] font-medium text-center mb-[30px]">
          {inviteInfo.projectName ? (
            <>
              <span className="font-semibold">"{inviteInfo.projectName}"</span>{" "}
              프로젝트에 참여합니다.
              <br />
              <span className="text-[#B9B9B9] text-[13px]">
                프로젝트에서 사용할 정보를 입력해주세요.
              </span>
            </>
          ) : (
            "프로젝트에서 사용할 정보를 입력해주세요."
          )}
        </div>

        {/* 이름 입력 */}
        <label className="block text-[#CECECE] text-[14px] font-medium mb-1">
          이름
        </label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="이름을 입력하세요"
          className="w-full h-[34px] rounded-[5px] border border-[#555555] bg-transparent px-3 text-white"
        />

        {/* 핸드폰 번호 입력 */}
        <label className="block text-[#CECECE] text-[14px] font-medium mt-3 mb-1">
          핸드폰 번호
        </label>
        <div className="flex gap-2">
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, ""))}
            placeholder="핸드폰 번호를 입력하세요"
            className="flex-1 h-[34px] rounded-[5px] border border-[#555555] bg-transparent px-3 text-white"
          />
        </div>

        {/* 하단 버튼 */}
        <div className="mt-[30px] flex gap-5">
          <button
            type="button"
            className="cursor-pointer w-full h-[40px] px-3 rounded-[5px] bg-[#2F2F2F] text-[#D0D0D0] text-[13px] disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleSkip}
            disabled={isSubmitting}
          >
            나중에 하기
          </button>
          <button
            type="submit"
            className="cursor-pointer w-full h-[40px] rounded-[5px] bg-[#252525] text-[#D0D0D0] text-[14px] font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isSubmitting}
          >
            {isSubmitting ? "처리 중..." : "프로젝트 참여하기"}
          </button>
        </div>
      </form>
    </AuthLayout>
  );
}

