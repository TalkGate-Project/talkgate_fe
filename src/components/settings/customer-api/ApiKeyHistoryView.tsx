"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import { ApiKeysService } from "@/services/apiKeys";
import type { ApiKey, ApiKeyCustomerHistoryItem } from "@/types/apiKeys";
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

  const limit = 20;

  const fetchHistory = useCallback(async () => {
    if (!projectId || !apiKey.id) return;

    setLoading(true);
    try {
      const headers = { "x-project-id": projectId };
      const response = await ApiKeysService.getCustomerHistory(
        apiKey.id,
        { page, limit },
        headers
      );

      if (response.data?.data) {
        setHistoryItems(response.data.data.items);
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
  }, [projectId, apiKey.id, page]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

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

  return (
    <div className="bg-card rounded-[14px] lg:rounded-[14px] rounded-t-none lg:rounded-t-[14px] pb-4 md:pb-7 flex flex-col">
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

        {/* API Key Logo/Name */}
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-full bg-neutral-20 flex items-center justify-center overflow-hidden">
            <Image
              src="/images/default-project-logo.svg"
              alt={apiKey.name}
              width={40}
              height={40}
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="w-full h-[1px] bg-neutral-30 opacity-70"></div>

      {/* Table */}
      <div className="px-4 md:px-7 pt-4 md:pt-6">
        {/* Table Header */}
        <div className="hidden md:grid grid-cols-[2fr_1fr_1fr_40px] gap-4 px-4 py-3 bg-neutral-10 dark:bg-neutral-20 rounded-t-[8px]">
          <span className="text-[14px] font-medium text-neutral-60">고객ID</span>
          <span className="text-[14px] font-medium text-neutral-60">고객이름</span>
          <span className="text-[14px] font-medium text-neutral-60">등록시간</span>
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
            {historyItems.map((item) => {
              const itemKey = String(item.customerId);
              const isExpanded = expandedIds.has(itemKey);
              const hasPartners = item.copiedPartnerProjects.length > 0;

              return (
                <div key={itemKey}>
                  {/* Main Row */}
                  <div
                    className={`grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr_40px] gap-2 md:gap-4 px-4 py-4 items-center ${
                      hasPartners ? "cursor-pointer hover:bg-neutral-10/50" : ""
                    }`}
                    onClick={() => hasPartners && toggleExpand(item.customerId)}
                  >
                    {/* Mobile Layout */}
                    <div className="md:hidden space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[14px] font-medium text-foreground">
                          {item.customerName}
                        </span>
                        <span className="text-[13px] text-neutral-50">
                          {formatDate(item.customerCreatedAt)}
                        </span>
                      </div>
                      <span className="text-[13px] text-neutral-60 block truncate">
                        {item.customerId}
                      </span>
                    </div>

                    {/* Desktop Layout */}
                    <span className="hidden md:block text-[14px] text-foreground truncate">
                      {item.customerId}
                    </span>
                    <span className="hidden md:block text-[14px] text-foreground">
                      {item.customerName}
                    </span>
                    <span className="hidden md:block text-[14px] text-neutral-60">
                      {formatDate(item.customerCreatedAt)}
                    </span>
                    
                    {/* Expand Arrow */}
                    <div className="hidden md:flex items-center justify-center">
                      {hasPartners && (
                        <svg
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                          className={`transition-transform ${isExpanded ? "rotate-180" : ""}`}
                        >
                          <path
                            d="M6 9L12 15L18 9"
                            stroke="currentColor"
                            className="text-neutral-50"
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
                    <div className="px-4 pb-4 bg-neutral-10/30">
                      <div className="flex items-center gap-2 py-2">
                        <span className="text-[13px] text-neutral-50">
                          전달 된 파트너 프로젝트
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-3">
                        {item.copiedPartnerProjects.map((project) => (
                          <div
                            key={project.projectId}
                            className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-neutral-20 rounded-[6px]"
                          >
                            <div className="w-6 h-6 rounded-full bg-neutral-20 overflow-hidden flex-shrink-0">
                              {project.logoUrl ? (
                                <Image
                                  src={project.logoUrl}
                                  alt={project.name}
                                  width={24}
                                  height={24}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    e.currentTarget.src = "/images/default-project-logo.svg";
                                  }}
                                />
                              ) : (
                                <Image
                                  src="/images/default-project-logo.svg"
                                  alt={project.name}
                                  width={24}
                                  height={24}
                                  className="w-full h-full object-cover"
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
