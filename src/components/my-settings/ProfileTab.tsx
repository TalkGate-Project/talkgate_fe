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
      // result 변수 사용을 위해 비동기 작업 진행
      void result;
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
      description: "잠시 후 다시 시도해주세요.",
      hideCancel: true,
      confirmText: "확인",
    });
  }, [refetchVerification]);
  
  // 본인인증 훅 사용 (프로필 본인인증은 account-verification 사용)
  const { startVerification, isVerifying } = usePhoneVerification({
    type: "account",
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
    void file; // 추후 구현 시 사용
    showErrorModal({
      type: "info",
      headline: "사진 업로드 기능은 준비 중입니다.",
      hideCancel: true,
    });
  };

  // 본인인증 버튼 컴포넌트 (재사용)
  const VerificationButton = () => {
    if (isLoadingVerification) {
      return (
        <span className="text-[12px] md:text-[14px] text-neutral-60">로딩 중...</span>
      );
    }
    
    if (verificationData?.isVerified === true) {
      return (
        <div className="inline-flex items-center justify-center px-2 md:px-3 py-1 md:py-1.5 gap-[6px] md:gap-[10px] border border-border rounded-[5px] dark:bg-white/10">
          <svg
            width="16"
            height="16"
            viewBox="0 0 20 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="md:w-5 md:h-5"
          >
            <path
              d="M16.6667 5L7.50033 14.1667L3.33366 10"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-neutral-60"
            />
          </svg>
          <span className="text-[12px] md:text-[14px] font-semibold text-foreground leading-[17px] tracking-[-0.02em]">
            본인인증 완료
          </span>
        </div>
      );
    }
    
    return (
      <button
        onClick={startVerification}
        disabled={isVerifying}
        className="cursor-pointer px-2 md:px-3 py-1 md:py-1.5 bg-[#1C1C1C] text-white rounded-[5px] text-[12px] md:text-[14px] font-semibold hover:bg-black/90 transition-colors disabled:opacity-60 flex items-center gap-1 md:gap-1.5"
      >
        {isVerifying ? (
          <>
            <svg
              className="animate-spin h-3 w-3 md:h-4 md:w-4"
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
            <span className="hidden md:inline">인증 중...</span>
            <span className="md:hidden">인증 중</span>
          </>
        ) : (
          <>
            <svg
              width="14"
              height="14"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="md:w-4 md:h-4"
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
            <span>본인인증</span>
          </>
        )}
      </button>
    );
  };

  return (
    <div className="bg-card rounded-none md:rounded-[14px] min-h-screen md:min-h-0 pb-[140px]">
      {/* Title - 모바일에서는 제목과 버튼을 같은 행에 배치 */}
      <div className="px-6 md:px-7 py-4 md:py-7 flex items-center justify-between gap-3">
        <h1 className="text-[20px] md:text-[24px] font-bold text-foreground">
          프로필 설정
        </h1>
        {/* 모바일에서만 버튼 표시 */}
        <div className="md:hidden flex items-center gap-2 flex-shrink-0">
          <VerificationButton />
        </div>
      </div>

      <div className="border-b border-[#e9e9e9] dark:!border-[#44444455]"></div>

      {/* Sub-title and Verification Button Row - 데스크탑에서만 표시 */}
      <div className="hidden md:flex px-7 py-6 items-start justify-between mb-1">
        <div className="flex-1 min-w-0">
          <h2 className="text-[16px] font-semibold text-foreground mb-1">
            프로필 정보
          </h2>
          <p className="text-[14px] font-medium text-neutral-60">
            프로젝트에서 사용되는 프로필 정보를 설정합니다.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <VerificationButton />
        </div>
      </div>

      {/* Divider */}
      <div className="hidden md:block mx-4 md:mx-7 h-[1px] bg-border dark:!bg-[#44444455] mb-6 md:mb-8"></div>

      {/* Avatar - Full width centered */}
      <div className="flex flex-col items-center justify-center mt-6 md:mt-0 mb-6 md:mb-8 gap-3">
        <div className="w-[80px] h-[80px] md:w-[100px] md:h-[100px] rounded-full bg-neutral-60 flex items-center justify-center overflow-hidden relative">
          {user?.profileImageUrl ? (
            <img
              src={user.profileImageUrl}
              alt="Profile"
              width={100}
              height={100}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-full h-full bg-[#7C7C7C] flex items-center justify-center text-white text-[28px] md:text-[36px] font-medium">
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
              className="text-[12px] md:text-[14px] text-[#5D5D5D] underline cursor-pointer hover:text-black transition-colors"
            >
              사진 업로드
            </label>
          </div>
        )}
      </div>

      {/* Form Fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5 max-w-[788px] mx-auto px-6 lg:px-0">
        {/* 이름 */}
        <div>
          <label className="block text-[12px] md:text-[14px] font-medium text-neutral-60 mb-2">
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
          <label className="block text-[12px] md:text-[14px] font-medium text-neutral-60 mb-2">
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
        <div className="md:col-span-2">
          <label className="block text-[12px] md:text-[14px] font-medium text-neutral-60 mb-2">
            연락처
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
