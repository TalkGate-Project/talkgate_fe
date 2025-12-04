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
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M19 7L18.1327 19.1425C18.0579 20.1891 17.187 21 16.1378 21H7.86224C6.81296 21 5.94208 20.1891 5.86732 19.1425L5 7M10 11V17M14 11V17M15 7V4C15 3.44772 14.5523 3 14 3H10C9.44772 3 9 3.44772 9 4V7M4 7H20"
          stroke="#B0B0B0"
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
  const [projectNumbers, setProjectNumbers] = useState<ProjectSenderNumber[]>(
    []
  );
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

  return (
    <div className="bg-card rounded-[14px] pb-7">
      {/* Title */}
      <h1 className="px-7 text-[24px] font-bold text-neutral-90 h-[76px] flex items-center border-b border-[#E2E2E2]">
        발신번호 등록
      </h1>

      {showProjectMissing ? (
        <div className="flex items-center justify-center h-40 text-[14px] text-neutral-60">
          프로젝트를 먼저 선택해주세요.
        </div>
      ) : (
        <div className="px-7 pt-[23px]">
          {/* 공통 발신번호 섹션 */}
          <div className="mb-[30px]">
            <div className="flex items-center justify-between mb-4 border-b border-[#E2E2E2] pb-3">
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
            <div className="bg-[#EDEDED] rounded-[8px] px-10 h-[40px] flex items-center mb-1">
              <div className="flex-1 text-[14px] font-medium text-neutral-60">
                발신번호
              </div>
              <div className="flex-1 text-[14px] font-medium text-neutral-60">
                상태
              </div>
              <div className="w-[160px]"></div>
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
              <div className="divide-y divide-[#E2E2E266]">
                {projectNumbers.map((num) => (
                  <div
                    key={num.id}
                    className="px-10 h-[52px] flex items-center hover:bg-neutral-10 transition-colors"
                  >
                    <div className="flex-1 text-[14px] text-neutral-90">
                      {num.number}
                    </div>
                    <div className="flex-1 flex items-center">
                      <StatusBadge
                        status={num.status as ProjectSenderNumberStatus}
                      />
                      {num.status === "rejected" && (
                        <InfoIcon tooltip="서류 검토 결과 발신번호 등록이 거부되었습니다." />
                      )}
                    </div>
                    <div className="w-[160px] flex justify-end">
                      <DeleteButton
                        onClick={() => handleDeleteProjectNumber(num.id)}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>



          {/* 개인 발신번호 섹션 */}
          <div>
            <div className="flex items-center justify-between mb-4 border-b border-[#E2E2E2] pb-3">
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
            <div className="bg-[#EDEDED] rounded-[8px] px-10 h-[40px] flex items-center mb-1">
              <div className="flex-1 text-[14px] font-medium text-neutral-60">
                발신번호
              </div>
              <div className="flex-1 text-[14px] font-medium text-neutral-60">
                등록일
              </div>
              <div className="w-[160px]"></div>
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
              <div className="divide-y divide-[#E2E2E266]">
                {memberNumbers.map((num) => (
                  <div
                    key={num.id}
                    className="px-10 h-[52px] flex items-center hover:bg-neutral-10 transition-colors"
                  >
                    <div className="flex-1 text-[14px] text-neutral-90">
                      {num.phoneNumber}
                    </div>
                    <div className="flex-1 text-[14px] text-neutral-60">
                      {formatDate(num.createdAt)}
                    </div>
                    <div className="w-[160px] flex justify-end">
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
