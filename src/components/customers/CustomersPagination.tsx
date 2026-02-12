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
    <div className="h-[64px] flex items-center justify-center gap-4 mt-0 md:mt-2">
      <Pagination
        page={page}
        totalPages={totalPages}
        onPageChange={onPageChange}
      />
    </div>
  );
}

