import { useEffect, useRef, useState } from "react";
import { CustomersBulkService } from "@/services/customersBulk";
import { CustomersService } from "@/services/customers";
import { showErrorModal } from "@/providers/ErrorFeedbackModalProvider";
import { showConfirmModal } from "@/lib/confirmModalEvents";
import CustomerShareModal from "@/components/customers/CustomerShareModal";
import CustomerExcelUploadModal from "@/components/customers/CustomerExcelUploadModal";
import BulkCategoryChangeModal from "@/components/customers/BulkCategoryChangeModal";
import type { DeleteCustomersFilterConditions } from "@/types/customers";

export type CustomersActionsProps = {
  projectId: string;
  appliedFilters: any;
  selectedIds: number[];
  selectionMode: "page" | "all" | null;
  total: number;
  selectedCount: number;
  limit: number;
  onLimitChange: (limit: number) => void;
  onUploadSuccess: () => void;
  onAssignOpen: () => void;
  onCreateOpen: () => void;
  onSmsOpen: () => void;
  onBulkScheduleOpen: () => void;
  onShareSuccess?: () => void;
  onDeleteSuccess?: () => void;
  onCategoryChangeSuccess?: () => void;
  /** 데이터 제공자 프로젝트일 때만 파트너배정 버튼 노출 조건에 포함 (기본 false) */
  isDataProvider?: boolean;
  /** 어드민/서브어드민일 때만 파트너배정 버튼 표시 (isDataProvider && admin|subAdmin 권한, 기본 비노출) */
  showPartnerAssignButton?: boolean;
  /** role이 member가 아닐 때만 직원배정 버튼 표시 (기본 true) */
  showAssignButton?: boolean;
  /** admin/subAdmin일 때만 삭제 버튼 표시 */
  showDeleteButton?: boolean;
  /** admin/subAdmin일 때만 엑셀 업로드 버튼 표시 */
  showExcelUploadButton?: boolean;
  /** admin/subAdmin일 때만 엑셀 다운로드 버튼 표시 */
  showExcelDownloadButton?: boolean;
};

function LocalIconTooltip({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="relative inline-flex group">
      {children}
      {/* -top-9(36px)는 버튼 높이와 딱 맞아떨어져 툴팁이 버튼에 거의 붙어 보였다 —
          4px 더 띄워 여백을 둔다. */}
      <div className="pointer-events-none absolute left-1/2 -translate-x-1/2 -top-10 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="rounded-[8px] bg-card border border-border px-3 py-2 text-[12px] text-foreground shadow-lg whitespace-nowrap">
          {label}
        </div>
      </div>
    </div>
  );
}

function buildDeleteFilterConditions(
  appliedFilters?: Record<string, unknown>
): DeleteCustomersFilterConditions {
  if (!appliedFilters || Object.keys(appliedFilters).length === 0) {
    return {};
  }

  const f = appliedFilters as Record<string, unknown>;
  const conditions: DeleteCustomersFilterConditions = {};

  if (typeof f.name === "string") conditions.name = f.name;
  if (typeof f.contact1 === "string") conditions.contact1 = f.contact1;
  if (typeof f.contact2 === "string") conditions.contact2 = f.contact2;
  if (typeof f.noteContent === "string") conditions.noteContent = f.noteContent;
  if (f.assignType != null) conditions.assignType = String(f.assignType);
  if (typeof f.apiKeyId === "number") conditions.apiKeyId = f.apiKeyId;
  if (typeof f.teamId === "number") conditions.teamId = f.teamId;
  if (typeof f.memberId === "number") conditions.memberId = f.memberId;
  if (typeof f.applicationRoute === "string") conditions.applicationRoute = f.applicationRoute;
  if (typeof f.mediaCompany === "string") conditions.mediaCompany = f.mediaCompany;
  if (typeof f.site === "string") conditions.site = f.site;
  if (Array.isArray(f.categoryIds)) {
    conditions.categoryIds = f.categoryIds.map((id) => (id === null ? "null" : id)) as (
      | number
      | string
    )[];
  }
  if (typeof f.applicationDateFrom === "string") conditions.applicationDateFrom = f.applicationDateFrom;
  if (typeof f.applicationDateTo === "string") conditions.applicationDateTo = f.applicationDateTo;
  if (typeof f.assignedAtFrom === "string") conditions.assignedAtFrom = f.assignedAtFrom;
  if (typeof f.assignedAtTo === "string") conditions.assignedAtTo = f.assignedAtTo;
  if (typeof f.projectPartnerId === "number") conditions.projectPartnerId = f.projectPartnerId;

  return Object.keys(conditions).length > 0 ? conditions : {};
}

export default function CustomersActions({
  projectId,
  appliedFilters,
  selectedIds,
  selectionMode,
  total,
  selectedCount,
  limit,
  onLimitChange,
  onUploadSuccess,
  onAssignOpen,
  onCreateOpen,
  onSmsOpen,
  onBulkScheduleOpen,
  onShareSuccess,
  onDeleteSuccess,
  onCategoryChangeSuccess,
  isDataProvider: _isDataProvider = false,
  showPartnerAssignButton = false,
  showAssignButton = true,
  showDeleteButton = true,
  showExcelUploadButton = true,
  showExcelDownloadButton = true,
}: CustomersActionsProps) {
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [excelUploadModalOpen, setExcelUploadModalOpen] = useState(false);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [limitPopoverOpen, setLimitPopoverOpen] = useState(false);
  const [actionsMenuOpen, setActionsMenuOpen] = useState(false);
  const desktopLimitPopoverRef = useRef<HTMLDivElement | null>(null);
  const mobileLimitPopoverRef = useRef<HTMLDivElement | null>(null);
  const actionsMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!actionsMenuOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (!actionsMenuRef.current?.contains(target)) {
        setActionsMenuOpen(false);
      }
    };

    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setActionsMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscapeKey);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscapeKey);
    };
  }, [actionsMenuOpen]);

  useEffect(() => {
    if (!limitPopoverOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const clickedDesktopPopover =
        desktopLimitPopoverRef.current?.contains(target) ?? false;
      const clickedMobilePopover =
        mobileLimitPopoverRef.current?.contains(target) ?? false;

      if (
        !clickedDesktopPopover &&
        !clickedMobilePopover
      ) {
        setLimitPopoverOpen(false);
      }
    };

    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setLimitPopoverOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscapeKey);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscapeKey);
    };
  }, [limitPopoverOpen]);

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
      if (appliedForExport.apiKeyId)
        exportQuery.apiKeyId = appliedForExport.apiKeyId;
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

  const hasSelection = selectedIds.length > 0 || selectionMode === "all";

  // 모든 벌크 액션이 동일한 선택 범위를 대상으로 한다 — 페이지 한도(limit)를 넘으면
  // 여러 페이지에 걸친 "전체 선택"이라 눈으로 다 확인하지 못한 채 실행될 위험이 커진다.
  const bulkTargetCount = selectionMode === "all" ? total : selectedIds.length;
  const OVER_LIMIT_CONFIRM_DELAY_SECONDS = 3;

  /**
   * 선택 범위가 현재 페이지 표시 한도를 넘을 때만(=전체선택으로 여러 페이지에 걸친 대상)
   * "전체 N건에 적용됩니다" 경고 + 3초 카운트다운 확인을 거치게 한다. 한 페이지 안에서
   * 눈으로 확인 가능한 선택이면 곧바로 진행한다. 직원배정/파트너배정/문자전송/일정추가/
   * 카테고리 변경이 공유하는 단일 게이트.
   */
  const confirmBulkActionIfNeeded = (proceed: () => void) => {
    if (bulkTargetCount <= limit) {
      proceed();
      return;
    }
    showConfirmModal({
      type: "caution",
      title: "전체 선택",
      headline: `전체 ${bulkTargetCount.toLocaleString()}건 항목에 적용됩니다.`,
      message: "계속 진행하시겠습니까?",
      confirmText: "확인",
      cancelText: "취소",
      confirmDelaySeconds: OVER_LIMIT_CONFIRM_DELAY_SECONDS,
      onConfirm: proceed,
    });
  };

  const handleAssignClick = () => confirmBulkActionIfNeeded(onAssignOpen);
  const handlePartnerAssignClick = () => confirmBulkActionIfNeeded(() => setShareModalOpen(true));
  const handleSmsClick = () => confirmBulkActionIfNeeded(onSmsOpen);
  const handleBulkScheduleClick = () => confirmBulkActionIfNeeded(onBulkScheduleOpen);

  const handleBulkDelete = () => {
    showConfirmModal({
      title: "고객 삭제",
      headline: `선택한 ${bulkTargetCount}명의 고객을 삭제하시겠습니까?`,
      message: "삭제된 고객 정보는 복구할 수 없습니다.",
      type: "warning",
      confirmText: "삭제",
      cancelText: "취소",
      // 전체선택으로 페이지 한도를 넘는 대량 삭제일 때만 카운트다운을 더한다 — 소수 선택
      // 삭제는 기존처럼 즉시 확인 가능해야 한다(불필요한 대기로 일상적 작업을 방해하지 않음).
      confirmDelaySeconds:
        bulkTargetCount > limit ? OVER_LIMIT_CONFIRM_DELAY_SECONDS : undefined,
      onConfirm: async () => {
        try {
          if (selectionMode === "all") {
            const filterConditions = buildDeleteFilterConditions(appliedFilters);
            await CustomersService.bulkDelete({
              projectId,
              deleteType: "filter",
              filterConditions,
              expectedCount: total,
            });
          } else {
            await CustomersService.bulkDelete({
              projectId,
              deleteType: "ids",
              customerIds: selectedIds,
            });
          }
          onDeleteSuccess?.();
        } catch {
          showErrorModal({
            title: "오류 발생",
            headline: "고객 삭제에 실패했습니다. 잠시 후 다시 시도해주세요.",
            confirmText: "확인",
            cancelText: null,
            hideCancel: true,
          });
        }
      },
    });
  };

  const handleCategoryClick = () => confirmBulkActionIfNeeded(() => setCategoryModalOpen(true));

  return (
    <div className="w-full flex justify-between items-start lg:items-center gap-2 lg:gap-3">
      {/* 모바일+태블릿(lg 미만): 좌측 액션 + 우측(삭제/페이지개수), 카운트는 하단 좌측.
          버튼 개수가 늘어나면서 태블릿 폭(md~lg)에서 데스크탑용 텍스트 버튼 행이 넘치게 돼
          태블릿도 이 컴팩트(아이콘 전용) 레이아웃을 그대로 쓰도록 범위를 넓혔다(2026-07-23). */}
      <div className="lg:hidden w-full flex flex-col gap-2">
        <div className="w-full flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <button
              type="button"
              className="cursor-pointer h-[34px] px-3 rounded-[5px] bg-neutral-90 dark:bg-neutral-90 text-neutral-20 dark:text-neutral-25 text-[13px] font-semibold tracking-[-0.02em] inline-flex items-center justify-center gap-1.5 hover:opacity-90 dark:hover:opacity-90 transition-opacity flex-shrink-0"
              onClick={onCreateOpen}
            >
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0" aria-hidden>
                <path d="M18 10C18 10 14.9526 10 13 10M15.5 12.3333V7.27778M11.3333 6.11111C11.3333 7.82933 9.84095 9.22222 8 9.22222C6.15905 9.22222 4.66667 7.82933 4.66667 6.11111C4.66667 4.39289 6.15905 3 8 3C9.84095 3 11.3333 4.39289 11.3333 6.11111ZM3 16.2222C3 13.6449 5.23858 11.5556 8 11.5556C10.7614 11.5556 13 13.6449 13 16.2222V17H3V16.2222Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span>고객등록</span>
            </button>
            <div className="relative flex-shrink-0" ref={actionsMenuRef}>
              <button
                type="button"
                className="cursor-pointer h-[34px] px-3 rounded-[5px] bg-neutral-90 dark:bg-neutral-90 text-neutral-20 dark:text-neutral-25 text-[13px] font-semibold tracking-[-0.02em] inline-flex items-center justify-center gap-1.5 hover:opacity-90 dark:hover:opacity-90 transition-opacity"
                onClick={() => setActionsMenuOpen((prev) => !prev)}
                aria-haspopup="menu"
                aria-expanded={actionsMenuOpen}
              >
                <span>선택항목 관리</span>
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 12 12"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className={`shrink-0 transition-transform ${actionsMenuOpen ? "rotate-180" : ""}`}
                  aria-hidden
                >
                  <path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              {actionsMenuOpen && (
                <div
                  role="menu"
                  className="absolute left-0 top-full mt-2 w-[140px] rounded-[8px] bg-neutral-90 dark:bg-neutral-90 shadow-[0px_8px_12px_rgba(9,30,66,0.1)] z-50 overflow-hidden py-1"
                >
                  {showAssignButton && (
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setActionsMenuOpen(false);
                        handleAssignClick();
                      }}
                      disabled={selectedIds.length === 0 && selectionMode !== "all"}
                      className="cursor-pointer w-full flex items-center gap-2 px-3 py-2.5 text-[14px] font-semibold tracking-[-0.02em] text-neutral-20 hover:bg-neutral-80 transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                    >
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0" aria-hidden>
                        <path d="M8.03017 11.1363C7.73727 10.8434 7.2624 10.8434 6.96951 11.1363C6.67661 11.4292 6.67661 11.9041 6.96951 12.197L7.49984 11.6667L8.03017 11.1363ZM9.1665 13.3333L8.63617 13.8637C8.92907 14.1566 9.40394 14.1566 9.69683 13.8637L9.1665 13.3333ZM13.0302 10.5303C13.3231 10.2374 13.3231 9.76256 13.0302 9.46967C12.7373 9.17678 12.2624 9.17678 11.9695 9.46967L12.4998 10L13.0302 10.5303ZM15.8332 5.83333H15.0832V15.8333H15.8332H16.5832V5.83333H15.8332ZM14.1665 17.5V16.75H5.83317V17.5V18.25H14.1665V17.5ZM4.1665 15.8333H4.9165V5.83333H4.1665H3.4165V15.8333H4.1665ZM5.83317 4.16667V4.91667H7.49984V4.16667V3.41667H5.83317V4.16667ZM12.4998 4.16667V4.91667H14.1665V4.16667V3.41667H12.4998V4.16667ZM5.83317 17.5V16.75C5.32691 16.75 4.9165 16.3396 4.9165 15.8333H4.1665H3.4165C3.4165 17.168 4.49848 18.25 5.83317 18.25V17.5ZM15.8332 15.8333H15.0832C15.0832 16.3396 14.6728 16.75 14.1665 16.75V17.5V18.25C15.5012 18.25 16.5832 17.168 16.5832 15.8333H15.8332ZM15.8332 5.83333H16.5832C16.5832 4.49865 15.5012 3.41667 14.1665 3.41667V4.16667V4.91667C14.6728 4.91667 15.0832 5.32707 15.0832 5.83333H15.8332ZM4.1665 5.83333H4.9165C4.9165 5.32707 5.32691 4.91667 5.83317 4.91667V4.16667V3.41667C4.49848 3.41667 3.4165 4.49865 3.4165 5.83333H4.1665ZM7.49984 11.6667L6.96951 12.197L8.63617 13.8637L9.1665 13.3333L9.69683 12.803L8.03017 11.1363L7.49984 11.6667ZM9.1665 13.3333L9.69683 13.8637L13.0302 10.5303L12.4998 10L11.9695 9.46967L8.63617 12.803L9.1665 13.3333ZM9.1665 2.5V3.25H10.8332V2.5V1.75H9.1665V2.5ZM10.8332 5.83333V5.08333H9.1665V5.83333V6.58333H10.8332V5.83333ZM9.1665 5.83333V5.08333C8.66024 5.08333 8.24984 4.67293 8.24984 4.16667H7.49984H6.74984C6.74984 5.50135 7.83182 6.58333 9.1665 6.58333V5.83333ZM12.4998 4.16667H11.7498C11.7498 4.67293 11.3394 5.08333 10.8332 5.08333V5.83333V6.58333C12.1679 6.58333 13.2498 5.50135 13.2498 4.16667H12.4998ZM10.8332 2.5V3.25C11.3394 3.25 11.7498 3.66041 11.7498 4.16667H12.4998H13.2498C13.2498 2.83198 12.1679 1.75 10.8332 1.75V2.5ZM9.1665 2.5V1.75C7.83182 1.75 6.74984 2.83198 6.74984 4.16667H7.49984H8.24984C8.24984 3.66041 8.66024 3.25 9.1665 3.25V2.5Z" fill="currentColor" />
                      </svg>
                      <span>직원배정</span>
                    </button>
                  )}
                  {showPartnerAssignButton && (
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setActionsMenuOpen(false);
                        handlePartnerAssignClick();
                      }}
                      disabled={selectedIds.length === 0 && selectionMode !== "all"}
                      className="cursor-pointer w-full flex items-center gap-2 px-3 py-2.5 text-[14px] font-semibold tracking-[-0.02em] text-neutral-20 hover:bg-neutral-80 transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                    >
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0" aria-hidden>
                        <path d="M6.66683 4.16667H5.00016C4.07969 4.16667 3.3335 4.91286 3.3335 5.83333V15.8333C3.3335 16.7538 4.07969 17.5 5.00016 17.5H13.3335C14.254 17.5 15.0002 16.7538 15.0002 15.8333V15M6.66683 4.16667C6.66683 5.08714 7.41302 5.83333 8.3335 5.83333H10.0002C10.9206 5.83333 11.6668 5.08714 11.6668 4.16667M6.66683 4.16667C6.66683 3.24619 7.41302 2.5 8.3335 2.5H10.0002C10.9206 2.5 11.6668 3.24619 11.6668 4.16667M11.6668 4.16667H13.3335C14.254 4.16667 15.0002 4.91286 15.0002 5.83333V8.33333M16.6668 11.6667H8.3335M8.3335 11.6667L10.8335 9.16667M8.3335 11.6667L10.8335 14.1667" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <span>파트너배정</span>
                    </button>
                  )}
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setActionsMenuOpen(false);
                      handleSmsClick();
                    }}
                    disabled={selectedIds.length === 0 && selectionMode !== "all"}
                    className="cursor-pointer w-full flex items-center gap-2 px-3 py-2.5 text-[14px] font-semibold tracking-[-0.02em] text-neutral-20 hover:bg-neutral-80 transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                  >
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0" aria-hidden>
                      <path d="M5.83333 6.66665H14.1667M5.83333 9.99998H9.16667M10 16.6666L6.66667 13.3333H4.16667C3.24619 13.3333 2.5 12.5871 2.5 11.6666V4.99998C2.5 4.07951 3.24619 3.33331 4.16667 3.33331H15.8333C16.7538 3.33331 17.5 4.07951 17.5 4.99998V11.6666C17.5 12.5871 16.7538 13.3333 15.8333 13.3333H13.3333L10 16.6666Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <span>문자전송</span>
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setActionsMenuOpen(false);
                      handleBulkScheduleClick();
                    }}
                    disabled={selectedIds.length === 0 && selectionMode !== "all"}
                    className="cursor-pointer w-full flex items-center gap-2 px-3 py-2.5 text-[14px] font-semibold tracking-[-0.02em] text-neutral-20 hover:bg-neutral-80 transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                  >
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0" aria-hidden>
                      <path d="M6.66667 5.83333V2.5M13.3333 5.83333V2.5M5.83333 9.16667H14.1667M4.16667 17.5H15.8333C16.7538 17.5 17.5 16.7538 17.5 15.8333V5.83333C17.5 4.91286 16.7538 4.16667 15.8333 4.16667H4.16667C3.24619 4.16667 2.5 4.91286 2.5 5.83333V15.8333C2.5 16.7538 3.24619 17.5 4.16667 17.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <span>일정추가</span>
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setActionsMenuOpen(false);
                      handleCategoryClick();
                    }}
                    disabled={selectedIds.length === 0 && selectionMode !== "all"}
                    className="cursor-pointer w-full flex items-center gap-2 px-3 py-2.5 text-[14px] font-semibold tracking-[-0.02em] text-neutral-20 hover:bg-neutral-80 transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                  >
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0" aria-hidden>
                      <path d="M3.33301 5.00016C3.33301 4.07969 4.0792 3.3335 4.99967 3.3335H6.66634C7.58682 3.3335 8.33301 4.07969 8.33301 5.00016V6.66683C8.33301 7.5873 7.58682 8.3335 6.66634 8.3335H4.99967C4.0792 8.3335 3.33301 7.5873 3.33301 6.66683V5.00016Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M11.6663 5.00016C11.6663 4.07969 12.4125 3.3335 13.333 3.3335H14.9997C15.9201 3.3335 16.6663 4.07969 16.6663 5.00016V6.66683C16.6663 7.5873 15.9201 8.3335 14.9997 8.3335H13.333C12.4125 8.3335 11.6663 7.5873 11.6663 6.66683V5.00016Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M3.33301 13.3335C3.33301 12.413 4.0792 11.6668 4.99967 11.6668H6.66634C7.58682 11.6668 8.33301 12.413 8.33301 13.3335V15.0002C8.33301 15.9206 7.58682 16.6668 6.66634 16.6668H4.99967C4.0792 16.6668 3.33301 15.9206 3.33301 15.0002V13.3335Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M11.6663 13.3335C11.6663 12.413 12.4125 11.6668 13.333 11.6668H14.9997C15.9201 11.6668 16.6663 12.413 16.6663 13.3335V15.0002C16.6663 15.9206 15.9201 16.6668 14.9997 16.6668H13.333C12.4125 16.6668 11.6663 15.9206 11.6663 15.0002V13.3335Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <span>카테고리</span>
                  </button>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-4 flex-shrink-0">
            {showDeleteButton && (
              <LocalIconTooltip label="고객삭제">
                <button
                  type="button"
                  onClick={handleBulkDelete}
                  disabled={!hasSelection}
                  className="cursor-pointer w-6 h-6 flex items-center justify-center rounded-[5px] hover:bg-neutral-10 dark:hover:bg-neutral-20 transition-colors text-neutral-50 dark:text-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                  aria-label="고객 삭제"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M19 7L18.1327 19.1425C18.0579 20.1891 17.187 21 16.1378 21H7.86224C6.81296 21 5.94208 20.1891 5.86732 19.1425L5 7M10 11V17M14 11V17M15 7V4C15 3.44772 14.5523 3 14 3H10C9.44772 3 9 3.44772 9 4V7M4 7H20" stroke="#B0B0B0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </LocalIconTooltip>
            )}
            <div className="relative h-6" ref={mobileLimitPopoverRef}>
              <LocalIconTooltip label="목록 개수">
                <button
                  type="button"
                  onClick={() => setLimitPopoverOpen((prev) => !prev)}
                  className="cursor-pointer w-6 h-6 flex items-center justify-center rounded-[5px] hover:bg-neutral-10 dark:hover:bg-neutral-20 transition-colors text-neutral-50 dark:text-neutral-50"
                  aria-label="목록 개수"
                  aria-haspopup="menu"
                  aria-expanded={limitPopoverOpen}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M3 4H16M3 8H12M3 12H12M17 8V20M17 20L13 16M17 20L21 16" stroke="#B0B0B0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </LocalIconTooltip>
              {limitPopoverOpen && (
                <div
                  role="menu"
                  className="absolute right-0 top-full mt-2 w-[105px] rounded-[8px] bg-white dark:bg-neutral-10 border border-neutral-30 dark:border-neutral-30 shadow-[0px_13px_61px_rgba(169,169,169,0.366013)] dark:shadow-[0px_8px_16px_rgba(0,0,0,0.45)] z-50 overflow-hidden"
                >
                  {[10, 20, 30, 50, 100].map((option) => {
                    const isSelected = limit === option;
                    return (
                      <button
                        key={option}
                        type="button"
                        role="menuitemradio"
                        aria-checked={isSelected}
                        onClick={() => {
                          onLimitChange(option);
                          setLimitPopoverOpen(false);
                        }}
                        className={`cursor-pointer w-full h-[49px] px-5 text-left text-[14px] font-medium tracking-[-0.02em] text-neutral-90 dark:text-neutral-90 transition-colors ${isSelected
                          ? "bg-neutral-20 dark:bg-neutral-20"
                          : "bg-white dark:bg-neutral-10 hover:bg-neutral-10 dark:hover:bg-neutral-20"
                          }`}
                      >
                        {option}개씩
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="text-[11px] text-neutral-50 text-left">
          총 {total.toLocaleString()}건 ({selectedCount}개 선택)
        </div>
      </div>

      {/* 데스크탑(lg 이상): 왼쪽 섹션(4버튼) + 오른쪽 섹션(엑셀 아이콘 2개), 같은 행 */}
      <div className="hidden lg:flex lg:flex-1 lg:justify-between lg:items-center lg:min-w-0">
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
          {showAssignButton && (
          <button
            type="button"
            className="cursor-pointer h-[34px] px-3 rounded-[5px] bg-neutral-90 dark:bg-neutral-90 text-neutral-20 dark:text-neutral-25 text-[14px] font-semibold tracking-[-0.02em] inline-flex items-center justify-center gap-2 hover:opacity-90 dark:hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:opacity-50"
            onClick={handleAssignClick}
            disabled={selectedIds.length === 0 && selectionMode !== "all"}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M8.03017 11.1363C7.73727 10.8434 7.2624 10.8434 6.96951 11.1363C6.67661 11.4292 6.67661 11.9041 6.96951 12.197L7.49984 11.6667L8.03017 11.1363ZM9.1665 13.3333L8.63617 13.8637C8.92907 14.1566 9.40394 14.1566 9.69683 13.8637L9.1665 13.3333ZM13.0302 10.5303C13.3231 10.2374 13.3231 9.76256 13.0302 9.46967C12.7373 9.17678 12.2624 9.17678 11.9695 9.46967L12.4998 10L13.0302 10.5303ZM15.8332 5.83333H15.0832V15.8333H15.8332H16.5832V5.83333H15.8332ZM14.1665 17.5V16.75H5.83317V17.5V18.25H14.1665V17.5ZM4.1665 15.8333H4.9165V5.83333H4.1665H3.4165V15.8333H4.1665ZM5.83317 4.16667V4.91667H7.49984V4.16667V3.41667H5.83317V4.16667ZM12.4998 4.16667V4.91667H14.1665V4.16667V3.41667H12.4998V4.16667ZM5.83317 17.5V16.75C5.32691 16.75 4.9165 16.3396 4.9165 15.8333H4.1665H3.4165C3.4165 17.168 4.49848 18.25 5.83317 18.25V17.5ZM15.8332 15.8333H15.0832C15.0832 16.3396 14.6728 16.75 14.1665 16.75V17.5V18.25C15.5012 18.25 16.5832 17.168 16.5832 15.8333H15.8332ZM15.8332 5.83333H16.5832C16.5832 4.49865 15.5012 3.41667 14.1665 3.41667V4.16667V4.91667C14.6728 4.91667 15.0832 5.32707 15.0832 5.83333H15.8332ZM4.1665 5.83333H4.9165C4.9165 5.32707 5.32691 4.91667 5.83317 4.91667V4.16667V3.41667C4.49848 3.41667 3.4165 4.49865 3.4165 5.83333H4.1665ZM7.49984 11.6667L6.96951 12.197L8.63617 13.8637L9.1665 13.3333L9.69683 12.803L8.03017 11.1363L7.49984 11.6667ZM9.1665 13.3333L9.69683 13.8637L13.0302 10.5303L12.4998 10L11.9695 9.46967L8.63617 12.803L9.1665 13.3333ZM9.1665 2.5V3.25H10.8332V2.5V1.75H9.1665V2.5ZM10.8332 5.83333V5.08333H9.1665V5.83333V6.58333H10.8332V5.83333ZM9.1665 5.83333V5.08333C8.66024 5.08333 8.24984 4.67293 8.24984 4.16667H7.49984H6.74984C6.74984 5.50135 7.83182 6.58333 9.1665 6.58333V5.83333ZM12.4998 4.16667H11.7498C11.7498 4.67293 11.3394 5.08333 10.8332 5.08333V5.83333V6.58333C12.1679 6.58333 13.2498 5.50135 13.2498 4.16667H12.4998ZM10.8332 2.5V3.25C11.3394 3.25 11.7498 3.66041 11.7498 4.16667H12.4998H13.2498C13.2498 2.83198 12.1679 1.75 10.8332 1.75V2.5ZM9.1665 2.5V1.75C7.83182 1.75 6.74984 2.83198 6.74984 4.16667H7.49984H8.24984C8.24984 3.66041 8.66024 3.25 9.1665 3.25V2.5Z" fill="currentColor" />
            </svg>
            <span>직원배정</span>
          </button>
          )}
          {showPartnerAssignButton && (
            <button
              type="button"
              className="cursor-pointer h-[34px] px-3 rounded-[5px] bg-neutral-90 dark:bg-neutral-90 text-neutral-20 dark:text-neutral-25 text-[14px] font-semibold tracking-[-0.02em] inline-flex items-center justify-center gap-2 hover:opacity-90 dark:hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:opacity-50"
              onClick={handlePartnerAssignClick}
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
            onClick={handleSmsClick}
            disabled={selectedIds.length === 0 && selectionMode !== "all"}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0" aria-hidden>
              <path d="M5.83333 6.66665H14.1667M5.83333 9.99998H9.16667M10 16.6666L6.66667 13.3333H4.16667C3.24619 13.3333 2.5 12.5871 2.5 11.6666V4.99998C2.5 4.07951 3.24619 3.33331 4.16667 3.33331H15.8333C16.7538 3.33331 17.5 4.07951 17.5 4.99998V11.6666C17.5 12.5871 16.7538 13.3333 15.8333 13.3333H13.3333L10 16.6666Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span>문자전송</span>
          </button>
          <button
            type="button"
            className="cursor-pointer h-[34px] px-3 rounded-[5px] bg-neutral-90 dark:bg-neutral-90 text-neutral-20 dark:text-neutral-25 text-[14px] font-semibold tracking-[-0.02em] inline-flex items-center justify-center gap-2 hover:opacity-90 dark:hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:opacity-50"
            onClick={handleBulkScheduleClick}
            disabled={selectedIds.length === 0 && selectionMode !== "all"}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0" aria-hidden>
              <path d="M6.66667 5.83333V2.5M13.3333 5.83333V2.5M5.83333 9.16667H14.1667M4.16667 17.5H15.8333C16.7538 17.5 17.5 16.7538 17.5 15.8333V5.83333C17.5 4.91286 16.7538 4.16667 15.8333 4.16667H4.16667C3.24619 4.16667 2.5 4.91286 2.5 5.83333V15.8333C2.5 16.7538 3.24619 17.5 4.16667 17.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span>일정추가</span>
          </button>
          <button
            type="button"
            className="cursor-pointer h-[34px] px-3 rounded-[5px] bg-neutral-90 dark:bg-neutral-90 text-neutral-20 dark:text-neutral-25 text-[14px] font-semibold tracking-[-0.02em] inline-flex items-center justify-center gap-1 hover:opacity-90 dark:hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:opacity-50"
            onClick={handleCategoryClick}
            disabled={selectedIds.length === 0 && selectionMode !== "all"}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0" aria-hidden>
              <path d="M3.33301 5.00016C3.33301 4.07969 4.0792 3.3335 4.99967 3.3335H6.66634C7.58682 3.3335 8.33301 4.07969 8.33301 5.00016V6.66683C8.33301 7.5873 7.58682 8.3335 6.66634 8.3335H4.99967C4.0792 8.3335 3.33301 7.5873 3.33301 6.66683V5.00016Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M11.6663 5.00016C11.6663 4.07969 12.4125 3.3335 13.333 3.3335H14.9997C15.9201 3.3335 16.6663 4.07969 16.6663 5.00016V6.66683C16.6663 7.5873 15.9201 8.3335 14.9997 8.3335H13.333C12.4125 8.3335 11.6663 7.5873 11.6663 6.66683V5.00016Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M3.33301 13.3335C3.33301 12.413 4.0792 11.6668 4.99967 11.6668H6.66634C7.58682 11.6668 8.33301 12.413 8.33301 13.3335V15.0002C8.33301 15.9206 7.58682 16.6668 6.66634 16.6668H4.99967C4.0792 16.6668 3.33301 15.9206 3.33301 15.0002V13.3335Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M11.6663 13.3335C11.6663 12.413 12.4125 11.6668 13.333 11.6668H14.9997C15.9201 11.6668 16.6663 12.413 16.6663 13.3335V15.0002C16.6663 15.9206 15.9201 16.6668 14.9997 16.6668H13.333C12.4125 16.6668 11.6663 15.9206 11.6663 15.0002V13.3335Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span>카테고리</span>
          </button>
          <div className="text-[14px] text-neutral-50">
            총 {total.toLocaleString()}건 ({selectedCount}개 선택)
          </div>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          {showDeleteButton && (
            <LocalIconTooltip label="고객삭제">
              <button
                type="button"
                onClick={handleBulkDelete}
                disabled={!hasSelection}
                className="cursor-pointer w-6 h-6 flex items-center justify-center rounded-[5px] hover:bg-neutral-10 dark:hover:bg-neutral-20 transition-colors text-neutral-50 dark:text-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                aria-label="고객 삭제"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M19 7L18.1327 19.1425C18.0579 20.1891 17.187 21 16.1378 21H7.86224C6.81296 21 5.94208 20.1891 5.86732 19.1425L5 7M10 11V17M14 11V17M15 7V4C15 3.44772 14.5523 3 14 3H10C9.44772 3 9 3.44772 9 4V7M4 7H20" stroke="#B0B0B0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>

              </button>
            </LocalIconTooltip>
          )}
          {showExcelUploadButton && (
            <LocalIconTooltip label="엑셀 업로드">
              <button
                type="button"
                onClick={() => setExcelUploadModalOpen(true)}
                className="cursor-pointer w-6 h-6 flex items-center justify-center rounded-[5px] hover:bg-neutral-10 dark:hover:bg-neutral-20 transition-colors text-neutral-50 dark:text-neutral-50"
                aria-label="엑셀 업로드"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M4 16L4 17C4 18.6569 5.34315 20 7 20L17 20C18.6569 20 20 18.6569 20 17L20 16M16 8L12 4M12 4L8 8M12 4L12 16" stroke="#B0B0B0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </LocalIconTooltip>
          )}
          {showExcelDownloadButton && (
            <LocalIconTooltip label="엑셀 다운로드">
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
                className="cursor-pointer w-6 h-6 flex items-center justify-center rounded-[5px] hover:bg-neutral-10 dark:hover:bg-neutral-20 transition-colors text-neutral-50 dark:text-neutral-50"
                aria-label="엑셀 다운로드"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M4 16L4 17C4 18.6569 5.34315 20 7 20L17 20C18.6569 20 20 18.6569 20 17L20 16M16 12L12 16M12 16L8 12M12 16L12 4" stroke="#B0B0B0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </LocalIconTooltip>
          )}
          <div className="relative h-6" ref={desktopLimitPopoverRef}>
            <LocalIconTooltip label="목록 개수">
              <button
                type="button"
                onClick={() => setLimitPopoverOpen((prev) => !prev)}
                className="cursor-pointer w-6 h-6 flex items-center justify-center rounded-[5px] hover:bg-neutral-10 dark:hover:bg-neutral-20 transition-colors text-neutral-50 dark:text-neutral-50"
                aria-label="페이지당 개수 선택"
                aria-haspopup="menu"
                aria-expanded={limitPopoverOpen}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M3 4H16M3 8H12M3 12H12M17 8V20M17 20L13 16M17 20L21 16" stroke="#B0B0B0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </LocalIconTooltip>
            {limitPopoverOpen && (
              <div
                role="menu"
                className="absolute right-0 top-full mt-2 w-[105px] rounded-[8px] bg-white dark:bg-neutral-10 border border-neutral-30 dark:border-neutral-30 shadow-[0px_13px_61px_rgba(169,169,169,0.366013)] dark:shadow-[0px_8px_16px_rgba(0,0,0,0.45)] z-50 overflow-hidden"
              >
                {[10, 20, 30, 50, 100].map((option) => {
                  const isSelected = limit === option;
                  return (
                    <button
                      key={option}
                      type="button"
                      role="menuitemradio"
                      aria-checked={isSelected}
                      onClick={() => {
                        onLimitChange(option);
                        setLimitPopoverOpen(false);
                      }}
                      className={`cursor-pointer w-full h-[49px] px-5 text-left text-[14px] font-medium tracking-[-0.02em] text-neutral-90 dark:text-neutral-90 transition-colors ${isSelected
                        ? "bg-neutral-20 dark:bg-neutral-20"
                        : "bg-white dark:bg-neutral-10 hover:bg-neutral-10 dark:hover:bg-neutral-20"
                        }`}
                    >
                      {option}개씩
                    </button>
                  );
                })}
              </div>
            )}
          </div>
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

      <BulkCategoryChangeModal
        open={categoryModalOpen}
        onClose={() => setCategoryModalOpen(false)}
        onSuccess={onCategoryChangeSuccess}
        projectId={projectId}
        selectedIds={selectedIds}
        selectionMode={selectionMode}
        appliedFilters={appliedFilters}
        total={total}
      />
    </div>
  );
}
