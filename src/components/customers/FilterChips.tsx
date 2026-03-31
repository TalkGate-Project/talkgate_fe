import { useEffect, useState } from "react";
import { CustomerFilters } from "@/hooks/useCustomersFilters";
import { useCustomerNoteCategories } from "@/hooks/useCustomerNoteCategories";
import { ProjectPartnersService } from "@/services/projectPartners";
import { ApiKeysService } from "@/services/apiKeys";
import { getSelectedProjectId } from "@/lib/project";
import { formatDateForChip } from "@/utils/datetime";

type FilterChipsProps = {
  filters: CustomerFilters;
  onRemove: (key: keyof CustomerFilters) => void;
  onRemoveCategory: (id: number | null) => void;
  onRemoveDateRange: (type: "application" | "assigned") => void;
  onResetAll: () => void;
  teamOptions?: { label: string; value: number }[];
  memberOptions?: { label: string; value: number }[];
  /** 파트너 칩 라벨을 위해 project-partners API 호출 여부. true일 때만 필요 시 호출 (데이터제공자 + admin/subAdmin). */
  shouldFetchPartners?: boolean;
};

const CHIP_CLASS_NAME =
  "inline-flex items-center justify-center gap-1 px-3 h-[32px] rounded-[30px] border border-[#E2E2E2] bg-white";

function Chip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <div className={CHIP_CLASS_NAME}>
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
  onResetAll,
  teamOptions = [],
  memberOptions = [],
  shouldFetchPartners = false,
}: FilterChipsProps) {
  const { categories } = useCustomerNoteCategories();
  const [partnerNameMap, setPartnerNameMap] = useState<Map<number, string>>(new Map());
  const [apiKeyNameMap, setApiKeyNameMap] = useState<Map<number, string>>(new Map());

  // project-partners는 파트너 필터 칩 라벨이 필요할 때만, 데이터제공자 프로젝트의 admin/subAdmin인 경우에만 호출
  const needPartnerName = typeof filters.projectPartnerId === "number";
  const needApiKeyName = typeof filters.apiKeyId === "number";
  useEffect(() => {
    if (!shouldFetchPartners || !needPartnerName) return;
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
  }, [shouldFetchPartners, needPartnerName]);

  useEffect(() => {
    if (!needApiKeyName) return;
    const projectId = getSelectedProjectId();
    if (!projectId) return;
    let cancelled = false;
    ApiKeysService.list({ page: 1, limit: 100 }, { "x-project-id": projectId })
      .then((res) => {
        if (cancelled) return;
        const list = res.data?.data?.apiKeys ?? [];
        const map = new Map<number, string>();
        list.forEach((apiKey) => {
          map.set(apiKey.id, apiKey.name);
        });
        setApiKeyNameMap(map);
      })
      .catch(() => {
        if (!cancelled) setApiKeyNameMap(new Map());
      });
    return () => {
      cancelled = true;
    };
  }, [needApiKeyName]);

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

  const hasAnyChips =
    Boolean(filters.name) ||
    Boolean(filters.contact1) ||
    Boolean(filters.teamId) ||
    Boolean(filters.memberId) ||
    Boolean(filters.applicationRoute) ||
    Boolean(filters.mediaCompany) ||
    Boolean(filters.site) ||
    Boolean(filters.noteContent) ||
    Boolean(filters.assignType && filters.assignType !== "all") ||
    typeof filters.apiKeyId === "number" ||
    typeof filters.projectPartnerId === "number" ||
    Boolean(Array.isArray(filters.categoryIds) && filters.categoryIds.length > 0) ||
    Boolean(filters.applicationDateFrom && filters.applicationDateTo) ||
    Boolean(filters.assignedAtFrom || filters.assignedAtTo) ||
    Boolean(filters.keyword) ||
    Boolean(filters.ipAddress) ||
    Boolean(filters.notablePoints) ||
    Boolean(filters.summaryInfo);

  return (
    <div className="flex flex-wrap items-center gap-2">
      {hasAnyChips && (
        <button
          type="button"
          onClick={onResetAll}
          className={`${CHIP_CLASS_NAME} cursor-pointer text-[14px] font-medium text-black opacity-80 transition-colors hover:bg-neutral-10`}
        >
          전체 초기화
        </button>
      )}
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
        <Chip label={`담당팀: ${getTeamName(filters.teamId)}`} onRemove={() => onRemove("teamId")} />
      )}
      {filters.memberId && (
        <Chip label={`담당자: ${getMemberName(filters.memberId)}`} onRemove={() => onRemove("memberId")} />
      )}
      {filters.applicationRoute && (
        <Chip label={`신청경로: ${filters.applicationRoute}`} onRemove={() => onRemove("applicationRoute")} />
      )}
      {filters.mediaCompany && (
        <Chip label={`매체사: ${filters.mediaCompany}`} onRemove={() => onRemove("mediaCompany")} />
      )}
      {filters.site && <Chip label={`사이트: ${filters.site}`} onRemove={() => onRemove("site")} />}
      {filters.noteContent && (
        <Chip 
          label={`상담 내용: ${filters.noteContent.length > 20 ? filters.noteContent.slice(0, 20) + "..." : filters.noteContent}`} 
          onRemove={() => onRemove("noteContent")} 
        />
      )}
      {filters.assignType && filters.assignType !== "all" && (
        <Chip
          label={`고객 배정 여부: ${filters.assignType === "assigned" ? "배정됨" : "배정대기"}`}
          onRemove={() => onRemove("assignType")}
        />
      )}
      {typeof filters.apiKeyId === "number" && (
        <Chip
          label={`API 키: ${apiKeyNameMap.get(filters.apiKeyId) ?? String(filters.apiKeyId)}`}
          onRemove={() => onRemove("apiKeyId")}
        />
      )}
      {typeof filters.projectPartnerId === "number" && (
        <Chip
          label={`파트너 업체: ${partnerNameMap.get(filters.projectPartnerId) ?? String(filters.projectPartnerId)}`}
          onRemove={() => onRemove("projectPartnerId")}
        />
      )}
      {Array.isArray(filters.categoryIds) &&
        filters.categoryIds.length > 0 &&
        filters.categoryIds.map((id) => (
          <Chip key={id} label={`상담 카테고리: ${getCategoryName(id)}`} onRemove={() => onRemoveCategory(id)} />
        ))}
      {filters.applicationDateFrom && filters.applicationDateTo && (
        <Chip
          label={`신청시간: ${formatDateForChip(filters.applicationDateFrom)} - ${formatDateForChip(filters.applicationDateTo)}`}
          onRemove={() => onRemoveDateRange("application")}
        />
      )}
      {(filters.assignedAtFrom || filters.assignedAtTo) && (
        <Chip
          label={`배정시간: ${formatDateForChip(filters.assignedAtFrom || "")} - ${formatDateForChip(filters.assignedAtTo || "")}`}
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

