import { Fragment, useState, useRef, useEffect, useLayoutEffect } from "react";
import {
  CustomerDuplicateItem,
  CustomerListItem,
  RecentNote,
} from "@/types/customers";
import Checkbox from "@/components/common/Checkbox";
import CustomersHoverPopover from "./CustomersHoverPopover";
import { formatDateTime, formatRelativeTime } from "@/utils/datetime";
import { formatContactForDisplay } from "@/utils/format";
import { useCustomerNoteCategories } from "@/hooks/useCustomerNoteCategories";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import { getBadgeStyle } from "@/utils/categoryBadge";
import { showConfirmModal } from "@/lib/confirmModalEvents";
import { CustomersService } from "@/services/customers";
import { showErrorModal } from "@/lib/errorModalEvents";
import { useMyMember } from "@/hooks/useMyMember";
import CustomerMeetingBadge from "./meeting/CustomerMeetingBadge";
import CustomerProcedureBadge from "./CustomerProcedureBadge";
import ApplicationTimeSortMenu from "./ApplicationTimeSortMenu";
import type { CustomerSortType } from "@/hooks/useCustomersFilters";
import { useHorizontalDragScroll } from "@/hooks/useHorizontalDragScroll";
import { getBodyZoom } from "@/utils/zoom";
import type { CustomerTableColumnsState } from "@/hooks/useCustomerTableColumns";
import {
  CHECKBOX_COLUMN_WIDTH,
  clampColumnWidth,
  fitColumnWidths,
  resizeColumnWithinFit,
  type CustomerColumnDefinition,
  type CustomerColumnKey,
} from "./customerTableColumns";

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
  page: number;
  limit: number;
  selectionMode: "page" | "all" | null;
  projectId: string;
  onRefetch: () => void;
  /** 연락처로 필터 적용 후 페이지 새로고침 (중복 "더보기"/"필터로 보기" 클릭 시) */
  onFilterByContact?: (contact: string) => void;
  /** IP 주소로 필터 적용 후 페이지 새로고침 (IP 중복 "더보기"/"필터로 보기" 클릭 시, 데이터 제공자 전용) */
  onFilterByIp?: (ipAddress: string) => void;
  /** 데이터 제공자 프로젝트 여부 (컬럼 분기용) */
  isDataProvider?: boolean;
  /** 데이터 제공자 여부가 확정되었는지 (헤더 안정화용) */
  isDataProviderReady?: boolean;
  sortType?: SortKey;
  sortOrder?: "ASC" | "DESC";
  onToggleSort?: (column: SortKey) => void;
  onSetSort?: (column: SortKey | null, order?: "ASC" | "DESC") => void;
  /** 열 순서·표시 여부·너비 설정 (useCustomerTableColumns) */
  columnsState: CustomerTableColumnsState;
};

type SortKey = CustomerSortType;

/** 중복 펼치기 기준. "ip"는 데이터 제공자 프로젝트에서만 쓴다. */
type DuplicateKind = "contact" | "ip";

const duplicateKey = (kind: DuplicateKind, customerId: number) =>
  `${kind}-${customerId}`;

function DuplicateToggleButton({
  count,
  isOpen,
  label,
  onClick,
}: {
  count: number;
  isOpen: boolean;
  label: string;
  onClick: (e: React.MouseEvent) => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="cursor-pointer inline-flex items-center justify-center h-[24px] min-w-[48px] px-1 rounded-[16px] bg-[#474747] text-white text-[14px] leading-none font-medium tracking-[-0.08em] flex-shrink-0"
      aria-label={isOpen ? `${label} 목록 닫기` : `${label} 목록 펼치기`}
    >
      <span className="inline-flex items-center h-full leading-[22px]">+&nbsp;</span>
      <span className="inline-flex items-center h-full leading-[22px] translate-y-[1px]">
        {count}
      </span>
      <div className="ml-0.5 w-[16px] h-[16px] shrink-0 flex items-center justify-center">
        <svg
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={`w-full h-full transition-transform translate-y-[1px] ${
            isOpen ? "rotate-180 !translate-y-[0.5px]" : ""
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
  );
}

function SortableHeaderLabel({
  label,
  sortKey,
  sortType,
  sortOrder,
  onToggleSort,
}: {
  label: string;
  sortKey: SortKey;
  sortType?: SortKey;
  sortOrder?: "ASC" | "DESC";
  onToggleSort?: (column: SortKey) => void;
}) {
  const isActive = sortType === sortKey;
  return (
    <button
      type="button"
      className="cursor-pointer inline-flex items-center gap-1 hover:text-neutral-90"
      onClick={(e) => {
        e.stopPropagation();
        onToggleSort?.(sortKey);
      }}
      aria-label={`${label} 정렬 토글`}
    >
      <span>{label}</span>
      <svg width="10" height="12" viewBox="0 0 10 12" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M5 1L8 4H2L5 1Z" fill={isActive && sortOrder === "ASC" ? "#111111" : "#B0B0B0"} />
        <path d="M5 11L2 8H8L5 11Z" fill={isActive && sortOrder === "DESC" ? "#111111" : "#B0B0B0"} />
      </svg>
    </button>
  );
}

function ApplicationTimeCell({
  customer,
  showLastNote,
  sortType,
}: {
  customer: CustomerListItem;
  showLastNote: boolean;
  sortType?: SortKey;
}) {
  const applicationTime = formatDateTime(customer.applicationDate || customer.createdAt);
  if (!showLastNote) return <TruncateWithTooltip text={applicationTime} className="min-w-0" />;

  // recentNotes는 BE에서 작성시간 내림차순으로 내려온다.
  const lastNoteAt = customer.recentNotes?.[0]?.createdAt;
  // 최근메모 기준으로 정렬 중이면 메모 줄을 본문 색으로 올리고 신청시간 줄을 낮춘다.
  const isLastNoteSort = sortType === "lastNoteDate";
  return (
    <div className="flex flex-col min-w-0 leading-[16px]">
      <span
        className={`block truncate ${isLastNoteSort ? "text-neutral-60" : ""}`}
        title={applicationTime}
      >
        {applicationTime}
      </span>
      <span
        className={`block truncate text-[12px] ${isLastNoteSort ? "text-neutral-90 font-semibold" : "text-neutral-60"}`}
        title={lastNoteAt ? `최근메모 ${formatDateTime(lastNoteAt)}` : undefined}
      >
        {lastNoteAt ? `메모 ${formatRelativeTime(lastNoteAt)}` : "메모 없음"}
      </span>
    </div>
  );
}

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
      // 소수점 오차(zoom/브라우저 렌더링)로 인한 깜빡임 방지
      setIsTruncated(el.scrollWidth - el.clientWidth > 1);
    };

    check();
    const rafId = window.requestAnimationFrame(check);
    const timerId = window.setTimeout(check, 0);

    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver(check);
      resizeObserver.observe(el);
      if (el.parentElement) resizeObserver.observe(el.parentElement);
    } else {
      window.addEventListener("resize", check);
    }

    return () => {
      window.cancelAnimationFrame(rafId);
      window.clearTimeout(timerId);
      if (resizeObserver) {
        resizeObserver.disconnect();
      } else {
        window.removeEventListener("resize", check);
      }
    };
  }, [text, className]);

  return (
    <span className={`relative block min-w-0 group ${className}`}>
      <span ref={textRef} className="block truncate">
        {text}
      </span>
      {isTruncated && (
        <span className="pointer-events-none hidden md:block absolute left-1/2 -translate-x-1/2 -top-9 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="rounded-[8px] bg-card border border-border px-3 py-2 text-[12px] text-foreground shadow-lg whitespace-nowrap">
            {text}
          </span>
        </span>
      )}
    </span>
  );
}

function getCustomerKeyword(
  customer: CustomerListItem | CustomerDuplicateItem
): string | null | undefined {
  return (customer as CustomerListItem & { keyword?: string | null }).keyword;
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
  page,
  limit,
  selectionMode,
  projectId,
  onRefetch,
  onFilterByContact,
  onFilterByIp,
  isDataProvider = false,
  isDataProviderReady = true,
  sortType,
  sortOrder,
  onToggleSort,
  onSetSort,
  columnsState,
}: CustomersTableProps) {
  const [hoverInfo, setHoverInfo] = useState<{
    name: string;
    notes: RecentNote[];
    top: number;
    left: number;
  } | null>(null);
  const hoverHideRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [hoveredId, setHoveredId] = useState<number | null>(null);
  const { categories } = useCustomerNoteCategories();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  // 행별로 펼쳐진 중복 기준 (연락처/IP 중 하나만 펼친다)
  const [expandedDuplicateRows, setExpandedDuplicateRows] = useState<
    Record<number, DuplicateKind | undefined>
  >({});
  // 아래 세 상태는 duplicateKey(kind, customerId)로 구분한다
  const [duplicateRows, setDuplicateRows] = useState<
    Record<string, CustomerDuplicateItem[]>
  >({});
  const [duplicateLoadingRows, setDuplicateLoadingRows] = useState<
    Record<string, boolean>
  >({});
  const [duplicateErrorRows, setDuplicateErrorRows] = useState<
    Record<string, boolean>
  >({});
  
  // 현재 사용자의 멤버 정보 가져오기
  const { member: myMember } = useMyMember(projectId);
  const myMemberId = myMember?.id;
  const normalizedPage = Math.max(1, page);
  const normalizedLimit = Math.max(1, limit);
  const {
    visibleColumns,
    widths: storedColumnWidths,
    isReady: isColumnsReady,
    setColumnWidths,
    resetColumnWidth,
  } = columnsState;
  const baseColumnWidths = visibleColumns.map(
    (column) => storedColumnWidths?.[column.key] ?? column.defaultWidth
  );
  const tableAreaRef = useRef<HTMLDivElement | null>(null);
  // 표가 쓸 수 있는 폭(레이아웃 px). clientWidth는 zoom이 곱해지기 전 값이라 열 너비와 같은 단위다.
  const [availableTableWidth, setAvailableTableWidth] = useState(0);
  useLayoutEffect(() => {
    const element = tableAreaRef.current;
    if (!element) return;
    const measure = () => setAvailableTableWidth(element.clientWidth);
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const resizeObserver = new ResizeObserver(measure);
    resizeObserver.observe(element);
    return () => resizeObserver.disconnect();
  }, []);
  const displayColumnWidths = fitColumnWidths(baseColumnWidths, availableTableWidth);
  const tableWidth =
    CHECKBOX_COLUMN_WIDTH +
    displayColumnWidths.reduce((sum, width) => sum + width, 0);
  const tableStyle: React.CSSProperties =
    availableTableWidth > 0 ? { width: tableWidth } : { width: "100%", minWidth: tableWidth };
  const tableRef = useRef<HTMLTableElement | null>(null);
  const columnElementRefs = useRef<Partial<Record<CustomerColumnKey, HTMLTableColElement | null>>>({});
  const [resizingColumnKey, setResizingColumnKey] = useState<CustomerColumnKey | null>(null);
  // 태블릿(md~lg)에서만 드래그로 가로 스크롤 — 모바일은 터치 스와이프가 이미 되고,
  // 데스크톱(lg+)은 보통 표가 잘리지 않아 굳이 붙일 이유가 없다.
  const { containerRef: dragScrollRef, dragScrollHandlers } = useHorizontalDragScroll<HTMLDivElement>({
    widthRange: { min: 780, max: 1080 },
  });
  const totalColumns = visibleColumns.length + 1;
  const detailColSpan = visibleColumns.length;
  const shouldRenderSkeleton = !isDataProviderReady || !isColumnsReady || loading;

  /**
   * 헤더 경계 드래그로 열 너비를 바꾼다. 표가 화면보다 좁아지지 않도록 줄인 만큼은 다른 열이 채운다
   * (resizeColumnWithinFit). 드래그 중에는 리렌더 없이 <col>/<table> 스타일만 직접 바꾸고
   * 손을 뗄 때 보이던 너비 전체를 한 번 저장한다(행이 많을 때 매 pointermove 리렌더는 버벅인다).
   * 좌표는 docs/ZOOM_SUBPIXEL_PLAYBOOK.md §4-4 규칙대로 화면 px를 zoom으로 나눠 레이아웃 px로 맞춘다.
   */
  const handleResizeStart = (event: React.PointerEvent, column: CustomerColumnDefinition) => {
    if (event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();

    const zoom = getBodyZoom();
    const columnIndex = visibleColumns.findIndex((item) => item.key === column.key);
    if (columnIndex < 0) return;
    const startWidths = [...displayColumnWidths];
    const availableWidth = tableAreaRef.current?.clientWidth ?? availableTableWidth;
    const startX = event.clientX;
    let latestWidths = startWidths;

    const applyWidths = (widths: number[]) => {
      visibleColumns.forEach((item, index) => {
        const columnElement = columnElementRefs.current[item.key];
        if (columnElement) columnElement.style.width = `${widths[index]}px`;
      });
      if (tableRef.current) {
        const total = widths.reduce((sum, width) => sum + width, 0);
        tableRef.current.style.width = `${CHECKBOX_COLUMN_WIDTH + total}px`;
        tableRef.current.style.minWidth = "";
      }
    };

    const handlePointerMove = (moveEvent: PointerEvent) => {
      const targetWidth = clampColumnWidth(
        column,
        startWidths[columnIndex] + (moveEvent.clientX - startX) / zoom
      );
      latestWidths = resizeColumnWithinFit(startWidths, columnIndex, targetWidth, availableWidth);
      applyWidths(latestWidths);
    };
    const handlePointerUp = () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      setResizingColumnKey(null);
      const nextWidths: Partial<Record<CustomerColumnKey, number>> = {};
      visibleColumns.forEach((item, index) => {
        nextWidths[item.key] = latestWidths[index];
      });
      setColumnWidths(nextWidths);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("pointercancel", handlePointerUp);
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    setResizingColumnKey(column.key);
  };

  const renderColumnGroup = () => (
    <colgroup>
      <col style={{ width: CHECKBOX_COLUMN_WIDTH }} />
      {visibleColumns.map((column, index) => (
        <col
          key={column.key}
          ref={(element) => {
            columnElementRefs.current[column.key] = element;
          }}
          style={{ width: displayColumnWidths[index] }}
        />
      ))}
    </colgroup>
  );

  const renderResizeHandle = (column: CustomerColumnDefinition) => (
    <span
      role="separator"
      aria-orientation="vertical"
      aria-label={`${column.label} 너비 조정`}
      title="드래그해 너비 조정 · 더블클릭으로 기본 너비"
      className="hidden md:flex absolute top-0 right-0 h-full w-[10px] z-10 cursor-col-resize justify-end group/resize"
      onPointerDown={(event) => handleResizeStart(event, column)}
      onMouseDown={(event) => event.stopPropagation()}
      onClick={(event) => event.stopPropagation()}
      onDoubleClick={(event) => {
        event.stopPropagation();
        resetColumnWidth(column.key);
      }}
    >
      <span
        className={`self-center h-[18px] w-[2px] rounded-full transition-colors ${
          resizingColumnKey === column.key
            ? "bg-neutral-60"
            : "bg-neutral-30 group-hover/resize:bg-neutral-60"
        }`}
      />
    </span>
  );

  const renderHeaderLabel = (column: CustomerColumnDefinition) => {
    // 번호 열은 기존처럼 헤더를 비워 둔다(설정 메뉴에서만 "번호"로 보인다)
    if (column.key === "rowNumber") return null;
    if (isDataProvider) return column.label;
    if (column.key === "category" || column.key === "assignedMember") {
      return (
        <SortableHeaderLabel
          label={column.label}
          sortKey={column.key}
          sortType={sortType}
          sortOrder={sortOrder}
          onToggleSort={onToggleSort}
        />
      );
    }
    if (column.key === "applicationTime") {
      return (
        <ApplicationTimeSortMenu sortType={sortType} sortOrder={sortOrder} onSetSort={onSetSort} />
      );
    }
    return column.label;
  };

  const renderCategoryBadge = (categoryId: number | null) => {
    if (categoryId === null) return <span className="opacity-80">-</span>;
    const category = categories.find((cat) => cat.id === categoryId);
    const categoryName = category?.name || "알 수 없음";
    const badgeStyle = getBadgeStyle(categoryName, categoryId, category?.colorCode);
    return (
      <span
        className="inline-flex items-center h-[22px] max-w-full rounded-[30px] px-3 text-[12px] leading-[14px] font-medium"
        style={badgeStyle}
      >
        <TruncateWithTooltip
          text={categoryName}
          className="min-w-0 overflow-hidden text-ellipsis whitespace-nowrap"
        />
      </span>
    );
  };

  /** 본 행과 펼친 중복 행이 같은 열 정의로 셀을 그린다. 중복 행에는 중복 펼치기·확인 같은 동작을 두지 않는다 */
  const renderCell = (
    key: CustomerColumnKey,
    customer: CustomerListItem,
    options: { isDuplicateRow: boolean; openDuplicateKind?: DuplicateKind; rowNumber?: number }
  ) => {
    const { isDuplicateRow, openDuplicateKind, rowNumber } = options;
    const rowHeightClass = isDuplicateRow ? "h-[44px]" : "h-[48px]";
    const textCellClass = `table-cell px-2 md:px-4 ${rowHeightClass} align-middle text-neutral-90 opacity-80 whitespace-nowrap`;

    switch (key) {
      case "rowNumber":
        return (
          <td
            key={key}
            className={`table-cell px-2 md:px-4 ${rowHeightClass} align-middle text-center text-neutral-70 whitespace-nowrap overflow-hidden text-ellipsis`}
          >
            {isDuplicateRow ? null : rowNumber !== undefined && rowNumber > 0 ? rowNumber : "-"}
          </td>
        );
      case "name":
        return (
          <td key={key} className={textCellClass}>
            <div className="flex items-center gap-2 h-full min-w-0 overflow-hidden">
              <span className="block min-w-0 shrink truncate leading-[17px]">
                {customer.name || "-"}
              </span>
              <CustomerMeetingBadge meeting={customer.meeting} />
              <CustomerProcedureBadge
                isAnalysisConnected={customer.isAnalysisConnected}
                trackingProcedure={customer.trackingProcedure}
                currentProcedureStep={customer.currentProcedureStep}
                totalProcedureSteps={customer.totalProcedureSteps}
              />
              {isDataProvider && customer.isPartnerUnassigned && (
                <span className="w-[6px] h-[6px] rounded-full flex-shrink-0 bg-[#00E272]" aria-hidden />
              )}
            </div>
          </td>
        );
      case "contact": {
        const contactDuplicateCount = Number(customer.duplicateCount ?? 0);
        return (
          <td key={key} className={textCellClass}>
            <div className="flex items-center gap-2 min-w-0">
              <TruncateWithTooltip
                text={formatContactForDisplay(customer.contact1 || customer.contact2 || "") || "-"}
                className="min-w-0"
              />
              {!isDuplicateRow && contactDuplicateCount > 0 && (
                <DuplicateToggleButton
                  count={contactDuplicateCount}
                  isOpen={openDuplicateKind === "contact"}
                  label="중복 고객"
                  onClick={(e) => handleToggleDuplicateRow(customer.id, "contact", e)}
                />
              )}
            </div>
          </td>
        );
      }
      case "ip": {
        const ipDuplicateCount = Number(customer.ipDuplicateCount ?? 0);
        return (
          <td key={key} className={textCellClass}>
            <div className="flex items-center gap-2 min-w-0">
              <TruncateWithTooltip text={customer.ipAddress || "-"} className="min-w-0" />
              {!isDuplicateRow && ipDuplicateCount > 0 && (
                <DuplicateToggleButton
                  count={ipDuplicateCount}
                  isOpen={openDuplicateKind === "ip"}
                  label="IP 중복 고객"
                  onClick={(e) => handleToggleDuplicateRow(customer.id, "ip", e)}
                />
              )}
            </div>
          </td>
        );
      }
      case "mediaCompany":
      case "site":
      case "applicationRoute":
      case "keyword": {
        const textByKey = {
          mediaCompany: customer.mediaCompany,
          site: customer.site,
          applicationRoute: customer.applicationRoute,
          keyword: getCustomerKeyword(customer),
        };
        return (
          <td key={key} className={textCellClass}>
            <TruncateWithTooltip text={textByKey[key] || "-"} className="min-w-0" />
          </td>
        );
      }
      case "category":
        return (
          <td
            key={key}
            className={`table-cell px-2 md:px-4 ${rowHeightClass} align-middle text-neutral-90 text-center whitespace-nowrap overflow-hidden`}
          >
            {renderCategoryBadge(customer.categoryId ?? null)}
          </td>
        );
      case "assignedMember":
        return (
          <td key={key} className={textCellClass}>
            <div className="flex items-center gap-2 min-w-0">
              <TruncateWithTooltip text={customer.assignedMemberName || "-"} className="min-w-0" />
              {!isDuplicateRow && customer.assignedMemberName && (
                <div className="flex items-center justify-center flex-shrink-0">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M10 18C14.4183 18 18 14.4183 18 10C18 5.58172 14.4183 2 10 2C5.58172 2 2 5.58172 2 10C2 14.4183 5.58172 18 10 18ZM13.7071 8.70711C14.0976 8.31658 14.0976 7.68342 13.7071 7.29289C13.3166 6.90237 12.6834 6.90237 12.2929 7.29289L9 10.5858L7.70711 9.29289C7.31658 8.90237 6.68342 8.90237 6.29289 9.29289C5.90237 9.68342 5.90237 10.3166 6.29289 10.7071L8.29289 12.7071C8.68342 13.0976 9.31658 13.0976 9.70711 12.7071L13.7071 8.70711Z"
                      fill={customer.status === "confirmed" ? "#00E272" : "#B0B0B0"}
                    />
                  </svg>
                </div>
              )}
            </div>
          </td>
        );
      case "applicationTime":
        return (
          <td key={key} className={textCellClass}>
            <ApplicationTimeCell customer={customer} showLastNote={!isDataProvider} sortType={sortType} />
          </td>
        );
      case "confirm": {
        const canConfirm =
          !isDuplicateRow &&
          customer.status !== "confirmed" &&
          customer.assignedMember?.id === myMemberId;
        return (
          <td key={key} className={`table-cell px-2 md:px-4 ${rowHeightClass} align-middle whitespace-nowrap`}>
            <div className="flex items-center justify-center">
              {canConfirm ? (
                <button
                  onClick={(e) => handleConfirmCustomer(customer.id, e)}
                  className="cursor-pointer flex items-center justify-center relative group"
                  aria-label="고객 확인"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M5 13L9 17L19 7" stroke="#00E272" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-neutral-90 text-neutral-0 text-[12px] px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                    확인
                  </span>
                </button>
              ) : null}
            </div>
          </td>
        );
      }
    }
  };

  const handleMouseEnter = (
    e: React.MouseEvent,
    customer: CustomerListItem | CustomerDuplicateItem
  ) => {
    // 모바일에서는 호버 미리보기 비활성화
    if (typeof window !== "undefined" && window.innerWidth < 780) {
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
    if (typeof window !== "undefined" && window.innerWidth < 780) {
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
    kind: DuplicateKind,
    e: React.MouseEvent
  ) => {
    e.stopPropagation();
    const nextOpen = expandedDuplicateRows[customerId] !== kind;

    setExpandedDuplicateRows((prev) => ({
      ...prev,
      [customerId]: nextOpen ? kind : undefined,
    }));

    const key = duplicateKey(kind, customerId);
    if (!nextOpen) return;
    if (duplicateRows[key]) return;
    if (duplicateLoadingRows[key]) return;

    setDuplicateLoadingRows((prev) => ({ ...prev, [key]: true }));
    setDuplicateErrorRows((prev) => ({ ...prev, [key]: false }));

    try {
      const fetchDuplicates =
        kind === "ip" ? CustomersService.ipDuplicates : CustomersService.duplicates;
      const response = await fetchDuplicates(String(customerId), projectId);
      const rows = (response.data?.data?.customers ?? []).filter(
        (item) => item.id !== customerId
      );
      setDuplicateRows((prev) => ({ ...prev, [key]: rows }));
    } catch {
      setDuplicateErrorRows((prev) => ({ ...prev, [key]: true }));
    } finally {
      setDuplicateLoadingRows((prev) => ({ ...prev, [key]: false }));
    }
  };

  const headerCellBaseClass = "bg-neutral-20 table-cell typo-title-4 font-medium px-2 md:px-4 h-[40px] whitespace-nowrap";

  const renderDuplicateDetailRow = (customerId: number, kind: string, content: React.ReactNode, className = "") => (
    <tr key={`${customerId}-duplicates-${kind}`} className="bg-[#F8F8F8] dark:bg-neutral-20">
      <td className="px-2 pr-4 md:pr-6 md:px-6 h-[44px]" />
      <td colSpan={detailColSpan} className={`px-2 md:px-4 h-[44px] ${className}`}>
        {content}
      </td>
    </tr>
  );

  return (
    <>
      <div ref={tableAreaRef} className="w-full min-w-0">
      {shouldRenderSkeleton ? (
        <div
          className="overflow-x-auto w-full min-w-0"
          style={{ WebkitOverflowScrolling: "touch" } as React.CSSProperties}
        >
          <table className="text-left border-separate border-spacing-0 table-fixed" style={tableStyle}>
            {renderColumnGroup()}
            <thead>
              <tr className="text-neutral-60">
                <th className="bg-neutral-20 px-2 md:px-6 h-[40px] align-middle rounded-l-[8px] md:rounded-l-[12px] whitespace-nowrap">
                  <div className="w-6 h-6 bg-neutral-30 rounded animate-pulse mx-auto md:mx-0" />
                </th>
                {visibleColumns.map((column, idx, arr) => (
                  <th
                    key={`skeleton-header-${column.key}`}
                    className={`bg-neutral-20 px-2 md:px-4 h-[40px] whitespace-nowrap ${
                      idx === arr.length - 1 ? "rounded-r-[8px] md:rounded-r-[12px]" : ""
                    }`}
                  >
                    <div className="h-3 w-16 max-w-full bg-neutral-30 rounded animate-pulse mx-auto" />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="typo-body-3">
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
                  {Array.from({ length: totalColumns - 1 }).map((_, colIdx) => (
                    <td
                      key={colIdx}
                      className="px-2 md:px-4"
                      style={{ height: "48px" }}
                    >
                      <div className="h-4 bg-neutral-20 rounded" />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div
          ref={dragScrollRef}
          className="overflow-x-auto w-full min-w-0"
          style={{ WebkitOverflowScrolling: "touch" } as React.CSSProperties}
          {...dragScrollHandlers}
        >
          <table
            ref={tableRef}
            className="text-left border-separate border-spacing-0 table-fixed"
            style={tableStyle}
          >
          {renderColumnGroup()}
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
                      className="shrink-0 min-w-[24px] min-h-[24px]"
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
              {visibleColumns.map((column, idx, arr) => {
                const isConfirmAllHeader = !isDataProvider && column.key === "confirm";
                return (
                  <th
                    key={column.key}
                    colSpan={1}
                    className={`${headerCellBaseClass} relative overflow-hidden text-ellipsis ${
                      idx === arr.length - 1 ? "rounded-r-[8px] md:rounded-r-[12px]" : ""
                    } ${column.key === "category" || column.key === "rowNumber" ? "text-center" : ""} ${
                      isConfirmAllHeader ? "text-center font-semibold underline cursor-pointer" : ""
                    }`}
                    onClick={isConfirmAllHeader ? handleConfirmAll : undefined}
                  >
                    {renderHeaderLabel(column)}
                    {renderResizeHandle(column)}
                  </th>
                );
              })}
            </tr>
          </thead>
            <tbody className="typo-body-3">
            {/* 에러 상태 */}
            {Boolean(error) && (
              <tr>
                <td
                  colSpan={totalColumns}
                  className="px-2 md:px-6 h-[72px] text-center text-red-500"
                >
                  데이터를 불러오지 못했습니다
                </td>
              </tr>
            )}
            {/* 실제 데이터 표시 */}
            {customers.map((c, index) => {
              const checked =
                selectedIds.includes(c.id) || selectionMode === "all";
              const isLastRow = index === customers.length - 1;
              const contactDuplicateCount = Number(c.duplicateCount ?? 0);
              const ipDuplicateCount = isDataProvider ? Number(c.ipDuplicateCount ?? 0) : 0;
              const openDuplicateKind = expandedDuplicateRows[c.id];
              const isDuplicateOpen = openDuplicateKind !== undefined;
              const duplicateCount =
                openDuplicateKind === "ip" ? ipDuplicateCount : contactDuplicateCount;
              const openDuplicateKey = duplicateKey(openDuplicateKind ?? "contact", c.id);
              const duplicateItems = duplicateRows[openDuplicateKey] ?? [];
              const duplicateLoading = Boolean(duplicateLoadingRows[openDuplicateKey]);
              const duplicateError = Boolean(duplicateErrorRows[openDuplicateKey]);
              const rowNumber =
                totalCount - (normalizedPage - 1) * normalizedLimit - index;
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
                          window.innerWidth >= 780
                        ) {
                          handleMouseEnter(e, c);
                        }
                      }}
                      onMouseMove={(e) => {
                        // 모바일에서는 호버 이벤트 비활성화
                        if (
                          typeof window !== "undefined" &&
                          window.innerWidth >= 780
                        ) {
                          handleMouseMove(e);
                        }
                      }}
                      onMouseLeave={() => {
                        // 모바일에서는 호버 이벤트 비활성화
                        if (
                          typeof window !== "undefined" &&
                          window.innerWidth >= 780
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
                            className="shrink-0 min-w-[24px] min-h-[24px]"
                          />
                        </div>
                      </td>
                      {visibleColumns.map((column) =>
                        renderCell(column.key, c, { isDuplicateRow: false, openDuplicateKind, rowNumber })
                      )}
                    </tr>
                    {isDuplicateOpen &&
                      (duplicateLoading ? (
                        renderDuplicateDetailRow(
                          c.id,
                          "loading",
                          <div className="h-full w-full flex items-center justify-center">
                            <LoadingSpinner size="sm" aria-label="중복 고객 목록 로딩 중" />
                          </div>
                        )
                      ) : duplicateError ? (
                        renderDuplicateDetailRow(
                          c.id,
                          "error",
                          "중복 고객 목록을 불러오지 못했습니다.",
                          "text-[13px] text-red-500"
                        )
                      ) : duplicateItems.length === 0 ? (
                        renderDuplicateDetailRow(
                          c.id,
                          "empty",
                          "중복 고객이 없습니다.",
                          "text-[13px] text-neutral-60"
                        )
                      ) : (
                        <>
                          {duplicateItems.map((item, itemIndex) => (
                          <tr
                            key={`${c.id}-duplicate-${item.id}`}
                            className={`cursor-pointer bg-[#F8F8F8] dark:bg-neutral-20 ${
                              hoveredId === item.id ? "md:bg-neutral-10 dark:md:bg-neutral-10 " : ""
                            }${
                              // 마지막 행 아래는 필터 이동 버튼 행이 항상 오므로 구분선을 그 행에 맡긴다
                              itemIndex < duplicateItems.length - 1
                                ? "border-b border-[#E2E2E2] dark:border-[#44444455]"
                                : ""
                            }`}
                            onClick={() => onCustomerClick(item.id)}
                            onMouseEnter={(e) => {
                              if (
                                typeof window !== "undefined" &&
                                window.innerWidth >= 780
                              ) {
                                handleMouseEnter(e, item);
                              }
                            }}
                            onMouseMove={(e) => {
                              if (
                                typeof window !== "undefined" &&
                                window.innerWidth >= 780
                              ) {
                                handleMouseMove(e);
                              }
                            }}
                            onMouseLeave={() => {
                              if (
                                typeof window !== "undefined" &&
                                window.innerWidth >= 780
                              ) {
                                handleMouseLeave();
                              }
                            }}
                          >
                            {/* 체크박스·번호 열은 비워 둠 */}
                            <td className="px-2 pr-4 md:pr-6 md:px-6 h-[44px]" />
                            {visibleColumns.map((column) =>
                              renderCell(column.key, item, { isDuplicateRow: true })
                            )}
                          </tr>
                          ))}
                          {/* 중복 개수와 관계없이 항상 노출: 펼친 목록에 다 보이면(5건 이하) "필터로 보기",
                              잘려 있으면 "더보기". 필터 상태에서 일괄 작업을 하려는 경우에도 쓴다. */}
                            <tr
                              key={`${c.id}-duplicate-more`}
                              className="bg-[#F8F8F8] dark:bg-neutral-20 border-b border-[#E2E2E2] dark:border-[#44444455]"
                            >
                              <td colSpan={totalColumns} className="px-2 md:px-4 py-2 align-middle">
                                <div
                                  className="border-t border-t-[rgba(226,226,226,0.4)] dark:border-t-[rgba(68,68,68,0.25)] pt-2 w-[calc(100%+0.5rem+0.5rem)] -ml-2 md:w-[calc(100%+1rem+1rem)] md:-ml-4"
                                >
                                  <div className="flex justify-center items-center px-2 md:px-4">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (openDuplicateKind === "ip") {
                                        if (c.ipAddress && onFilterByIp) onFilterByIp(c.ipAddress);
                                        return;
                                      }
                                      const contact = c.contact1 || c.contact2 || "";
                                      if (contact && onFilterByContact) onFilterByContact(contact);
                                    }}
                                    style={{ minWidth: 80, height: 28 }}
                                    className="flex justify-center items-center shrink-0 px-2 bg-white dark:bg-neutral-10 border border-[#E2E2E2] dark:border-neutral-30 rounded-[5px] text-[#808080] dark:text-neutral-60 font-semibold text-[14px] leading-none tracking-[-0.02em] cursor-pointer hover:opacity-90 transition-opacity whitespace-nowrap"
                                    aria-label={
                                      openDuplicateKind === "ip"
                                        ? "IP 주소로 필터 적용하여 전체 보기"
                                        : "연락처로 필터 적용하여 전체 보기"
                                    }
                                  >
                                    {duplicateCount > 5 ? (
                                      <>
                                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0" aria-hidden>
                                          <path d="M8 3.33331V12.6666M3.33331 8H12.6666" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                        <span className="shrink-0 ml-1 leading-none translate-y-[1px]">더보기</span>
                                      </>
                                    ) : (
                                      <span className="shrink-0 leading-none translate-y-[1px]">필터로 보기</span>
                                    )}
                                  </button>
                                </div>
                                </div>
                              </td>
                            </tr>
                        </>
                      ))
                    }
                </Fragment>
              );
            })}
            {customers.length === 0 && !error && (
              <tr>
                <td
                  colSpan={totalColumns}
                  className="px-2 md:px-6 pt-10 pb-10 min-h-[200px] text-center text-neutral-60"
                >
                  결과가 없습니다
                </td>
              </tr>
            )}
            </tbody>
          </table>
        </div>
      )}
      </div>
      {hoverInfo && (
        <CustomersHoverPopover
          name={hoverInfo.name}
          notes={hoverInfo.notes}
          top={hoverInfo.top}
          left={hoverInfo.left}
          onMouseEnter={handlePopoverMouseEnter}
          onMouseLeave={handlePopoverMouseLeave}
        />
      )}
    </>
  );
}
