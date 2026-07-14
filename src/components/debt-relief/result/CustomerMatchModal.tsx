"use client";

import { useEffect, useState } from "react";
import { AnalysisService } from "@/services/analysis";
import { showErrorModal } from "@/providers/ErrorFeedbackModalProvider";
import Pagination from "@/components/common/Pagination";
import type { ConnectableCustomer } from "@/types/analysis";

type Props = {
  open: boolean;
  onClose: () => void;
  onBack?: () => void;
  analysisId: string;
  projectId: string;
  onMatched: () => void;
};

const PAGE_LIMIT = 10;

function CloseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M6 18L18 6M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function BackIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function CustomerMatchModal({ open, onClose, onBack, analysisId, projectId, onMatched }: Props) {
  const [keyword, setKeyword] = useState("");
  const [debouncedKeyword, setDebouncedKeyword] = useState("");
  const [page, setPage] = useState(1);
  const [customers, setCustomers] = useState<ConnectableCustomer[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [matchingId, setMatchingId] = useState<number | null>(null);

  // 검색어 300ms 디바운스 + 페이지 리셋
  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(() => {
      setDebouncedKeyword(keyword);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [keyword, open]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);

    AnalysisService.connectableCustomers(Number(analysisId), projectId, {
      search: debouncedKeyword.trim() || undefined,
      page,
      limit: PAGE_LIMIT,
    })
      .then((response) => {
        if (cancelled) return;
        const data = response.data.data;
        setCustomers(data.customers);
        setTotal(data.total);
      })
      .catch((error) => {
        if (cancelled) return;
        console.error("Failed to load connectable customers:", error);
        showErrorModal({ headline: "고객 목록을 불러오지 못했습니다.", description: "잠시 후 다시 시도해주세요." });
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, analysisId, projectId, debouncedKeyword, page]);

  // 닫힐 때 검색 상태 초기화 (다음에 열 때 깨끗하게 시작)
  useEffect(() => {
    if (!open) {
      setKeyword("");
      setDebouncedKeyword("");
      setPage(1);
      setCustomers([]);
    }
  }, [open]);

  const handleMatch = async (customerId: number) => {
    if (matchingId) return;
    setMatchingId(customerId);
    try {
      await AnalysisService.matchCustomer(Number(analysisId), { projectId, customerId });
      onMatched();
      onClose();
    } catch (error: unknown) {
      console.error("Failed to match customer:", error);
      const code = (error as { data?: { code?: string } })?.data?.code;
      if (code === "ANALYSIS_ALREADY_CONNECTED") {
        showErrorModal({
          headline: "이미 다른 고객과 연결된 진단입니다.",
          description: "새로고침 후 다시 시도해주세요.",
        });
      } else {
        showErrorModal({ headline: "고객 연결에 실패했습니다.", description: "잠시 후 다시 시도해주세요." });
      }
    } finally {
      setMatchingId(null);
    }
  };

  if (!open) return null;

  const totalPages = Math.max(1, Math.ceil(total / PAGE_LIMIT));

  return (
    <>
      <div className="fixed inset-0 bg-black/50 dark:bg-[#000000CC] z-40" onClick={onClose} aria-hidden />
      <div
        className="fixed left-4 right-4 top-1/2 -translate-y-1/2 md:left-1/2 md:right-auto md:w-[480px] md:-translate-x-1/2 w-[calc(100%-2rem)] max-h-[80vh] bg-card dark:bg-neutral-10 rounded-[14px] z-50 flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 pt-5 pb-4 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                aria-label="뒤로가기"
                className="cursor-pointer w-6 h-6 grid place-items-center text-neutral-60 hover:opacity-70 shrink-0"
              >
                <BackIcon />
              </button>
            )}
            <h2 className="text-[18px] font-semibold text-foreground">고객 연결</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="cursor-pointer w-6 h-6 grid place-items-center text-neutral-60 hover:opacity-70"
          >
            <CloseIcon />
          </button>
        </div>

        <div className="px-6 pb-3 shrink-0">
          <input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="이름 또는 연락처로 검색"
            className="w-full h-[38px] px-3 rounded-[8px] border border-neutral-30 bg-card text-[14px] text-foreground placeholder:text-neutral-50 focus:outline-none focus:border-neutral-50"
          />
        </div>

        <div className="overflow-y-auto px-6 pb-4 flex-1 min-h-[200px]">
          {loading ? (
            <div className="flex items-center justify-center py-10 text-[14px] text-neutral-60">불러오는 중...</div>
          ) : customers.length === 0 ? (
            <div className="flex items-center justify-center py-10 text-[14px] text-neutral-60">
              연결 가능한 고객이 없습니다.
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {customers.map((customer) => (
                <div
                  key={customer.id}
                  className="flex items-center justify-between gap-3 h-[52px] px-4 rounded-[8px] bg-neutral-10"
                >
                  <div className="min-w-0">
                    <p className="text-[14px] font-semibold text-foreground truncate">{customer.name}</p>
                    <p className="text-[12px] text-neutral-60 truncate">{customer.contact1}</p>
                  </div>
                  <button
                    type="button"
                    disabled={matchingId === customer.id}
                    onClick={() => handleMatch(customer.id)}
                    className="cursor-pointer shrink-0 h-[30px] px-3 rounded-[5px] bg-neutral-90 text-neutral-20 text-[13px] font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {matchingId === customer.id ? "연결 중..." : "연결"}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {totalPages > 1 && (
          <div className="flex justify-center pb-4 shrink-0">
            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} disabled={loading} maxButtons={5} />
          </div>
        )}
      </div>
    </>
  );
}
