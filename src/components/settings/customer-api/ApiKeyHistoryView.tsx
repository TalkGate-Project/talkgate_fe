"use client";

import { useEffect, useState, useCallback } from "react";
import { ApiKeysService } from "@/services/apiKeys";
import { ProjectPartnersService } from "@/services/projectPartners";
import type { ApiKey, ApiKeyCustomerHistoryItem } from "@/types/apiKeys";
import type { ProjectPartner } from "@/types/projectPartners";
import Pagination from "@/components/common/Pagination";
import { showErrorModal } from "@/providers/ErrorFeedbackModalProvider";

interface ApiKeyHistoryViewProps {
  apiKey: ApiKey;
  projectId: string;
  onBack: () => void;
}

export default function ApiKeyHistoryView({
  apiKey,
  projectId,
  onBack,
}: ApiKeyHistoryViewProps) {
  const [historyItems, setHistoryItems] = useState<ApiKeyCustomerHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [partners, setPartners] = useState<ProjectPartner[]>([]);
  const [selectedProjectPartnerId, setSelectedProjectPartnerId] = useState<number | null>(null);
  
  // 모바일 필터 토글 상태
  const [isFilterExpanded, setIsFilterExpanded] = useState(false);

  const limit = 20;

  // 협력업체 목록 조회 (승인된 것만)
  const fetchPartners = useCallback(async () => {
    if (!projectId) return;
    try {
      const headers = { "x-project-id": projectId };
      const res = await ProjectPartnersService.list(
        { page: 1, limit: 100, status: "approved" },
        headers
      );
      const data = res.data?.data;
      if (data?.list) {
        setPartners(data.list);
      }
    } catch {
      setPartners([]);
    }
  }, [projectId]);

  const fetchHistory = useCallback(async () => {
    if (!projectId || !apiKey.id) return;

    setLoading(true);
    try {
      const headers = { "x-project-id": projectId };
      const query: { page: number; limit: number; projectPartnerId?: number } = {
        page,
        limit,
      };
      // project-partners list의 id를 projectPartnerId로 전달
      if (selectedProjectPartnerId != null) {
        query.projectPartnerId = selectedProjectPartnerId;
      }
      const response = await ApiKeysService.getCustomerHistory(
        apiKey.id,
        query,
        headers
      );

      if (response.data?.data) {
        const items = response.data.data.items;
        setHistoryItems(items);
        setTotalPages(response.data.data.totalPages);
      }
    } catch (err) {
      console.error("Failed to fetch customer history", err);
      showErrorModal({
        type: "error",
        headline: "고객 히스토리를 불러오는데 실패했습니다.",
        hideCancel: true,
        confirmText: "확인",
      });
    } finally {
      setLoading(false);
    }
  }, [projectId, apiKey.id, page, selectedProjectPartnerId]);

  useEffect(() => {
    fetchPartners();
  }, [fetchPartners]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const handleFilterClick = useCallback((projectPartnerId: number | null) => {
    setSelectedProjectPartnerId(projectPartnerId);
    setPage(1);
  }, []);

  const toggleExpand = (customerId: string | number) => {
    const key = String(customerId);
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).replace(/\. /g, "-").replace(/\./g, "");
  };

  const formatDateMobile = (dateString: string) => {
    const date = new Date(dateString);
    const year = date.getFullYear().toString().slice(2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}.${month}.${day}`;
  };

  return (
    <div className="bg-card rounded-[14px] rounded-t-none md:rounded-t-[14px] pb-4 md:pb-7 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 md:px-7 h-[64px] md:h-[76px]">
        <div className="flex items-center gap-3">
          {/* Back Button */}
          <button
            onClick={onBack}
            className="cursor-pointer w-6 h-6 flex items-center justify-center"
            aria-label="뒤로가기"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M15 18L9 12L15 6" stroke="currentColor" className="text-foreground" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <h1 className="text-[20px] md:text-[24px] font-bold text-foreground leading-[1]">
            API 키 히스토리
          </h1>
        </div>
      </div>

      {/* Divider */}
      <div className="w-full h-[1px] bg-neutral-30 opacity-70"></div>

      {/* 협력업체별 필터 뱃지 */}
      <div className="relative px-4 md:px-7 mt-4 md:mt-7 mb-2">
        <div
          className={`flex flex-wrap items-center gap-2 pr-8 md:pr-0 transition-[height] duration-200 overflow-hidden ${
            !isFilterExpanded ? "h-[30px] md:h-auto" : "h-auto"
          }`}
        >
          <button
            type="button"
            onClick={() => handleFilterClick(null)}
            className={`cursor-pointer inline-flex items-center justify-center py-1 px-3 h-[30px] md:h-[22px] rounded-[30px] text-[13px] md:text-[12px] font-medium leading-[14px] transition-colors opacity-80 ${
              selectedProjectPartnerId === null
                ? "bg-secondary-10 dark:bg-secondary-20/40 text-secondary-40 dark:text-secondary-20"
                : "bg-[#E2E2E2] dark:bg-neutral-30 text-[#595959] dark:text-neutral-60 hover:bg-neutral-40 dark:hover:bg-neutral-25"
            }`}
          >
            전체
          </button>
          {partners.map((partner) => {
            const isSelected = selectedProjectPartnerId === partner.id;
            return (
              <button
                key={partner.id}
                type="button"
                onClick={() => handleFilterClick(partner.id)}
                className={`cursor-pointer inline-flex items-center justify-center py-1 px-3 h-[30px] md:h-[22px] rounded-[30px] text-[13px] md:text-[12px] font-medium leading-[14px] transition-colors truncate max-w-[200px] opacity-80 ${
                  isSelected
                    ? "bg-secondary-10 dark:bg-secondary-20/40 text-secondary-40 dark:text-secondary-20"
                    : "bg-[#E2E2E2] dark:bg-neutral-30 text-[#595959] dark:text-neutral-60 hover:bg-neutral-40 dark:hover:bg-neutral-25"
                }`}
              >
                {partner.partnerProjectName}
              </button>
            );
          })}
        </div>

        {/* Mobile Filter Toggle Button */}
        <button
          type="button"
          onClick={() => setIsFilterExpanded(!isFilterExpanded)}
          className="md:hidden absolute right-4 top-1 w-6 h-6 flex items-center justify-center cursor-pointer"
          aria-label={isFilterExpanded ? "필터 접기" : "필터 펼치기"}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={`transition-transform duration-200 ${isFilterExpanded ? "rotate-180" : ""}`}
          >
            <path
              d="M15.8346 7.5L10.0013 13.3333L4.16797 7.5"
              stroke="#B0B0B0"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>

      {/* Table */}
      <div className="px-4 md:px-7 pt-2">
        {/* Table Header */}
        <div className="grid grid-cols-[1.8fr_0.8fr_0.8fr_24px] md:grid-cols-[2fr_1fr_1fr_40px] gap-2 md:gap-4 px-4 py-3 bg-neutral-10 dark:bg-neutral-20 rounded-[8px] md:rounded-b-none">
          <span className="text-[13px] md:text-[14px] font-medium text-neutral-60 truncate">고객ID</span>
          <span className="text-[13px] md:text-[14px] font-medium text-neutral-60 truncate">이름</span>
          <span className="text-[13px] md:text-[14px] font-medium text-neutral-60 truncate">등록시간</span>
          <span></span>
        </div>

        {/* Table Body */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <span className="text-[14px] text-neutral-60">로딩 중...</span>
          </div>
        ) : historyItems.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <span className="text-[14px] text-neutral-60">
              등록된 고객 히스토리가 없습니다.
            </span>
          </div>
        ) : (
          <div className="divide-y divide-neutral-20">
            {historyItems.map((item, index) => {
              const itemKey = `${String(item.customerId)}-${index}`;
              const isExpanded = expandedIds.has(itemKey);
              const hasPartners = item.copiedPartnerProjects.length > 0;

              return (
                <div key={itemKey}>
                  {/* Main Row */}
                  <div
                    className={`grid grid-cols-[1.8fr_0.8fr_0.8fr_24px] md:grid-cols-[2fr_1fr_1fr_40px] gap-2 md:gap-4 px-4 py-4 items-center ${
                      hasPartners ? "cursor-pointer hover:bg-neutral-10/50" : ""
                    }`}
                    onClick={() => hasPartners && toggleExpand(itemKey)}
                  >
                    <span className="text-[13px] md:text-[14px] font-medium text-foreground truncate">
                      {item.customerId}
                    </span>
                    <span className="text-[13px] md:text-[14px] text-foreground truncate" title={item.customerName}>
                      {item.customerName}
                    </span>
                    <span className="text-[13px] md:text-[14px] text-neutral-60 truncate">
                      <span className="md:hidden">{formatDateMobile(item.customerCreatedAt)}</span>
                      <span className="hidden md:inline">{formatDate(item.customerCreatedAt)}</span>
                    </span>
                    
                    {/* Expand Arrow */}
                    <div className="flex items-center justify-center">
                      {hasPartners && (
                        <svg
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                          className={`w-5 h-5 md:w-6 md:h-6 text-neutral-40 transition-transform ${isExpanded ? "rotate-180" : "rotate-270"}`}
                        >
                          <path
                            d="M6 9L12 15L18 9"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      )}
                    </div>
                  </div>

                  {/* Expanded Content - Partner Projects */}
                  {isExpanded && hasPartners && (
                    <div className="px-4 py-3 bg-neutral-10/30 grid grid-cols-2 md:grid-cols-[2fr_1fr_1fr_40px] md:gap-4">
                      {/* 모바일 뷰에서는 그냥 리스트로, 데스크탑에서는 그리드 구조 */}
                      <div className="flex items-start gap-2 mb-2 md:mb-0 md:py-2 md:col-span-1">
                        <span className="text-[13px] text-neutral-50 flex items-center gap-2">
                          전달 된 파트너 프로젝트
                        </span>
                      </div>
                      <div className="md:col-span-3 pl-0">
                        <div className="flex flex-col gap-2">
                        {item.copiedPartnerProjects.map((project) => (
                          <div
                            key={project.projectId}
                            className="flex items-center gap-2 px-0 md:px-3 py-0 md:py-2"
                          >
                            <div className="w-5 h-5 md:w-6 md:h-6 rounded-full bg-neutral-30 overflow-hidden flex-shrink-0">
                              {project.logoUrl && (
                                <img
                                  src={project.logoUrl}
                                  alt={project.name}
                                  width={24}
                                  height={24}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    e.currentTarget.style.display = "none";
                                  }}
                                />
                              )}
                            </div>
                            <span className="text-[13px] font-medium text-foreground">
                              {project.name}
                            </span>
                          </div>
                        ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && !loading && (
          <div className="flex justify-center mt-6">
            <Pagination
              page={page}
              totalPages={totalPages}
              onPageChange={setPage}
              disabled={loading}
            />
          </div>
        )}
      </div>
    </div>
  );
}
