"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ConversationsService } from "@/services/conversations";
import type { UnconnectedCustomer } from "@/types/conversations";

type Props = {
  open: boolean;
  onClose: () => void;
  onBack: () => void;
  projectId: number;
  conversationName?: string;
  onLink: (customerId: number) => Promise<void>;
};

const PAGE_LIMIT = 10;

export default function CustomerLinkExistingModal({
  open,
  onClose,
  onBack,
  projectId,
  conversationName,
  onLink,
}: Props) {
  const [searchInput, setSearchInput] = useState("");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [customers, setCustomers] = useState<UnconnectedCustomer[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [linking, setLinking] = useState(false);

  const fetchCustomers = useCallback(
    async (nextPage: number, keyword: string) => {
      setLoading(true);
      setError(null);
      try {
        const response = await ConversationsService.listUnconnectedCustomers({
          projectId: String(projectId),
          page: nextPage,
          limit: PAGE_LIMIT,
          search: keyword ? keyword : undefined,
        });
        const payload = response.data;
        if (payload?.result) {
          setCustomers(payload.data?.customers ?? []);
          setTotal(payload.data?.total ?? 0);
          setPage(nextPage);
          setSearchKeyword(keyword);
        }
      } catch (err) {
        console.error(err);
        setCustomers([]);
        setTotal(0);
        setError("고객 목록을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.");
      } finally {
        setLoading(false);
      }
    },
    [projectId]
  );

  useEffect(() => {
    if (!open) return;
    setSearchInput("");
    setSearchKeyword("");
    setSelectedId(null);
    setError(null);
    fetchCustomers(1, "");
  }, [open, fetchCustomers]);

  const totalPages = useMemo(() => {
    if (total === 0) return 1;
    return Math.max(1, Math.ceil(total / PAGE_LIMIT));
  }, [total]);

  const handleSearch = () => {
    fetchCustomers(1, searchInput.trim());
  };

  const handleLink = async () => {
    if (!selectedId) {
      setError("연동할 고객을 선택해주세요.");
      return;
    }
    setLinking(true);
    setError(null);
    try {
      await onLink(selectedId);
    } catch (err: any) {
      const message = err instanceof Error ? err.message : "고객 연동에 실패했습니다.";
      setError(message);
    } finally {
      setLinking(false);
    }
  };

  if (!open) return null;

  const canPrev = page > 1;
  const canNext = page < totalPages;

  return (
    <div className="fixed inset-0 z-[130]">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute left-1/2 top-1/2 w-[720px] -translate-x-1/2 -translate-y-1/2">
        <div className="relative w-full rounded-[16px] bg-white px-8 py-9 shadow-[0px_32px_90px_rgba(15,23,42,0.2)]">
          <button
            aria-label="close"
            onClick={onClose}
            className="absolute right-6 top-6 h-8 w-8 rounded-full border border-[#E2E2E2] text-[#808080]"
          >
            ×
          </button>
          <button
            type="button"
            onClick={onBack}
            className="inline-flex h-9 items-center gap-2 text-[13px] text-[#4B5563] hover:text-[#111827]"
          >
            <span className="text-[16px]">←</span>
            이전 단계로 돌아가기
          </button>
          <h2 className="mt-4 text-[22px] font-semibold text-[#111827]">기존 고객과 연동</h2>
          {conversationName ? (
            <p className="mt-1 text-[13px] text-[#6B7280]">대화방: {conversationName}</p>
          ) : null}

          <div className="mt-6 flex items-center gap-3">
            <div className="flex-1">
              <input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSearch();
                }}
                placeholder="고객명 또는 연락처 검색"
                className="h-[42px] w-full rounded-[10px] border border-[#D1D5DB] px-4 text-[14px] outline-none focus:border-[#4D82F3]"
              />
            </div>
            <button
              className="h-[42px] rounded-[10px] bg-[#4D82F3] px-5 text-[14px] font-semibold text-white"
              onClick={handleSearch}
              disabled={loading}
            >
              검색
            </button>
          </div>

          <div className="mt-4 flex items-center justify-between text-[13px] text-[#6B7280]">
            <span>총 {total.toLocaleString()}명</span>
            {searchKeyword ? <span>검색어: "{searchKeyword}"</span> : <span>미연동 고객 목록</span>}
          </div>

          <div className="mt-3 h-[320px] overflow-hidden rounded-[14px] border border-[#E5E7EB]">
            <div className="h-full overflow-auto">
              {loading ? (
                <div className="flex h-full items-center justify-center text-[14px] text-[#6B7280]">불러오는 중...</div>
              ) : customers.length === 0 ? (
                <div className="flex h-full items-center justify-center text-[14px] text-[#6B7280]">
                  연동 가능한 고객이 없습니다.
                </div>
              ) : (
                customers.map((customer) => {
                  const selected = selectedId === customer.id;
                  return (
                    <button
                      key={customer.id}
                      type="button"
                      onClick={() => setSelectedId(customer.id)}
                      className={`w-full border-b border-[#F3F4F6] px-5 py-4 text-left transition-colors last:border-b-0 ${selected ? "bg-[#E6FBF3]" : "hover:bg-[#F9FAFB]"}`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <div className="text-[16px] font-semibold text-[#111827]">{customer.name}</div>
                          {customer.contact1 ? (
                            <div className="mt-1 text-[13px] text-[#4B5563]">{customer.contact1}</div>
                          ) : null}
                          {customer.contact2 ? (
                            <div className="mt-1 text-[12px] text-[#6B7280]">{customer.contact2}</div>
                          ) : null}
                        </div>
                        {selected ? (
                          <span className="inline-flex h-7 items-center justify-center rounded-full bg-[#00C97E] px-3 text-[12px] font-semibold text-white">
                            선택됨
                          </span>
                        ) : null}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <span className="text-[12px] text-[#9CA3AF]">페이지 {page} / {totalPages}</span>
            <div className="flex items-center gap-2">
              <button
                className="h-[36px] rounded-[8px] border border-[#D1D5DB] px-4 text-[13px] text-[#4B5563] disabled:opacity-40"
                onClick={() => fetchCustomers(page - 1, searchKeyword)}
                disabled={!canPrev || loading}
              >
                이전
              </button>
              <button
                className="h-[36px] rounded-[8px] border border-[#D1D5DB] px-4 text-[13px] text-[#4B5563] disabled:opacity-40"
                onClick={() => fetchCustomers(page + 1, searchKeyword)}
                disabled={!canNext || loading}
              >
                다음
              </button>
            </div>
          </div>

          {error ? (
            <div className="mt-3 rounded-[10px] border border-[#FECACA] bg-[#FEF2F2] px-3 py-2 text-[12px] text-[#B91C1C]">
              {error}
            </div>
          ) : null}

          <div className="mt-6 flex justify-end gap-3">
            <button
              className="h-[38px] rounded-[10px] border border-[#D1D5DB] px-5 text-[13px] text-[#4B5563]"
              onClick={onClose}
              disabled={linking}
            >
              취소
            </button>
            <button
              className="h-[38px] rounded-[10px] bg-[#00C97E] px-5 text-[13px] font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleLink}
              disabled={!selectedId || linking}
            >
              {linking ? "연동 중..." : "연동하기"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


