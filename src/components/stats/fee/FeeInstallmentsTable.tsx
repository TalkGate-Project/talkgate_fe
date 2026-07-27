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
  /** 담당자 열은 법무법인 프로젝트에서만 노출 (영업점 프로젝트는 하위 담당자 개념이 없음) */
  showAssigneeColumn: boolean;
};

export default function FeeInstallmentsTable({
  items,
  isLoading,
  isError,
  hasProject,
  currentPage,
  totalPages,
  onPageChange,
  showAssigneeColumn,
}: FeeInstallmentsTableProps) {
  const columnCount = showAssigneeColumn ? 6 : 5;

  return (
    <>
      {/* 열이 다 들어가기엔 좁아 피그마처럼 가로 스크롤(overflow-hidden이면 상태 열이 잘림).
          md:min-w-0로 태블릿 구간 바닥을 없앴더니 진짜로 넘치는 대신 표가 눌려서, 상태 열
          라벨(2글자)이 폭 부족으로 세로로 쌓여 보이는 문제가 있었다 — 항상 min-w-[560px]를
          유지해 그 구간에서도 overflow-x-auto가 실제로 스크롤을 맡도록 한다. */}
      <div className="overflow-x-auto rounded-[8px] md:rounded-[12px]">
        <table className="w-full min-w-[560px] border-separate border-spacing-0">
          <thead>
            <tr className="h-[40px]">
              <th className="bg-neutral-20 text-left px-2 md:px-4 pl-3 md:pl-[30px] text-[13px] md:text-[16px] font-medium text-neutral-70 rounded-l-[8px] md:rounded-l-[12px] w-[110px] md:w-[130px] flex-shrink-0">
                날짜
              </th>
              <th className="bg-neutral-20 text-left px-2 md:px-4 text-[13px] md:text-[16px] font-medium text-neutral-70 w-[140px] md:w-[170px]">
                고객명
              </th>
              {showAssigneeColumn && (
                <th className="bg-neutral-20 text-left px-2 md:px-4 text-[13px] md:text-[16px] font-medium text-neutral-70 w-[160px] md:w-[190px]">
                  담당자
                </th>
              )}
              <th className="bg-neutral-20 text-left px-2 md:px-4 text-[13px] md:text-[16px] font-medium text-neutral-70 w-[90px] md:w-[110px]">
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
                <td colSpan={columnCount} className="text-center py-20 text-[14px] text-neutral-60">
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
                      { width: 140, paddingX: 4 },
                      ...(showAssigneeColumn ? [{ width: 160, paddingX: 4 }] : []),
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
                <td colSpan={columnCount} className="text-center py-20 text-[14px] text-danger-40">
                  납부 내역을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={columnCount} className="text-center py-20 text-[14px] text-neutral-60">
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
                    {showAssigneeColumn && (
                      <td className="px-2 md:px-4 min-w-0">
                        {item.sourceMemberName ? (
                          <p className="truncate">
                            <span className="text-[14px] font-semibold leading-[17px] text-neutral-90 opacity-80">
                              {item.sourceMemberName}
                            </span>
                            {item.sourceProjectName && (
                              <span className="ml-1 text-[14px] font-medium leading-[17px] text-neutral-60 opacity-80">
                                {item.sourceProjectName}
                              </span>
                            )}
                          </p>
                        ) : (
                          <span className="block truncate text-[13px] md:text-[15px] text-neutral-80">
                            {item.sourceProjectName || "-"}
                          </span>
                        )}
                      </td>
                    )}
                    <td className="px-2 md:px-4 whitespace-nowrap">
                      {item.installmentCount ? (
                        <span className="text-[13px] md:text-[15px]">
                          <span className="font-semibold text-neutral-90 opacity-80">
                            {item.installmentNumber}
                          </span>
                          <span className="font-medium text-neutral-60 opacity-80">
                            /{item.installmentCount}회차
                          </span>
                        </span>
                      ) : (
                        <span className="text-[13px] md:text-[15px] text-neutral-80">
                          {item.installmentNumber}회차
                        </span>
                      )}
                    </td>
                    <td className="px-2 md:px-4 text-[13px] md:text-[15px] font-medium text-neutral-90 whitespace-nowrap">
                      {formatWonAsManwonCompact(item.amount)}
                    </td>
                    <td className="px-2 md:px-4 pr-3 md:pr-[30px] whitespace-nowrap">
                      <span
                        className={`inline-flex items-center justify-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-[12px] md:text-[13px] font-medium ${pill.className}`}
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
