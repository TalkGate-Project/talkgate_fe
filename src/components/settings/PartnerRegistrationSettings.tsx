"use client";

import { useState, useEffect, useCallback } from "react";
import { useSelectedProjectId } from "@/hooks/useSelectedProjectId";
import Pagination from "@/components/common/Pagination";
import { showConfirmModal } from "@/lib/confirmModalEvents";
import { showErrorModal } from "@/providers/ErrorFeedbackModalProvider";
import PartnerRegisterModal from "./PartnerRegisterModal";
import { ProjectPartnersService } from "@/services/projectPartners";
import type { ProjectPartner, ProjectPartnerStatus } from "@/types/projectPartners";

/** 상태 칩: 수락(Primary-10/80), 대기(Warning-10/60), 거절(Error-10/40) */
function PartnerStatusBadge({ status }: { status: ProjectPartnerStatus }) {
  const config: Record<
    ProjectPartnerStatus,
    { label: string; bg: string; text: string }
  > = {
    approved: { label: "수락", bg: "#D6FAE8", text: "#00B55B" },
    pending: { label: "대기", bg: "#FFF5D5", text: "#976400" },
    rejected: { label: "거절", bg: "#FFEBEB", text: "#D83232" },
  };
  const { label, bg, text } = config[status] ?? {
    label: status,
    bg: "#F5F5F5",
    text: "#595959",
  };
  return (
    <span
      className="inline-flex items-center justify-center rounded-[30px] py-1 px-3 text-[12px] font-medium leading-[14px] whitespace-nowrap"
      style={{ background: bg }}
      aria-label={label}
    >
      <span style={{ color: text, opacity: 0.8 }}>{label}</span>
    </span>
  );
}

/** 수정 버튼 아이콘 (stroke #B0B0B0) */
function EditIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <path
        d="M11 5H6C4.89543 5 4 5.89543 4 7V18C4 19.1046 4.89543 20 6 20H17C18.1046 20 19 19.1046 19 18V13M17.5858 3.58579C18.3668 2.80474 19.6332 2.80474 20.4142 3.58579C21.1953 4.36683 21.1953 5.63316 20.4142 6.41421L11.8284 15H9L9 12.1716L17.5858 3.58579Z"
        stroke="#B0B0B0"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** 삭제 버튼 – 발신번호 등록 페이지와 동일한 32px 버튼 + 24px 아이콘 */
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
      className="cursor-pointer w-8 h-8 min-w-8 min-h-8 flex items-center justify-center rounded-[5px] hover:bg-neutral-10 dark:hover:bg-neutral-30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      aria-label="삭제"
    >
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden
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

const PAGE_SIZE = 10;

export default function PartnerRegistrationSettings() {
  const [projectId] = useSelectedProjectId();
  const [page, setPage] = useState(1);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [partners, setPartners] = useState<ProjectPartner[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const fetchPartners = useCallback(async () => {
    if (!projectId) {
      setPartners([]);
      setTotalPages(1);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await ProjectPartnersService.list(
        { page, limit: PAGE_SIZE },
        { "x-project-id": projectId }
      );
      const data = res.data?.data;
      if (data) {
        setPartners(data.list ?? []);
        setTotalPages(Math.max(1, data.totalPages ?? 1));
      } else {
        setPartners([]);
        setTotalPages(1);
      }
    } catch {
      setPartners([]);
      setTotalPages(1);
      showErrorModal({
        type: "error",
        headline: "파트너 목록을 불러오는데 실패했습니다.",
        hideCancel: true,
      });
    } finally {
      setLoading(false);
    }
  }, [projectId, page]);

  useEffect(() => {
    fetchPartners();
  }, [fetchPartners]);

  const handleEdit = (item: ProjectPartner) => {
    // TODO: 수정 API/모달 연동 시 구현
    console.log("Edit partner:", item);
  };

  const handleDelete = (item: ProjectPartner) => {
    showConfirmModal({
      title: "파트너 삭제",
      message: `"${item.partnerProjectName}"을(를) 삭제하시겠습니까?`,
      confirmText: "삭제",
      onConfirm: async () => {
        if (!projectId) return;
        setDeletingId(item.id);
        try {
          await ProjectPartnersService.remove(item.id, { "x-project-id": projectId });
          showErrorModal({
            type: "success",
            headline: "삭제되었습니다.",
            hideCancel: true,
            confirmText: "확인",
          });
          await fetchPartners();
        } catch {
          showErrorModal({
            type: "error",
            headline: "삭제에 실패했습니다.",
            hideCancel: true,
          });
        } finally {
          setDeletingId(null);
        }
      },
    });
  };

  const handleRegisterCompany = () => {
    setIsRegisterModalOpen(true);
  };

  const handlePartnerRegisterSuccess = () => {
    fetchPartners();
  };

  return (
    <div className="bg-card rounded-[14px] lg:rounded-[14px] rounded-t-none lg:rounded-t-[14px] pb-4 md:pb-7 flex flex-col">
      {/* 헤더: 제목 + 업체등록 버튼 */}
      <div className="flex items-center justify-between px-4 md:px-7 h-[64px] md:h-[76px]">
        <h1 className="text-[20px] md:text-[24px] font-bold text-foreground leading-[1]">
          파트너등록
        </h1>
        <button
          type="button"
          onClick={handleRegisterCompany}
          className="cursor-pointer h-[34px] px-3 md:px-4 rounded-[5px] bg-neutral-90 dark:bg-neutral-80 text-[13px] md:text-[14px] font-semibold text-neutral-0 hover:opacity-90 flex-shrink-0 whitespace-nowrap"
        >
          업체등록
        </button>
      </div>

      <PartnerRegisterModal
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
        projectId={projectId ?? ""}
        onSuccess={handlePartnerRegisterSuccess}
      />

      <div className="w-full h-[1px] bg-neutral-30 opacity-70" />

      {/* 테이블 헤더 (데스크탑) – 프로젝트명, 비고, 상태, 액션. 열 너비·갭·패딩을 본문과 동일하게 */}
      <div className="hidden md:flex mx-4 md:mx-7 bg-neutral-20 dark:bg-neutral-20 rounded-[8px] mt-4 h-[40px] items-center pl-4 md:pl-10 pr-4 gap-3">
        <div className="w-[120px] md:w-[140px] flex-shrink-0 text-[16px] font-medium text-neutral-60 dark:text-neutral-60 leading-[19px]">
          프로젝트명
        </div>
        <div className="flex-1 min-w-0 text-[16px] font-medium text-neutral-60 dark:text-neutral-60 leading-[19px]">
          설명
        </div>
        <div className="w-[72px] flex-shrink-0 text-[16px] font-medium text-neutral-60 dark:text-neutral-60 leading-[19px]">
          상태
        </div>
        <div className="w-[88px] md:w-[100px] lg:w-[116px] xl:w-[132px] flex-shrink-0 text-[16px] font-medium text-neutral-60 dark:text-neutral-60 leading-[19px]" />
      </div>

      {/* 목록 – 헤더와 동일한 열 너비·갭·패딩으로 정렬 */}
      <div className="px-4 md:px-7 pt-2 flex flex-col">
        {loading ? (
          <div className="flex items-center justify-center py-12 text-[14px] text-neutral-60">
            불러오는 중...
          </div>
        ) : partners.length === 0 ? (
          <div className="flex items-center justify-center py-12 text-[14px] text-neutral-60">
            등록된 파트너가 없습니다.
          </div>
        ) : (
          <div className="space-y-0">
            {partners.map((item) => (
              <div
                key={item.id}
                className="flex items-center pl-4 md:pl-10 pr-4 gap-3 py-3 md:py-4 border-b border-neutral-30/50 last:border-b-0"
              >
                <div className="w-[120px] md:w-[140px] flex-shrink-0 text-[14px] font-medium text-foreground truncate">
                  {item.partnerProjectName}
                </div>
                <div className="flex-1 min-w-0 text-[14px] text-neutral-70 truncate">
                  {item.description}
                </div>
                <div className="w-[72px] flex-shrink-0 flex items-center">
                  <PartnerStatusBadge status={item.status} />
                </div>
                <div className="w-[88px] md:w-[100px] lg:w-[116px] xl:w-[132px] flex-shrink-0 flex items-center justify-end gap-2 md:gap-12">
                  <button
                    type="button"
                    onClick={() => handleEdit(item)}
                    className="cursor-pointer w-8 h-8 min-w-8 min-h-8 flex items-center justify-center rounded-[5px] hover:bg-neutral-10 dark:hover:bg-neutral-30 transition-colors"
                    aria-label="수정"
                  >
                    <EditIcon />
                  </button>
                  <DeleteButton
                    onClick={() => handleDelete(item)}
                    disabled={deletingId === item.id}
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 페이지네이션 – 데이터 없을 때도 표시, 기본 1페이지 */}
        <div className="flex justify-center mt-6">
          <Pagination
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </div>
      </div>
    </div>
  );
}
