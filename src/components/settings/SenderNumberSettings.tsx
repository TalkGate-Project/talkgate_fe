"use client";

import { useEffect, useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSelectedProjectId } from "@/hooks/useSelectedProjectId";
import { SmsService } from "@/services/sms";
import type { ProjectSenderNumber, MemberSenderNumber } from "@/types/sms";
import SelfAuthenticationModal from "./SelfAuthenticationModal";
import CommonSenderNumberModal from "./CommonSenderNumberModal";
import { showErrorModal } from "@/providers/ErrorFeedbackModalProvider";
import {
  usePhoneVerification,
  type VerificationResult,
} from "@/hooks/usePhoneVerification";
import { VerificationService } from "@/services/verification";

type ProjectSenderNumberStatus = "verified" | "pending" | "rejected";

// 상태 뱃지 컴포넌트
function StatusBadge({ status }: { status: ProjectSenderNumberStatus }) {
  const config = {
    verified: {
      label: "승인",
      bgColor: "bg-[#DCFCE7]",
      textColor: "text-[#166534]",
    },
    pending: {
      label: "심사중",
      bgColor: "bg-[#FEF9C3]",
      textColor: "text-[#854D0E]",
    },
    rejected: {
      label: "거부",
      bgColor: "bg-[#FEE2E2]",
      textColor: "text-[#991B1B]",
    },
  };

  const { label, bgColor, textColor } = config[status] || config.pending;

  return (
    <span
      className={`inline-flex items-center h-[24px] px-2.5 rounded-[4px] text-[12px] font-medium ${bgColor} ${textColor}`}
    >
      {label}
    </span>
  );
}

// 삭제 아이콘 버튼
function DeleteButton({
  onClick,
  disabled,
}: {
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="w-8 h-8 flex items-center justify-center rounded-[5px] hover:bg-neutral-10 dark:hover:bg-neutral-30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      aria-label="삭제"
    >
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M19 7L18.1327 19.1425C18.0579 20.1891 17.187 21 16.1378 21H7.86224C6.81296 21 5.94208 20.1891 5.86732 19.1425L5 7M10 11V17M14 11V17M15 7V4C15 3.44772 14.5523 3 14 3H10C9.44772 3 9 3.44772 9 4V7M4 7H20"
          stroke="currentColor"
          className="text-neutral-60 dark:text-neutral-50"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}

// 정보 아이콘 (거부 사유 등)
function InfoIcon({ tooltip }: { tooltip?: string }) {
  return (
    <span className="relative group cursor-help ml-1.5">
      <svg
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="8" cy="8" r="7" stroke="#EF4444" strokeWidth="1.5" />
        <path
          d="M8 5V8.5"
          stroke="#EF4444"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <circle cx="8" cy="11" r="0.75" fill="#EF4444" />
      </svg>
      {tooltip && (
        <span className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-max max-w-[200px] px-2 py-1 bg-neutral-90 dark:bg-[#A0A0A0] text-white dark:text-[#111111] text-[12px] rounded-[4px] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 whitespace-normal">
          {tooltip}
        </span>
      )}
    </span>
  );
}

export default function SenderNumberSettings() {
  const [projectId, ready] = useSelectedProjectId();

  // 프로젝트 발신번호 (공통)
  const [projectNumbers, setProjectNumbers] = useState<ProjectSenderNumber[]>(
    []
  );
  const [loadingProject, setLoadingProject] = useState(false);

  // 멤버 발신번호 (개인)
  const [memberNumbers, setMemberNumbers] = useState<MemberSenderNumber[]>([]);
  const [loadingMember, setLoadingMember] = useState(false);

  // 모달 상태
  const [showSelfAuthModal, setShowSelfAuthModal] = useState(false);
  const [showCommonSenderModal, setShowCommonSenderModal] = useState(false);
  const [authPurpose, setAuthPurpose] = useState<"personal" | "common">("personal");

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

  const isUserAuthenticated = verificationData?.isVerified === true;
  const showProjectMissing = ready && !projectId;

  // 프로젝트 발신번호 로드
  const loadProjectNumbers = useCallback(async () => {
    if (!projectId) return;
    setLoadingProject(true);
    try {
      const res = await SmsService.getProjectSenderNumbers({
        page: 1,
        limit: 100,
      });
      const data = (res.data as any)?.data ?? res.data;
      setProjectNumbers(data?.numbers ?? []);
    } catch (error) {
      console.error("프로젝트 발신번호 로드 실패:", error);
      setProjectNumbers([]);
    } finally {
      setLoadingProject(false);
    }
  }, [projectId]);

  // 멤버 발신번호 로드
  const loadMemberNumbers = useCallback(async () => {
    if (!projectId) return;
    setLoadingMember(true);
    try {
      const res = await SmsService.getMemberSenderNumbers({
        page: 1,
        limit: 100,
      });
      const data = (res.data as any)?.data ?? res.data;
      setMemberNumbers(data?.numbers ?? []);
    } catch (error) {
      console.error("멤버 발신번호 로드 실패:", error);
      setMemberNumbers([]);
    } finally {
      setLoadingMember(false);
    }
  }, [projectId]);

  // 프로젝트 변경 시 데이터 로드
  useEffect(() => {
    if (ready && projectId) {
      loadProjectNumbers();
      loadMemberNumbers();
    }
  }, [ready, projectId, loadProjectNumbers, loadMemberNumbers]);

  // 삭제 핸들러 (TODO: API 연동)
  const handleDeleteProjectNumber = async (id: number) => {
    showErrorModal({
      type: "error",
      headline: "발신번호 삭제",
      description: "이 발신번호를 삭제하시겠습니까?",
      onConfirm: () => {
        // TODO: API 연동 후 구현
        showErrorModal({
          type: "error",
          headline: "알림",
          description: "발신번호 삭제 API가 아직 구현되지 않았습니다.",
          hideCancel: true,
          confirmText: "확인",
        });
      },
    });
  };

  const handleDeleteMemberNumber = async (id: number) => {
    showErrorModal({
      headline: "발신번호 삭제",
      description: "이 발신번호를 삭제하시겠습니까?",
      onConfirm: () => {
        // TODO: API 연동 후 구현
        showErrorModal({
          headline: "알림",
          description: "발신번호 삭제 API가 아직 구현되지 않았습니다.",
          hideCancel: true,
          confirmText: "확인",
        });
      },
    });
  };

  // 공통 발신번호 추가 핸들러
  const handleAddProjectNumber = () => {
    // 본인인증이 필요한지 확인
    if (!isUserAuthenticated) {
      // 본인인증이 안된 사용자: 본인인증 안내
      setAuthPurpose("common");
      setShowSelfAuthModal(true);
    } else {
      // 본인인증이 완료된 사용자: 서류 등록 모달 바로 표시
      setShowCommonSenderModal(true);
    }
  };

  // 본인인증 성공 핸들러 (개인 발신번호용)
  // 백엔드에서 자동으로 발신번호를 추가하므로 별도 API 호출 불필요
  const handlePersonalVerificationSuccess = useCallback(
    async (result: VerificationResult) => {
      console.log("[SenderNumberSettings] ✅ 본인인증 성공:", result);
      
      // 본인인증 상태를 다시 조회
      await refetchVerification();
      
      // 발신번호 목록 새로고침 (백엔드에서 자동으로 추가됨)
      await loadMemberNumbers();
      
      showErrorModal({
        type: "success",
        headline: "본인인증이 완료되었습니다.",
        description: "발신번호가 자동으로 추가되었습니다.",
        hideCancel: true,
        confirmText: "확인",
      });
    },
    [refetchVerification, loadMemberNumbers]
  );

  // 본인인증 실패 핸들러 (개인 발신번호용)
  const handlePersonalVerificationError = useCallback((result: VerificationResult) => {
    console.error("[SenderNumberSettings] 본인인증 실패:", result);

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

  // 본인인증 훅 사용 (개인 발신번호용)
  const { startVerification: startPersonalVerification, isVerifying: isVerifyingPersonal } = usePhoneVerification({
    type: "sms-sender",
    onSuccess: handlePersonalVerificationSuccess,
    onError: handlePersonalVerificationError,
  });

  // 개인 발신번호 추가 핸들러
  const handleAddMemberNumber = () => {
    setAuthPurpose("personal");
    
    if (isUserAuthenticated) {
      // 인증이 이미 된 경우: 바로 본인인증 시작
      startPersonalVerification();
    } else {
      // 인증이 안된 경우: 확인 모달 표시
      setShowSelfAuthModal(true);
    }
  };

  // 확인 모달에서 확인 버튼 클릭 시 본인인증 시작
  const handleConfirmAuthentication = () => {
    setShowSelfAuthModal(false);
    startPersonalVerification();
  };

  // 공통 발신번호용 확인 핸들러
  const handleCommonAuthConfirm = () => {
    setShowSelfAuthModal(false);
    // 공통 발신번호: 서류 등록 모달 표시
    setShowCommonSenderModal(true);
  };

  // 공통 발신번호 등록 성공 핸들러
  const handleCommonSenderSuccess = () => {
    loadProjectNumbers(); // 목록 새로고침
  };

  // 날짜 포맷팅 (데스크탑용)
  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date
        .toLocaleDateString("ko-KR", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
        })
        .replace(/\. /g, "-")
        .replace(".", "");
    } catch {
      return dateStr;
    }
  };

  // 날짜 포맷팅 (모바일용 - YYYY-MM-DD HH:mm 형식)
  const formatDateMobile = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      const hours = String(date.getHours()).padStart(2, "0");
      const minutes = String(date.getMinutes()).padStart(2, "0");
      return `${year}-${month}-${day} ${hours}:${minutes}`;
    } catch {
      return dateStr;
    }
  };

  return (
    <>
      {/* 본인인증 확인 모달 */}
      <SelfAuthenticationModal
        isOpen={showSelfAuthModal}
        onClose={() => setShowSelfAuthModal(false)}
        onConfirm={
          authPurpose === "personal"
            ? handleConfirmAuthentication
            : handleCommonAuthConfirm
        }
        purpose={authPurpose}
      />

      {/* 공통 발신번호 추가 모달 */}
      <CommonSenderNumberModal
        isOpen={showCommonSenderModal}
        onClose={() => setShowCommonSenderModal(false)}
        onSuccess={handleCommonSenderSuccess}
      />

      <div className="bg-card rounded-[14px] lg:rounded-[14px] rounded-t-none lg:rounded-t-[14px] pb-4 md:pb-7">
        {/* Title */}
        <h1 className="px-4 md:px-7 text-[18px] md:text-[24px] font-bold text-ink dark:text-neutral-80 py-4 md:py-0 md:h-[76px] flex items-center border-b border-neutral-30 dark:border-neutral-30">
          발신번호 등록
        </h1>

      {showProjectMissing ? (
        <div className="flex items-center justify-center h-40 text-[14px] text-neutral-60 dark:text-neutral-60 px-4 md:px-7">
          프로젝트를 먼저 선택해주세요.
        </div>
      ) : (
        <div className="px-6 md:px-7 pt-4 md:pt-[23px]">
          {/* 공통 발신번호 섹션 */}
          <div className="mb-6 md:mb-[30px]">
            <div className="flex items-center justify-between mb-4 border-b border-neutral-30 dark:border-neutral-30 pb-3 gap-3">
              <h2 className="text-[16px] font-semibold text-ink dark:text-neutral-80">
                공통 발신번호
              </h2>
              <button
                type="button"
                onClick={handleAddProjectNumber}
                className="cursor-pointer h-[34px] px-3 md:px-4 rounded-[5px] bg-neutral-90 dark:bg-neutral-80 text-[12px] md:text-[14px] font-semibold text-neutral-0 dark:text-neutral-0 hover:bg-neutral-80 dark:hover:bg-neutral-70 transition-colors whitespace-nowrap"
              >
                +발신번호 추가
              </button>
            </div>

            {/* 테이블 헤더 - 모바일/데스크탑 분리 */}
            {/* Mobile Header */}
            <div className="md:hidden bg-neutral-10 dark:bg-neutral-20 rounded-[8px] px-4 h-[40px] flex items-center mb-1">
              <div className="w-[140px] flex-none text-[14px] font-medium text-neutral-60 dark:text-neutral-60">
                발신번호
              </div>
              <div className="flex-1 text-[14px] font-medium text-neutral-60 dark:text-neutral-60">
                상태
              </div>
              <div className="w-8 flex-none"></div>
            </div>
            
            {/* Desktop Header */}
            <div className="hidden md:flex bg-neutral-10 dark:bg-neutral-20 rounded-[8px] px-10 h-[40px] items-center mb-1">
              <div className="flex-1 min-w-0 text-[14px] font-medium text-neutral-60 dark:text-neutral-60">
                발신번호
              </div>
              <div className="flex-1 min-w-0 text-[14px] font-medium text-neutral-60 dark:text-neutral-60">
                상태
              </div>
              <div className="w-[160px] flex-shrink-0"></div>
            </div>

            {/* 테이블 바디 */}
            {loadingProject ? (
              <div className="flex items-center justify-center h-32 text-[14px] text-neutral-60 dark:text-neutral-60">
                로딩 중...
              </div>
            ) : projectNumbers.length === 0 ? (
              <div className="flex items-center justify-center h-32 text-[14px] text-neutral-60 dark:text-neutral-60 border border-dashed border-neutral-30 dark:border-neutral-30 rounded-[10px] mt-2">
                등록된 공통 발신번호가 없습니다.
              </div>
            ) : (
              <div>
                {projectNumbers.map((num, index) => {
                  const isLastRow = index === projectNumbers.length - 1;
                  return (
                    <div key={num.id}>
                      {/* Desktop View */}
                      <div className="hidden md:flex items-center px-10 h-[52px] hover:bg-neutral-10 dark:hover:bg-neutral-20 transition-colors border-b border-neutral-30/40 dark:!border-[#44444455]">
                        <div className="flex-1 min-w-0 text-[14px] text-ink dark:text-neutral-80">
                          {num.number}
                        </div>
                        <div className="flex-1 min-w-0 flex items-center">
                          <StatusBadge
                            status={num.status as ProjectSenderNumberStatus}
                          />
                          {num.status === "rejected" && (
                            <InfoIcon tooltip="서류 검토 결과 발신번호 등록이 거부되었습니다." />
                          )}
                        </div>
                        <div className="w-[160px] flex-shrink-0 flex justify-end">
                          <DeleteButton
                            onClick={() => handleDeleteProjectNumber(num.id)}
                          />
                        </div>
                      </div>

                      {/* Mobile View */}
                      <div className="md:hidden flex items-center py-3 pl-3 pr-4">
                        <div className="w-[140px] flex-none min-w-0">
                          <div className="text-[14px] text-ink dark:text-neutral-80 font-semibold truncate">
                            {num.number}
                          </div>
                        </div>
                        <div className="flex-1 flex items-center gap-1">
                          <StatusBadge
                            status={num.status as ProjectSenderNumberStatus}
                          />
                          {num.status === "rejected" && (
                            <InfoIcon tooltip="서류 검토 결과 발신번호 등록이 거부되었습니다." />
                          )}
                        </div>
                        <div className="w-8 flex-none flex items-center justify-center">
                          <DeleteButton
                            onClick={() => handleDeleteProjectNumber(num.id)}
                          />
                        </div>
                      </div>

                      {/* Divider - 마지막 행 제외 */}
                      {!isLastRow && (
                        <div className="w-full h-[1px] bg-neutral-30 dark:bg-neutral-30 opacity-50"></div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>



          {/* 개인 발신번호 섹션 */}
          <div>
            <div className="flex items-center justify-between mb-4 border-b border-neutral-30 dark:border-neutral-30 pb-3 gap-3">
              <h2 className="text-[16px] font-semibold text-ink dark:text-neutral-80">
                개인 발신번호
              </h2>
              <button
                type="button"
                onClick={handleAddMemberNumber}
                className="cursor-pointer h-[34px] px-3 md:px-4 rounded-[5px] bg-neutral-90 dark:bg-neutral-80 text-[12px] md:text-[14px] font-semibold text-neutral-0 dark:text-neutral-0 hover:bg-neutral-80 dark:hover:bg-neutral-70 transition-colors whitespace-nowrap"
              >
                +발신번호 추가
              </button>
            </div>
              
            {/* 테이블 헤더 - 모바일/데스크탑 분리 */}
            {/* Mobile Header */}
            <div className="md:hidden bg-neutral-10 dark:bg-neutral-20 rounded-[8px] px-4 h-[40px] flex items-center mb-1">
              <div className="w-[140px] flex-none text-[14px] font-medium text-neutral-60 dark:text-neutral-60">
                발신번호
              </div>
              <div className="flex-1 text-[14px] font-medium text-neutral-60 dark:text-neutral-60">
                등록일
              </div>
              <div className="w-8 flex-none"></div>
            </div>
            
            {/* Desktop Header */}
            <div className="hidden md:flex bg-neutral-10 dark:bg-neutral-20 rounded-[8px] px-10 h-[40px] items-center mb-1">
              <div className="flex-1 min-w-0 text-[14px] font-medium text-neutral-60 dark:text-neutral-60">
                발신번호
              </div>
              <div className="flex-1 min-w-0 text-[14px] font-medium text-neutral-60 dark:text-neutral-60">
                등록일
              </div>
              <div className="w-[160px] flex-shrink-0"></div>
            </div>

            {/* 테이블 바디 */}
            {loadingMember ? (
              <div className="flex items-center justify-center h-32 text-[14px] text-neutral-60 dark:text-neutral-60">
                로딩 중...
              </div>
            ) : memberNumbers.length === 0 ? (
              <div className="flex items-center justify-center h-32 text-[14px] text-neutral-60 dark:text-neutral-60 border border-dashed border-neutral-30 dark:border-neutral-30 rounded-[10px] mt-2">
                등록된 개인 발신번호가 없습니다.
              </div>
            ) : (
              <div>
                {memberNumbers.map((num, index) => {
                  const isLastRow = index === memberNumbers.length - 1;
                  return (
                    <div key={num.id}>
                      {/* Desktop View */}
                      <div className="hidden md:flex items-center px-10 h-[52px] hover:bg-neutral-10 dark:hover:bg-neutral-20 transition-colors border-b border-neutral-30/40 dark:!border-[#44444455]">
                        <div className="flex-1 min-w-0 text-[14px] text-ink dark:text-neutral-80">
                          {num.phoneNumber}
                        </div>
                        <div className="flex-1 min-w-0 text-[14px] text-neutral-60 dark:text-neutral-60">
                          {formatDate(num.createdAt)}
                        </div>
                        <div className="w-[160px] flex-shrink-0 flex justify-end">
                          <DeleteButton
                            onClick={() => handleDeleteMemberNumber(num.id)}
                          />
                        </div>
                      </div>

                      {/* Mobile View */}
                      <div className="md:hidden flex items-center py-3 pl-3 pr-4">
                        <div className="w-[140px] flex-none min-w-0">
                          <div className="text-[14px] text-ink dark:text-neutral-80 font-semibold truncate">
                            {num.phoneNumber}
                          </div>
                        </div>
                        <div className="flex-1">
                          <div className="text-[12px] text-neutral-60 dark:text-neutral-60 whitespace-nowrap">
                            {formatDateMobile(num.createdAt)}
                          </div>
                        </div>
                        <div className="w-8 flex-none flex items-center justify-center">
                          <DeleteButton
                            onClick={() => handleDeleteMemberNumber(num.id)}
                          />
                        </div>
                      </div>

                      {/* Divider - 마지막 행 제외 */}
                      {!isLastRow && (
                        <div className="w-full h-[1px] bg-neutral-30 dark:bg-neutral-30 opacity-50"></div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
      </div>
    </>
  );
}
