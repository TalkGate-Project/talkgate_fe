"use client";

import { useState, useMemo } from "react";
import Pagination from "@/components/common/Pagination";
import Tooltip from "@/components/common/Tooltip";
import { showConfirmModal } from "@/lib/confirmModalEvents";
import { showErrorModal } from "@/providers/ErrorFeedbackModalProvider";

/** API 연동 시 사용할 타입 – 현재는 더미 데이터용 */
export type PartnerItem = {
  id: number;
  projectName: string;
  remark: string;
};

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

/** 더미 데이터 – 추후 API 목록으로 교체 */
const DUMMY_PARTNERS: PartnerItem[] = [
  { id: 1, projectName: "api", remark: "api.techflow.io api.techflow.io" },
  { id: 2, projectName: "dev", remark: "forum.pixelart.net" },
  { id: 3, projectName: "admin어드민", remark: "https://wiki.pixelartmentpage.net" },
  { id: 4, projectName: "status 프로젝트용", remark: "https://alivedev.mentmantelive.pixelart.net" },
  { id: 5, projectName: "G-story", remark: "https://wiki.pixelartmexxntpage.net" },
  { id: 6, projectName: "Kim.sales", remark: "https://wiki.pixelartmentpage.net" },
  { id: 7, projectName: "forum", remark: "https://wiki.pixelartpixelart.net" },
];

const PAGE_SIZE = 10;

export default function PartnerRegistrationSettings() {
  const [page, setPage] = useState(1);
  // 추후 API 연동 시: list를 API 응답으로 교체
  const [partners, setPartners] = useState<PartnerItem[]>(DUMMY_PARTNERS);

  const totalPages = Math.max(1, Math.ceil(partners.length / PAGE_SIZE));
  const paginatedPartners = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return partners.slice(start, start + PAGE_SIZE);
  }, [partners, page]);

  const handleEdit = (item: PartnerItem) => {
    // TODO: API 연동 시 수정 모달 또는 페이지로 이동
    console.log("Edit partner:", item);
  };

  const handleDelete = (item: PartnerItem) => {
    showConfirmModal({
      title: "파트너 삭제",
      message: `"${item.projectName}"을(를) 삭제하시겠습니까?`,
      confirmText: "삭제",
      onConfirm: () => {
        setPartners((prev) => prev.filter((p) => p.id !== item.id));
        showErrorModal({
          type: "success",
          headline: "삭제되었습니다.",
          hideCancel: true,
          confirmText: "확인",
        });
      },
    });
  };

  const handleRegisterCompany = () => {
    // TODO: API 연동 시 업체등록 모달 또는 페이지
    console.log("업체등록");
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

      <div className="w-full h-[1px] bg-neutral-30 opacity-70" />

      {/* 테이블 헤더 (데스크탑) – 프로젝트명 열 좁게, 비고 열 넓게, 세로 라인 맞춤 */}
      <div className="hidden md:flex mx-7 bg-neutral-20 dark:bg-neutral-20 rounded-[8px] pl-10 pr-4 h-[40px] items-center gap-3 mt-4">
        <div className="w-[120px] md:w-[140px] flex-shrink-0 text-[16px] font-medium text-neutral-60 dark:text-neutral-60 leading-[19px]">
          프로젝트명
        </div>
        <div className="flex-1 min-w-0 text-[16px] font-medium text-neutral-60 dark:text-neutral-60 leading-[19px]">
          비고
        </div>
        <div className="flex-shrink-0 w-[88px] md:w-[100px] lg:w-[116px] xl:w-[132px] text-[16px] font-medium text-neutral-60 dark:text-neutral-60 leading-[19px]" />
      </div>

      {/* 목록 */}
      <div className="px-4 md:px-7 pt-2 flex flex-col">
        {paginatedPartners.length === 0 ? (
          <div className="flex items-center justify-center py-12 text-[14px] text-neutral-60">
            등록된 파트너가 없습니다.
          </div>
        ) : (
          <div className="space-y-0">
            {paginatedPartners.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-2 md:gap-3 py-3 md:py-4 px-4 md:pl-10 md:pr-4 border-b border-neutral-30/50 last:border-b-0"
              >
                <div className="w-[120px] md:w-[140px] flex-shrink-0 text-[14px] font-medium text-foreground truncate">
                  {item.projectName}
                </div>
                <div className="flex-1 min-w-0 text-[14px] text-neutral-70 truncate">
                  {item.remark}
                </div>
                {/* 수정·삭제 버튼: HD/웹에서 약 52px, 작은 화면에서 비율에 맞게 축소 */}
                <div className="flex items-center flex-shrink-0 gap-3 min-[480px]:gap-4 sm:gap-5 md:gap-6 lg:gap-8 xl:gap-[52px]">

                  <button
                    type="button"
                    onClick={() => handleEdit(item)}
                    className="cursor-pointer w-8 h-8 min-w-8 min-h-8 flex items-center justify-center rounded-[5px] hover:bg-neutral-10 dark:hover:bg-neutral-30 transition-colors"
                    aria-label="수정"
                  >
                    <EditIcon />
                  </button>
                  <DeleteButton onClick={() => handleDelete(item)} />
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
