"use client";

type ColumnConfig = {
  /** 셀 너비 (px 또는 flex) */
  width?: number | "flex";
  /** 셀 패딩 (px) */
  paddingX?: number;
  /** 셀 높이 (px) */
  height?: number;
  /** 추가 클래스명 */
  className?: string;
  /** 셀 타입: "text" (기본값, 텍스트 스켈레톤), "checkbox" (체크박스 스켈레톤) */
  type?: "text" | "checkbox";
};

type TableSkeletonRowProps = {
  /** 열 설정 배열 */
  columns: ColumnConfig[];
  /** 행 높이 (px, 기본값: 48) */
  rowHeight?: number;
  /** 추가 클래스명 */
  className?: string;
};

/**
 * 테이블 행 스켈레톤 컴포넌트
 * CustomersTable 스타일을 참고하여 만들어진 공용 컴포넌트
 * 
 * @example
 * // 기본 사용
 * <TableSkeletonRow 
 *   columns={[
 *     { width: 24, paddingX: 6 },
 *     { width: "flex", paddingX: 6 },
 *     { width: 100, paddingX: 4 }
 *   ]} 
 * />
 */
export default function TableSkeletonRow({
  columns,
  rowHeight = 48,
  className = "",
}: TableSkeletonRowProps) {
  return (
    <tr className={`border-b border-[#E2E2E2] dark:!border-[#44444455] animate-pulse ${className}`}>
      {columns.map((col, idx) => {
        const paddingX = col.paddingX ?? 4;
        
        return (
          <td
            key={idx}
            className={`h-[${rowHeight}px] align-middle ${col.className || ""}`}
            style={{
              height: `${rowHeight}px`,
              paddingLeft: `${paddingX * 4}px`,
              paddingRight: `${paddingX * 4}px`,
            }}
          >
            {col.type === "checkbox" ? (
              <div className="flex items-center h-full">
                <div className="w-6 h-6 bg-neutral-20 rounded" />
              </div>
            ) : (
              <div
                className="h-4 bg-neutral-20 rounded"
                style={
                  col.width === "flex"
                    ? { flex: 1 }
                    : typeof col.width === "number"
                    ? { width: `${col.width}px` }
                    : {}
                }
              />
            )}
          </td>
        );
      })}
    </tr>
  );
}

