"use client";

import { useState, useEffect } from "react";
import { CustomersBulkService } from "@/services/customersBulk";
import { getSelectedProjectId } from "@/lib/project";
import type { BulkJobDetail, BulkJobFailure } from "@/types/customersBulk";
import { formatDateTimeWithSpaces, formatDateTimeCompact } from "@/utils/datetime";

interface FailureDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobId: number;
}

interface FailureCardProps {
  errorCode: string;
  errorMessage: string;
  rowNumber: number;
}

function FailureCard({ errorCode, errorMessage, rowNumber }: FailureCardProps) {
  const displayMessage = getErrorDisplayMessage(errorCode, errorMessage);

  return (
    <div className="flex flex-col items-start px-3 py-2 gap-1.5 border border-neutral-30 dark:border-neutral-30 rounded-[5px] h-[68px]">
      <div className="text-[14px] font-semibold leading-5 text-danger-40 dark:text-danger-40 truncate w-full" title={displayMessage}>
        {displayMessage}
      </div>
      <div className="text-[14px] font-medium leading-5 text-neutral-90 dark:text-neutral-80">
        {rowNumber}행
      </div>
    </div>
  );
}

function getErrorDisplayMessage(errorCode: string, errorMessage: string): string {
  // 에러 코드와 메시지를 한국어로 변환
  const errorMap: Record<string, string> = {
    // Error Codes
    VALIDATION_ERROR: "필수필드 누락",
    PROCESSING_ERROR: "처리 오류",
    DUPLICATE_CUSTOMER: "고객 중복",
    CUSTOMER_ALREADY_EXISTS: "고객 중복",
    SYSTEM_ERROR: "시스템 오류",
    INVALID_FORMAT: "형식 오류",

    // Error Messages
    REQUIRED_FIELDS_MISSING: "필수필드 누락",
    DUPLICATE_ERROR: "고객 중복",
    INVALID_DATA: "데이터 형식 오류",
  };

  // errorMessage 먼저 확인, 없으면 errorCode 확인
  return errorMap[errorMessage] || errorMap[errorCode] || errorMessage || errorCode;
}

export default function FailureDetailModal({
  isOpen,
  onClose,
  jobId,
}: FailureDetailModalProps) {
  const [jobDetail, setJobDetail] = useState<BulkJobDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [failureList, setFailureList] = useState<BulkJobFailure[]>([]);

  useEffect(() => {
    if (!isOpen || !jobId) return;

    const fetchJobDetail = async () => {
      const projectId = getSelectedProjectId();
      if (!projectId) return;

      try {
        setIsLoading(true);
        const response = await CustomersBulkService.importDetail(jobId, projectId);
        
        // API response structure: { ok, status, data: { result, data: { ...job details } } }
        const responseData = response.data as any;
        const actualData = responseData.data || responseData;
        
        setJobDetail(actualData);

        const failures = actualData.failures || [];
        setFailureList(failures.slice(0, 20));
      } catch (error) {
        console.error("Failed to fetch job detail:", error);
        setJobDetail(null);
        setFailureList([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchJobDetail();
  }, [isOpen, jobId]);

  if (!isOpen) return null;

  // 날짜 포맷팅은 중앙 유틸리티 사용
  const formatDateTime = (dateString: string | null) => {
    return formatDateTimeWithSpaces(dateString);
  };

  const formatDateTimeMobile = (dateString: string | null) => {
    return formatDateTimeCompact(dateString);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/30 dark:bg-[#000000CC] flex items-center justify-center">
      {/* Modal - 모바일: 전체 화면, 데스크탑: 고정 너비 */}
      <div className="relative w-full h-full md:w-[848px] md:h-auto md:max-h-[668px] md:rounded-[14px] bg-card dark:bg-neutral-10 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 md:px-7 h-[64px] md:h-auto md:pt-6 md:pb-[30px] flex-shrink-0">
          <div className="flex items-center gap-2 md:gap-0">
            {/* 모바일 뒤로가기 버튼 */}
            <button
              type="button"
              onClick={onClose}
              className="md:hidden cursor-pointer w-6 h-6 flex items-center justify-center hover:opacity-70 transition-opacity"
              aria-label="뒤로가기"
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M15 19L8 12L15 5"
                  stroke="currentColor"
                  className="text-neutral-90 dark:text-neutral-80"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            <h2 className="text-[18px] font-semibold leading-[21px] text-ink dark:text-neutral-80">
              실패 내역 상세보기
            </h2>
          </div>
          {/* 데스크탑 닫기 버튼 */}
          <button
            onClick={onClose}
            className="hidden md:flex cursor-pointer w-6 h-6 items-center justify-center text-neutral-60 dark:text-neutral-60"
            aria-label="닫기"
          >
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
              <path d="M6 18L18 6M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        {/* Divider */}
        <div className="mx-4 md:mx-7 h-[1px] bg-neutral-30 dark:bg-neutral-30 flex-shrink-0"></div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4 md:px-7 pt-4 md:pt-[13px] pb-4 md:pb-0">
          {isLoading ? (
            <div className="flex items-center justify-center h-[500px]">
              <div className="text-neutral-60 dark:text-neutral-60">로딩 중...</div>
            </div>
          ) : jobDetail ? (
            <>
              {/* File Information */}
              <div className="bg-neutral-10 dark:bg-neutral-20 rounded-[12px] px-4 py-3 mb-4 md:mb-[23px]">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-2 md:gap-0">
                  <div className="flex-1 min-w-0">
                    <div className="text-[14px] md:text-[16px] font-semibold leading-[17px] md:leading-[19px] text-ink dark:text-neutral-80 mb-1 truncate" title={jobDetail.fileName}>
                      {jobDetail.fileName}
                    </div>
                    <div className="text-[13px] md:text-[14px] font-medium leading-[16px] md:leading-[17px] text-neutral-60 dark:text-neutral-60">
                      업로드 시간: <span className="md:hidden">{formatDateTimeMobile(jobDetail.createdAt)}</span><span className="hidden md:inline">{formatDateTime(jobDetail.createdAt)}</span>
                    </div>
                  </div>
                  <div className="text-left md:text-right md:ml-4 md:shrink-0">
                    <div className="text-[13px] md:text-[14px] font-medium leading-[16px] md:leading-[17px] text-neutral-60 dark:text-neutral-60 mb-1">
                      총 {jobDetail.failureCount}건의 실패 항목
                    </div>
                    <div className="text-[12px] md:text-[14px] font-medium leading-[14px] md:leading-[17px] text-neutral-50 dark:text-neutral-50">
                      *최대 20개 항목까지 표시됩니다.
                    </div>
                  </div>
                </div>
              </div>

              {/* Failure Grid */}
              <div 
                className="mb-4 md:mb-6 overflow-y-auto md:max-h-[336px] pr-2"
                style={{
                  scrollbarWidth: 'thin',
                  scrollbarColor: '#D0D0D0 transparent',
                }}
              >
                {failureList.length === 0 ? (
                  <div className="flex items-center justify-center h-32 text-neutral-60 dark:text-neutral-60">
                    실패 항목이 없습니다.
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-[14px]">
                    {failureList.map((failure) => (
                      <FailureCard
                        key={failure.id}
                        errorCode={failure.errorCode}
                        errorMessage={failure.errorMessage}
                        rowNumber={failure.rowNumber}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Divider */}
              <div className="w-full h-[1px] bg-neutral-30 dark:bg-neutral-30 mb-3 md:mb-[13px]"></div>

              {/* Footer Buttons */}
              <div className="flex justify-end gap-3 mb-3 md:mb-3 flex-shrink-0">
                <button
                  onClick={onClose}
                  className="cursor-pointer px-3 py-[6px] h-[34px] bg-card dark:bg-neutral-10 border border-neutral-30 dark:border-neutral-30 rounded-[5px] text-[14px] font-semibold leading-[17px] tracking-[-0.02em] text-ink dark:text-neutral-80 hover:bg-neutral-10 dark:hover:bg-neutral-20 transition-colors"
                >
                  닫기
                </button>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-[500px]">
              <div className="text-neutral-60 dark:text-neutral-60">데이터를 불러올 수 없습니다.</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
