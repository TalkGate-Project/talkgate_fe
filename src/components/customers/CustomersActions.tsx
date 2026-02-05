import { useState } from "react";
import { CustomersBulkService } from "@/services/customersBulk";
import { showErrorModal } from "@/providers/ErrorFeedbackModalProvider";
import { showConfirmModal } from "@/lib/confirmModalEvents";
import CustomerShareModal from "@/components/customers/CustomerShareModal";
import CustomerExcelUploadModal from "@/components/customers/CustomerExcelUploadModal";

type CustomersActionsProps = {
  projectId: string;
  appliedFilters: any;
  selectedIds: number[];
  selectionMode: "page" | "all" | null;
  total: number;
  selectedCount: number;
  onUploadSuccess: () => void;
  onAssignOpen: () => void;
  onCreateOpen: () => void;
  onSmsOpen: () => void;
  onShareSuccess?: () => void;
  /** 데이터 제공자일 때만 파트너배정 버튼 표시 (기본 비노출) */
  isDataProvider?: boolean;
};

export default function CustomersActions({
  projectId,
  appliedFilters,
  selectedIds,
  selectionMode,
  total,
  selectedCount,
  onUploadSuccess,
  onAssignOpen,
  onCreateOpen,
  onSmsOpen,
  onShareSuccess,
  isDataProvider = false,
}: CustomersActionsProps) {
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [excelUploadModalOpen, setExcelUploadModalOpen] = useState(false);

  const handleExcelDownload = async () => {
    try {
      const exportQuery: Record<
        string,
        string | number | boolean | Array<string | number>
      > = {};
      const appliedForExport: any = appliedFilters;

      // API 스펙에 맞는 모든 필터 파라미터 전달 (page, limit 제외)
      if (appliedForExport.name) exportQuery.name = appliedForExport.name;
      if (appliedForExport.contact1)
        exportQuery.contact1 = appliedForExport.contact1;
      if (appliedForExport.contact2)
        exportQuery.contact2 = appliedForExport.contact2;
      if (appliedForExport.noteContent)
        exportQuery.noteContent = appliedForExport.noteContent;
      if (appliedForExport.assignType)
        exportQuery.assignType = appliedForExport.assignType;
      if (appliedForExport.teamId) exportQuery.teamId = appliedForExport.teamId;
      if (appliedForExport.memberId)
        exportQuery.memberId = appliedForExport.memberId;
      if (appliedForExport.applicationRoute)
        exportQuery.applicationRoute = appliedForExport.applicationRoute;
      if (appliedForExport.mediaCompany)
        exportQuery.mediaCompany = appliedForExport.mediaCompany;
      if (appliedForExport.site) exportQuery.site = appliedForExport.site;
      if (
        appliedForExport.categoryIds &&
        Array.isArray(appliedForExport.categoryIds) &&
        appliedForExport.categoryIds.length > 0
      ) {
        // null을 문자열 "null"로 변환하여 "일반" 카테고리를 나타냄
        exportQuery.categoryIds = appliedForExport.categoryIds.map(
          (id: number | null) => (id === null ? "null" : id)
        );
      }
      if (appliedForExport.applicationDateFrom)
        exportQuery.applicationDateFrom = appliedForExport.applicationDateFrom;
      if (appliedForExport.applicationDateTo)
        exportQuery.applicationDateTo = appliedForExport.applicationDateTo;
      if (appliedForExport.assignedAtFrom)
        exportQuery.assignedAtFrom = appliedForExport.assignedAtFrom;
      if (appliedForExport.assignedAtTo)
        exportQuery.assignedAtTo = appliedForExport.assignedAtTo;

      const blobRes = await CustomersBulkService.exportExcel({
        projectId,
        query: exportQuery,
      });
      const blob = blobRes.data;

      // Blob 크기 확인 (디버깅용)
      console.log("[Excel Download] Blob 수신:", {
        size: blob.size,
        type: blob.type,
      });

      if (blob.size < 100) {
        console.warn(
          "[Excel Download] ⚠️ Blob 크기가 너무 작습니다:",
          blob.size
        );
      }

      // Blob의 MIME 타입이 올바르게 설정되었는지 확인하고, 필요시 재생성
      const blobType =
        blob.type ||
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
      const finalBlob =
        blob.type === blobType ? blob : new Blob([blob], { type: blobType });

      // 파일명 생성: customer_YYYY-MM-DD_HH.xlsx 형식
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, "0");
      const day = String(now.getDate()).padStart(2, "0");
      const hour = String(now.getHours()).padStart(2, "0");
      const fileName = `customer_${year}-${month}-${day}_${hour}.xlsx`;

      const url = URL.createObjectURL(finalBlob);
      const a = document.createElement("a");
      a.href = url;
      // 한글 파일명 인코딩 처리
      a.download = fileName;
      // 파일명 인코딩을 위한 추가 처리
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error(err);
      showErrorModal({
        title: "오류 발생",
        headline: "다운로드에 실패했습니다. 잠시 후 다시 시도해주세요.",
        confirmText: "확인",
        cancelText: null,
        hideCancel: true,
      });
    }
  };

  return (
    <div className="w-full flex justify-between items-end md:items-center gap-2 md:gap-3">
      {/* 모바일: 고객등록, 일괄배정만 표시 (기존과 동일) */}
      <div className="md:hidden flex items-center gap-2">
        <button
          className="cursor-pointer h-[34px] px-4 rounded-[8px] bg-neutral-90 text-neutral-20 text-[14px] font-semibold tracking-[-0.02em]"
          onClick={onCreateOpen}
        >
          고객등록
        </button>
        <button
          className="cursor-pointer h-[34px] px-4 rounded-[8px] bg-neutral-90 text-neutral-20 text-[14px] font-semibold tracking-[-0.02em] disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={onAssignOpen}
          disabled={selectedIds.length === 0 && selectionMode !== "all"}
        >
          일괄배정
        </button>
      </div>
      <div className="md:hidden text-[11px] text-neutral-50">
        총 {total.toLocaleString()}건 ({selectedCount}개 선택)
      </div>

      {/* 데스크탑: 왼쪽 섹션(4버튼) + 오른쪽 섹션(엑셀 아이콘 2개), 같은 행 */}
      <div className="hidden md:flex md:flex-1 md:justify-between md:items-center md:min-w-0">
        <div className="flex items-center gap-3 flex-shrink-0">
          <button
            type="button"
            className="cursor-pointer h-[34px] px-3 rounded-[5px] bg-neutral-90 dark:bg-neutral-90 text-neutral-20 dark:text-neutral-25 text-[14px] font-semibold tracking-[-0.02em] inline-flex items-center justify-center gap-2 hover:opacity-90 dark:hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:opacity-50"
            onClick={onCreateOpen}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0" aria-hidden>
              <path d="M18 10C18 10 14.9526 10 13 10M15.5 12.3333V7.27778M11.3333 6.11111C11.3333 7.82933 9.84095 9.22222 8 9.22222C6.15905 9.22222 4.66667 7.82933 4.66667 6.11111C4.66667 4.39289 6.15905 3 8 3C9.84095 3 11.3333 4.39289 11.3333 6.11111ZM3 16.2222C3 13.6449 5.23858 11.5556 8 11.5556C10.7614 11.5556 13 13.6449 13 16.2222V17H3V16.2222Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span>고객등록</span>
          </button>
          <button
            type="button"
            className="cursor-pointer h-[34px] px-3 rounded-[5px] bg-neutral-90 dark:bg-neutral-90 text-neutral-20 dark:text-neutral-25 text-[14px] font-semibold tracking-[-0.02em] inline-flex items-center justify-center gap-2 hover:opacity-90 dark:hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:opacity-50"
            onClick={onAssignOpen}
            disabled={selectedIds.length === 0 && selectionMode !== "all"}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M8.03017 11.1363C7.73727 10.8434 7.2624 10.8434 6.96951 11.1363C6.67661 11.4292 6.67661 11.9041 6.96951 12.197L7.49984 11.6667L8.03017 11.1363ZM9.1665 13.3333L8.63617 13.8637C8.92907 14.1566 9.40394 14.1566 9.69683 13.8637L9.1665 13.3333ZM13.0302 10.5303C13.3231 10.2374 13.3231 9.76256 13.0302 9.46967C12.7373 9.17678 12.2624 9.17678 11.9695 9.46967L12.4998 10L13.0302 10.5303ZM15.8332 5.83333H15.0832V15.8333H15.8332H16.5832V5.83333H15.8332ZM14.1665 17.5V16.75H5.83317V17.5V18.25H14.1665V17.5ZM4.1665 15.8333H4.9165V5.83333H4.1665H3.4165V15.8333H4.1665ZM5.83317 4.16667V4.91667H7.49984V4.16667V3.41667H5.83317V4.16667ZM12.4998 4.16667V4.91667H14.1665V4.16667V3.41667H12.4998V4.16667ZM5.83317 17.5V16.75C5.32691 16.75 4.9165 16.3396 4.9165 15.8333H4.1665H3.4165C3.4165 17.168 4.49848 18.25 5.83317 18.25V17.5ZM15.8332 15.8333H15.0832C15.0832 16.3396 14.6728 16.75 14.1665 16.75V17.5V18.25C15.5012 18.25 16.5832 17.168 16.5832 15.8333H15.8332ZM15.8332 5.83333H16.5832C16.5832 4.49865 15.5012 3.41667 14.1665 3.41667V4.16667V4.91667C14.6728 4.91667 15.0832 5.32707 15.0832 5.83333H15.8332ZM4.1665 5.83333H4.9165C4.9165 5.32707 5.32691 4.91667 5.83317 4.91667V4.16667V3.41667C4.49848 3.41667 3.4165 4.49865 3.4165 5.83333H4.1665ZM7.49984 11.6667L6.96951 12.197L8.63617 13.8637L9.1665 13.3333L9.69683 12.803L8.03017 11.1363L7.49984 11.6667ZM9.1665 13.3333L9.69683 13.8637L13.0302 10.5303L12.4998 10L11.9695 9.46967L8.63617 12.803L9.1665 13.3333ZM9.1665 2.5V3.25H10.8332V2.5V1.75H9.1665V2.5ZM10.8332 5.83333V5.08333H9.1665V5.83333V6.58333H10.8332V5.83333ZM9.1665 5.83333V5.08333C8.66024 5.08333 8.24984 4.67293 8.24984 4.16667H7.49984H6.74984C6.74984 5.50135 7.83182 6.58333 9.1665 6.58333V5.83333ZM12.4998 4.16667H11.7498C11.7498 4.67293 11.3394 5.08333 10.8332 5.08333V5.83333V6.58333C12.1679 6.58333 13.2498 5.50135 13.2498 4.16667H12.4998ZM10.8332 2.5V3.25C11.3394 3.25 11.7498 3.66041 11.7498 4.16667H12.4998H13.2498C13.2498 2.83198 12.1679 1.75 10.8332 1.75V2.5ZM9.1665 2.5V1.75C7.83182 1.75 6.74984 2.83198 6.74984 4.16667H7.49984H8.24984C8.24984 3.66041 8.66024 3.25 9.1665 3.25V2.5Z" fill="currentColor" />
            </svg>
            <span>직원배정</span>
          </button>
          {isDataProvider && (
            <button
              type="button"
              className="cursor-pointer h-[34px] px-3 rounded-[5px] bg-neutral-90 dark:bg-neutral-90 text-neutral-20 dark:text-neutral-25 text-[14px] font-semibold tracking-[-0.02em] inline-flex items-center justify-center gap-2 hover:opacity-90 dark:hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:opacity-50"
              onClick={() => setShareModalOpen(true)}
              disabled={selectedIds.length === 0 && selectionMode !== "all"}
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M6.66683 4.16667H5.00016C4.07969 4.16667 3.3335 4.91286 3.3335 5.83333V15.8333C3.3335 16.7538 4.07969 17.5 5.00016 17.5H13.3335C14.254 17.5 15.0002 16.7538 15.0002 15.8333V15M6.66683 4.16667C6.66683 5.08714 7.41302 5.83333 8.3335 5.83333H10.0002C10.9206 5.83333 11.6668 5.08714 11.6668 4.16667M6.66683 4.16667C6.66683 3.24619 7.41302 2.5 8.3335 2.5H10.0002C10.9206 2.5 11.6668 3.24619 11.6668 4.16667M11.6668 4.16667H13.3335C14.254 4.16667 15.0002 4.91286 15.0002 5.83333V8.33333M16.6668 11.6667H8.3335M8.3335 11.6667L10.8335 9.16667M8.3335 11.6667L10.8335 14.1667" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span>파트너배정</span>
            </button>
          )}
          <button
            type="button"
            className="cursor-pointer h-[34px] px-3 rounded-[5px] bg-neutral-90 dark:bg-neutral-90 text-neutral-20 dark:text-neutral-25 text-[14px] font-semibold tracking-[-0.02em] inline-flex items-center justify-center gap-2 hover:opacity-90 dark:hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:opacity-50"
            onClick={onSmsOpen}
            disabled={selectedIds.length === 0 && selectionMode !== "all"}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0" aria-hidden>
              <path d="M5.83333 6.66665H14.1667M5.83333 9.99998H9.16667M10 16.6666L6.66667 13.3333H4.16667C3.24619 13.3333 2.5 12.5871 2.5 11.6666V4.99998C2.5 4.07951 3.24619 3.33331 4.16667 3.33331H15.8333C16.7538 3.33331 17.5 4.07951 17.5 4.99998V11.6666C17.5 12.5871 16.7538 13.3333 15.8333 13.3333H13.3333L10 16.6666Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span>문자전송</span>
          </button>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            type="button"
            onClick={() => setExcelUploadModalOpen(true)}
            className="cursor-pointer w-9 h-9 flex items-center justify-center rounded-[5px] hover:bg-neutral-10 dark:hover:bg-neutral-20 transition-colors text-neutral-50 dark:text-neutral-50"
            aria-label="엑셀 업로드"
          >
            <svg width="24" height="24" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
              <path
                d="M5.33301 21.3334L5.33301 22.6667C5.33301 24.8758 7.12387 26.6667 9.33301 26.6667L22.6663 26.6667C24.8755 26.6667 26.6663 24.8758 26.6663 22.6667L26.6663 21.3334M21.333 10.6667L15.9997 5.33335M15.9997 5.33335L10.6663 10.6667M15.9997 5.33335L15.9997 21.3334"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => {
              showConfirmModal({
                type: "info",
                title: "",
                headline: "현재 고객목록을 엑셀로 변환할까요?",
                message: "다운로드는 한 번에 최대 5,000건까지만 가능해요.",
                confirmText: "확인",
                cancelText: "취소",
                onConfirm: handleExcelDownload,
              });
            }}
            className="cursor-pointer w-9 h-9 flex items-center justify-center rounded-[5px] hover:bg-neutral-10 dark:hover:bg-neutral-20 transition-colors text-neutral-50 dark:text-neutral-50"
            aria-label="엑셀 다운로드"
          >
            <svg width="24" height="24" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
              <path
                d="M5.33301 21.3334L5.33301 22.6667C5.33301 24.8758 7.12387 26.6667 9.33301 26.6667L22.6663 26.6667C24.8755 26.6667 26.6663 24.8758 26.6663 22.6667L26.6663 21.3334M21.333 16L15.9997 21.3334M15.9997 21.3334L10.6663 16M15.9997 21.3334L15.9997 5.33335"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      </div>

      <CustomerShareModal
        isOpen={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        onSuccess={onShareSuccess}
        projectId={projectId}
        selectedIds={selectedIds}
        selectionMode={selectionMode}
        appliedFilters={appliedFilters}
        selectedCount={selectionMode === "all" ? total : selectedIds.length}
      />

      <CustomerExcelUploadModal
        isOpen={excelUploadModalOpen}
        onClose={() => setExcelUploadModalOpen(false)}
        projectId={projectId}
        onUploadSuccess={onUploadSuccess}
      />
    </div>
  );
}
