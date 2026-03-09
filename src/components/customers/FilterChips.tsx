import { useEffect, useState } from "react";
import { CustomerFilters } from "@/hooks/useCustomersFilters";
import { CustomerNoteCategoriesService, CustomerNoteCategory } from "@/services/customerNoteCategories";
import { ProjectPartnersService } from "@/services/projectPartners";
import { getSelectedProjectId } from "@/lib/project";
import { formatDateForChip } from "@/utils/datetime";

type FilterChipsProps = {
  filters: CustomerFilters;
  onRemove: (key: keyof CustomerFilters) => void;
  onRemoveCategory: (id: number | null) => void;
  onRemoveDateRange: (type: "application" | "assigned") => void;
  teamOptions?: { label: string; value: number }[];
  memberOptions?: { label: string; value: number }[];
};

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
  const [partnerNameMap, setPartnerNameMap] = useState<Map<number, string>>(new Map());

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

  useEffect(() => {
    const projectId = getSelectedProjectId();
    if (!projectId) return;
    let cancelled = false;
    ProjectPartnersService.list({ page: 1, limit: 100 }, { "x-project-id": projectId })
      .then((res) => {
        if (cancelled) return;
        const list = res.data?.data?.list ?? [];
        const map = new Map<number, string>();
        list.forEach((partner: any) => {
          map.set(partner.id, partner.partnerProjectName ?? `파트너 업체 ${partner.id}`);
        });
        setPartnerNameMap(map);
      })
      .catch(() => {
        if (!cancelled) setPartnerNameMap(new Map());
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // 카테고리 ID로 이름 찾기
  const getCategoryName = (id: number | null): string => {
    if (id === null) return "일반";
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
      {filters.name && (
        <Chip
          label={`이름: ${filters.name.length > 20 ? filters.name.slice(0, 20) + "..." : filters.name}`}
          onRemove={() => onRemove("name")}
        />
      )}
      {filters.contact1 && (
        <Chip
          label={`연락처: ${filters.contact1}`}
          onRemove={() => onRemove("contact1")}
        />
      )}
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
      {filters.noteContent && (
        <Chip 
          label={`상담 내용: ${filters.noteContent.length > 20 ? filters.noteContent.slice(0, 20) + "..." : filters.noteContent}`} 
          onRemove={() => onRemove("noteContent")} 
        />
      )}
      {filters.assignType && filters.assignType !== "all" && (
        <Chip
          label={filters.assignType === "assigned" ? "배정됨" : "배정대기"}
          onRemove={() => onRemove("assignType")}
        />
      )}
      {typeof filters.projectPartnerId === "number" && (
        <Chip
          label={partnerNameMap.get(filters.projectPartnerId) ?? `파트너 업체 ${filters.projectPartnerId}`}
          onRemove={() => onRemove("projectPartnerId")}
        />
      )}
      {Array.isArray(filters.categoryIds) &&
        filters.categoryIds.length > 0 &&
        filters.categoryIds.map((id) => (
          <Chip key={id} label={getCategoryName(id)} onRemove={() => onRemoveCategory(id)} />
        ))}
      {filters.applicationDateFrom && filters.applicationDateTo && (
        <Chip
          label={`${formatDateForChip(filters.applicationDateFrom)} - ${formatDateForChip(filters.applicationDateTo)}`}
          onRemove={() => onRemoveDateRange("application")}
        />
      )}
      {(filters.assignedAtFrom || filters.assignedAtTo) && (
        <Chip
          label={`${formatDateForChip(filters.assignedAtFrom || "")} - ${formatDateForChip(filters.assignedAtTo || "")}`}
          onRemove={() => onRemoveDateRange("assigned")}
        />
      )}
      {filters.keyword && (
        <Chip
          label={`키워드: ${filters.keyword.length > 20 ? filters.keyword.slice(0, 20) + "..." : filters.keyword}`}
          onRemove={() => onRemove("keyword")}
        />
      )}
      {filters.ipAddress && (
        <Chip label={`IP 주소: ${filters.ipAddress}`} onRemove={() => onRemove("ipAddress")} />
      )}
      {filters.notablePoints && (
        <Chip
          label={`특이사항: ${filters.notablePoints.length > 20 ? filters.notablePoints.slice(0, 20) + "..." : filters.notablePoints}`}
          onRemove={() => onRemove("notablePoints")}
        />
      )}
      {filters.summaryInfo && (
        <Chip
          label={`요약정보: ${filters.summaryInfo.length > 20 ? filters.summaryInfo.slice(0, 20) + "..." : filters.summaryInfo}`}
          onRemove={() => onRemove("summaryInfo")}
        />
      )}
    </div>
  );
}

