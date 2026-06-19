"use client";

import { useMemo } from "react";

import type { StatsFilterValues } from "@/components/stats/StatsFilterModal";
import type { Option } from "@/components/common/filterFields";
import { formatDateForChip } from "@/utils/datetime";

type StatsFilterChipsProps = {
  filters: StatsFilterValues;
  onRemove: (key: keyof StatsFilterValues) => void;
  onRemoveDateRange: (type: "application" | "assigned") => void;
  onResetAll: () => void;
  teamOptions?: Option[];
  memberOptions?: Option[];
  showTeam?: boolean;
  showMember?: boolean;
};

const CHIP_CLASS_NAME =
  "inline-flex items-center justify-center gap-1 px-3 h-[32px] rounded-[30px] border border-[#E2E2E2] dark:border-neutral-30 bg-white dark:bg-neutral-10";

function Chip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <div className={CHIP_CLASS_NAME}>
      <span className="text-[14px] font-medium text-black dark:text-neutral-80 opacity-80">{label}</span>
      <button
        type="button"
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

export default function StatsFilterChips({
  filters,
  onRemove,
  onRemoveDateRange,
  onResetAll,
  teamOptions = [],
  memberOptions = [],
  showTeam = false,
  showMember = false,
}: StatsFilterChipsProps) {
  const getTeamName = (id: number): string => {
    const team = teamOptions.find((item) => item.value === id);
    return team?.label || `팀 ${id}`;
  };

  const getMemberName = (id: number): string => {
    const member = memberOptions.find((item) => item.value === id);
    return member?.label || `담당자 ${id}`;
  };

  const hasAnyChips = useMemo(() => {
    return (
      (showTeam && typeof filters.teamId === "number") ||
      (showMember && typeof filters.memberId === "number") ||
      Boolean(filters.applicationRoute) ||
      Boolean(filters.mediaCompany) ||
      Boolean(filters.site) ||
      Boolean(filters.applicationDateStart && filters.applicationDateEnd) ||
      Boolean(filters.assignedAtStart || filters.assignedAtEnd)
    );
  }, [filters, showMember, showTeam]);

  if (!hasAnyChips) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 min-w-0">
      <button
        type="button"
        onClick={onResetAll}
        aria-label="필터 전체 초기화"
        className={`${CHIP_CLASS_NAME} cursor-pointer w-[32px] !px-0 text-black dark:text-neutral-80 transition-colors hover:bg-neutral-10 dark:hover:bg-neutral-20`}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M4 4V9H4.58152M19.9381 11C19.446 7.05369 16.0796 4 12 4C8.64262 4 5.76829 6.06817 4.58152 9M4.58152 9H9M20 20V15H19.4185M19.4185 15C18.2317 17.9318 15.3574 20 12 20C7.92038 20 4.55399 16.9463 4.06189 13M19.4185 15H15"
            stroke="#B0B0B0"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      {showTeam && typeof filters.teamId === "number" && (
        <Chip label={getTeamName(filters.teamId)} onRemove={() => onRemove("teamId")} />
      )}
      {showMember && typeof filters.memberId === "number" && (
        <Chip label={getMemberName(filters.memberId)} onRemove={() => onRemove("memberId")} />
      )}
      {filters.applicationRoute && (
        <Chip label={filters.applicationRoute} onRemove={() => onRemove("applicationRoute")} />
      )}
      {filters.mediaCompany && (
        <Chip label={filters.mediaCompany} onRemove={() => onRemove("mediaCompany")} />
      )}
      {filters.site && <Chip label={filters.site} onRemove={() => onRemove("site")} />}
      {filters.applicationDateStart && filters.applicationDateEnd && (
        <Chip
          label={`신청시간: ${formatDateForChip(filters.applicationDateStart)} - ${formatDateForChip(filters.applicationDateEnd)}`}
          onRemove={() => onRemoveDateRange("application")}
        />
      )}
      {(filters.assignedAtStart || filters.assignedAtEnd) && (
        <Chip
          label={`배정시간: ${formatDateForChip(filters.assignedAtStart || "")} - ${formatDateForChip(filters.assignedAtEnd || "")}`}
          onRemove={() => onRemoveDateRange("assigned")}
        />
      )}
    </div>
  );
}
