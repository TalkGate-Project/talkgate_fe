"use client";

import { useEffect, useState, useCallback } from "react";
import { useSelectedProjectId } from "@/hooks/useSelectedProjectId";
import { SmsService } from "@/services/sms";
import type { SmsHistory, SmsStatus, SmsMessageType } from "@/types/sms";
import { SMS_STATUS_LABEL } from "@/types/sms";
import DateRangePicker from "@/components/common/DateRangePicker";
import Pagination from "@/components/common/Pagination";
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
  const [messageTypeFilter, setMessageTypeFilter] = useState<SmsMessageType | "">("");
  
  // 모달 상태
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [tempStatusFilter, setTempStatusFilter] = useState<SmsStatus | "">("");
  const [tempMessageTypeFilter, setTempMessageTypeFilter] = useState<SmsMessageType | "">("");

  const showProjectMissing = ready && !projectId;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  // 데이터 로드
  const loadHistories = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const query: any = {
        page,
        limit: PAGE_SIZE,
        startDate: startDate ? startDate.toISOString().split("T")[0] : undefined,
        endDate: endDate ? endDate.toISOString().split("T")[0] : undefined,
        status: statusFilter || undefined,
      };
      // messageType 필터가 있으면 추가 (API가 지원하는 경우)
      if (messageTypeFilter) {
        query.messageType = messageTypeFilter;
      }
      const res = await SmsService.getHistory(query);
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
  }, [projectId, page, startDate, endDate, statusFilter, messageTypeFilter]);

  // 프로젝트 변경 또는 필터 변경 시 데이터 로드
  useEffect(() => {
    if (ready && projectId) {
      loadHistories();
    }
  }, [ready, projectId, loadHistories]);

  // 필터 변경 시 페이지 초기화
  useEffect(() => {
    setPage(1);
  }, [startDate, endDate, statusFilter, messageTypeFilter]);

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
    setMessageTypeFilter("");
    setPage(1);
  };

  // 필터 모달 열기
  const handleOpenFilterModal = () => {
    setTempStatusFilter(statusFilter);
    setTempMessageTypeFilter(messageTypeFilter);
    setIsFilterModalOpen(true);
  };

  // 필터 모달 닫기
  const handleCloseFilterModal = () => {
    setIsFilterModalOpen(false);
  };

  // 필터 모달 초기화
  const handleResetFilterModal = () => {
    setTempStatusFilter("");
    setTempMessageTypeFilter("");
  };

  // 필터 적용
  const handleApplyFilters = () => {
    setStatusFilter(tempStatusFilter);
    setMessageTypeFilter(tempMessageTypeFilter);
    setIsFilterModalOpen(false);
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
            <div className="flex flex-wrap items-center gap-3 my-6">
              <DateRangePicker
                startDate={startDate}
                endDate={endDate}
                onStartChange={setStartDate}
                onEndChange={setEndDate}
                showInlineIcon={true}
              />
              
              <button
                type="button"
                onClick={handleOpenFilterModal}
                className="cursor-pointer h-[34px] px-3 rounded-[5px] text-[14px] font-medium text-neutral-90 border border-neutral-30 hover:bg-neutral-10 transition-colors"
              >
                필터추가
              </button>
              
              <button
                type="button"
                onClick={loadHistories}
                className="cursor-pointer h-[34px] px-4 rounded-[5px] text-[14px] font-medium text-white bg-neutral-90 hover:bg-neutral-80 transition-colors"
              >
                검색
              </button>
            </div>

            {/* 필터 모달 */}
            {isFilterModalOpen && (
              <>
                {/* 모달 배경 오버레이 */}
                <div
                  className="fixed inset-0 bg-black/30 z-40"
                  onClick={handleCloseFilterModal}
                />
                
                {/* 모달 */}
                <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[380px] h-[306px] bg-white rounded-[14px] shadow-[0px_13px_61px_rgba(169,169,169,0.366013)] z-50 flex flex-col">
                  {/* 모달 헤더 */}
                  <div className="flex items-center justify-between px-6 pt-6 pb-[30px]">
                    <h3 className="text-[18px] font-semibold text-neutral-90">필터설정</h3>
                    <button
                      type="button"
                      onClick={handleCloseFilterModal}
                      className="cursor-pointer w-6 h-6 flex items-center justify-center hover:bg-neutral-10 rounded transition-colors"
                      aria-label="닫기"
                    >
                      <svg
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M18 6L6 18M6 6L18 18"
                          stroke="#B0B0B0"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>
                  </div>

                  {/* 모달 내용 */}
                  <div className="flex-1 px-7 flex flex-col gap-6">
                    {/* 메시지 유형 필터 */}
                    <div className="flex flex-col gap-2">
                      <label className="text-[14px] font-medium text-[#808080] leading-[17px] tracking-[0.2px]">
                        메시지 유형
                      </label>
                      <div className="flex flex-row items-center gap-3 flex-wrap">
                        {(["전체", "LMS", "SMS", "MMS"] as const).map((type) => {
                          const value = type === "전체" ? "" : type;
                          const isSelected = tempMessageTypeFilter === value;
                          return (
                            <button
                              key={type}
                              type="button"
                              onClick={() => setTempMessageTypeFilter(value as SmsMessageType | "")}
                              className={`cursor-pointer flex flex-row justify-center items-center px-3 py-[6px] gap-[10px] h-[34px] rounded-[5px] transition-colors ${
                                isSelected
                                  ? "bg-[rgba(214,250,232,0.3)] border-2 border-[#51F8A5]"
                                  : "border border-[#E2E2E2] hover:bg-neutral-10"
                              }`}
                            >
                              <span
                                className={`text-[14px] leading-[17px] text-center tracking-[-0.02em] ${
                                  isSelected
                                    ? "text-black font-semibold"
                                    : "text-[#252525] opacity-80 font-medium"
                                }`}
                              >
                                {type}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* 상태 필터 */}
                    <div className="flex flex-col gap-2">
                      <label className="text-[14px] font-medium text-[#808080] leading-[17px] tracking-[0.2px]">
                        상태
                      </label>
                      <div className="flex flex-row items-center gap-3 flex-wrap">
                        {(["전체", "완료", "처리중", "실패"] as const).map((status) => {
                          const value =
                            status === "전체"
                              ? ""
                              : status === "완료"
                              ? "success"
                              : status === "처리중"
                              ? "processing"
                              : "failed";
                          const isSelected = tempStatusFilter === value;
                          return (
                            <button
                              key={status}
                              type="button"
                              onClick={() => setTempStatusFilter(value as SmsStatus | "")}
                              className={`cursor-pointer flex flex-row justify-center items-center px-3 py-[6px] gap-[10px] h-[34px] rounded-[5px] transition-colors ${
                                isSelected
                                  ? "bg-[rgba(214,250,232,0.3)] border-2 border-[#51F8A5]"
                                  : "border border-[#E2E2E2] hover:bg-neutral-10"
                              }`}
                            >
                              <span
                                className={`text-[14px] leading-[17px] text-center tracking-[-0.02em] ${
                                  isSelected
                                    ? "text-black font-semibold"
                                    : "text-[#252525] opacity-80 font-medium"
                                }`}
                              >
                                {status}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* 모달 푸터 */}
                  <div className="px-6 py-3 flex items-center justify-end gap-3 border-t border-[#E2E2E2]">
                    <button
                      type="button"
                      onClick={handleResetFilterModal}
                      className="cursor-pointer w-[62px] h-[34px] flex  justify-center items-center px-3 py-[6px] gap-[10px] h-[34px] w-[60px] border border-[#E2E2E2] rounded-[5px] text-[14px] font-semibold text-black tracking-[-0.02em] hover:bg-neutral-10 transition-colors"
                    >
                      초기화
                    </button>
                    <button
                      type="button"
                      onClick={handleApplyFilters}
                      className="cursor-pointer w-[72px] h-[34px] flex  justify-center items-center px-3 py-[6px] gap-[10px] h-[34px]  bg-[#252525] rounded-[5px] text-[14px] font-semibold text-[#EDEDED] tracking-[-0.02em] hover:bg-neutral-80 transition-colors"
                    >
                      적용완료
                    </button>
                  </div>
                </div>
              </>
            )}

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
            <div className="flex justify-center mt-6">
              <Pagination
                page={page}
                totalPages={totalPages}
                onPageChange={setPage}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
