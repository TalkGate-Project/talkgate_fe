import { CSSProperties, useEffect, useState } from "react";
import { CustomerFilters } from "@/hooks/useCustomersFilters";
import { useCustomerNoteCategories } from "@/hooks/useCustomerNoteCategories";
import { ProjectPartnersService } from "@/services/projectPartners";
import { ApiKeysService } from "@/services/apiKeys";
import { getSelectedProjectId } from "@/lib/project";
import { formatDateForChip } from "@/utils/datetime";
import { getBadgeStyle } from "@/utils/categoryBadge";
import { NO_CATEGORY_LABEL } from "@/utils/customerCategory";

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
  "inline-flex items-center justify-center gap-1 px-3 h-[32px] rounded-[30px] border border-[#E2E2E2] dark:border-neutral-30 bg-white dark:bg-neutral-10";

function Chip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <div className={CHIP_CLASS_NAME}>
      <span className="text-[14px] font-medium text-black dark:text-neutral-80 opacity-80">{label}</span>
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

function CategoryChip({
  label,
  style,
  onRemove,
}: {
  label: string;
  style: CSSProperties;
  onRemove: () => void;
}) {
  return (
    <div
      className="inline-flex items-center justify-center gap-1 px-3 h-[32px] rounded-[30px] border border-transparent"
      style={style}
    >
      <span className="text-[14px] font-medium opacity-80">{label}</span>
      <button
        aria-label="remove"
        onClick={onRemove}
        className="cursor-pointer w-4 h-4 grid place-items-center"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M4 12L12 4M4 4L12 12"
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
    if (id === null) return NO_CATEGORY_LABEL;
    const category = categories.find((c) => c.id === id);
    return category?.name || `카테고리 ${id}`;
  };

  const getCategoryChipStyle = (id: number | null): CSSProperties => {
    if (id === null) {
      return getBadgeStyle(NO_CATEGORY_LABEL, 0);
    }

    const category = categories.find((item) => item.id === id);
    const categoryName = category?.name || `카테고리 ${id}`;
    return getBadgeStyle(categoryName, id, category?.colorCode);
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
    Boolean(filters.salesMemo);

  return (
    <div className="flex flex-wrap items-center gap-2">
      {hasAnyChips && (
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
          <CategoryChip
            key={id === null ? "general" : id}
            label={`카테고리: ${getCategoryName(id)}`}
            style={getCategoryChipStyle(id)}
            onRemove={() => onRemoveCategory(id)}
          />
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
      {filters.salesMemo && (
        <Chip
          label={`영업메모: ${filters.salesMemo.length > 20 ? filters.salesMemo.slice(0, 20) + "..." : filters.salesMemo}`}
          onRemove={() => onRemove("salesMemo")}
        />
      )}
    </div>
  );
}

