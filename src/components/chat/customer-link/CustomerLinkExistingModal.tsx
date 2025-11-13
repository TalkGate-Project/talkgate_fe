"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import BaseModal from "@/components/common/BaseModal";
import { ConversationsService } from "@/services/conversations";
import Pagination from "@/components/common/Pagination";
import type { UnconnectedCustomer } from "@/types/conversations";

type Props = {
  open: boolean;
  onClose: () => void;
  onBack: () => void;
  projectId: number;
  conversationName?: string;
  onLink: (customerId: number) => Promise<void>;
};

const PAGE_LIMIT = 5;

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
      const message =
        err instanceof Error ? err.message : "고객 연동에 실패했습니다.";
      setError(message);
    } finally {
      setLinking(false);
    }
  };

  if (!open) return null;

  const canPrev = page > 1;
  const canNext = page < totalPages;

  return (
    <BaseModal
      onClose={() => (!linking ? onClose() : undefined)}
      overlayClassName="bg-black/30"
      containerClassName="relative w-[848px] rounded-[14px] bg-neutral-0 shadow-[0px_13px_61px_rgba(169,169,169,0.37)]"
      ariaLabel="기존 고객과 연동"
    >
      <div className="relative w-full h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-3">
          <h2 className="text-[18px] font-semibold leading-[21px] text-neutral-90">
            고객연동
          </h2>
          <button
            aria-label="close"
            onClick={() => !linking && onClose()}
            className="cursor-pointer w-6 h-6 grid place-items-center"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M6 18L18 6M6 6L18 18"
                stroke="#B0B0B0"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </button>
        </div>
        <div className="mt-[18px] leading-[1] px-6 pb-3 text-[14px] text-neutral-60">
          현재 자신에게 할당된 고객 중 아직 연동이 안된 고객 목록입니다.
        </div>

        <div className="border-b border-[#E2E2E266] mx-7 mb-3"></div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 pb-6">
          {/* Search */}
          <div className="mb-3 max-w-[188px] flex items-center gap-3">
            <div className="flex-1 relative">
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="w-full h-[36px] rounded-[10px] border border-neutral-60 bg-neutral-0 pl-3 pr-3 text-[14px] outline-none placeholder:text-neutral-60"
                placeholder="이름 연락처로 검색..."
                disabled={loading}
              />
              <svg
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-50"
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M17.5 17.5L12.5 12.5M14.1667 8.33333C14.1667 11.555 11.555 14.1667 8.33333 14.1667C5.11167 14.1667 2.5 11.555 2.5 8.33333C2.5 5.11167 5.11167 2.5 8.33333 2.5C11.555 2.5 14.1667 5.11167 14.1667 8.33333Z"
                  stroke="#808080"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-hidden rounded-[12px] min-h-[340px]">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-neutral-20 text-neutral-60">
                  {[
                    "이름",
                    "연령",
                    "전화번호",
                    "담당팀",
                    "담당자",
                    "시간",
                    "연동",
                  ].map((h, i) => (
                    <th
                      key={h}
                      className={`px-6 h-[40px] text-[16px] font-medium ${
                        i === 0
                          ? "rounded-l-[8px]"
                          : i === 6
                          ? "rounded-r-[8px]"
                          : ""
                      }`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="text-[14px]">
                {loading &&
                  Array.from({ length: PAGE_LIMIT }).map((_, idx) => (
                    <tr
                      key={`sk-${idx}`}
                      className="border-b border-neutral-20 animate-pulse"
                    >
                      {Array.from({ length: 7 }).map((__, cIdx) => (
                        <td key={cIdx} className="px-6 h-[56px] align-middle">
                          <div
                            className="h-3 rounded bg-neutral-20"
                            style={{
                              width: cIdx === 0 ? 80 : cIdx === 2 ? 140 : 60,
                            }}
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                {!loading && customers.length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      className="h-[64px] text-center text-neutral-60"
                    >
                      연동 가능한 고객이 없습니다.
                    </td>
                  </tr>
                )}
                {!loading &&
                  customers.map((c) => (
                    <tr key={c.id} className="border-b border-neutral-20">
                      <td className="px-6 h-[56px] align-middle text-neutral-90">
                        {c.name}
                      </td>
                      <td className="px-6 h-[56px] align-middle text-neutral-60">
                        -
                      </td>
                      <td className="px-6 h-[56px] align-middle">
                        <span className="font-semibold">
                          {c.contact1 || "-"}
                        </span>
                      </td>
                      <td className="px-6 h-[56px] align-middle text-neutral-60">
                        {c.assignedMember?.team?.name || "-"}
                      </td>
                      <td className="px-6 h-[56px] align-middle text-neutral-60">
                        {c.assignedMember?.name || "-"}
                      </td>
                      <td className="px-6 h-[56px] align-middle text-neutral-60">
                        -
                      </td>
                      <td className="px-6 h-[56px] align-middle">
                        <button
                          className="h-[28px] px-3 rounded-[6px] bg-neutral-90 text-[13px] text-neutral-0"
                          onClick={() => onLink(c.id)}
                          disabled={linking}
                        >
                          연동
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          {/* Pagination (bottom bar style) */}
          <div className="mt-4 flex items-center justify-between">
            <span className="text-[14px] text-neutral-60">
              총 {total.toLocaleString()}건
            </span>
            <Pagination
              page={page}
              totalPages={totalPages}
              onPageChange={(n) => fetchCustomers(n, searchKeyword)}
              disabled={loading}
            />
            <div className="min-w-[100px]"></div>
          </div>
          <div className="border-t border-[#E2E2E266] w-full mt-4 pt-3 flex items-center justify-end">
            <button
              className="cursor-pointer h-[34px] px-4 rounded-[6px] border border-neutral-30 text-[14px]"
              onClick={onClose}
              disabled={linking}
            >
              취소
            </button>
          </div>

          {/* Error */}
          {error && (
            <div className="mt-3 rounded-[5px] border border-danger-20 bg-danger-10 px-3 py-2 text-[14px] text-danger-60">
              {error}
            </div>
          )}
        </div>
      </div>
    </BaseModal>
  );
}
