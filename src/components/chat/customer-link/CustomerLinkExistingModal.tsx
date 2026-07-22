"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ConversationsService } from "@/services/conversations";
import Pagination from "@/components/common/Pagination";
import type { UnconnectedCustomer } from "@/types/conversations";

// Simple scroll lock for fullscreen modals
function lockBodyScroll() {
  document.documentElement.style.overflow = "hidden";
  document.body.style.overflow = "hidden";
}

function unlockBodyScroll() {
  document.documentElement.style.overflow = "";
  document.body.style.overflow = "";
}

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

  useEffect(() => {
    if (open) {
      lockBodyScroll();
      const handleKey = (e: KeyboardEvent) => {
        if (e.key === "Escape" && !linking) {
          onClose();
        }
      };
      window.addEventListener("keydown", handleKey);
      return () => {
        window.removeEventListener("keydown", handleKey);
        unlockBodyScroll();
      };
    }
  }, [open, linking, onClose]);

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
    } catch {
      // 사용자 친화적인 에러 메시지 사용
      setError("고객 연동에 실패했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setLinking(false);
    }
  };

  if (!open) return null;

  const canPrev = page > 1;
  const canNext = page < totalPages;

  return (
    <div className="fixed inset-0 z-[100] bg-black/30 dark:bg-[#000000CC]">
      <div className="w-full h-full p-0 md:h-auto md:min-h-full md:flex md:items-center md:justify-center md:p-4">
        <div className="w-full h-full md:w-[848px] md:h-auto md:max-h-[523px] rounded-t-[14px] md:rounded-[14px] bg-neutral-0 dark:bg-neutral-10 flex flex-col md:shadow-[0px_13px_61px_rgba(169,169,169,0.366013)] md:drop-shadow-[0px_8px_12px_rgba(9,30,66,0.1)] dark:md:shadow-none dark:md:drop-shadow-none">
          {/* Header with back button */}
          <div className="flex items-center gap-3 px-4 md:px-6 pt-4 md:pt-6 pb-3 shrink-0 border-b border-[#E2E2E266]">
            <button
              onClick={() => !linking && onBack()}
              className="flex items-center gap-2 text-neutral-90 dark:text-neutral-70 hover:text-neutral-90 transition-colors"
              aria-label="뒤로가기"
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M15 18l-6-6 6-6" />
              </svg>
              <span className="text-[16px] font-medium">고객목록</span>
            </button>
            <div className="flex-1" />
            <h2 className="text-[18px] font-semibold leading-[21px] text-neutral-90 absolute left-1/2 -translate-x-1/2">
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
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
        <div className="mt-3 md:mt-[18px] leading-[1] px-4 md:px-6 pb-3 text-[14px] text-neutral-60 shrink-0">
          현재 자신에게 할당된 고객 중 아직 연동이 안된 고객 목록입니다.
        </div>

        <div className="border-b border-[#E2E2E266] mx-4 md:mx-7 mb-3 shrink-0"></div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4 md:px-6 pb-4 md:pb-6 min-h-0">
          {/* Search */}
          <div className="mb-3 w-full md:max-w-[188px] flex items-center gap-3">
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
                className="absolute cursor-pointer right-3 top-1/2 -translate-y-1/2 text-neutral-50"
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M17.5 17.5L12.5 12.5M14.1667 8.33333C14.1667 11.555 11.555 14.1667 8.33333 14.1667C5.11167 14.1667 2.5 11.555 2.5 8.33333C2.5 5.11167 5.11167 2.5 8.33333 2.5C11.555 2.5 14.1667 5.11167 14.1667 8.33333Z"
                  stroke="#808080"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>

          {/* Table - 데스크탑, 모바일은 카드 리스트 */}
          {/* 데스크탑 테이블 */}
          <div className="hidden md:block overflow-hidden rounded-[12px] min-h-[340px]">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-neutral-20 text-neutral-60">
                  {[
                    "이름",
                    "연령",
                    "전화번호",
                    "담당팀",
                    "담당자",
                    "등록일",
                    "연동",
                  ].map((h, i) => (
                    <th
                      key={h}
                      className={`px-4 h-[40px] text-[16px] font-medium ${
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
                      <td className="px-4 h-[56px] align-middle text-neutral-90">
                        {c.name}
                      </td>
                      <td className="px-4 h-[56px] align-middle text-neutral-60">
                        {c.ageRange || "-"}
                      </td>
                      <td className="px-4 h-[56px] align-middle">
                        <span className="font-semibold">
                          {c.contact1 || "-"}
                        </span>
                      </td>
                      <td className="px-4 h-[56px] align-middle text-neutral-60">
                        {c.assignedMember?.team?.name || "-"}
                      </td>
                      <td className="px-4 h-[56px] align-middle text-neutral-60">
                        {c.assignedMember?.name || "-"}
                      </td>
                      <td className="px-4 h-[56px] align-middle text-neutral-60">
                        {c.createdAt ? c.createdAt.slice(0, 10) : "-"}
                      </td>
                      <td className="px-4 h-[56px] align-middle">
                        <button
                          className="cursor-pointer h-[28px] px-3 rounded-[6px] bg-neutral-90 text-[13px] text-neutral-0"
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

          {/* 모바일 카드 리스트 */}
          <div className="md:hidden space-y-3 min-h-[340px]">
            {loading &&
              Array.from({ length: PAGE_LIMIT }).map((_, idx) => (
                <div
                  key={`sk-${idx}`}
                  className="bg-card rounded-[12px] p-4 border border-neutral-20 animate-pulse"
                >
                  <div className="h-4 bg-neutral-20 rounded mb-2 w-1/3"></div>
                  <div className="h-3 bg-neutral-20 rounded w-1/2"></div>
                </div>
              ))}
            {!loading && customers.length === 0 && (
              <div className="h-[64px] flex items-center justify-center text-neutral-60 text-[14px]">
                연동 가능한 고객이 없습니다.
              </div>
            )}
            {!loading &&
              customers.map((c) => (
                <div
                  key={c.id}
                  className="bg-card rounded-[12px] p-4 border border-neutral-20"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="text-[16px] font-semibold text-neutral-90 mb-1">
                        {c.name}
                      </div>
                      <div className="text-[14px] text-neutral-60">
                        {c.ageRange && <span className="mr-3">연령: {c.ageRange}</span>}
                        <span className="font-semibold">{c.contact1 || "-"}</span>
                      </div>
                    </div>
                    <button
                      className="cursor-pointer h-[28px] px-3 rounded-[6px] bg-neutral-90 text-[13px] text-neutral-0 shrink-0 ml-3"
                      onClick={() => onLink(c.id)}
                      disabled={linking}
                    >
                      연동
                    </button>
                  </div>
                  <div className="flex items-center gap-4 text-[12px] text-neutral-60 pt-2 border-t border-neutral-20">
                    <span>담당팀: {c.assignedMember?.team?.name || "-"}</span>
                    <span>담당자: {c.assignedMember?.name || "-"}</span>
                  </div>
                  {c.createdAt && (
                    <div className="text-[12px] text-neutral-60 mt-1">
                      등록일: {c.createdAt.slice(0, 10)}
                    </div>
                  )}
                </div>
              ))}
          </div>

          {/* Pagination (bottom bar style) */}
          <div className="mt-4 flex items-center justify-between shrink-0">
            <span className="text-[14px] text-neutral-60">
              총 {total.toLocaleString()}건
            </span>
            <Pagination
              page={page}
              totalPages={totalPages}
              onPageChange={(n) => fetchCustomers(n, searchKeyword)}
              disabled={loading}
            />
            <div className="min-w-[100px] hidden md:block"></div>
          </div>
          <div className="border-t border-[#E2E2E266] w-full mt-4 pt-3 flex items-center justify-end shrink-0">
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
      </div>
    </div>
  );
}
