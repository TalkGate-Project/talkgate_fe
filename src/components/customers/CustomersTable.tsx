import { Fragment, useState, useRef, useEffect } from "react";
import {
  CustomerDuplicateItem,
  CustomerListItem,
  RecentNote,
} from "@/types/customers";
import Checkbox from "@/components/common/Checkbox";
import CustomersHoverPopover from "./CustomersHoverPopover";
import { formatDateTime } from "@/utils/datetime";
import {
  CustomerNoteCategoriesService,
  CustomerNoteCategory,
} from "@/services/customerNoteCategories";
import TableSkeletonRow from "@/components/common/TableSkeletonRow";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import { getBadgeStyle } from "@/utils/categoryBadge";
import { showConfirmModal } from "@/lib/confirmModalEvents";
import { CustomersService } from "@/services/customers";
import { showErrorModal } from "@/lib/errorModalEvents";
import { useMyMember } from "@/hooks/useMyMember";

type CustomersTableProps = {
  customers: CustomerListItem[];
  loading: boolean;
  error: boolean;
  selectedIds: number[];
  onSelect: (customerId: number, checked: boolean) => void;
  onSelectAll: (mode: "page" | "all") => void;
  allSelectedOnPage: boolean;
  onCustomerClick: (customerId: number) => void;
  totalCount: number;
  selectionMode: "page" | "all" | null;
  projectId: string;
  onRefetch: () => void;
};

function TruncateWithTooltip({
  text,
  className = "",
}: {
  text: string;
  className?: string;
}) {
  const textRef = useRef<HTMLSpanElement | null>(null);
  const [isTruncated, setIsTruncated] = useState(false);

  useEffect(() => {
    const el = textRef.current;
    if (!el) return;
    const check = () => {
      setIsTruncated(el.scrollWidth > el.clientWidth);
    };
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, [text]);

  return (
    <span
      ref={textRef}
      className={`block truncate ${className}`}
      title={isTruncated ? text : undefined}
    >
      {text}
    </span>
  );
}

function getBodyZoom(): number {
  if (typeof document === "undefined") return 1;
  const raw = String(
    ((document.body.style as any).zoom ?? "") as string
  ).trim();
  const parsed = Number.parseFloat(raw);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

export default function CustomersTable({
  customers,
  loading,
  error,
  selectedIds,
  onSelect,
  onSelectAll,
  allSelectedOnPage,
  onCustomerClick,
  totalCount,
  selectionMode,
  projectId,
  onRefetch,
}: CustomersTableProps) {
  const [hoverInfo, setHoverInfo] = useState<{
    name: string;
    notes: RecentNote[];
    top: number;
    left: number;
  } | null>(null);
  const hoverHideRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [hoveredId, setHoveredId] = useState<number | null>(null);
  const [categories, setCategories] = useState<CustomerNoteCategory[]>([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [expandedDuplicateRows, setExpandedDuplicateRows] = useState<
    Record<number, boolean>
  >({});
  const [duplicateRows, setDuplicateRows] = useState<
    Record<number, CustomerDuplicateItem[]>
  >({});
  const [duplicateLoadingRows, setDuplicateLoadingRows] = useState<
    Record<number, boolean>
  >({});
  const [duplicateErrorRows, setDuplicateErrorRows] = useState<
    Record<number, boolean>
  >({});
  
  // 현재 사용자의 멤버 정보 가져오기
  const { member: myMember } = useMyMember(projectId);
  const myMemberId = myMember?.id;

  // Fetch categories on mount
  useEffect(() => {
    CustomerNoteCategoriesService.list()
      .then((res) => {
        // res.data = { result: true, data: [...categories] }
        setCategories((res.data as any)?.data ?? []);
      })
      .catch(() => {
        // silently fail
      });
  }, []);

  const handleMouseEnter = (
    e: React.MouseEvent,
    customer: CustomerListItem
  ) => {
    // 모바일에서는 호버 미리보기 비활성화
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      return;
    }

    if (hoverHideRef.current) {
      clearTimeout(hoverHideRef.current);
      hoverHideRef.current = null;
    }
    const { clientX, clientY } = e;
    const notes = Array.isArray(customer.recentNotes)
      ? customer.recentNotes
      : [];
    setHoveredId(customer.id);

    // body zoom(컴팩트 0.8 / 기본 1) 기준으로 위치 보정
    const zoom = getBodyZoom();
    const offsetX = zoom < 1 ? 20 : 12;
    const offsetY = zoom < 1 ? 20 : 12;

    const adjustedX = (clientX + offsetX) / zoom;
    const adjustedY = (clientY + offsetY) / zoom;

    // window.innerWidth도 줌 레벨에 따라 달라질 수 있으므로 안전하게 처리
    // (크롬 등에서는 zoom 시 innerWidth가 늘어남)
    const maxLeft = window.innerWidth / zoom - 400;

    setHoverInfo({
      name: customer.name,
      notes,
      top: adjustedY,
      left: Math.min(adjustedX, maxLeft),
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    // 모바일에서는 호버 미리보기 비활성화
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      return;
    }

    if (!hoverInfo) return;
    const { clientX, clientY } = e;

    const zoom = getBodyZoom();
    const offsetX = zoom < 1 ? 20 : 12;
    const offsetY = zoom < 1 ? 20 : 12;

    const adjustedX = (clientX + offsetX) / zoom;
    const adjustedY = (clientY + offsetY) / zoom;
    const maxLeft = window.innerWidth / zoom - 400;

    setHoverInfo((prev) =>
      prev
        ? {
            ...prev,
            top: adjustedY,
            left: Math.min(adjustedX, maxLeft),
          }
        : prev
    );
  };

  const handleMouseLeave = () => {
    if (hoverHideRef.current) clearTimeout(hoverHideRef.current);
    hoverHideRef.current = setTimeout(() => {
      setHoverInfo(null);
      setHoveredId(null);
    }, 150);
  };

  const handlePopoverMouseEnter = () => {
    if (hoverHideRef.current) {
      clearTimeout(hoverHideRef.current);
      hoverHideRef.current = null;
    }
  };

  const handlePopoverMouseLeave = () => {
    setHoverInfo(null);
    setHoveredId(null);
  };

  // 드롭다운 외부 클릭 감지
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false);
      }
    };

    if (dropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [dropdownOpen]);

  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDropdownOpen(!dropdownOpen);
  };

  const handleSelectAllPage = () => {
    onSelectAll("page");
    setDropdownOpen(false);
  };

  const handleSelectAllList = () => {
    onSelectAll("all");
    setDropdownOpen(false);
  };

  const handleConfirmAll = () => {
    showConfirmModal({
      message: "자신에게 직접 할당된 모든 고객을 확인됨으로 변경하시겠습니까?",
      confirmText: "확인",
      cancelText: "취소",
      onConfirm: async () => {
        try {
          await CustomersService.confirmAll(projectId);
          onRefetch();
        } catch (error: any) {
          const errorCode = error?.data?.code;
          const errorStatus = error?.status;

          if (errorStatus === 403 && errorCode === "FORBIDDEN") {
            showErrorModal({
              headline: "확인할 수 있는 권한이 없습니다.",
              description: "자신에게 직접 할당된 고객만 확인할 수 있습니다.",
              hideCancel: true,
              confirmText: "확인",
            });
          } else {
            showErrorModal({
              headline: "전체 확인에 실패했습니다.",
              description: "잠시 후 다시 시도해주세요.",
              hideCancel: true,
              confirmText: "확인",
            });
          }
        }
      },
    });
  };

  const handleConfirmCustomer = (customerId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const customer = customers.find((c) => c.id === customerId);
    if (!customer || customer.status === "confirmed") return;

    showConfirmModal({
      message: "해당 고객을 확인됨으로 변경하시겠습니까?",
      confirmText: "확인",
      cancelText: "취소",
      onConfirm: async () => {
        try {
          await CustomersService.confirm(String(customerId), projectId);
          onRefetch();
        } catch (error: any) {
          const errorCode = error?.data?.code;
          const errorStatus = error?.status;

          if (errorStatus === 403 && errorCode === "FORBIDDEN") {
            showErrorModal({
              headline: "확인할 수 있는 권한이 없습니다.",
              description: "배정된 멤버만 고객을 확인할 수 있습니다.",
              hideCancel: true,
              confirmText: "확인",
            });
          } else {
            showErrorModal({
              headline: "고객 확인에 실패했습니다.",
              description: "잠시 후 다시 시도해주세요.",
              hideCancel: true,
              confirmText: "확인",
            });
          }
        }
      },
    });
  };

  const handleToggleDuplicateRow = async (
    customerId: number,
    e: React.MouseEvent
  ) => {
    e.stopPropagation();
    const isOpen = Boolean(expandedDuplicateRows[customerId]);
    const nextOpen = !isOpen;

    setExpandedDuplicateRows((prev) => ({
      ...prev,
      [customerId]: nextOpen,
    }));

    if (!nextOpen) return;
    if (duplicateRows[customerId]) return;
    if (duplicateLoadingRows[customerId]) return;

    setDuplicateLoadingRows((prev) => ({ ...prev, [customerId]: true }));
    setDuplicateErrorRows((prev) => ({ ...prev, [customerId]: false }));

    try {
      const response = await CustomersService.duplicates(
        String(customerId),
        projectId
      );
      const rows = (response.data?.data?.customers ?? []).filter(
        (item) => item.id !== customerId
      );
      setDuplicateRows((prev) => ({ ...prev, [customerId]: rows }));
    } catch {
      setDuplicateErrorRows((prev) => ({ ...prev, [customerId]: true }));
    } finally {
      setDuplicateLoadingRows((prev) => ({ ...prev, [customerId]: false }));
    }
  };

  return (
    <>
      <div
        className="overflow-x-auto w-full min-w-0"
        style={{ WebkitOverflowScrolling: "touch" } as React.CSSProperties}
      >
        <table className="w-full min-w-[900px] text-left border-separate border-spacing-0 table-fixed">
          <colgroup>
            <col style={{ width: "5%" }} />
            <col style={{ width: "10%" }} />
            <col style={{ width: "18%" }} />
            <col style={{ width: "10%" }} />
            <col style={{ width: "10%" }} />
            <col style={{ width: "10%" }} />
            <col style={{ width: "9%" }} />
            <col style={{ width: "9%" }} />
            <col style={{ width: "11%" }} />
            <col style={{ width: "8%" }} />
          </colgroup>
          <thead>
            <tr className="text-neutral-60">
              <th className="bg-neutral-20 px-2 md:px-6 h-[40px] align-middle rounded-l-[8px] md:rounded-l-[12px] whitespace-nowrap">
                <div
                  className="flex items-center justify-center md:justify-start relative"
                  ref={dropdownRef}
                >
                  <div
                    onClick={handleCheckboxClick}
                    className="cursor-pointer flex items-center"
                  >
                    <Checkbox
                      checked={allSelectedOnPage || selectionMode === "all"}
                      onChange={() => {}}
                      ariaLabel="전체 선택"
                      size={24}
                    />
                  </div>
                  {dropdownOpen && (
                    <div className="absolute top-full left-0 mt-1 w-[240px] min-w-[240px] bg-white dark:bg-neutral-10 border border-neutral-30 dark:border-neutral-30 rounded-[5px] shadow-lg z-50 flex flex-col">
                      <button
                        onClick={handleSelectAllList}
                        className="cursor-pointer w-full h-[48px] text-left px-4 py-2 text-[14px] text-neutral-90 dark:text-neutral-90 hover:bg-neutral-10 dark:hover:bg-neutral-20 transition-colors whitespace-nowrap"
                      >
                        전체 목록 선택&nbsp;
                        <span className="text-neutral-60">
                          총 {totalCount}개
                        </span>
                      </button>
                      <button
                        onClick={handleSelectAllPage}
                        className="cursor-pointer w-full h-[48px] text-left px-4 py-2 text-[14px] text-neutral-90 dark:text-neutral-90 hover:bg-neutral-10 dark:hover:bg-neutral-20 transition-colors border-t border-neutral-30 dark:border-neutral-30 whitespace-nowrap"
                      >
                        현재 페이지 선택&nbsp;
                        <span className="text-neutral-60">
                          총 {customers.length}개
                        </span>
                      </button>
                    </div>
                  )}
                </div>
              </th>
              {/* PC/모바일 동일: 모든 열 (모바일은 가로 스크롤로 확인) */}
              {[
                "이름",
                "연락처",
                "매체사",
                "사이트",
                "신청경로",
                "담당자",
                "카테고리",
                "신청시간",
                "전체확인",
              ].map((h, idx, arr) => (
                <th
                  key={h}
                  colSpan={1}
                  className={`bg-neutral-20 table-cell typo-title-4 font-medium px-2 md:px-4 h-[40px] whitespace-nowrap ${
                    idx === arr.length - 1 ? "rounded-r-[8px] md:rounded-r-[12px]" : ""
                  } ${h === "카테고리" ? "text-center" : ""} ${
                    h === "전체확인"
                      ? "text-center font-semibold underline cursor-pointer"
                      : ""
                  }`}
                  onClick={h === "전체확인" ? handleConfirmAll : undefined}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="typo-body-3">
            {/* 로딩 중일 때 스켈레톤 표시 */}
            {loading && (
              <>
                {Array.from({ length: 10 }).map((_, idx) => (
                  <tr
                    key={`skeleton-${idx}`}
                    className="border-b border-[#E2E2E2] dark:!border-[#44444455] animate-pulse"
                  >
                    <td
                      className="px-2 pr-4 md:pr-6 md:px-6 min-w-[48px] overflow-visible"
                      style={{ height: "48px" }}
                    >
                      <div className="flex items-center justify-start h-full">
                        <div className="w-6 h-6 bg-neutral-20 rounded" />
                      </div>
                    </td>
                    {Array.from({ length: 10 }).map((_, colIdx) => (
                      <td
                        key={colIdx}
                        className="px-2 md:px-4"
                        style={{ height: "48px" }}
                      >
                        <div
                          className="h-4 bg-neutral-20 rounded"
                          style={{ flex: 1 }}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </>
            )}
            {/* 에러 상태 */}
            {Boolean(error) && !loading && (
              <tr>
                <td
                  colSpan={11}
                  className="px-2 md:px-6 h-[72px] text-center text-red-500"
                >
                  데이터를 불러오지 못했습니다
                </td>
              </tr>
            )}
            {/* 실제 데이터 표시 */}
            {!loading &&
              customers.map((c, index) => {
                const checked =
                  selectedIds.includes(c.id) || selectionMode === "all";
                const isLastRow = index === customers.length - 1;
                const duplicateCount = Number(c.duplicateCount ?? 0);
                const canToggleDuplicate = duplicateCount > 0;
                const isDuplicateOpen = Boolean(expandedDuplicateRows[c.id]);
                const duplicateItems = duplicateRows[c.id] ?? [];
                const duplicateLoading = Boolean(duplicateLoadingRows[c.id]);
                const duplicateError = Boolean(duplicateErrorRows[c.id]);
                return (
                  <Fragment key={c.id}>
                    <tr
                      className={`cursor-pointer border-b border-[#E2E2E2] dark:!border-[#44444455] ${
                        hoveredId === c.id ? "md:bg-neutral-10" : ""
                      }`}
                      style={
                        !isLastRow ? { borderBottom: "1px solid #e2e2e255" } : {}
                      }
                      onClick={() => onCustomerClick(c.id)}
                      onMouseEnter={(e) => {
                        // 모바일에서는 호버 이벤트 비활성화
                        if (
                          typeof window !== "undefined" &&
                          window.innerWidth >= 768
                        ) {
                          handleMouseEnter(e, c);
                        }
                      }}
                      onMouseMove={(e) => {
                        // 모바일에서는 호버 이벤트 비활성화
                        if (
                          typeof window !== "undefined" &&
                          window.innerWidth >= 768
                        ) {
                          handleMouseMove(e);
                        }
                      }}
                      onMouseLeave={() => {
                        // 모바일에서는 호버 이벤트 비활성화
                        if (
                          typeof window !== "undefined" &&
                          window.innerWidth >= 768
                        ) {
                          handleMouseLeave();
                        }
                      }}
                    >
                      <td
                        className="pr-0 md:pl-6 md:pr-4 h-[48px] whitespace-nowrap min-w-[48px] overflow-visible"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-center md:justify-start h-full">
                          <Checkbox
                            checked={checked}
                            onChange={(next) => onSelect(c.id, next)}
                            ariaLabel={`select ${c.name}`}
                            size={24}
                          />
                        </div>
                      </td>
                      <td className="table-cell px-2 md:px-6 h-[48px] align-middle text-neutral-90 opacity-80 whitespace-nowrap">
                        <div className="inline-flex items-center h-full align-middle">
                          <TruncateWithTooltip
                            text={c.name || "-"}
                            className="leading-[17px] min-w-[4ch] max-w-[9ch] md:max-w-[12ch]"
                          />
                        </div>
                      </td>
                      <td className="table-cell px-2 md:px-4 h-[48px] align-middle text-neutral-90 opacity-80 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <TruncateWithTooltip
                            text={c.contact1 || c.contact2 || "-"}
                            className="min-w-0 max-w-[12ch] md:max-w-[18ch]"
                          />
                          {canToggleDuplicate && (
                            <button
                              type="button"
                              onClick={(e) => handleToggleDuplicateRow(c.id, e)}
                              className="cursor-pointer inline-flex items-center justify-center h-[18px] min-w-[36px] px-1 rounded-[9px] bg-[#474747] text-white text-[13px] leading-none font-medium tracking-[-0.08em] flex-shrink-0"
                              aria-label={
                                isDuplicateOpen
                                  ? "중복 고객 목록 닫기"
                                  : "중복 고객 목록 펼치기"
                              }
                            >
                              <span className="inline-flex items-center h-full leading-none">+</span>
                              <span className="inline-flex items-center h-full leading-none translate-y-[1px]">
                                {duplicateCount}
                              </span>
                              <div className="ml-0.5 w-[12px] h-[12px] shrink-0 flex items-center justify-center">
                                <svg
                                  width="12"
                                  height="12"
                                  viewBox="0 0 12 12"
                                  fill="none"
                                  xmlns="http://www.w3.org/2000/svg"
                                  className={`w-full h-full transition-transform ${
                                    isDuplicateOpen ? "rotate-180" : ""
                                  }`}
                                >
                                  <path
                                    d="M3 4.5L6 7.5L9 4.5"
                                    stroke="#FFFFFF"
                                    strokeWidth="1.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                </svg>
                              </div>
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="table-cell px-2 md:px-4 h-[48px] align-middle text-neutral-90 opacity-80 whitespace-nowrap">
                        <TruncateWithTooltip
                          text={c.mediaCompany || "-"}
                          className="max-w-[120px] md:max-w-[180px]"
                        />
                      </td>
                      <td className="table-cell px-2 md:px-4 h-[48px] align-middle text-neutral-90 opacity-80 whitespace-nowrap">
                        <TruncateWithTooltip
                          text={c.site || "-"}
                          className="max-w-[150px] md:max-w-[200px]"
                        />
                      </td>
                      <td className="table-cell px-2 md:px-4 h-[48px] align-middle text-neutral-90 opacity-80 whitespace-nowrap">
                        <TruncateWithTooltip
                          text={c.applicationRoute || "-"}
                          className="max-w-[120px] md:max-w-[180px]"
                        />
                      </td>
                      <td className="table-cell px-2 md:px-4 h-[48px] align-middle text-neutral-90 opacity-80 whitespace-nowrap">
                        <div className="flex items-center gap-2 min-w-0">
                          <TruncateWithTooltip
                            text={c.assignedMemberName || "-"}
                            className="min-w-0 max-w-[8ch] md:max-w-[12ch]"
                          />
                          {c.assignedMemberName && (
                            <div className="flex items-center justify-center flex-shrink-0">
                              <svg
                                width="20"
                                height="20"
                                viewBox="0 0 20 20"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path
                                  fillRule="evenodd"
                                  clipRule="evenodd"
                                  d="M10 18C14.4183 18 18 14.4183 18 10C18 5.58172 14.4183 2 10 2C5.58172 2 2 5.58172 2 10C2 14.4183 5.58172 18 10 18ZM13.7071 8.70711C14.0976 8.31658 14.0976 7.68342 13.7071 7.29289C13.3166 6.90237 12.6834 6.90237 12.2929 7.29289L9 10.5858L7.70711 9.29289C7.31658 8.90237 6.68342 8.90237 6.29289 9.29289C5.90237 9.68342 5.90237 10.3166 6.29289 10.7071L8.29289 12.7071C8.68342 13.0976 9.31658 13.0976 9.70711 12.7071L13.7071 8.70711Z"
                                  fill={
                                    c.status === "confirmed"
                                      ? "#00E272"
                                      : "#B0B0B0"
                                  }
                                />
                              </svg>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="table-cell px-2 md:px-4 h-[48px] align-middle text-neutral-90 text-center whitespace-nowrap overflow-hidden">
                        {(() => {
                          // 마지막 상담내용의 카테고리를 찾기
                          const notes = Array.isArray(c.recentNotes)
                            ? c.recentNotes
                            : [];

                          // 상담/노트가 없는 경우에만 "-" 표시
                          if (notes.length === 0)
                            return <span className="opacity-80">-</span>;

                          // createdAt 기준으로 정렬하여 가장 최근 노트 찾기
                          const sortedNotes = [...notes].sort(
                            (a, b) =>
                              new Date(b.createdAt).getTime() -
                              new Date(a.createdAt).getTime()
                          );
                          const lastNote = sortedNotes[0];

                          // 카테고리 정보 확인
                          const categoryId = lastNote.categoryId;
                          const category = categories.find(
                            (cat) => cat.id === categoryId
                          );
                          const categoryName = category?.name || "일반";
                          const badgeStyle = getBadgeStyle(
                            categoryName,
                            categoryId || 0
                          );

                          return (
                            <span
                              className={`inline-flex items-center h-[22px] max-w-full rounded-[30px] px-3 text-[12px] leading-[14px] font-medium ${badgeStyle.bg} ${badgeStyle.text}`}
                            >
                              <span
                                className="block min-w-0 max-w-[62px] md:max-w-[96px] overflow-hidden text-ellipsis whitespace-nowrap"
                                title={categoryName}
                              >
                                {categoryName}
                              </span>
                            </span>
                          );
                        })()}
                      </td>
                      <td className="table-cell px-2 md:px-4 h-[48px] align-middle text-neutral-90 opacity-80 whitespace-nowrap">
                        {formatDateTime(c.applicationDate || c.createdAt)}
                      </td>
                      <td className="table-cell px-2 md:px-4 h-[48px] align-middle whitespace-nowrap">
                        <div className="flex items-center justify-center">
                          {c.status !== "confirmed" &&
                          c.assignedMember?.id === myMemberId ? (
                            <button
                              onClick={(e) => handleConfirmCustomer(c.id, e)}
                              className="cursor-pointer flex items-center justify-center relative group"
                              aria-label="고객 확인"
                            >
                              <svg
                                width="24"
                                height="24"
                                viewBox="0 0 24 24"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path
                                  d="M5 13L9 17L19 7"
                                  stroke="#00E272"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                              <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-neutral-90 text-neutral-0 text-[12px] px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                                확인
                              </span>
                            </button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                    {isDuplicateOpen &&
                      (duplicateLoading ? (
                        <tr key={`${c.id}-duplicates-loading`} className="bg-[#F8F8F8] dark:bg-neutral-20">
                          <td className="px-2 pr-4 md:pr-6 md:px-6 h-[44px]" />
                          <td colSpan={10} className="px-2 md:px-4 h-[44px]">
                            <div className="h-full w-full flex items-center justify-center">
                              <LoadingSpinner size="sm" aria-label="중복 고객 목록 로딩 중" />
                            </div>
                          </td>
                        </tr>
                      ) : duplicateError ? (
                        <tr key={`${c.id}-duplicates-error`} className="bg-[#F8F8F8] dark:bg-neutral-20">
                          <td className="px-2 pr-4 md:pr-6 md:px-6 h-[44px]" />
                          <td colSpan={10} className="px-2 md:px-4 h-[44px] text-[13px] text-red-500">
                            중복 고객 목록을 불러오지 못했습니다.
                          </td>
                        </tr>
                      ) : duplicateItems.length === 0 ? (
                        <tr key={`${c.id}-duplicates-empty`} className="bg-[#F8F8F8] dark:bg-neutral-20">
                          <td className="px-2 pr-4 md:pr-6 md:px-6 h-[44px]" />
                          <td colSpan={10} className="px-2 md:px-4 h-[44px] text-[13px] text-neutral-60">
                            중복 고객이 없습니다.
                          </td>
                        </tr>
                      ) : (
                        duplicateItems.map((item, itemIndex) => (
                          <tr
                            key={`${c.id}-duplicate-${item.id}`}
                            className={`cursor-pointer bg-[#F8F8F8] dark:bg-neutral-20 ${
                              itemIndex === duplicateItems.length - 1
                                ? "border-b border-[#E2E2E2] dark:border-[#44444455]"
                                : ""
                            }`}
                            onClick={() => onCustomerClick(item.id)}
                          >
                            {/* 체크박스 열은 비워 둠 */}
                            <td className="px-2 pr-4 md:pr-6 md:px-6 h-[44px]" />
                            <td className="table-cell px-2 md:px-6 h-[44px] align-middle text-neutral-90 opacity-80 whitespace-nowrap">
                              <div className="inline-flex items-center h-full align-middle">
                                <TruncateWithTooltip
                                  text={item.name || "-"}
                                  className="leading-[17px] min-w-[4ch] max-w-[9ch] md:max-w-[12ch]"
                                />
                              </div>
                            </td>
                            <td className="table-cell px-2 md:px-4 h-[44px] align-middle text-neutral-90 opacity-80 whitespace-nowrap">
                              <TruncateWithTooltip
                                text={item.contact1 || item.contact2 || "-"}
                                className="min-w-0 max-w-[12ch] md:max-w-[18ch]"
                              />
                            </td>
                            <td className="table-cell px-2 md:px-4 h-[44px] align-middle text-neutral-90 opacity-80 whitespace-nowrap">
                              <TruncateWithTooltip
                                text={item.mediaCompany || "-"}
                                className="max-w-[120px] md:max-w-[180px]"
                              />
                            </td>
                            <td className="table-cell px-2 md:px-4 h-[44px] align-middle text-neutral-90 opacity-80 whitespace-nowrap">
                              <TruncateWithTooltip
                                text={item.site || "-"}
                                className="max-w-[150px] md:max-w-[200px]"
                              />
                            </td>
                            <td className="table-cell px-2 md:px-4 h-[44px] align-middle text-neutral-90 opacity-80 whitespace-nowrap">
                              <TruncateWithTooltip
                                text={item.applicationRoute || "-"}
                                className="max-w-[120px] md:max-w-[180px]"
                              />
                            </td>
                            <td className="table-cell px-2 md:px-4 h-[44px] align-middle text-neutral-90 opacity-80 whitespace-nowrap">
                              <TruncateWithTooltip
                                text={item.assignedMemberName || "-"}
                                className="min-w-0 max-w-[8ch] md:max-w-[12ch]"
                              />
                            </td>
                            <td className="table-cell px-2 md:px-4 h-[44px] align-middle text-neutral-90 text-center whitespace-nowrap overflow-hidden">
                              {(() => {
                                const notes = Array.isArray(item.recentNotes)
                                  ? item.recentNotes
                                  : [];
                                if (notes.length === 0)
                                  return <span className="opacity-80">-</span>;

                                const sortedNotes = [...notes].sort(
                                  (a, b) =>
                                    new Date(b.createdAt).getTime() -
                                    new Date(a.createdAt).getTime()
                                );
                                const lastNote = sortedNotes[0];
                                const categoryId = lastNote.categoryId;
                                const category = categories.find(
                                  (cat) => cat.id === categoryId
                                );
                                const categoryName = category?.name || "일반";
                                const badgeStyle = getBadgeStyle(
                                  categoryName,
                                  categoryId || 0
                                );

                                return (
                                  <span
                                    className={`inline-flex items-center h-[22px] max-w-full rounded-[30px] px-3 text-[12px] leading-[14px] font-medium ${badgeStyle.bg} ${badgeStyle.text}`}
                                  >
                                    <span
                                      className="block min-w-0 max-w-[62px] md:max-w-[96px] overflow-hidden text-ellipsis whitespace-nowrap"
                                      title={categoryName}
                                    >
                                      {categoryName}
                                    </span>
                                  </span>
                                );
                              })()}
                            </td>
                            <td className="table-cell px-2 md:px-4 h-[44px] align-middle text-neutral-90 opacity-80 whitespace-nowrap">
                              {formatDateTime(item.applicationDate || item.createdAt)}
                            </td>
                            <td className="table-cell px-2 md:px-4 h-[44px] align-middle whitespace-nowrap" />
                          </tr>
                        ))
                      ))}
                  </Fragment>
                );
              })}
            {!loading && customers.length === 0 && !error && (
              <tr>
                <td
                  colSpan={11}
                  className="px-2 md:px-6 pt-10 pb-10 min-h-[200px] text-center text-neutral-60"
                >
                  결과가 없습니다
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {hoverInfo && (
        <CustomersHoverPopover
          name={hoverInfo.name}
          notes={hoverInfo.notes}
          categories={categories}
          top={hoverInfo.top}
          left={hoverInfo.left}
          onMouseEnter={handlePopoverMouseEnter}
          onMouseLeave={handlePopoverMouseLeave}
        />
      )}
    </>
  );
}
