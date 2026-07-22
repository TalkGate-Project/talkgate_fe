import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useChatContext } from "@/providers/ChatProvider";
import type { ChatFilterDefaults, Messenger } from "@/components/chat/ChatFilterModal";

const PLATFORM_MAP: Record<string, "line" | "telegram" | "instagram" | undefined> = {
  telegram: "telegram",
  instagram: "instagram",
  line: "line",
};

const MESSENGER_MAP: Record<string, Messenger> = {
  telegram: "telegram",
  instagram: "instagram",
  line: "line",
};

/**
 * 채팅 필터 관련 로직을 관리하는 훅
 */
export function useChatFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setFilters } = useChatContext();

  // 쿼리 문자열과 동기화된 필터 상태: status = all | active | closed
  const statusFromQuery = (searchParams.get("status") || "all").toLowerCase();
  const statusFilter: "all" | "active" | "closed" =
    statusFromQuery === "active" || statusFromQuery === "closed"
      ? (statusFromQuery as any)
      : "all";

  const setStatusFilter = useCallback((next: "all" | "active" | "closed") => {
    const params = new URLSearchParams(searchParams.toString());
    if (next === "all") params.delete("status");
    else params.set("status", next);
    router.replace(`?${params.toString()}`, { scroll: false });
  }, [searchParams, router]);

  const platformQuery = (searchParams.get("platform") || "").toLowerCase();
  const platform = PLATFORM_MAP[platformQuery];

  // 필터 모달용 상태
  const [filterDefaults, setFilterDefaults] = useState<ChatFilterDefaults>(() => ({
    messenger: platform ? (MESSENGER_MAP[platform] || "all") : "all",
    categoryIds: undefined,
  }));

  // URL 쿼리 파라미터 변경 시 filterDefaults 동기화
  useEffect(() => {
    setFilterDefaults(prev => ({
      ...prev,
      messenger: platform ? (MESSENGER_MAP[platform] || "all") : "all",
    }));
  }, [platform]);

  // 필터 적용 핸들러
  const handleFilterApply = useCallback((filters: ChatFilterDefaults) => {
    const params = new URLSearchParams(searchParams.toString());
    
    // platform 파라미터 업데이트
    const platformValue = filters.messenger === "all" ? undefined : filters.messenger as "line" | "telegram" | "instagram" | undefined;
    if (platformValue) {
      params.set("platform", platformValue);
    } else {
      params.delete("platform");
    }
    
    // URL 업데이트
    router.replace(`?${params.toString()}`, { scroll: false });
    
    // 필터 상태 저장
    setFilterDefaults(filters);
    
    // setFilters를 명시적으로 호출하여 소켓 재요청 트리거
    setFilters({ 
      platform: platformValue,
      categoryIds: filters.categoryIds,
    });
  }, [searchParams, router, setFilters]);

  return {
    statusFilter,
    setStatusFilter,
    platform,
    filterDefaults,
    handleFilterApply,
  };
}
