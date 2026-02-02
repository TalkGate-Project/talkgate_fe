"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";

import Panel from "@/components/common/Panel";
import { useRouter } from "next/navigation";
import { useSelectedProjectId } from "@/hooks/useSelectedProjectId";
import { CustomersService } from "@/services/customers";
import type {
  RecentlyAssignedCustomer,
  RecentlyAssignedCustomersResponse,
} from "@/types/dashboard";
import Pagination from "@/components/common/Pagination";
import CustomerDetailModal from "@/components/customers/CustomerDetailModal";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import TableSkeletonRow from "@/components/common/TableSkeletonRow";

const HEADER_LABELS = ["이름", "신청경로", "매체사", "사이트", "등록시간", ""];
const ROW_LIMIT = 10;

export default function AssignedCustomersTable() {
  const router = useRouter();
  const [projectId, projectReady] = useSelectedProjectId();
  const waitingForProject = !projectReady;
  const hasProject = projectReady && Boolean(projectId);
  const missingProject = projectReady && !projectId;
  const [page, setPage] = useState(1);
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(
    null
  );

  useEffect(() => {
    setPage(1);
  }, [projectId]);

  const { data, isLoading, isError, isFetching } =
    useQuery<RecentlyAssignedCustomersResponse>({
      queryKey: ["dashboard", "recently-assigned", projectId, page],
      enabled: hasProject,
      queryFn: async () => {
        if (!projectId) throw new Error("프로젝트를 선택해주세요.");
        const res = await CustomersService.recentlyAssigned(projectId, {
          limit: ROW_LIMIT,
          page,
        });
        return res.data;
      },
      staleTime: 60 * 1000,
      placeholderData: (previous) => previous,
    });

  const meta = data?.data;
  const rawCustomers = meta?.customers;
  const customers: RecentlyAssignedCustomer[] = Array.isArray(rawCustomers)
    ? rawCustomers
    : [];
  const totalCount = meta?.total ?? customers.length;
  const limit = meta?.limit ?? ROW_LIMIT;
  const computedTotalPages =
    limit > 0 ? Math.ceil(Math.max(1, totalCount) / limit) : 1;
  const totalPages = meta?.totalPages ?? computedTotalPages;

  const rows = customers;
  const canPaginate = hasProject && !missingProject;

  const loading = isLoading && !data;
  const showError = isError && !isFetching;
  const showEmpty = !loading && !showError && rows.length === 0;

  return (
    <Panel
      title={<span className="text-[14px] md:typo-title-4 font-semibold">새로 배정된 고객</span>}
      action={
        <button
          onClick={() => router.push("/customers")}
          className="cursor-pointer h-[24px] md:h-[34px] w-[42px] md:w-auto md:px-3 rounded-[5px] border border-border bg-card text-[11px] md:text-[14px] font-semibold tracking-[-0.02em] text-foreground transition-colors hover:bg-neutral-10"
        >
          더보기
        </button>
      }
      className="rounded-[14px]"
      style={{ height: 420, boxShadow: "6px 6px 54px 0px rgba(0, 0, 0, 0.05)" }}
      headerClassName="flex items-center justify-between px-4 md:px-7 pt-4 md:pt-[22px]"
      bodyClassName="px-4 md:px-7 pb-4 md:pb-6 pt-4 md:pt-4 flex flex-col gap-4 min-h-0"
    >
      <div
        className="flex-1 min-h-0 overflow-y-auto rounded-[12px] bg-card"
        style={{ width: "100%" }}
      >
        {waitingForProject ? (
          <div className="flex h-full items-center justify-center">
            <LoadingSpinner size="2xl" />
          </div>
        ) : missingProject ? (
          <div className="flex h-full items-center justify-center text-[14px] text-neutral-60 pb-10">
            프로젝트를 먼저 선택해주세요.
          </div>
        ) : loading ? (
          <LoadingTableSkeleton />
        ) : showError ? (
          <div className="flex h-full items-center justify-center text-[14px] text-danger-40">
            데이터를 불러오는 중 문제가 발생했습니다.
          </div>
        ) : showEmpty ? (
          <div className="flex h-full items-center justify-center text-[14px] text-neutral-60 pb-10">
            최근에 배정된 고객이 없습니다.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-neutral-20 text-neutral-60">
                  {HEADER_LABELS.map((label, index) => (
                    <th
                      key={label}
                      className={`text-[12px] md:typo-title-4 font-medium h-[36px] md:h-[40px] px-2 md:px-6 text-neutral-70 whitespace-nowrap ${
                        index === 0
                          ? "rounded-l-[8px]"
                          : index === HEADER_LABELS.length - 1
                          ? "rounded-r-[8px] w-[40px] md:w-[90px]"
                          : ""
                      }`}
                    >
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="typo-body-3">
                {rows.map((customer) => {
                  const route = customer.applicationRoute || "-";
                  const media = customer.mediaCompany || "-";
                  const site = customer.site || "-";
                  const assignedLabel = customer.applicationDate
                    ? formatDistanceToNow(new Date(customer.applicationDate), {
                        addSuffix: true,
                        locale: ko,
                      })
                    : "-";

                  return (
                    <tr
                      key={customer.id}
                      className="border-b border-neutral-30/40 dark:!border-[#44444455] text-[13px] md:text-[16px]"
                    >
                      <td className="px-2 md:px-6 h-[52px] md:h-[58px] align-middle text-neutral-90 opacity-80">
                        <span className="block truncate max-w-[80px] md:max-w-none">
                          {customer.name}
                        </span>
                      </td>
                      <td className="px-2 md:px-6 h-[52px] md:h-[58px] align-middle text-neutral-90 opacity-80">
                        <span className="block truncate max-w-[100px] md:max-w-none">
                          {route}
                        </span>
                      </td>
                      <td className="px-2 md:px-6 h-[52px] md:h-[58px] align-middle text-neutral-90 opacity-80">
                        <span className="block truncate max-w-[80px] md:max-w-none">
                          {media}
                        </span>
                      </td>
                      <td className="px-2 md:px-6 h-[52px] md:h-[58px] align-middle text-neutral-90 opacity-80">
                        <span className="block truncate max-w-[120px] md:max-w-none">
                          {site}
                        </span>
                      </td>
                      <td className="px-2 md:px-6 h-[52px] md:h-[58px] align-middle text-neutral-90 whitespace-nowrap">
                        {assignedLabel}
                      </td>
                      <td className="pl-2 md:pl-6 w-[40px] md:w-[90px] h-[52px] md:h-[58px] align-middle">
                        <button
                          onClick={() => setSelectedCustomerId(customer.id)}
                          className="cursor-pointer inline-flex items-center justify-center w-full md:w-[90px]"
                        >
                          <svg
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                            className="md:w-6 md:h-6"
                          >
                            <path
                              d="M9 5L16 12L9 19"
                              stroke="#B0B0B0"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="dark:stroke-neutral-50"
                            />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <div className="flex-shrink-0 flex items-center justify-center">
        <Pagination
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
          disabled={
            !canPaginate || loading || waitingForProject || missingProject
          }
          className="justify-center"
        />
      </div>
      <CustomerDetailModal
        open={selectedCustomerId !== null}
        onClose={() => setSelectedCustomerId(null)}
        customerId={selectedCustomerId}
      />
    </Panel>
  );
}

function LoadingTableSkeleton() {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-neutral-20 text-neutral-60">
            {HEADER_LABELS.map((label, index) => (
              <th
                key={label}
                className={`text-[12px] md:typo-title-4 font-medium h-[36px] md:h-[40px] px-2 md:px-6 text-neutral-70 whitespace-nowrap ${
                  index === 0
                    ? "rounded-l-[8px]"
                    : index === HEADER_LABELS.length - 1
                    ? "rounded-r-[8px] w-[40px] md:w-[90px]"
                    : ""
                }`}
              >
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="typo-body-3">
          {Array.from({ length: 4 }).map((_, idx) => (
            <TableSkeletonRow
              key={`skeleton-${idx}`}
              columns={[
                { width: "flex", paddingX: 2 }, // 이름
                { width: "flex", paddingX: 2 }, // 신청경로
                { width: "flex", paddingX: 2 }, // 매체사
                { width: "flex", paddingX: 2 }, // 사이트
                { width: "flex", paddingX: 2 }, // 등록시간
                { width: 40, paddingX: 2 }, // 화살표 버튼
              ]}
              rowHeight={52}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
