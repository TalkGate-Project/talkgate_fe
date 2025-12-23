"use client";

import { useState, useEffect, useCallback } from "react";
import { useMe } from "@/hooks/useMe";
import { useQuery } from "@tanstack/react-query";

import { showErrorModal } from "@/lib/errorModalEvents";
import {
  usePhoneVerification,
  type VerificationResult,
} from "@/hooks/usePhoneVerification";
import { VerificationService } from "@/services/verification";

export default function ProfileTab() {
  const { user, refetch } = useMe();
  const [isEditing, setIsEditing] = useState(false);

  const [name, setName] = useState(user?.name || "-");
  const [email, setEmail] = useState(user?.email || "");
  const [contact, setContact] = useState(user?.phone || "");

  // 본인인증 상태 조회
  const {
    data: verificationData,
    refetch: refetchVerification,
    isLoading: isLoadingVerification,
  } = useQuery({
    queryKey: ["verification", "identity"],
    queryFn: async () => {
      const response = await VerificationService.getIdentity();
      return response.data.data; // ApiSuccessResponse의 data에서 실제 VerificationIdentity 추출
    },
    staleTime: 1000 * 60 * 5, // 5분
  });
  
  // 본인인증 성공 핸들러
  const handleVerificationSuccess = useCallback(
    async (result: VerificationResult) => {
      console.log("[ProfileTab] ✅ 본인인증 성공:", result);
      await Promise.all([refetchVerification(), refetch()]);
      showErrorModal({
        type: "success",
        headline: "본인인증이 완료되었습니다.",
        hideCancel: true,
      });
    },
    [refetchVerification, refetch]
  );

  // 본인인증 실패 핸들러
  const handleVerificationError = useCallback((result: VerificationResult) => {
    console.error("[ProfileTab] 본인인증 실패:", result);

    // 이미 본인인증이 완료된 경우
    if (result.code === "IDENTITY_VERIFICATION_ALREADY_EXISTS") {
      showErrorModal({
        type: "info",
        headline: "이미 본인인증이 완료되었습니다.",
        hideCancel: true,
        confirmText: "확인",
      });
      // 이미 완료된 경우 상태를 다시 조회
      refetchVerification();
      return;
    }

    // 팝업 차단된 경우
    if (result.code === "POPUP_BLOCKED") {
      showErrorModal({
        type: "error",
        headline: "팝업이 차단되었습니다.",
        description: "브라우저 설정에서 팝업 차단을 해제해주세요.",
        hideCancel: true,
        confirmText: "확인",
      });
      return;
    }

    // 기타 오류
    showErrorModal({
      type: "error",
      headline: "본인인증에 실패했습니다.",
      description: result.message || "잠시 후 다시 시도해주세요.",
      hideCancel: true,
      confirmText: "확인",
    });
  }, [refetchVerification]);
  
  // 본인인증 훅 사용 (로그인 상태에서는 sms-sender-number-registration 사용)
  // x-project-id 헤더는 apiClient가 쿠키에서 자동으로 추가
  const { startVerification, isVerifying } = usePhoneVerification({
    type: "sms-sender",
    onSuccess: handleVerificationSuccess,
    onError: handleVerificationError,
  });

  // user 데이터가 로드되면 상태 업데이트
  useEffect(() => {
    if (user && !isEditing) {
      setName(user.name);
      setEmail(user.email);
      setContact(user.phone || "");
    }
  }, [user, isEditing]);

  // 초기화용 ref
  const initialData = {
    name: user?.name || "-",
    email: user?.email || "",
    contact: user?.phone || ""
  };

  // TODO: 프로필 수정 버튼 삭제, 개발 완료 후 삭제 예정
  // const handleEditStart = () => {
  //   setIsEditing(true);
  // };

  // TODO: 프로필 수정 버튼 삭제, 개발 완료 후 삭제 예정
  // const handleCancel = () => {
  //   setName(initialData.name);
  //   setEmail(initialData.email);
  //   setContact(initialData.contact);
  //   setIsEditing(false);
  // };

  // TODO: 프로필 수정 버튼 삭제, 개발 완료 후 삭제 예정
  // const handleSave = async () => {
  //   try {
  //     setSaving(true);
  //     const { AuthService } = await import("@/services/auth");
  //     await AuthService.updateProfile({ name, phone: contact });
  //     await refetch();
  //     setIsEditing(false);
  //     showErrorModal({
  //       type: "success",
  //       headline: "프로필이 업데이트되었습니다.",
  //       hideCancel: true,
  //     });
  //   } catch (e: any) {
  //     showErrorModal({
  //       type: "error",
  //       headline: "업데이트에 실패했습니다",
  //       description: "프로필 업데이트 중 오류가 발생했습니다.",
  //       hideCancel: true,
  //     });
  //   } finally {
  //     setSaving(false);
  //   }
  // };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // TODO: 이미지 업로드 API 연동 필요
    console.log("File selected:", file);
    showErrorModal({
      type: "info",
      headline: "사진 업로드 기능은 준비 중입니다.",
      hideCancel: true,
    });
  };

  return (
    <div className="bg-card rounded-[14px] pb-[140px]">
      {/* Title */}
      <h1 className="px-7 py-7 text-[24px] font-bold text-foreground">
        프로필
      </h1>

      <div className="border-b border-[#E2E2E266]"></div>

      {/* Sub-title and Verification Button Row */}
      <div className="px-7 py-6 flex items-start justify-between mb-1">
        <div>
          <h2 className="text-[16px] font-semibold text-foreground mb-1">
            프로필 정보
          </h2>
          <p className="text-[14px] font-medium text-neutral-60">
            프로젝트에서 사용되는 프로필 정보를 설정합니다.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isLoadingVerification ? (
            <span className="text-[14px] text-neutral-60">로딩 중...</span>
          ) : verificationData?.isVerified === true ? (
            <div className="inline-flex items-center justify-center px-3 py-1.5 gap-[10px] border border-[#E2E2E2] rounded-[5px]">
              <svg
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M16.6667 5L7.50033 14.1667L3.33366 10"
                  stroke="#B0B0B0"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span className="text-[14px] font-semibold text-[#000000] leading-[17px] tracking-[-0.02em]">
                본인인증 완료
              </span>
            </div>
          ) : (
            <button
              onClick={startVerification}
              disabled={isVerifying}
              className="cursor-pointer px-3 py-1.5 bg-[#1C1C1C] text-white rounded-[5px] text-[14px] font-semibold hover:bg-black/90 transition-colors disabled:opacity-60 flex items-center gap-1.5"
            >
              {isVerifying ? (
                <>
                  <svg
                    className="animate-spin h-4 w-4"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  인증 중...
                </>
              ) : (
                <>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <rect
                      x="4"
                      y="2"
                      width="8"
                      height="12"
                      rx="1.5"
                      stroke="currentColor"
                      strokeWidth="1.2"
                    />
                    <line
                      x1="6.5"
                      y1="11.5"
                      x2="9.5"
                      y2="11.5"
                      stroke="currentColor"
                      strokeWidth="1.2"
                      strokeLinecap="round"
                    />
                  </svg>
                  본인인증
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Divider */}
      <div className="mx-7 h-[1px] bg-border mb-8"></div>

      {/* Avatar - Full width centered */}
      <div className="flex flex-col items-center justify-center mb-8 gap-3">
        <div className="w-[100px] h-[100px] rounded-full bg-neutral-60 flex items-center justify-center overflow-hidden relative">
          {user?.profileImageUrl ? (
            <img
              src={user.profileImageUrl}
              alt="Profile"
              width={100}
              height={100}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-[#7C7C7C] flex items-center justify-center text-white text-[36px] font-medium">
               {/* 텍스트 기반 아바타 (예: 이름 첫 글자) */}
               {user?.name ? user.name.charAt(0) : "김"}
            </div>
          )}
        </div>
        
        {isEditing && (
          <div>
            <input
              type="file"
              id="profile-upload"
              className="hidden"
              accept="image/*"
              onChange={handleFileChange}
            />
            <label 
              htmlFor="profile-upload"
              className="text-[14px] text-[#5D5D5D] underline cursor-pointer hover:text-black transition-colors"
            >
              사진 업로드
            </label>
          </div>
        )}
      </div>

      {/* Form Fields */}
      <div className="grid grid-cols-2 gap-5 max-w-[788px] mx-auto">
        {/* 이름 */}
        <div>
          <label className="block text-[14px] font-medium text-neutral-60 mb-2">
            이름
          </label>
          <input
            type="text"
            value={name}
            readOnly={!isEditing}
            onChange={(e) => setName(e.target.value)}
            className={`w-full px-3 py-2 border rounded-[5px] text-[14px] text-foreground focus:outline-none transition-colors ${
              isEditing 
                ? "border-border bg-card focus:border-foreground" 
                : "border-border bg-neutral-10 text-neutral-60 cursor-default"
            }`}
            placeholder="이름을 입력하세요"
          />
        </div>

        {/* 이메일 */}
        <div>
          <label className="block text-[14px] font-medium text-neutral-60 mb-2">
            이메일
          </label>
          <input
            type="email"
            value={email}
            readOnly={!isEditing}
            onChange={(e) => setEmail(e.target.value)}
            className={`w-full px-3 py-2 border rounded-[5px] text-[14px] text-foreground focus:outline-none transition-colors ${
              isEditing 
                ? "border-border bg-card focus:border-foreground" 
                : "border-border bg-neutral-10 text-neutral-60 cursor-default"
            }`}
            placeholder="이메일을 입력하세요"
          />
        </div>

        {/* 휴대폰 번호 */}
        <div>
          <label className="block text-[14px] font-medium text-neutral-60 mb-2">
            휴대폰 번호
          </label>
          <input
            type="tel"
            value={contact}
            readOnly={!isEditing}
            onChange={(e) => setContact(e.target.value)}
            className={`w-full px-3 py-2 border rounded-[5px] text-[14px] text-foreground focus:outline-none transition-colors ${
              isEditing 
                ? "border-border bg-card focus:border-foreground" 
                : "border-border bg-neutral-10 text-neutral-60 cursor-default"
            }`}
            placeholder="휴대폰 번호를 입력하세요"
          />
        </div>
      </div>
    </div>
  );
}
