import { CustomerRegistrationRecord } from "@/types/statistics";
import { formatTableDate } from "@/utils/format";
import ApplyTableSkeleton from "./ApplyTableSkeleton";

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
  const pageNumbers = Array.from({ length: totalPages }, (_, idx) => idx + 1);

  return (
    <>
      <div className="flex items-center justify-between">
        <h3 className="text-[18px] font-semibold text-neutral-90">상세 데이터</h3>
        <div className="flex items-center gap-3">
          <div className="w-[175px] h-[34px] border border-border rounded-[5px] px-2 grid grid-cols-[1fr_auto] items-center text-[14px]">
            <span className="opacity-90">연도 . 월 . 일</span>
            <span className="w-5 h-5 border-2 border-neutral-40 rounded" />
          </div>
          <span className="mx-1 text-neutral-60">-</span>
          <div className="w-[175px] h-[34px] border border-border rounded-[5px] px-2 grid grid-cols-[1fr_auto] items-center text-[14px]">
            <span className="opacity-90">연도 . 월 . 일</span>
            <span className="w-5 h-5 border-2 border-neutral-40 rounded" />
          </div>
        </div>
      </div>

      <div className="mt-4 h-px bg-neutral-30" />

      <div className="mt-4">
        {/* Table Header */}
        <div className="grid grid-cols-5 text-[16px] text-neutral-60 font-semibold border-b border-neutral-30">
          <div className="px-4 py-2">날짜</div>
          <div className="px-4 py-2">신청 건수</div>
          <div className="px-4 py-2">직접입력</div>
          <div className="px-4 py-2">엑셀 업로드</div>
          <div className="px-4 py-2">API</div>
        </div>

        {/* Table Body */}
        <div className="min-h-[240px]">
          {!hasProject ? (
            <TableEmptyState message="프로젝트를 먼저 선택해주세요." />
          ) : isLoading ? (
            <div className="flex h-[160px] items-center justify-center">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-neutral-20 border-t-primary-60" />
            </div>
          ) : isError ? (
            <div className="flex h-[160px] items-center justify-center text-[14px] text-danger-40">
              데이터를 불러오는 중 오류가 발생했습니다.
            </div>
          ) : rows.length === 0 ? (
            <TableEmptyState message="표시할 데이터가 없습니다." />
          ) : (
            rows.map((row) => (
              <div key={row.id} className="grid grid-cols-5 text-[14px] text-neutral-90 opacity-80 border-b border-neutral-30">
                <div className="px-4 py-3">{formatTableDate(row.statisticsDate)}</div>
                <div className="px-4 py-3">{NUMBER_FORMATTER.format(row.totalCount)}건</div>
                <div className="px-4 py-3">{NUMBER_FORMATTER.format(row.directInputCount)}건</div>
                <div className="px-4 py-3">{NUMBER_FORMATTER.format(row.excelUploadCount)}건</div>
                <div className="px-4 py-3">{NUMBER_FORMATTER.format(row.apiCount)}건</div>
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        {hasProject && rows.length > 0 && (
          <div className="mt-3 flex items-center justify-center gap-2">
            <button
              className="w-8 h-8 rounded-full grid place-items-center border-2 border-neutral-40 rotate-90 disabled:border-neutral-30 disabled:text-neutral-40"
              onClick={() => onPageChange(Math.max(1, currentPage - 1))}
              disabled={currentPage <= 1}
            />
            {pageNumbers.map((num) => (
              <button
                key={num}
                className={`w-8 h-8 rounded-full grid place-items-center ${num === currentPage ? 'bg-neutral-90 text-neutral-0' : 'text-neutral-60'}`}
                onClick={() => onPageChange(num)}
              >
                {num}
              </button>
            ))}
            <button
              className="w-8 h-8 rounded-full grid place-items-center border-2 border-neutral-40 -rotate-90 disabled:border-neutral-30 disabled:text-neutral-40"
              onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage >= totalPages}
            />
          </div>
        )}
      </div>
    </>
  );
}

