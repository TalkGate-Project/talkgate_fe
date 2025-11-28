import { useEffect, useState } from "react";
import { CustomerFilters } from "@/hooks/useCustomersFilters";
import { CustomerNoteCategoriesService, CustomerNoteCategory } from "@/services/customerNoteCategories";

type FilterChipsProps = {
  filters: CustomerFilters;
  onRemove: (key: keyof CustomerFilters) => void;
  onRemoveCategory: (id: number) => void;
  onRemoveDateRange: (type: "application" | "assigned") => void;
  teamOptions?: { label: string; value: number }[];
  memberOptions?: { label: string; value: number }[];
};

// 날짜를 YYYY. MM. DD 형식으로 포맷 (점 뒤에 공백 추가)
function formatDateForChip(dateStr: string): string {
  if (!dateStr) return "";
  // YYYY-MM-DD 형식을 YYYY. MM. DD로 변환
  const parts = dateStr.split("-");
  if (parts.length !== 3) return dateStr;
  return `${parts[0]}. ${parts[1]}. ${parts[2]}`;
}

function Chip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <div className="inline-flex items-center justify-center gap-1 px-3 h-[32px] rounded-[30px] border border-[#E2E2E2] bg-white">
      <span className="text-[14px] font-medium text-black opacity-80">{label}</span>
      <button
        aria-label="remove"
        onClick={onRemove}
        className="cursor-pointer w-4 h-4 grid place-items-center"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M4 12L12 4M4 4L12 12"
            stroke="#808080"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </div>
  );
}

export default function FilterChips({
  filters,
  onRemove,
  onRemoveCategory,
  onRemoveDateRange,
  teamOptions = [],
  memberOptions = [],
}: FilterChipsProps) {
  // 카테고리 목록을 가져와서 이름을 표시하기 위한 상태
  const [categories, setCategories] = useState<CustomerNoteCategory[]>([]);

  useEffect(() => {
    CustomerNoteCategoriesService.list()
      .then((res) => {
        const arr = (res.data as any)?.data ?? (res.data as any);
        setCategories(Array.isArray(arr) ? arr : []);
      })
      .catch(() => {
        setCategories([]);
      });
  }, []);

  // 카테고리 ID로 이름 찾기
  const getCategoryName = (id: number): string => {
    const category = categories.find((c) => c.id === id);
    return category?.name || `카테고리 ${id}`;
  };

  // 팀 ID로 이름 찾기
  const getTeamName = (id: number): string => {
    const team = teamOptions.find((t) => t.value === id);
    return team?.label || `팀 ${id}`;
  };

  // 담당자 ID로 이름 찾기
  const getMemberName = (id: number): string => {
    const member = memberOptions.find((m) => m.value === id);
    return member?.label || `담당자 ${id}`;
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {filters.teamId && (
        <Chip label={`팀 ${getTeamName(filters.teamId)}`} onRemove={() => onRemove("teamId")} />
      )}
      {filters.memberId && (
        <Chip label={`담당자 ${getMemberName(filters.memberId)}`} onRemove={() => onRemove("memberId")} />
      )}
      {filters.applicationRoute && (
        <Chip label={filters.applicationRoute} onRemove={() => onRemove("applicationRoute")} />
      )}
      {filters.mediaCompany && (
        <Chip label={filters.mediaCompany} onRemove={() => onRemove("mediaCompany")} />
      )}
      {filters.site && <Chip label={filters.site} onRemove={() => onRemove("site")} />}
      {Array.isArray(filters.categoryIds) &&
        filters.categoryIds.length > 0 &&
        filters.categoryIds.map((id) => (
          <Chip key={id} label={getCategoryName(id)} onRemove={() => onRemoveCategory(id)} />
        ))}
      {(filters.applicationDateFrom || filters.applicationDateTo) && (
        <Chip
          label={`${formatDateForChip(filters.applicationDateFrom || "")} - ${formatDateForChip(filters.applicationDateTo || "")}`}
          onRemove={() => onRemoveDateRange("application")}
        />
      )}
      {(filters.assignedAtFrom || filters.assignedAtTo) && (
        <Chip
          label={`${formatDateForChip(filters.assignedAtFrom || "")} - ${formatDateForChip(filters.assignedAtTo || "")}`}
          onRemove={() => onRemoveDateRange("assigned")}
        />
      )}
    </div>
  );
}

