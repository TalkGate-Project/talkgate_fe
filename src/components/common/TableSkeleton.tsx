"use client";

type TableSkeletonProps = {
  /** 표시할 행 수 */
  rows?: number;
  /** 열 설정 (너비 지정, flex-1은 "flex"로) */
  columns?: Array<string | number>;
  /** 추가 클래스명 */
  className?: string;
  /** 각 행의 높이 */
  rowHeight?: string;
};

/**
 * 테이블 로딩 시 표시할 스켈레톤 컴포넌트
 * 
 * @example
 * // 기본 사용 (3행)
 * <TableSkeleton />
 * 
 * @example
 * // 사용자 정의 열 구성
 * <TableSkeleton 
 *   rows={5} 
 *   columns={["flex", 120, 100, 100]} 
 * />
 */
export default function TableSkeleton({ 
  rows = 5, 
  columns = ["flex", 120, 120, 120],
  className = "",
  rowHeight = "py-4"
}: TableSkeletonProps) {
  return (
    <div className={className}>
      {Array.from({ length: rows }).map((_, rowIdx) => (
        <div key={rowIdx} className={`flex items-center px-6 gap-4 ${rowHeight}`}>
          {columns.map((col, colIdx) => {
            const width = col === "flex" ? "flex-1" : `w-[${col}px]`;
            return (
              <div
                key={colIdx}
                className={`h-4 rounded bg-neutral-20 animate-pulse ${width}`}
                style={col === "flex" ? { flex: 1 } : { width: typeof col === 'number' ? `${col}px` : col }}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
}

