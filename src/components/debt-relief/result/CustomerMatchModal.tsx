"use client";

import { useEffect, useState } from "react";
import { AnalysisService } from "@/services/analysis";
import { showErrorModal } from "@/providers/ErrorFeedbackModalProvider";
import { showConfirmModal } from "@/lib/confirmModalEvents";
import BaseModal from "@/components/common/BaseModal";
import Pagination from "@/components/common/Pagination";
import { formatContactForDisplay } from "@/utils/format";
import { formatDateTime } from "@/utils/datetime";
import type { ConnectableCustomer } from "@/types/analysis";

type Props = {
  open: boolean;
  onClose: () => void;
  onBack?: () => void;
  /** 상세 화면에서는 분석 ID로 즉시 매칭하고, 신규 화면에서는 생략해 선택만 한다. */
  analysisId?: string;
  /** false면 전용 목록만 조회하고 실제 교체/연동 처리는 onSelected에 위임한다. */
  matchImmediately?: boolean;
  projectId: string;
  /** 진단 원본 입력 성명. 연동 대상 고객명과 다르면 확인 모달로 한 번 더 확인한다. */
  analysisCustomerName?: string;
  onMatched?: () => void;
  onSelected?: (customer: ConnectableCustomer) => void | Promise<void>;
};

type SelectableCustomer = ConnectableCustomer & { isAnalysisConnected?: boolean };

const PAGE_LIMIT = 5;

const TABLE_HEADERS = ["이름", "연령", "전화번호", "담당팀", "담당자", "시간", "연동"] as const;

function CloseIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden className="text-neutral-50">
      <path
        d="M6 18L18 6M6 6L18 18"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden className="text-neutral-50">
      <path
        d="M17.5 17.5L12.5 12.5M14.1667 8.33333C14.1667 11.555 11.555 14.1667 8.33333 14.1667C5.11167 14.1667 2.5 11.555 2.5 8.33333C2.5 5.11167 5.11167 2.5 8.33333 2.5C11.555 2.5 14.1667 5.11167 14.1667 8.33333Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function getTeamName(customer: ConnectableCustomer): string {
  return (
    customer.assignedTeamName ||
    customer.assignedMember?.teamName ||
    customer.assignedMember?.team?.name ||
    "-"
  );
}

function getAssigneeName(customer: ConnectableCustomer): string {
  return customer.assignedMemberName || customer.assignedMember?.name || "-";
}

export default function CustomerMatchModal({
  open,
  onClose,
  onBack,
  analysisId,
  matchImmediately = true,
  projectId,
  analysisCustomerName,
  onMatched,
  onSelected,
}: Props) {
  const [keyword, setKeyword] = useState("");
  const [debouncedKeyword, setDebouncedKeyword] = useState("");
  const [page, setPage] = useState(1);
  const [customers, setCustomers] = useState<SelectableCustomer[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [matchingId, setMatchingId] = useState<number | null>(null);

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

    // analysisId가 있으면(상세/수정) 해당 분석 담당자 기준, 없으면(신규 작성 중) 요청 멤버 기준으로
    // 서버가 알아서 매칭 가능 고객을 골라준다 — 신규/상세 화면 모두 같은 엔드포인트를 쓴다.
    const request = AnalysisService.connectableCustomersV2(projectId, {
      analysisId: analysisId ? Number(analysisId) : undefined,
      search: debouncedKeyword.trim() || undefined,
      page,
      limit: PAGE_LIMIT,
    }).then((response) => response.data.data);

    request
      .then((response) => {
        if (cancelled) return;
        const data = response;
        setCustomers(data.customers);
        setTotal(data.total);
      })
      .catch((error) => {
        if (cancelled) return;
        console.error("Failed to load connectable customers:", error);
        showErrorModal({
          headline: "고객 목록을 불러오지 못했습니다.",
          description: "잠시 후 다시 시도해주세요.",
        });
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, analysisId, projectId, debouncedKeyword, page]);

  useEffect(() => {
    if (!open) {
      setKeyword("");
      setDebouncedKeyword("");
      setPage(1);
      setCustomers([]);
      setTotal(0);
      setMatchingId(null);
    }
  }, [open]);

  const performMatch = async (customerId: number) => {
    setMatchingId(customerId);
    try {
      const selectedCustomer = customers.find((customer) => customer.id === customerId);
      if (!selectedCustomer) return;
      if (!analysisId && selectedCustomer.isAnalysisConnected) return;
      if (analysisId && matchImmediately) {
        await AnalysisService.matchCustomer(Number(analysisId), { projectId, customerId });
        onMatched?.();
      } else {
        await onSelected?.(selectedCustomer);
      }
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

  const handleMatch = (customerId: number) => {
    if (matchingId) return;

    const candidateName = customers.find((customer) => customer.id === customerId)?.name?.trim();
    const originalName = analysisCustomerName?.trim();
    const nameMismatch = Boolean(candidateName && originalName && candidateName !== originalName);

    if (nameMismatch) {
      showConfirmModal({
        headline: "이름이 다른 고객에게 매칭하려고 합니다.",
        message: "이어서 진행하시겠습니까?",
        type: "caution",
        confirmText: "연동",
        cancelText: "취소",
        onConfirm: () => performMatch(customerId),
      });
      return;
    }

    void performMatch(customerId);
  };

  if (!open) return null;

  const totalPages = Math.max(1, Math.ceil(total / PAGE_LIMIT));
  const handleCancel = onBack ?? onClose;
  const handleClose = () => {
    if (!matchingId) onClose();
  };

  return (
    <BaseModal
      onClose={handleClose}
      closeOnOverlayClick={false}
      zIndexClassName="z-50"
      overlayClassName="bg-black/50 dark:bg-[#000000CC]"
      ariaLabel="고객연동"
      positionerClassName="w-full h-full p-0 md:h-auto md:min-h-full md:flex md:items-center md:justify-center md:p-4"
      disableAutoContainerSizing
      containerClassName="w-full h-full md:w-[848px] md:h-[625px] md:max-h-[90vh] rounded-t-[14px] md:rounded-[14px] bg-neutral-0 dark:bg-neutral-10 flex flex-col shadow-[0px_13px_61px_rgba(169,169,169,0.366013)] drop-shadow-[0px_8px_12px_rgba(9,30,66,0.1)] dark:shadow-none dark:drop-shadow-none"
    >
          <div className="flex items-start justify-between gap-4 px-4 md:px-7 pt-5 md:pt-6 shrink-0">
            <div className="min-w-0">
              <h2
                id="customer-match-modal-title"
                className="text-[18px] font-semibold leading-[21px] text-foreground dark:text-[#FDFDFD]"
              >
                고객연동
              </h2>
              <p className="mt-3 text-[14px] font-medium leading-[17px] tracking-[0.2px] text-neutral-60">
                {analysisId
                  ? "현재 자신에게 할당된 고객 중 아직 연동이 안된 고객 목록입니다."
                  : "등록된 고객 중 이번 분석에 연결할 고객을 선택해주세요."}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={Boolean(matchingId)}
              aria-label="닫기"
              className="cursor-pointer w-6 h-6 grid place-items-center shrink-0 mt-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <CloseIcon />
            </button>
          </div>

          <div className="mx-4 md:mx-7 mt-4 border-b border-neutral-30 dark:border-[#4D4D4D] shrink-0" />

          <div className="flex-1 min-h-0 overflow-y-auto px-4 md:px-7 pt-3 pb-4 flex flex-col">
            <div className="relative w-full md:w-[200px] shrink-0">
              <input
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
                placeholder="이름 연락처로 검색..."
                disabled={Boolean(matchingId)}
                className="w-full h-[34px] px-3 pr-10 rounded-[5px] border border-neutral-30 bg-card text-[12px] font-medium leading-[14px] tracking-[-0.02em] text-foreground placeholder:text-neutral-60 focus:outline-none focus:border-neutral-50 disabled:opacity-60 dark:border-[#4D4D4D] dark:bg-[#1E1E1E] dark:text-[#FDFDFD]"
              />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
                <SearchIcon />
              </span>
            </div>

            <div className="hidden md:block mt-3 overflow-hidden rounded-[8px] flex-1 min-h-0">
              <table className="w-full text-left border-collapse table-fixed">
                <thead>
                  <tr className="bg-neutral-20 text-neutral-60 dark:bg-[#333333]">
                    {TABLE_HEADERS.map((header, index) => (
                      <th
                        key={header}
                        className={`h-10 px-3 text-[16px] font-medium leading-[19px] ${
                          index === 0 ? "rounded-l-[8px] w-[88px]" : ""
                        } ${index === 1 ? "w-[56px]" : ""} ${index === 2 ? "w-[140px]" : ""} ${
                          index === 3 ? "w-[96px]" : ""
                        } ${index === 4 ? "w-[72px]" : ""} ${index === 5 ? "w-[140px]" : ""} ${
                          index === 6 ? "rounded-r-[8px] w-[72px] text-center" : ""
                        }`}
                      >
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading &&
                    Array.from({ length: PAGE_LIMIT }).map((_, rowIndex) => (
                      <tr key={`skeleton-${rowIndex}`} className="border-b border-neutral-30 dark:border-[#4D4D4D] animate-pulse">
                        {Array.from({ length: 7 }).map((__, cellIndex) => (
                          <td key={cellIndex} className="h-[59px] px-3 align-middle">
                            <div
                              className="h-3 rounded bg-neutral-20"
                              style={{
                                width: cellIndex === 2 ? 120 : cellIndex === 5 ? 100 : 48,
                              }}
                            />
                          </td>
                        ))}
                      </tr>
                    ))}

                  {!loading && customers.length === 0 && (
                    <tr>
                      <td colSpan={7} className="h-[240px] text-center text-[14px] text-neutral-60">
                        연동 가능한 고객이 없습니다.
                      </td>
                    </tr>
                  )}

                  {!loading &&
                    customers.map((customer) => (
                      <tr key={customer.id} className="border-b border-neutral-30 dark:border-[#4D4D4D]">
                        <td className="h-[59px] px-3 align-middle text-[14px] font-medium text-neutral-90 opacity-80 truncate">
                          {customer.name || "-"}
                        </td>
                        <td className="h-[59px] px-3 align-middle text-[14px] font-medium text-neutral-90 opacity-80 truncate">
                          {customer.ageRange || "-"}
                        </td>
                        <td className="h-[59px] px-3 align-middle text-[14px] font-semibold text-neutral-90 opacity-80 truncate">
                          {formatContactForDisplay(customer.contact1) || "-"}
                        </td>
                        <td className="h-[59px] px-3 align-middle text-[14px] font-medium text-neutral-90 opacity-80 truncate">
                          {getTeamName(customer)}
                        </td>
                        <td className="h-[59px] px-3 align-middle text-[14px] font-medium text-neutral-90 opacity-80 truncate">
                          {getAssigneeName(customer)}
                        </td>
                        <td className="h-[59px] px-3 align-middle text-[14px] font-medium text-neutral-90 opacity-80 whitespace-nowrap">
                          {formatDateTime(customer.applicationDate)}
                        </td>
                        <td className="h-[59px] px-3 align-middle text-center">
                          <button
                            type="button"
                            disabled={matchingId === customer.id || customer.isAnalysisConnected}
                            onClick={() => handleMatch(customer.id)}
                            className="cursor-pointer inline-flex h-[34px] min-w-[48px] items-center justify-center rounded-[5px] bg-neutral-90 px-3 py-0 text-[14px] font-semibold leading-[17px] tracking-[-0.02em] text-neutral-20 disabled:cursor-not-allowed disabled:opacity-50 dark:text-[#333333]"
                          >
                            <span className="-translate-y-px">
                              {matchingId === customer.id
                                ? "..."
                                : customer.isAnalysisConnected
                                  ? "연동됨"
                                  : "연동"}
                            </span>
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>

            <div className="md:hidden mt-3 space-y-3 flex-1 min-h-0">
              {loading &&
                Array.from({ length: PAGE_LIMIT }).map((_, index) => (
                  <div
                    key={`mobile-skeleton-${index}`}
                    className="rounded-[12px] border border-neutral-30 p-4 animate-pulse dark:border-[#4D4D4D]"
                  >
                    <div className="h-4 w-1/3 bg-neutral-20 rounded mb-2" />
                    <div className="h-3 w-1/2 bg-neutral-20 rounded" />
                  </div>
                ))}

              {!loading && customers.length === 0 && (
                <div className="h-[160px] flex items-center justify-center text-[14px] text-neutral-60">
                  연동 가능한 고객이 없습니다.
                </div>
              )}

              {!loading &&
                customers.map((customer) => (
                  <div
                    key={customer.id}
                    className="rounded-[12px] border border-neutral-30 bg-card p-4 dark:border-[#4D4D4D] dark:bg-[#1E1E1E]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-[16px] font-semibold text-foreground truncate">
                          {customer.name || "-"}
                        </p>
                        <p className="mt-1 text-[14px] text-neutral-60">
                          {customer.ageRange ? `${customer.ageRange} · ` : ""}
                          <span className="font-semibold text-foreground">
                            {formatContactForDisplay(customer.contact1) || "-"}
                          </span>
                        </p>
                      </div>
                      <button
                        type="button"
                        disabled={matchingId === customer.id || customer.isAnalysisConnected}
                        onClick={() => handleMatch(customer.id)}
                        className="cursor-pointer inline-flex h-[34px] min-w-[48px] shrink-0 items-center justify-center rounded-[5px] bg-neutral-90 px-3 py-0 text-[14px] font-semibold leading-[17px] text-neutral-20 disabled:cursor-not-allowed disabled:opacity-50 dark:text-[#333333]"
                      >
                        <span className="-translate-y-px">
                          {matchingId === customer.id
                            ? "..."
                            : customer.isAnalysisConnected
                              ? "연동됨"
                              : "연동"}
                        </span>
                      </button>
                    </div>
                    <div className="mt-3 pt-3 border-t border-neutral-30 dark:border-[#4D4D4D] flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-neutral-60">
                      <span>담당팀: {getTeamName(customer)}</span>
                      <span>담당자: {getAssigneeName(customer)}</span>
                      <span>시간: {formatDateTime(customer.applicationDate)}</span>
                    </div>
                  </div>
                ))}
            </div>

            <div className="mt-4 flex items-center justify-between gap-3 shrink-0">
              <span className="text-[14px] font-medium leading-5 text-neutral-50 whitespace-nowrap">
                총 {total.toLocaleString("ko-KR")}건
              </span>
              <Pagination
                page={page}
                totalPages={totalPages}
                onPageChange={setPage}
                disabled={loading || Boolean(matchingId)}
                maxButtons={10}
                className="justify-center"
              />
              <div className="w-[52px] hidden md:block" aria-hidden />
            </div>
          </div>

          <div className="mx-4 md:mx-7 border-t border-neutral-30 dark:border-[#4D4D4D] shrink-0" />

          <div className="flex justify-end px-4 md:px-7 py-4 shrink-0">
            <button
              type="button"
              onClick={handleCancel}
              disabled={Boolean(matchingId)}
              className="cursor-pointer inline-flex h-[34px] items-center justify-center rounded-[5px] border border-neutral-30 bg-card px-3 py-0 text-[14px] font-semibold leading-[17px] tracking-[-0.02em] text-foreground hover:bg-neutral-10 disabled:cursor-not-allowed disabled:opacity-50 dark:border-[#4D4D4D] dark:bg-[#1E1E1E] dark:text-[#FDFDFD] dark:hover:bg-[#222222]"
            >
              <span className="-translate-y-px">취소</span>
            </button>
          </div>
    </BaseModal>
  );
}
