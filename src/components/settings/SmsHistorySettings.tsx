"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useSelectedProjectId } from "@/hooks/useSelectedProjectId";
import { SmsService } from "@/services/sms";
import type { SmsHistory, SmsStatus, SmsMessageType } from "@/types/sms";
import { SMS_STATUS_LABEL } from "@/types/sms";
import DatePicker from "@/components/common/DatePicker";
import dayjs from "dayjs";

const PAGE_SIZE = 10;

// 상태 뱃지 컴포넌트
function StatusBadge({ status }: { status: SmsStatus }) {
  const config: Record<SmsStatus, { bgColor: string; textColor: string }> = {
    pending: {
      bgColor: "bg-[#F3F4F6]",
      textColor: "text-[#4B5563]",
    },
    processing: {
      bgColor: "bg-[#FEF9C3]",
      textColor: "text-[#854D0E]",
    },
    success: {
      bgColor: "bg-[#DCFCE7]",
      textColor: "text-[#166534]",
    },
    failed: {
      bgColor: "bg-[#FEE2E2]",
      textColor: "text-[#991B1B]",
    },
  };

  const label = SMS_STATUS_LABEL[status] || status;
  const { bgColor, textColor } = config[status] || config.processing;

  return (
    <span
      className={`inline-flex items-center h-[24px] px-2.5 rounded-[4px] text-[12px] font-medium ${bgColor} ${textColor}`}
    >
      {label}
    </span>
  );
}

// 메시지 유형 뱃지
function MessageTypeBadge({ type }: { type: SmsMessageType }) {
  const config = {
    SMS: {
      bgColor: "bg-[#E0F2FE]",
      textColor: "text-[#0369A1]",
    },
    LMS: {
      bgColor: "bg-[#F3E8FF]",
      textColor: "text-[#7C3AED]",
    },
    MMS: {
      bgColor: "bg-[#FCE7F3]",
      textColor: "text-[#BE185D]",
    },
  };

  const { bgColor, textColor } = config[type] || config.SMS;

  return (
    <span
      className={`inline-flex items-center h-[24px] px-2.5 rounded-[4px] text-[12px] font-medium ${bgColor} ${textColor}`}
    >
      {type}
    </span>
  );
}

// 페이지네이션 컴포넌트
function Pagination({
  currentPage,
  totalPages,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  const pages = useMemo(() => {
    const result: (number | "...")[] = [];
    const maxVisible = 10;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) result.push(i);
    } else {
      if (currentPage <= 4) {
        for (let i = 1; i <= 5; i++) result.push(i);
        result.push("...");
        result.push(totalPages);
      } else if (currentPage >= totalPages - 3) {
        result.push(1);
        result.push("...");
        for (let i = totalPages - 4; i <= totalPages; i++) result.push(i);
      } else {
        result.push(1);
        result.push("...");
        for (let i = currentPage - 1; i <= currentPage + 1; i++) result.push(i);
        result.push("...");
        result.push(totalPages);
      }
    }

    return result;
  }, [currentPage, totalPages]);

  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-1 mt-6">
      {/* 이전 버튼 */}
      <button
        type="button"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="w-8 h-8 flex items-center justify-center rounded-[5px] hover:bg-neutral-20 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        aria-label="이전 페이지"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M10 12L6 8L10 4"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {/* 페이지 번호 */}
      {pages.map((page, idx) =>
        page === "..." ? (
          <span key={`ellipsis-${idx}`} className="w-8 h-8 flex items-center justify-center text-[14px] text-neutral-60">
            ...
          </span>
        ) : (
          <button
            key={page}
            type="button"
            onClick={() => onPageChange(page)}
            className={`w-8 h-8 flex items-center justify-center rounded-full text-[14px] font-medium transition-colors ${
              currentPage === page
                ? "bg-neutral-90 text-white"
                : "text-neutral-60 hover:bg-neutral-20"
            }`}
          >
            {page}
          </button>
        )
      )}

      {/* 다음 버튼 */}
      <button
        type="button"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="w-8 h-8 flex items-center justify-center rounded-[5px] hover:bg-neutral-20 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        aria-label="다음 페이지"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M6 4L10 8L6 12"
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

export default function SmsHistorySettings() {
  const [projectId, ready] = useSelectedProjectId();

  // 데이터 상태
  const [histories, setHistories] = useState<SmsHistory[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  // 필터 상태
  const [page, setPage] = useState(1);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [statusFilter, setStatusFilter] = useState<SmsStatus | "">("");

  const showProjectMissing = ready && !projectId;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  // 데이터 로드
  const loadHistories = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const res = await SmsService.getHistory({
        page,
        limit: PAGE_SIZE,
        startDate: startDate ? startDate.toISOString().split("T")[0] : undefined,
        endDate: endDate ? endDate.toISOString().split("T")[0] : undefined,
        status: statusFilter || undefined,
      });
      const data = (res.data as any)?.data ?? res.data;
      setHistories(data?.histories ?? []);
      setTotal(data?.total ?? 0);
    } catch (error) {
      console.error("SMS 이력 로드 실패:", error);
      setHistories([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [projectId, page, startDate, endDate, statusFilter]);

  // 프로젝트 변경 또는 필터 변경 시 데이터 로드
  useEffect(() => {
    if (ready && projectId) {
      loadHistories();
    }
  }, [ready, projectId, loadHistories]);

  // 필터 변경 시 페이지 초기화
  useEffect(() => {
    setPage(1);
  }, [startDate, endDate, statusFilter]);

  // 날짜 포맷팅
  const formatDateTime = (dateStr: string) => {
    try {
      return dayjs( dateStr ).format("YYYY-MM-DD HH:mm");
    } catch {
      return dateStr;
    }
  };

  // 필터 초기화
  const handleResetFilters = () => {
    setStartDate(null);
    setEndDate(null);
    setStatusFilter("");
    setPage(1);
  };

  return (
    <div className="bg-card rounded-[14px] pb-7">
      {/* Title */}
      <h1 className="px-7 text-[24px] font-bold text-neutral-90 h-[76px] flex items-center border-b border-[#E2E2E2]">
        문자 발송 이력
      </h1>

      <div className="px-7">
        {/* 설명 */}
        <div className="mb-6 border-b border-[#E2E2E2] pt-[30px] pb-3">
          <h2 className="text-[16px] font-semibold text-neutral-90 mb-1">
            문자 발송 이력
          </h2>
          <p className="text-[14px] text-neutral-60">
            문자 발송 이력을 확인할 수 있습니다.
          </p>
        </div>

        {showProjectMissing ? (
          <div className="flex items-center justify-center h-40 text-[14px] text-neutral-60">
            프로젝트를 먼저 선택해주세요.
          </div>
        ) : (
          <>
            {/* 필터 영역 */}
            {/* <div className="flex flex-wrap items-center gap-3 mb-4">
              <div className="relative w-[160px]">
                <DatePicker
                  value={startDate}
                  onChange={setStartDate}
                  placeholder="시작일"
                  maxDate={endDate || undefined}
                  className="pr-10"
                />
                <svg
                  className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M12.6667 2.66667H3.33333C2.59695 2.66667 2 3.26362 2 4V13.3333C2 14.0697 2.59695 14.6667 3.33333 14.6667H12.6667C13.403 14.6667 14 14.0697 14 13.3333V4C14 3.26362 13.403 2.66667 12.6667 2.66667Z"
                    stroke="#B0B0B0"
                    strokeWidth="1.33"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M10.6667 1.33333V4"
                    stroke="#B0B0B0"
                    strokeWidth="1.33"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M5.33333 1.33333V4"
                    stroke="#B0B0B0"
                    strokeWidth="1.33"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M2 6.66667H14"
                    stroke="#B0B0B0"
                    strokeWidth="1.33"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>

              <span className="text-neutral-60">~</span>

              <div className="relative w-[160px]">
                <DatePicker
                  value={endDate}
                  onChange={setEndDate}
                  placeholder="종료일"
                  minDate={startDate || undefined}
                  className="pr-10"
                />
                <svg
                  className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M12.6667 2.66667H3.33333C2.59695 2.66667 2 3.26362 2 4V13.3333C2 14.0697 2.59695 14.6667 3.33333 14.6667H12.6667C13.403 14.6667 14 14.0697 14 13.3333V4C14 3.26362 13.403 2.66667 12.6667 2.66667Z"
                    stroke="#B0B0B0"
                    strokeWidth="1.33"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M10.6667 1.33333V4"
                    stroke="#B0B0B0"
                    strokeWidth="1.33"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M5.33333 1.33333V4"
                    stroke="#B0B0B0"
                    strokeWidth="1.33"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M2 6.66667H14"
                    stroke="#B0B0B0"
                    strokeWidth="1.33"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>

              <div className="relative">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as SmsStatus | "")}
                  className="h-[34px] w-[120px] px-3 border border-neutral-30 rounded-[5px] text-[14px] text-ink appearance-none bg-white pr-8 outline-none focus:border-neutral-60"
                >
                  <option value="">전체 상태</option>
                  <option value="pending">대기중</option>
                  <option value="processing">처리중</option>
                  <option value="success">완료</option>
                  <option value="failed">실패</option>
                </select>
                <svg
                  className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
                  width="10"
                  height="8"
                  viewBox="0 0 10 8"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M5.40544 7.4382C5.20587 7.71473 4.79413 7.71473 4.59456 7.4382L0.241885 2.7926C0.00323535 2.46192 0.239523 2 0.647327 2L9.35267 2C9.76048 2 9.99676 2.46192 9.75812 2.7926L5.40544 7.4382Z"
                    fill="#B0B0B0"
                  />
                </svg>
              </div>

              {(startDate || endDate || statusFilter) && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="h-[34px] px-3 rounded-[5px] text-[14px] text-neutral-60 hover:bg-neutral-20 transition-colors"
                >
                  필터 초기화
                </button>
              )}
            </div> */}

            {/* 테이블 */}
            <div className="overflow-x-auto">
              {/* 테이블 헤더 */}
              <div className="bg-[#EDEDED] rounded-[8px] px-4 pl-10 h-[40px] flex items-center mb-1">
                <div className="flex-[2] text-[14px] font-medium text-neutral-60 text-left">
                  발송일시
                </div>
                <div className="flex-[2] text-[14px] font-medium text-neutral-60 text-left">
                  발신번호
                </div>
                <div className="flex-[1.2] text-[14px] font-medium text-neutral-60 text-left">
                  메시지 유형
                </div>
                <div className="flex-[1] text-[14px] font-medium text-neutral-60 text-left">
                  광고/정보
                </div>
                <div className="flex-[1.2] text-[14px] font-medium text-neutral-60 text-left">
                  전체 고객 수
                </div>
                <div className="flex-[1] text-[14px] font-medium text-neutral-60 text-left">
                  성공 수
                </div>
                <div className="flex-[1] text-[14px] font-medium text-neutral-60 text-left">
                  실패 수
                </div>
                <div className="flex-[1] text-[14px] font-medium text-neutral-60 text-center">
                  상태
                </div>
              </div>

              {/* 테이블 바디 */}
              {loading ? (
                <div className="flex items-center justify-center h-40 text-[14px] text-neutral-60">
                  로딩 중...
                </div>
              ) : histories.length === 0 ? (
                <div className="flex items-center justify-center h-40 text-[14px] text-neutral-60 border border-dashed border-neutral-30 rounded-[10px] mt-2">
                  문자 발송 이력이 없습니다.
                </div>
              ) : (
                <div className="divide-y divide-[#E2E2E266]">
                  {histories.map((history) => (
                    <div
                      key={history.id}
                      className="px-4 pl-10 h-[52px] flex items-center hover:bg-neutral-10 transition-colors"
                    >
                      <div className="flex-[2] text-[14px] text-neutral-90 text-left">
                        {formatDateTime(history.scheduledAt || history.createdAt)}
                      </div>
                      <div className="flex-[2] text-[14px] text-neutral-90 text-left">
                        {history.senderPhoneNumber}
                      </div>
                      <div className="flex-[1.2] flex">
                        <MessageTypeBadge type={history.messageType} />
                      </div>
                      <div className="flex-[1] text-[14px] text-neutral-60 text-left">
                        {history.advertisementType === "informational" ? "정보성" : "광고성"}
                      </div>
                      <div className="flex-[1.2] text-[14px] text-neutral-90 text-left">
                        {history.totalRecipients}
                      </div>
                      <div className="flex-[1] text-[14px] text-neutral-90 text-left">
                        {history.successCount}
                      </div>
                      <div className="flex-[1] text-[14px] text-neutral-90 text-left">
                        {history.failCount}
                      </div>
                      <div className="flex-[1] flex justify-center">
                        <StatusBadge status={history.status} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 페이지네이션 */}
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={setPage}
            />
          </>
        )}
      </div>
    </div>
  );
}
