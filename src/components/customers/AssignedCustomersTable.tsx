"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";

import Panel from "@/components/common/Panel";
import { useSelectedProjectId } from "@/hooks/useSelectedProjectId";
import { CustomersService } from "@/services/customers";
import type { RecentlyAssignedCustomer, RecentlyAssignedCustomersResponse } from "@/types/dashboard";

export default function AssignedCustomersTable() {
  const [projectId, projectReady] = useSelectedProjectId();
  const waitingForProject = !projectReady;
  const hasProject = projectReady && Boolean(projectId);
  const missingProject = projectReady && !projectId;

  const { data, isLoading, isError, isFetching } = useQuery<RecentlyAssignedCustomersResponse>({
    queryKey: ["dashboard", "recently-assigned", projectId],
    enabled: hasProject,
    queryFn: async () => {
      if (!projectId) throw new Error("프로젝트를 선택해주세요.");
      const res = await CustomersService.recentlyAssigned(projectId, { limit: 10 });
      return res.data;
    },
    staleTime: 60 * 1000,
    placeholderData: (previous) => previous,
  });

  const customers: RecentlyAssignedCustomer[] = data?.data.data ?? [];
  const totalCount = data?.data.totalCount ?? customers.length;

  const rows = useMemo(() => customers.slice(0, 10), [customers]);

  const loading = isLoading && !data;
  const showError = isError && !isFetching;
  const showEmpty = !loading && !showError && rows.length === 0;

  return (
    <Panel
      title={<span className="typo-title-2">새로 할당된 고객 ({totalCount})</span>}
      action={
        <button className="h-[34px] px-3 rounded-[5px] border border-border bg-card text-[14px] font-semibold tracking-[-0.02em] text-foreground transition-colors hover:bg-neutral-10">
          더보기
        </button>
      }
      className="rounded-[14px]"
      style={{ height: 420, boxShadow: "6px 6px 54px rgba(0,0,0,0.05)" }}
      bodyClassName="px-6 pb-0 pt-4 flex flex-col"
    >
      <div className="overflow-hidden rounded-[12px] grow" style={{ width: "100%" }}>
        {waitingForProject ? (
          <div className="flex h-full items-center justify-center">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-neutral-20 border-t-primary-60" />
          </div>
        ) : missingProject ? (
          <div className="flex h-full items-center justify-center text-[14px] text-neutral-60">
            프로젝트를 먼저 선택해주세요.
          </div>
        ) : loading ? (
          <LoadingTableSkeleton />
        ) : showError ? (
          <div className="flex h-full items-center justify-center text-[14px] text-danger-40">
            데이터를 불러오는 중 문제가 발생했습니다.
          </div>
        ) : showEmpty ? (
          <div className="flex h-full items-center justify-center text-[14px] text-neutral-60">
            최근에 배정된 고객이 없습니다.
          </div>
        ) : (
          <table className="w-full text-left border-separate border-spacing-0">
            <thead>
              <tr className="bg-neutral-20 text-neutral-60">
                {["이름", "전화번호", "유입경로", "배정 시각", "정보"].map((h, i) => (
                  <th
                    key={h}
                    className={`typo-title-2 font-bold px-6 h-[48px] text-neutral-70 ${i === 0 ? "rounded-l-[12px]" : i === 4 ? "rounded-r-[12px]" : ""}`}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="typo-body-3">
              {rows.map((customer) => {
                const contact = customer.contact1 ?? customer.contact2 ?? "-";
                const route = customer.applicationRoute ?? customer.mediaCompany ?? customer.site ?? "-";
                const assignedLabel = customer.assignedAt
                  ? formatDistanceToNow(new Date(customer.assignedAt), { addSuffix: true, locale: ko })
                  : "-";
                return (
                  <tr key={customer.id} className="border-b-[0.5px] border-border">
                    <td className="px-6 h-[58px] align-middle text-foreground opacity-80">{customer.name}</td>
                    <td className="px-6 h-[58px] align-middle text-foreground opacity-80">{contact}</td>
                    <td className="px-6 h-[58px] align-middle text-foreground opacity-80">{route}</td>
                    <td className="px-6 h-[58px] align-middle text-foreground opacity-80">{assignedLabel}</td>
                    <td className="px-6 h-[58px] align-middle">
                      <button className="h-[34px] px-3 rounded-[5px] bg-neutral-90 text-[14px] font-semibold tracking-[-0.02em] text-neutral-0 transition-colors">
                        고객정보
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </Panel>
  );
}

function LoadingTableSkeleton() {
  return (
    <div className="flex h-full flex-col justify-center gap-3">
      {Array.from({ length: 5 }).map((_, idx) => (
        <div key={idx} className="mx-6 flex items-center gap-4">
          {Array.from({ length: 5 }).map((__, colIdx) => (
            <span key={colIdx} className="h-5 flex-1 animate-pulse rounded bg-neutral-20" />
          ))}
        </div>
      ))}
    </div>
  );
}


