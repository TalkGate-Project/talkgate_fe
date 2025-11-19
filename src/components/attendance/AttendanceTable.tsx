import TableSkeleton from "@/components/common/TableSkeleton";
import Pagination from "@/components/common/Pagination";
import { AttendanceItem } from "@/types/attendance";
import { formatHm, computeWorkTime } from "@/utils/attendance";

interface AttendanceTableProps {
  rows: AttendanceItem[];
  loading: boolean;
  error: string | null;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onRowClick: (employee: AttendanceItem) => void;
  onFilterClick: () => void;
}

export default function AttendanceTable({
  rows,
  loading,
  error,
  currentPage,
  totalPages,
  onPageChange,
  onRowClick,
  onFilterClick,
}: AttendanceTableProps) {
  return (
    <div className="bg-card rounded-[14px] p-7 shadow-[0_13px_61px_rgba(169,169,169,0.12)]">
      {/* 헤더 영역 */}
      <div className="flex items-center gap-3 mb-[30px]">
        <h2 className="text-[18px] font-semibold text-neutral-90">
          출퇴근 현황
        </h2>
        <button
          onClick={onFilterClick}
          className="cursor-pointer w-6 h-6 border border-border rounded-[5px] flex items-center justify-center hover:bg-neutral-10 transition-colors"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 26 26"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M7 8C7 7.45 7.45 7 8 7H18C18.55 7 19 7.45 19 8V9.25C19 9.52 18.89 9.77 18.71 9.96L14.63 14.04C14.44 14.23 14.33 14.48 14.33 14.75V16.33L11.67 19V14.75C11.67 14.48 11.56 14.23 11.37 14.04L7.29 9.96C7.11 9.77 7 9.52 7 9.25V8Z"
              stroke="var(--neutral-50)"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>

      {/* 테이블 헤더 */}
      <div className="bg-neutral-20 rounded-[8px] h-[40px] flex items-center px-[30px]">
        <div className="flex-1 text-[16px] font-medium leading-[1] text-neutral-60">
          이름
        </div>
        <div className="flex-1 text-[16px] font-medium leading-[1] text-neutral-60">
          팀
        </div>
        <div className="flex-1 text-[16px] font-medium leading-[1] text-neutral-60">
          직급
        </div>
        <div className="flex-1 text-[16px] font-medium leading-[1] text-neutral-60">
          출근시간
        </div>
        <div className="flex-1 text-[16px] font-medium leading-[1] text-neutral-60">
          퇴근시간
        </div>
        <div className="flex-1 text-[16px] font-medium leading-[1] text-neutral-60">
          근무시간
        </div>
      </div>

      {/* 테이블 본문 */}
      <div>
        {loading ? (
          <TableSkeleton
            rows={8}
            columns={["flex", 120, 80, 100, 100, 100]}
          />
        ) : error ? (
          <div className="py-12 text-center text-[14px] text-danger-40">
            {error}
          </div>
        ) : rows.length === 0 ? (
          <div className="py-12 text-center text-[14px] text-neutral-60">
            근태 데이터가 없습니다.
          </div>
        ) : (
          rows.map((record, index) => (
            <div key={record.memberId || index}>
              <div
                className="flex items-center py-4 px-[30px] hover:bg-neutral-10 cursor-pointer transition-colors"
                onClick={() => onRowClick(record)}
              >
                {/* 이름 */}
                <div className="flex-1 text-[14px] font-medium leading-[1] text-neutral-90 opacity-80">
                  {record.memberName || "-"}
                </div>
                {/* 팀 */}
                <div className="flex-1 text-[14px] font-medium leading-[1] text-neutral-90 opacity-80">
                  {record.teamName || "-"}
                </div>
                {/* 직급 */}
                <div className="flex-1 text-[14px] font-medium leading-[1] text-neutral-90 opacity-80">
                  {record.role === "leader"
                    ? "리더"
                    : record.role === "member"
                    ? "멤버"
                    : record.role || "-"}
                </div>
                {/* 출근시간 */}
                <div className="flex-1 text-[14px] font-medium leading-[1] text-neutral-90 opacity-80">
                  {formatHm(record.attendanceAt)}
                </div>
                {/* 퇴근시간 */}
                <div className="flex-1 text-[14px] font-medium leading-[1] text-neutral-90 opacity-80">
                  {formatHm(record.leaveAt)}
                </div>
                {/* 근무시간 */}
                <div className="flex-1 text-[14px] font-semibold text-neutral-90 opacity-80">
                  {computeWorkTime(record.attendanceAt, record.leaveAt) || "-"}
                </div>
              </div>

              {/* 구분선 */}
              {index < rows.length - 1 && (
                <div className="border-t border-border opacity-50" />
              )}
            </div>
          ))
        )}
      </div>

      {/* 구분선 */}
      <div className="border-t border-border opacity-50 my-4" />

      {/* Pagination */}
      <div className="flex justify-center py-2">
        <Pagination
          page={currentPage}
          totalPages={totalPages}
          onPageChange={onPageChange}
          disabled={loading}
        />
      </div>
    </div>
  );
}

