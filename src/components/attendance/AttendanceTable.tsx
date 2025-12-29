import TableSkeletonRow from "@/components/common/TableSkeletonRow";
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
          className="cursor-pointer border border-border rounded-[5px] flex items-center justify-center hover:bg-neutral-10 transition-colors"
        >
          <svg
            width="26"
            height="26"
            viewBox="0 0 26 26"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect
              x="0.5"
              y="0.5"
              width="25"
              height="25"
              rx="5.5"
              stroke="#E2E2E2"
            />
            <path
              d="M7 8C7 7.44772 7.44772 7 8 7H18C18.5523 7 19 7.44772 19 8V9.25245C19 9.51767 18.8946 9.77202 18.7071 9.95956L14.6262 14.0404C14.4387 14.228 14.3333 14.4823 14.3333 14.7475V16.3333L11.6667 19V14.7475C11.6667 14.4823 11.5613 14.228 11.3738 14.0404L7.29289 9.95956C7.10536 9.77202 7 9.51767 7 9.25245V8Z"
              stroke="#B0B0B0"
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
          <div className="overflow-hidden">
            <table className="w-full border-collapse">
              <tbody>
                {Array.from({ length: 8 }).map((_, idx) => (
                  <TableSkeletonRow
                    key={`skeleton-${idx}`}
                    columns={[
                      { width: "flex", paddingX: 7.5 }, // 이름
                      { width: "flex", paddingX: 7.5 }, // 팀
                      { width: "flex", paddingX: 7.5 }, // 직급
                      { width: "flex", paddingX: 7.5 }, // 출근시간
                      { width: "flex", paddingX: 7.5 }, // 퇴근시간
                      { width: "flex", paddingX: 7.5 }, // 근무시간
                    ]}
                    rowHeight={48}
                  />
                ))}
              </tbody>
            </table>
          </div>
        ) : error ? (
          // 권한 관련 에러는 이미 상위에서 리디렉션 처리되므로 여기서는 표시하지 않음
          error.includes("Only admin") || 
          error.includes("admin can perform") ||
          error.includes("권한") ||
          error.includes("permission") ||
          error.includes("access denied") ? (
            <div className="py-12 text-center text-[14px] text-neutral-60">
              데이터를 불러올 수 없습니다.
            </div>
          ) : (
            <div className="py-12 text-center text-[14px] text-danger-40">
              {error}
            </div>
          )
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
