import { useState } from "react";
import { CustomerRegistrationRecord } from "@/types/statistics";
import { formatTableDateKR } from "@/utils/format";
import ApplyTableSkeleton from "./ApplyTableSkeleton";
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
}: RegistrationDetailTableProps) {
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);

  const handleReset = () => {
    setStartDate(null);
    setEndDate(null);
    // TODO: API 호출로 필터 초기화
  };

  const handleStartChange = (date: Date | null) => {
    setStartDate(date);
    // TODO: API 호출로 필터 적용
  };

  const handleEndChange = (date: Date | null) => {
    setEndDate(date);
    // TODO: API 호출로 필터 적용
  };

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-[18px] font-semibold text-foreground">상세 데이터</h3>
        <DateRangePicker
          startDate={startDate}
          endDate={endDate}
          onStartChange={handleStartChange}
          onEndChange={handleEndChange}
          onReset={handleReset}
          showInlineIcon
        />
      </div>

      <div className="overflow-hidden rounded-[12px]">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-neutral-20 h-[40px]">
              <th className="text-left px-4 pl-[30px] text-[16px] font-medium text-neutral-70 rounded-l-[8px]">날짜</th>
              <th className="text-left px-4 text-[16px] font-medium text-neutral-70">신청 건수</th>
              <th className="text-left px-4 text-[16px] font-medium text-neutral-70">직접입력</th>
              <th className="text-left px-4 text-[16px] font-medium text-neutral-70">엑셀 업로드</th>
              <th className="text-left px-4 text-[16px] font-medium text-neutral-70 rounded-r-[8px]">API</th>
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
                {Array.from({ length: 10 }).map((_, idx) => (
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
                  <td className="px-4 py-3 pl-[30px] text-[14px] font-medium text-foreground opacity-80">{formatTableDateKR(row.statisticsDate)}</td>
                  <td className="px-4 py-3 text-[14px] font-medium text-foreground opacity-80">{NUMBER_FORMATTER.format(row.totalCount)}건</td>
                  <td className="px-4 py-3 text-[14px] font-medium text-foreground opacity-80">{NUMBER_FORMATTER.format(row.directInputCount)}건</td>
                  <td className="px-4 py-3 text-[14px] font-semibold text-foreground opacity-80">{NUMBER_FORMATTER.format(row.excelUploadCount)}건</td>
                  <td className="px-4 py-3 text-[14px] font-semibold text-foreground opacity-80">{NUMBER_FORMATTER.format(row.apiCount)}건</td>
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

