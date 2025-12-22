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
import { PAGE_SIZE } from "./sms-history/constants";
import { formatDateTime, dateToISOString } from "./sms-history/utils";

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

  return (
    <div className="bg-card rounded-[14px] pb-7">
      {/* Title */}
      <h1 className="px-7 text-[24px] font-bold text-ink dark:text-neutral-80 h-[76px] flex items-center border-b border-neutral-30 dark:border-neutral-30">
        문자 발송 이력
      </h1>

      <div className="px-7">
        {/* 설명 */}
        <div className="mb-6 border-b border-neutral-30 dark:border-neutral-30 pt-[30px] pb-3">
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
            <div className="flex flex-wrap items-center gap-3 my-6">
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
              
              <button
                type="button"
                onClick={handleOpenFilterModal}
                className="cursor-pointer h-[34px] px-3 rounded-[5px] text-[14px] font-medium text-ink dark:text-neutral-80 border border-neutral-30 dark:border-neutral-30 hover:bg-neutral-10 dark:hover:bg-neutral-20 transition-colors"
              >
                필터추가
              </button>
              
              <button
                type="button"
                onClick={loadHistories}
                className="cursor-pointer h-[34px] px-4 rounded-[5px] text-[14px] font-medium text-neutral-0 dark:text-neutral-0 bg-neutral-90 dark:bg-neutral-80 hover:bg-neutral-80 dark:hover:bg-neutral-70 transition-colors"
              >
                검색
              </button>
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

            {/* 테이블 */}
            <div className="overflow-x-auto">
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
                        className={`px-4 pl-10 h-[52px] flex items-center hover:bg-neutral-10 dark:hover:bg-neutral-20 transition-colors border-b border-neutral-30/40 dark:!border-[#44444455]`}
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
