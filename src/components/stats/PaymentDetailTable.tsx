"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";

import DateRangePicker from "@/components/common/DateRangePicker";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import Pagination from "@/components/common/Pagination";
import SortIcon from "@/components/common/SortIcon";
import CustomerDetailModal from "@/components/customers/CustomerDetailModal";
import TeamMemberInfoModal from "@/components/settings/teamManagement/TeamMemberInfoModal";
import { useSelectedProjectId } from "@/hooks/useSelectedProjectId";
import { StatisticsService } from "@/services/statistics";
import type {
  CustomerPaymentDetailRecord,
  CustomerPaymentDetailsResponse,
  CustomerPaymentDetailsSortField,
} from "@/types/statistics";

const PAGE_SIZE = 10;
const NUMBER_FORMATTER = new Intl.NumberFormat("ko-KR");
const TABLE_GRID_TEMPLATE =
  "minmax(150px,1.3fr) minmax(150px,1.3fr) minmax(180px,1.35fr) minmax(140px,1fr) minmax(110px,0.85fr)";

function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDisplayDate(value: string): string {
  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    return value;
  }

  const year = parsedDate.getFullYear();
  const month = `${parsedDate.getMonth() + 1}`.padStart(2, "0");
  const day = `${parsedDate.getDate()}`.padStart(2, "0");

  return `${year}.${month}.${day}`;
}

function formatCurrency(value: number): string {
  return `${NUMBER_FORMATTER.format(value)}원`;
}

function getDefaultRange() {
  const end = new Date();
  const start = new Date(end);
  start.setDate(start.getDate() - 6);
  return { startDate: formatDate(start), endDate: formatDate(end) };
}

function getDefaultSortOrder(sortField: CustomerPaymentDetailsSortField) {
  return sortField === "memberName" ? "ASC" : "DESC";
}

function formatPaymentMethod(paymentMethod: string): string {
  switch (paymentMethod) {
    case "creditCard":
      return "카드";
    case "bankTransfer":
      return "계좌이체";
    case "cash":
      return "현금";
    default:
      return paymentMethod || "-";
  }
}

export default function PaymentDetailTable() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [projectId, projectReady] = useSelectedProjectId();
  const waitingForProject = !projectReady;
  const hasProject = projectReady && Boolean(projectId);
  const missingProject = projectReady && !projectId;
  const initialRange = getDefaultRange();
  const initialSortField =
    (searchParams.get("payDetailSortField") as CustomerPaymentDetailsSortField | null) ??
    "paymentDate";
  const initialSortOrder =
    (searchParams.get("payDetailSortOrder") as "ASC" | "DESC" | null) ??
    getDefaultSortOrder(initialSortField);
  const initialPage = Number.parseInt(searchParams.get("payDetailPage") ?? "1", 10);

  const [startDate, setStartDate] = useState<string>(initialRange.startDate);
  const [endDate, setEndDate] = useState<string>(initialRange.endDate);
  const [sortField, setSortField] =
    useState<CustomerPaymentDetailsSortField>(initialSortField);
  const [sortOrder, setSortOrder] = useState<"ASC" | "DESC">(initialSortOrder);
  const [page, setPage] = useState(Number.isFinite(initialPage) && initialPage > 0 ? initialPage : 1);
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
  const [selectedMemberId, setSelectedMemberId] = useState<number | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());

    if (page > 1) {
      params.set("payDetailPage", String(page));
    } else {
      params.delete("payDetailPage");
    }

    if (sortField === "paymentDate") {
      params.delete("payDetailSortField");
    } else {
      params.set("payDetailSortField", sortField);
    }

    if (sortField === "paymentDate" && sortOrder === "DESC") {
      params.delete("payDetailSortOrder");
    } else {
      params.set("payDetailSortOrder", sortOrder);
    }

    router.replace(`?${params.toString()}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, sortField, sortOrder]);

  const detailQuery = useQuery<CustomerPaymentDetailsResponse>({
    queryKey: [
      "stats",
      "payment",
      "detail",
      { projectId, startDate, endDate, page, sortField, sortOrder },
    ],
    enabled: hasProject,
    placeholderData: (previous) => previous,
    queryFn: async () => {
      if (!projectId) {
        throw new Error("프로젝트를 선택해주세요.");
      }

      const response = await StatisticsService.customerPaymentDetails({
        projectId,
        startDate,
        endDate,
        sortField,
        sortOrder,
        page,
        limit: PAGE_SIZE,
      });

      return response.data;
    },
  });

  const payload = detailQuery.data?.data;
  const rows: CustomerPaymentDetailRecord[] =
    payload?.data === null ? [] : (payload?.data ?? []);
  const totalCount = payload?.totalCount ?? 0;
  const limit = payload?.limit ?? PAGE_SIZE;
  const totalPages = Math.max(1, Math.ceil(totalCount / limit));

  const showSkeleton = detailQuery.isLoading && !detailQuery.data;
  const showError = detailQuery.isError && !detailQuery.isFetching;
  const showEmpty =
    !showSkeleton && !showError && (payload?.data === null || rows.length === 0);

  const handleSort = (field: CustomerPaymentDetailsSortField) => {
    if (sortField === field) {
      setSortOrder((previous) => (previous === "DESC" ? "ASC" : "DESC"));
    } else {
      setSortField(field);
      setSortOrder(getDefaultSortOrder(field));
    }

    setPage(1);
  };

  const header = (
    <div className="mb-3 flex flex-col md:flex-row md:items-center justify-between gap-3">
      <h3 className="text-[16px] font-semibold text-foreground">건별 매출 현황</h3>
      <DateRangePicker
        startDate={startDate ? new Date(startDate) : null}
        endDate={endDate ? new Date(endDate) : null}
        onStartChange={(date) => {
          setStartDate(date ? formatDate(date) : "");
          setPage(1);
        }}
        onEndChange={(date) => {
          setEndDate(date ? formatDate(date) : "");
          setPage(1);
        }}
        onReset={() => {
          const range = getDefaultRange();
          setStartDate(range.startDate);
          setEndDate(range.endDate);
          setPage(1);
        }}
        showInlineIcon
      />
    </div>
  );

  if (waitingForProject) {
    return (
      <div className="mt-1">
        {header}
        <div className="flex h-[160px] items-center justify-center rounded-[12px] border border-dashed border-neutral-30 bg-card px-[30px]">
          <LoadingSpinner size="xl" />
        </div>
      </div>
    );
  }

  if (missingProject) {
    return (
      <div className="mt-1">
        {header}
        <div className="flex h-[160px] items-center justify-center rounded-[12px] border border-dashed border-neutral-30 bg-card px-[30px] text-[14px] text-neutral-60">
          프로젝트를 먼저 선택해주세요.
        </div>
      </div>
    );
  }

  return (
    <div>
      {header}
      <div className="overflow-x-auto">
        <div
          className="h-[40px] min-w-[840px] bg-neutral-20 rounded-[8px] md:rounded-[12px] grid items-center pl-5 md:px-[30px] text-[13px] md:text-[16px] text-neutral-70 font-medium"
          style={{
            gridTemplateColumns: TABLE_GRID_TEMPLATE,
          }}
        >
          <div>고객이름</div>
          <button
            type="button"
            className="flex items-center gap-1 cursor-pointer text-left"
            onClick={() => handleSort("memberName")}
          >
            매출담당자
            <SortIcon
              state={
                sortField === "memberName"
                  ? sortOrder === "ASC"
                    ? "asc"
                    : "desc"
                  : "none"
              }
            />
          </button>
          <button
            type="button"
            className="flex items-center gap-1 cursor-pointer text-left"
            onClick={() => handleSort("amount")}
          >
            결제금액
            <SortIcon
              state={
                sortField === "amount"
                  ? sortOrder === "ASC"
                    ? "asc"
                    : "desc"
                  : "none"
              }
            />
          </button>
          <div>설명</div>
          <button
            type="button"
            className="flex items-center gap-1 cursor-pointer text-left"
            onClick={() => handleSort("paymentDate")}
          >
            날짜
            <SortIcon
              state={
                sortField === "paymentDate"
                  ? sortOrder === "ASC"
                    ? "asc"
                    : "desc"
                  : "none"
              }
            />
          </button>
        </div>
        <div className="min-w-[840px] min-h-[280px] divide-y divide-[#44444433] bg-card border-b border-[#44444455]">
          {showSkeleton &&
            Array.from({ length: PAGE_SIZE }).map((_, index) => (
              <div
                key={`payment-detail-skeleton-${index}`}
                className="h-[56px] grid items-center pl-5 md:px-[30px] border-b border-[#E2E2E2] dark:!border-[#44444455] animate-pulse"
                style={{
                  gridTemplateColumns: TABLE_GRID_TEMPLATE,
                }}
              >
                <div className="h-4 w-[70%] rounded bg-neutral-20" />
                <div className="h-4 w-[70%] rounded bg-neutral-20" />
                <div className="h-4 w-[80%] rounded bg-neutral-20" />
                <div className="h-4 w-[85%] rounded bg-neutral-20" />
                <div className="h-4 w-[65%] rounded bg-neutral-20" />
              </div>
            ))}
          {showError && (
            <div className="flex h-[120px] items-center justify-center text-[14px] text-danger-40">
              결제 통계를 불러오는 중 오류가 발생했습니다.
            </div>
          )}
          {showEmpty && (
            <div className="flex h-[120px] items-center justify-center text-[14px] text-neutral-60">
              {payload?.data === null
                ? "결제 통계 데이터가 없습니다."
                : "표시할 데이터가 없습니다."}
            </div>
          )}
          {!showSkeleton &&
            !showError &&
            rows.map((row) => (
              <div
                key={row.id}
                className="h-[56px] grid items-center pl-5 md:px-[30px] text-[14px] text-foreground opacity-80"
                style={{
                  gridTemplateColumns: TABLE_GRID_TEMPLATE,
                }}
              >
                <button
                  type="button"
                  onClick={() => setSelectedCustomerId(row.customerId)}
                  className="truncate pr-4 text-left cursor-pointer hover:underline"
                >
                  {row.customerName}
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedMemberId(row.memberId)}
                  className="truncate pr-4 text-left cursor-pointer hover:underline"
                >
                  {row.memberName}
                </button>
                <div className="truncate pr-4">
                  {`${formatPaymentMethod(row.paymentMethod)} ${formatCurrency(row.amount)}`}
                </div>
                <div className="truncate pr-4">{row.description?.trim() || "-"}</div>
                <div className="truncate pr-4">
                  {formatDisplayDate(row.paymentDate)}
                </div>
              </div>
            ))}
        </div>
      </div>
      <div className="mt-6 flex justify-center">
        <Pagination
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
          disabled={detailQuery.isLoading}
        />
      </div>
      <CustomerDetailModal
        open={selectedCustomerId !== null}
        onClose={() => setSelectedCustomerId(null)}
        customerId={selectedCustomerId}
      />
      {selectedMemberId !== null && (
        <TeamMemberInfoModal
          open={selectedMemberId !== null}
          memberId={selectedMemberId}
          onClose={() => setSelectedMemberId(null)}
          projectId={projectId}
        />
      )}
    </div>
  );
}
