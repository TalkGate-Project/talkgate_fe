"use client";

import type { FeeStatisticsInstallmentItem } from "@/types/analysisFeeStatistics";
import Pagination from "@/components/common/Pagination";
import TableSkeletonRow from "@/components/common/TableSkeletonRow";
import {
  formatFeeDateDot,
  formatWonAsManwonCompact,
  getFeeStatusPill,
} from "./feeFormat";

type FeeInstallmentsTableProps = {
  items: FeeStatisticsInstallmentItem[];
  isLoading: boolean;
  isError: boolean;
  hasProject: boolean;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
};

export default function FeeInstallmentsTable({
  items,
  isLoading,
  isError,
  hasProject,
  currentPage,
  totalPages,
  onPageChange,
}: FeeInstallmentsTableProps) {
  return (
    <>
      {/* 모바일: 열이 다 들어가기엔 좁아 피그마처럼 가로 스크롤(overflow-hidden이면 상태 열이 잘림) */}
      <div className="overflow-x-auto rounded-[8px] md:rounded-[12px]">
        <table className="w-full min-w-[560px] border-separate border-spacing-0 md:min-w-0">
          <thead>
            <tr className="h-[40px]">
              <th className="bg-neutral-20 text-left px-2 md:px-4 pl-3 md:pl-[30px] text-[13px] md:text-[16px] font-medium text-neutral-70 rounded-l-[8px] md:rounded-l-[12px] w-[110px] md:w-[130px] flex-shrink-0">
                날짜
              </th>
              <th className="bg-neutral-20 text-left px-2 md:px-4 text-[13px] md:text-[16px] font-medium text-neutral-70">
                고객명
              </th>
              <th className="bg-neutral-20 text-left px-2 md:px-4 text-[13px] md:text-[16px] font-medium text-neutral-70">
                담당자
              </th>
              <th className="bg-neutral-20 text-left px-2 md:px-4 text-[13px] md:text-[16px] font-medium text-neutral-70 w-[80px] md:w-[100px]">
                회차
              </th>
              <th className="bg-neutral-20 text-left px-2 md:px-4 text-[13px] md:text-[16px] font-medium text-neutral-70 w-[90px] md:w-[120px]">
                금액
              </th>
              <th className="bg-neutral-20 text-left px-2 md:px-4 pr-3 md:pr-[30px] text-[13px] md:text-[16px] font-medium text-neutral-70 rounded-r-[8px] md:rounded-r-[12px] w-[80px] md:w-[100px]">
                상태
              </th>
            </tr>
          </thead>
          <tbody>
            {!hasProject ? (
              <tr>
                <td colSpan={6} className="text-center py-20 text-[14px] text-neutral-60">
                  프로젝트를 먼저 선택해주세요.
                </td>
              </tr>
            ) : isLoading ? (
              <>
                {Array.from({ length: 8 }).map((_, idx) => (
                  <TableSkeletonRow
                    key={idx}
                    columns={[
                      { width: 100, paddingX: 4 },
                      { width: "flex", paddingX: 4 },
                      { width: "flex", paddingX: 4 },
                      { width: 80, paddingX: 4 },
                      { width: 90, paddingX: 4 },
                      { width: 80, paddingX: 4 },
                    ]}
                    rowHeight={52}
                  />
                ))}
              </>
            ) : isError ? (
              <tr>
                <td colSpan={6} className="text-center py-20 text-[14px] text-danger-40">
                  납부 내역을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-20 text-[14px] text-neutral-60">
                  조회된 납부 내역이 없습니다.
                </td>
              </tr>
            ) : (
              items.map((item) => {
                const pill = getFeeStatusPill(item.status);
                return (
                  <tr key={item.id} className="h-[52px] border-b border-neutral-20">
                    <td className="px-2 md:px-4 pl-3 md:pl-[30px] text-[13px] md:text-[15px] text-neutral-80 whitespace-nowrap">
                      {formatFeeDateDot(item.scheduledDate)}
                    </td>
                    <td className="px-2 md:px-4 text-[13px] md:text-[15px] text-neutral-90 min-w-0">
                      <span className="block truncate">{item.customerName || "-"}</span>
                    </td>
                    <td className="px-2 md:px-4 text-[13px] md:text-[15px] text-neutral-80 min-w-0">
                      {/* TODO: assignee name when API provides it — 현재는 sourceProjectName만 표시 */}
                      <span className="block truncate">
                        {item.sourceProjectName || "-"}
                      </span>
                    </td>
                    <td className="px-2 md:px-4 text-[13px] md:text-[15px] text-neutral-80 whitespace-nowrap">
                      {/* TODO: total installmentCount when API provides it (예: 3/8회차) */}
                      {item.installmentNumber}회차
                    </td>
                    <td className="px-2 md:px-4 text-[13px] md:text-[15px] font-medium text-neutral-90 whitespace-nowrap">
                      {formatWonAsManwonCompact(item.amount)}
                    </td>
                    <td className="px-2 md:px-4 pr-3 md:pr-[30px]">
                      <span
                        className={`inline-flex items-center justify-center rounded-full px-2.5 py-0.5 text-[12px] md:text-[13px] font-medium ${pill.className}`}
                      >
                        {pill.label}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {hasProject && !isLoading && !isError && totalPages > 0 && (
        <div className="mt-6 flex justify-center">
          <Pagination
            page={currentPage}
            totalPages={totalPages}
            onPageChange={onPageChange}
          />
        </div>
      )}
    </>
  );
}
