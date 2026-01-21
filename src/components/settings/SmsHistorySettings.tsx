"use client";

import { useEffect, useState, useCallback } from "react";
import { useSelectedProjectId } from "@/hooks/useSelectedProjectId";
import { SmsService } from "@/services/sms";
import type { SmsHistory, SmsStatus, SmsMessageType } from "@/types/sms";
import DateRangePicker from "@/components/common/DateRangePicker";
import Pagination from "@/components/common/Pagination";
import StatusBadge from "./sms-history/StatusBadge";
import MessageTypeBadge from "./sms-history/MessageTypeBadge";
import SmsHistoryFilterModal from "./sms-history/SmsHistoryFilterModal";
import SmsHistoryDetailModal from "./sms-history/SmsHistoryDetailModal";
import { PAGE_SIZE } from "./sms-history/constants";
import { formatDateTime } from "@/utils/datetime";
import { dateToISOString } from "./sms-history/utils";
import { SMS_STATUS_LABEL } from "@/types/sms";

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
  const [selectedHistory, setSelectedHistory] = useState<SmsHistory | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

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
        startDate: dateToISOString(startDate),
        endDate: dateToISOString(endDate),
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

  // 필터 모달 열기
  const handleOpenFilterModal = () => {
    setIsFilterModalOpen(true);
  };

  // 필터 모달 닫기
  const handleCloseFilterModal = () => {
    setIsFilterModalOpen(false);
  };

  // 상세 모달 열기
  const handleOpenDetailModal = (history: SmsHistory) => {
    setSelectedHistory(history);
    setIsDetailModalOpen(true);
  };

  // 상세 모달 닫기
  const handleCloseDetailModal = () => {
    setIsDetailModalOpen(false);
    setSelectedHistory(null);
  };

  // 모바일용 메시지 유형 뱃지 (CSS 참고 - padding 2px 4px, height 18px)
  const MobileMessageTypeBadge = ({ type }: { type: SmsMessageType }) => {
    const config: Record<SmsMessageType, { bgColor: string; textColor: string }> = {
      SMS: {
        bgColor: "bg-[#D3E1FE]",
        textColor: "text-[#4D82F3]",
      },
      LMS: {
        bgColor: "bg-[#D3E1FE]",
        textColor: "text-[#4D82F3]",
      },
      MMS: {
        bgColor: "bg-[#FFF5D5]",
        textColor: "text-[#976400]",
      },
    };
    const { bgColor, textColor } = config[type] || config.SMS;
    return (
      <span
        className={`inline-flex items-center justify-center h-[18px] px-1 py-0.5 rounded-[5px] text-[12px] font-medium ${bgColor} ${textColor} opacity-80`}
      >
        {type}
      </span>
    );
  };

  // 모바일용 상태 뱃지 (CSS 참고 - padding 4px 12px, height 22px, rounded-[30px])
  const MobileStatusBadge = ({ status }: { status: SmsStatus }) => {
    const config: Record<SmsStatus, { bgColor: string; textColor: string }> = {
      pending: {
        bgColor: "bg-[#F3F4F6]",
        textColor: "text-[#4B5563]",
      },
      processing: {
        bgColor: "bg-[#D3E1FE]",
        textColor: "text-[#4D82F3]",
      },
      success: {
        bgColor: "bg-[#D6FAE8]",
        textColor: "text-[#00B55B]",
      },
      failed: {
        bgColor: "bg-[#FFEBEB]",
        textColor: "text-[#D83232]",
      },
    };
    const { bgColor, textColor } = config[status] || config.processing;
    const label = SMS_STATUS_LABEL[status] || status;
    return (
      <span
        className={`inline-flex items-center justify-center h-[22px] px-3 py-1 rounded-[30px] text-[12px] font-medium ${bgColor} ${textColor} opacity-80`}
      >
        {label}
      </span>
    );
  };

  return (
    <div className="bg-card rounded-[14px] lg:rounded-[14px] rounded-t-none lg:rounded-t-[14px] pb-4 md:pb-7">
      {/* Title */}
      <h1 className="px-4 md:px-7 text-[18px] md:text-[24px] font-bold text-ink dark:text-neutral-80 py-4 md:py-0 md:h-[76px] flex items-center border-b border-neutral-30 dark:border-neutral-30">
        문자 발송 이력
      </h1>

      <div className="px-4 md:px-7">
        {/* 설명 - 데스크탑만 표시 */}
        <div className="hidden md:block mb-6 border-b border-neutral-30 dark:border-neutral-30 pt-[30px] pb-3">
          <h2 className="text-[16px] font-semibold text-ink dark:text-neutral-80 mb-1">
            문자 발송 이력
          </h2>
          <p className="text-[14px] text-neutral-60 dark:text-neutral-60">
            문자 발송 이력을 확인할 수 있습니다.
          </p>
        </div>

        {showProjectMissing ? (
          <div className="flex items-center justify-center h-40 text-[14px] text-neutral-60 dark:text-neutral-60">
            프로젝트를 먼저 선택해주세요.
          </div>
        ) : (
          <>
            {/* 필터 영역 */}
            <div className="flex flex-col md:flex-row md:flex-wrap items-stretch md:items-center gap-3 my-4 md:my-6">
              <div className="md:flex-none">
                <DateRangePicker
                  startDate={startDate}
                  endDate={endDate}
                  onStartChange={setStartDate}
                  onEndChange={setEndDate}
                  onReset={() => {
                    // 날짜뿐만 아니라 필터 모달의 필터도 함께 초기화
                    setStatusFilter("");
                    setMessageTypeFilter("");
                    setPage(1);
                  }}
                  showInlineIcon={true}
                />
              </div>
              
              <div className="flex gap-2 md:gap-3">
                <button
                  type="button"
                  onClick={handleOpenFilterModal}
                  className="cursor-pointer flex-1 md:flex-none h-[34px] px-3 rounded-[5px] text-[14px] font-medium text-ink dark:text-neutral-80 border border-neutral-30 dark:border-neutral-30 hover:bg-neutral-10 dark:hover:bg-neutral-20 transition-colors"
                >
                  필터추가
                </button>
                
                <button
                  type="button"
                  onClick={loadHistories}
                  className="cursor-pointer flex-1 md:flex-none h-[34px] px-4 rounded-[5px] text-[14px] font-medium text-neutral-0 dark:text-neutral-0 bg-neutral-90 dark:bg-neutral-80 hover:bg-neutral-80 dark:hover:bg-neutral-70 transition-colors"
                >
                  검색
                </button>
              </div>
            </div>

            {/* 필터 모달 */}
            <SmsHistoryFilterModal
              isOpen={isFilterModalOpen}
              onClose={handleCloseFilterModal}
              statusFilter={statusFilter}
              messageTypeFilter={messageTypeFilter}
              onStatusChange={setStatusFilter}
              onMessageTypeChange={setMessageTypeFilter}
            />

            {/* 상세 정보 모달 */}
            <SmsHistoryDetailModal
              isOpen={isDetailModalOpen}
              onClose={handleCloseDetailModal}
              history={selectedHistory}
            />

            {/* 모바일 카드 리스트 */}
            <div className="md:hidden space-y-3">
              {loading ? (
                <div className="flex items-center justify-center h-40 text-[14px] text-neutral-60 dark:text-neutral-60">
                  로딩 중...
                </div>
              ) : histories.length === 0 ? (
                <div className="flex items-center justify-center h-40 text-[14px] text-neutral-60 dark:text-neutral-60 border border-dashed border-neutral-30 dark:border-neutral-30 rounded-[10px]">
                  문자 발송 이력이 없습니다.
                </div>
              ) : (
                histories.map((history) => (
                  <div
                    key={history.id}
                    onClick={() => handleOpenDetailModal(history)}
                    className="bg-white dark:bg-neutral-10 border border-neutral-30 dark:border-neutral-30 rounded-[12px] p-4 relative cursor-pointer hover:bg-neutral-5 dark:hover:bg-neutral-15 transition-colors"
                  >
                    {/* 첫 번째 줄: 발신번호, 메시지 유형 뱃지, 날짜/시간 */}
                    <div className="flex items-center justify-between mb-2">
                      {/* 좌측: 발신번호 + 메시지 유형 뱃지 */}
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <div className="text-[14px] font-semibold text-neutral-90 dark:text-neutral-80 leading-[17px]">
                          {history.senderPhoneNumber}
                        </div>
                        {/* 메시지 유형 뱃지 (발신번호 바로 오른쪽) */}
                        <MobileMessageTypeBadge type={history.messageType} />
                      </div>
                      {/* 우측: 날짜/시간 */}
                      <div className="text-[14px] font-semibold text-neutral-90 dark:text-neutral-80 opacity-80 flex-shrink-0 ml-2 leading-[17px]">
                        {formatDateTime(history.scheduledAt || history.createdAt)}
                      </div>
                    </div>

                    {/* 하단: 고객/성공/실패/정보성 또는 광고성/상태 */}
                    <div className="flex items-center justify-between">
                      {/* 좌측: 고객/성공/실패/정보성 또는 광고성 */}
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <span className="text-[13px] font-medium text-neutral-90 dark:text-neutral-80 leading-[16px]">고객</span>
                        <span className="text-[14px] font-bold text-neutral-90 dark:text-neutral-80 leading-[14px]">
                          {history.totalRecipients > 99 ? `+99` : history.totalRecipients}
                        </span>
                        <span className="text-[13px] font-medium text-neutral-90 dark:text-neutral-80 leading-[16px]">성공</span>
                        <span className="text-[14px] font-bold text-neutral-90 dark:text-neutral-80 leading-[14px]">
                          {history.successCount}
                        </span>
                        <span className="text-[13px] font-medium text-neutral-90 dark:text-neutral-80 leading-[16px]">실패</span>
                        <span className="text-[14px] font-bold text-neutral-90 dark:text-neutral-80 leading-[14px]">
                          {history.failCount}
                        </span>
                        <span className="text-[13px] font-medium text-neutral-90 dark:text-neutral-80 leading-[16px]">
                          {history.advertisementType === "informational" ? "정보성" : "광고성"}
                        </span>
                      </div>
                      {/* 우측: 상태 뱃지 */}
                      <div className="flex-shrink-0 ml-2">
                        <MobileStatusBadge status={history.status} />
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* 데스크탑 테이블 */}
            <div className="hidden md:block overflow-x-auto">
              {/* 테이블 헤더 */}
              <div className="bg-neutral-20 dark:bg-neutral-20 rounded-[8px] px-4 pl-10 h-[40px] flex items-center mb-1">
                <div className="flex-[2] text-[14px] font-medium text-neutral-60 dark:text-neutral-60 text-left">
                  발송일시
                </div>
                <div className="flex-[2] text-[14px] font-medium text-neutral-60 dark:text-neutral-60 text-left">
                  발신번호
                </div>
                <div className="flex-[1.2] text-[14px] font-medium text-neutral-60 dark:text-neutral-60 text-left">
                  메시지 유형
                </div>
                <div className="flex-[1] text-[14px] font-medium text-neutral-60 dark:text-neutral-60 text-left">
                  광고/정보
                </div>
                <div className="flex-[1.2] text-[14px] font-medium text-neutral-60 dark:text-neutral-60 text-left">
                  전체 고객 수
                </div>
                <div className="flex-[1] text-[14px] font-medium text-neutral-60 dark:text-neutral-60 text-left">
                  성공 수
                </div>
                <div className="flex-[1] text-[14px] font-medium text-neutral-60 dark:text-neutral-60 text-left">
                  실패 수
                </div>
                <div className="flex-[1] text-[14px] font-medium text-neutral-60 dark:text-neutral-60 text-center">
                  상태
                </div>
              </div>

              {/* 테이블 바디 */}
              {loading ? (
                <div className="flex items-center justify-center h-40 text-[14px] text-neutral-60 dark:text-neutral-60">
                  로딩 중...
                </div>
              ) : histories.length === 0 ? (
                <div className="flex items-center justify-center h-40 text-[14px] text-neutral-60 dark:text-neutral-60 border border-dashed border-neutral-30 dark:border-neutral-30 rounded-[10px] mt-2">
                  문자 발송 이력이 없습니다.
                </div>
              ) : (
                <div className="divide-y divide-neutral-30/40 dark:!divide-neutral-[#44444455]">
                  {histories.map((history) => {
                    const isLastRow = histories.indexOf(history) === histories.length - 1;
                    return (
                      <div
                        key={history.id}
                        onClick={() => handleOpenDetailModal(history)}
                        className={`px-4 pl-10 h-[52px] flex items-center hover:bg-neutral-10 dark:hover:bg-neutral-20 transition-colors border-b border-neutral-30/40 dark:!border-[#44444455] cursor-pointer`}
                      >
                        <div className="flex-[2] text-[14px] text-ink dark:text-neutral-80 text-left">
                          {formatDateTime(history.scheduledAt || history.createdAt)}
                        </div>
                        <div className="flex-[2] text-[14px] text-ink dark:text-neutral-80 text-left">
                          {history.senderPhoneNumber}
                        </div>
                        <div className="flex-[1.2] flex">
                          <MessageTypeBadge type={history.messageType} />
                        </div>
                        <div className="flex-[1] text-[14px] text-neutral-60 dark:text-neutral-60 text-left">
                          {history.advertisementType === "informational" ? "정보성" : "광고성"}
                        </div>
                        <div className="flex-[1.2] text-[14px] text-ink dark:text-neutral-80 text-left">
                          {history.totalRecipients}
                        </div>
                        <div className="flex-[1] text-[14px] text-ink dark:text-neutral-80 text-left">
                          {history.successCount}
                        </div>
                        <div className="flex-[1] text-[14px] text-ink dark:text-neutral-80 text-left">
                          {history.failCount}
                        </div>
                        <div className="flex-[1] flex justify-center">
                          <StatusBadge status={history.status} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 페이지네이션 */}
            <div className="flex justify-center mt-4 md:mt-6">
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
