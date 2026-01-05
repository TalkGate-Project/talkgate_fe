"use client";

import { useState, useEffect } from "react";
import { CustomerRegistrationRecord } from "@/types/statistics";
import { formatTableDateKR } from "@/utils/format";
import DateRangePicker from "@/components/common/DateRangePicker";
import Pagination from "@/components/common/Pagination";
import TableSkeletonRow from "@/components/common/TableSkeletonRow";

const NUMBER_FORMATTER = new Intl.NumberFormat("ko-KR");

type RegistrationDetailTableProps = {
  rows: CustomerRegistrationRecord[];
  isLoading: boolean;
  isError: boolean;
  hasProject: boolean;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  startDate: Date | null;
  endDate: Date | null;
  onStartDateChange: (date: Date | null) => void;
  onEndDateChange: (date: Date | null) => void;
  onDateReset: () => void;
};

function TableEmptyState({ message }: { message: string }) {
  return (
    <div className="flex h-[160px] items-center justify-center text-[14px] text-neutral-60">
      {message}
    </div>
  );
}

export default function RegistrationDetailTable({
  rows,
  isLoading,
  isError,
  hasProject,
  currentPage,
  totalPages,
  onPageChange,
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  onDateReset,
}: RegistrationDetailTableProps) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const skeletonCount = isMobile ? 7 : 10;

  return (
    <>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <h3 className="text-[18px] font-semibold text-foreground">상세 데이터</h3>
        <div className="md:hidden border-b border-neutral-30 h-0 my-3">
          <br/>
        </div>
        <DateRangePicker
          startDate={startDate}
          endDate={endDate}
          onStartChange={onStartDateChange}
          onEndChange={onEndDateChange}
          onReset={onDateReset}
          showInlineIcon
        />
      </div>

      <div className="overflow-hidden rounded-[12px]">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-neutral-20 h-[40px]">
              <th className="text-left px-1 md:px-4 pl-3 md:pl-[30px] text-[13px] md:text-[16px] font-medium text-neutral-70 rounded-l-[8px]">날짜</th>
              <th className="text-left px-1 md:px-4 text-[13px] md:text-[16px] font-medium text-neutral-70">신청 건수</th>
              <th className="text-left px-1 md:px-4 text-[13px] md:text-[16px] font-medium text-neutral-70">직접입력</th>
              <th className="text-left px-1 md:px-4 text-[13px] md:text-[16px] font-medium text-neutral-70">엑셀 업로드</th>
              <th className="text-left px-1 md:px-4 text-[13px] md:text-[16px] font-medium text-neutral-70 rounded-r-[8px]">API</th>
            </tr>
          </thead>
          <tbody>
            {!hasProject ? (
              <tr>
                <td colSpan={5} className="text-center py-20 text-[14px] text-neutral-60">
                  프로젝트를 먼저 선택해주세요.
                </td>
              </tr>
            ) : isLoading ? (
              <>
                {Array.from({ length: skeletonCount }).map((_, idx) => (
                  <TableSkeletonRow
                    key={`skeleton-${idx}`}
                    columns={[
                      { width: "flex", paddingX: 7.5, className: "pl-[30px]" }, // 날짜
                      { width: "flex", paddingX: 4 }, // 신청 건수
                      { width: "flex", paddingX: 4 }, // 직접입력
                      { width: "flex", paddingX: 4 }, // 엑셀 업로드
                      { width: "flex", paddingX: 4 }, // API
                    ]}
                    rowHeight={48}
                  />
                ))}
              </>
            ) : isError ? (
              <tr>
                <td colSpan={5} className="text-center py-20 text-[14px] text-danger-40">
                  데이터를 불러오는 중 오류가 발생했습니다.
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-20 text-[14px] text-neutral-60">
                  표시할 데이터가 없습니다.
                </td>
              </tr>
            ) : (
              rows.map((row, index) => (
                <tr key={row.id} className="border-b border-neutral-30/40 dark:!border-[#44444455]">
                  <td className="px-1 md:px-4 py-3 pl-3 md:pl-[30px] text-[14px] font-medium text-foreground opacity-80">{formatTableDateKR(row.statisticsDate)}</td>
                  <td className="px-1 md:px-4 py-3 text-[14px] font-medium text-foreground opacity-80">{NUMBER_FORMATTER.format(row.totalCount)}건</td>
                  <td className="px-1 md:px-4 py-3 text-[14px] font-medium text-foreground opacity-80">{NUMBER_FORMATTER.format(row.directInputCount)}건</td>
                  <td className="px-1 md:px-4 py-3 text-[14px] font-semibold text-foreground opacity-80">{NUMBER_FORMATTER.format(row.excelUploadCount)}건</td>
                  <td className="px-1 md:px-4 py-3 text-[14px] font-semibold text-foreground opacity-80">{NUMBER_FORMATTER.format(row.apiCount)}건</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {hasProject && rows.length > 0 && (
        <div className="mt-4 flex justify-center">
          <Pagination
            page={currentPage}
            totalPages={totalPages}
            onPageChange={onPageChange}
            disabled={isLoading}
          />
        </div>
      )}
    </>
  );
}

