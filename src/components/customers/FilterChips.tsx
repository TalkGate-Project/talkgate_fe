import { CustomerFilters } from "@/hooks/useCustomersFilters";

type FilterChipsProps = {
  filters: CustomerFilters;
  onRemove: (key: keyof CustomerFilters) => void;
  onRemoveCategory: (id: number) => void;
  onRemoveDateRange: (type: "application" | "assigned") => void;
};

function Chip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <div className="inline-flex items-center gap-2 px-3 h-[34px] rounded-[30px] bg-[#F2F2F2] dark:bg-[#222222]">
      <span className="text-[14px] text-[#000] dark:text-[#FFFFFF]">{label}</span>
      <button
        aria-label="remove"
        onClick={onRemove}
        className="w-4 h-4 grid place-items-center text-[#000] dark:text-[#FFFFFF]"
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M3 9L9 3M3 3L9 9"
            stroke="currentColor"
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
}: FilterChipsProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {filters.teamId && (
        <Chip label={`팀 ${filters.teamId}`} onRemove={() => onRemove("teamId")} />
      )}
      {filters.memberId && (
        <Chip label={`담당자 ${filters.memberId}`} onRemove={() => onRemove("memberId")} />
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
          <Chip key={id} label={`카테고리 ${id}`} onRemove={() => onRemoveCategory(id)} />
        ))}
      {(filters.applicationDateFrom || filters.applicationDateTo) && (
        <Chip
          label={`${filters.applicationDateFrom || ""} - ${filters.applicationDateTo || ""}`}
          onRemove={() => onRemoveDateRange("application")}
        />
      )}
      {(filters.assignedAtFrom || filters.assignedAtTo) && (
        <Chip
          label={`${filters.assignedAtFrom || ""} - ${filters.assignedAtTo || ""}`}
          onRemove={() => onRemoveDateRange("assigned")}
        />
      )}
    </div>
  );
}

