"use client";

import { useEffect, useState, useCallback } from "react";
import { useSelectedProjectId } from "@/hooks/useSelectedProjectId";
import { SmsService } from "@/services/sms";
import type { ProjectSenderNumber, MemberSenderNumber } from "@/types/sms";

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
      className="w-8 h-8 flex items-center justify-center rounded-[5px] hover:bg-neutral-20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      aria-label="삭제"
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 18 18"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M2.25 4.5H3.75H15.75"
          stroke="#B0B0B0"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M6 4.5V3C6 2.60218 6.15804 2.22064 6.43934 1.93934C6.72064 1.65804 7.10218 1.5 7.5 1.5H10.5C10.8978 1.5 11.2794 1.65804 11.5607 1.93934C11.842 2.22064 12 2.60218 12 3V4.5M14.25 4.5V15C14.25 15.3978 14.092 15.7794 13.8107 16.0607C13.5294 16.342 13.1478 16.5 12.75 16.5H5.25C4.85218 16.5 4.47064 16.342 4.18934 16.0607C3.90804 15.7794 3.75 15.3978 3.75 15V4.5H14.25Z"
          stroke="#B0B0B0"
          strokeWidth="1.5"
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
        <span className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-max max-w-[200px] px-2 py-1 bg-neutral-90 text-white text-[11px] rounded-[4px] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 whitespace-normal">
          {tooltip}
        </span>
      )}
    </span>
  );
}

export default function SenderNumberSettings() {
  const [projectId, ready] = useSelectedProjectId();

  // 프로젝트 발신번호 (공통)
  const [projectNumbers, setProjectNumbers] = useState<ProjectSenderNumber[]>([]);
  const [loadingProject, setLoadingProject] = useState(false);

  // 멤버 발신번호 (개인)
  const [memberNumbers, setMemberNumbers] = useState<MemberSenderNumber[]>([]);
  const [loadingMember, setLoadingMember] = useState(false);

  const showProjectMissing = ready && !projectId;

  // 프로젝트 발신번호 로드
  const loadProjectNumbers = useCallback(async () => {
    if (!projectId) return;
    setLoadingProject(true);
    try {
      const res = await SmsService.getProjectSenderNumbers({ page: 1, limit: 100 });
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
      const res = await SmsService.getMemberSenderNumbers({ page: 1, limit: 100 });
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
    if (!confirm("이 발신번호를 삭제하시겠습니까?")) return;
    // TODO: API 연동 후 구현
    alert("발신번호 삭제 API가 아직 구현되지 않았습니다.");
  };

  const handleDeleteMemberNumber = async (id: number) => {
    if (!confirm("이 발신번호를 삭제하시겠습니까?")) return;
    // TODO: API 연동 후 구현
    alert("발신번호 삭제 API가 아직 구현되지 않았습니다.");
  };

  // 추가 핸들러 (TODO: 모달 구현)
  const handleAddProjectNumber = () => {
    // TODO: 발신번호 추가 모달 구현
    alert("발신번호 추가 기능이 아직 구현되지 않았습니다.");
  };

  const handleAddMemberNumber = () => {
    // TODO: 발신번호 추가 모달 구현
    alert("발신번호 추가 기능이 아직 구현되지 않았습니다.");
  };

  // 날짜 포맷팅
  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString("ko-KR", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      }).replace(/\. /g, "-").replace(".", "");
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="bg-card rounded-[14px] pb-7">
      {/* Title */}
      <h1 className="px-7 text-[24px] font-bold text-neutral-90 h-[76px] flex items-center">
        발신번호 등록
      </h1>

      {showProjectMissing ? (
        <div className="flex items-center justify-center h-40 text-[14px] text-neutral-60">
          프로젝트를 먼저 선택해주세요.
        </div>
      ) : (
        <div className="px-7">
          {/* 공통 발신번호 섹션 */}
          <div className="mb-10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[16px] font-semibold text-neutral-90">
                공통 발신번호
              </h2>
              <button
                type="button"
                onClick={handleAddProjectNumber}
                className="h-[34px] px-4 rounded-[5px] bg-neutral-90 text-[14px] font-semibold text-white hover:bg-neutral-80 transition-colors"
              >
                +발신번호 추가
              </button>
            </div>

            {/* 테이블 헤더 */}
            <div className="bg-[#EDEDED] rounded-[8px] px-6 h-[40px] flex items-center mb-1">
              <div className="flex-1 text-[14px] font-medium text-neutral-60">
                발신번호
              </div>
              <div className="w-[120px] text-[14px] font-medium text-neutral-60">
                상태
              </div>
              <div className="w-[60px]"></div>
            </div>

            {/* 테이블 바디 */}
            {loadingProject ? (
              <div className="flex items-center justify-center h-32 text-[14px] text-neutral-60">
                로딩 중...
              </div>
            ) : projectNumbers.length === 0 ? (
              <div className="flex items-center justify-center h-32 text-[14px] text-neutral-60 border border-dashed border-neutral-30 rounded-[10px] mt-2">
                등록된 공통 발신번호가 없습니다.
              </div>
            ) : (
              <div className="divide-y divide-neutral-20">
                {projectNumbers.map((num) => (
                  <div
                    key={num.id}
                    className="px-6 h-[52px] flex items-center hover:bg-neutral-10 transition-colors"
                  >
                    <div className="flex-1 text-[14px] text-neutral-90">
                      {num.number}
                    </div>
                    <div className="w-[120px] flex items-center">
                      <StatusBadge status={num.status as ProjectSenderNumberStatus} />
                      {num.status === "rejected" && (
                        <InfoIcon tooltip="서류 검토 결과 발신번호 등록이 거부되었습니다." />
                      )}
                    </div>
                    <div className="w-[60px] flex justify-end">
                      <DeleteButton
                        onClick={() => handleDeleteProjectNumber(num.id)}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 구분선 */}
          <div className="h-px bg-neutral-30 mb-8" />

          {/* 개인 발신번호 섹션 */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[16px] font-semibold text-neutral-90">
                개인 발신번호
              </h2>
              <button
                type="button"
                onClick={handleAddMemberNumber}
                className="h-[34px] px-4 rounded-[5px] bg-neutral-90 text-[14px] font-semibold text-white hover:bg-neutral-80 transition-colors"
              >
                +발신번호 추가
              </button>
            </div>

            {/* 테이블 헤더 */}
            <div className="bg-[#EDEDED] rounded-[8px] px-6 h-[40px] flex items-center mb-1">
              <div className="flex-1 text-[14px] font-medium text-neutral-60">
                발신번호
              </div>
              <div className="w-[180px] text-[14px] font-medium text-neutral-60">
                등록일
              </div>
              <div className="w-[60px]"></div>
            </div>

            {/* 테이블 바디 */}
            {loadingMember ? (
              <div className="flex items-center justify-center h-32 text-[14px] text-neutral-60">
                로딩 중...
              </div>
            ) : memberNumbers.length === 0 ? (
              <div className="flex items-center justify-center h-32 text-[14px] text-neutral-60 border border-dashed border-neutral-30 rounded-[10px] mt-2">
                등록된 개인 발신번호가 없습니다.
              </div>
            ) : (
              <div className="divide-y divide-neutral-20">
                {memberNumbers.map((num) => (
                  <div
                    key={num.id}
                    className="px-6 h-[52px] flex items-center hover:bg-neutral-10 transition-colors"
                  >
                    <div className="flex-1 text-[14px] text-neutral-90">
                      {num.phoneNumber}
                    </div>
                    <div className="w-[180px] text-[14px] text-neutral-60">
                      {formatDate(num.createdAt)}
                    </div>
                    <div className="w-[60px] flex justify-end">
                      <DeleteButton
                        onClick={() => handleDeleteMemberNumber(num.id)}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
