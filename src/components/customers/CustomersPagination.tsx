import Pagination from "@/components/common/Pagination";

type CustomersPaginationProps = {
  total: number;
  selectedCount: number;
  page: number;
  totalPages: number;
  limit: number;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
};

export default function CustomersPagination({
  total,
  selectedCount,
  page,
  totalPages,
  onPageChange,
}: CustomersPaginationProps) {
  return (
    <div className="h-[64px] flex items-center justify-between gap-4 mt-2">
      <div className="text-[14px] font-normal" style={{ color: '#B0B0B0' }}>
        총 {total.toLocaleString()}건 ({selectedCount}개 선택)
      </div>
      <Pagination
        page={page}
        totalPages={totalPages}
        onPageChange={onPageChange}
      />
      <div></div>
    </div>
  );
}

