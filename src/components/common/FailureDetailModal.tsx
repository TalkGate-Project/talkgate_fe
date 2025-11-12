"use client";

import { useState, useEffect } from "react";
import { CustomersBulkService } from "@/services/customersBulk";
import { getSelectedProjectId } from "@/lib/project";
import type { BulkJobDetail, BulkJobFailure } from "@/types/customersBulk";

interface FailureDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobId: number;
}

interface FailureCardProps {
  errorCode: string;
  errorMessage: string;
  count: number;
}

function FailureCard({ errorCode, errorMessage, count }: FailureCardProps) {
  const displayMessage = getErrorDisplayMessage(errorCode, errorMessage);
  
  return (
    <div className="flex flex-col items-start p-3 gap-1.5 border border-[#E2E2E2] rounded-[5px] h-[68px]">
      <div className="text-[14px] font-semibold leading-5 text-[#D83232] truncate w-full" title={displayMessage}>
        {displayMessage}
      </div>
      <div className="text-[14px] font-medium leading-5 text-[#808080]">
        {count}행
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
  const [groupedFailures, setGroupedFailures] = useState<Array<{ errorCode: string; errorMessage: string; count: number }>>([]);

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

        // Group failures by errorCode
        const failures = actualData.failures || [];
        const failureMap = new Map<string, { errorMessage: string; count: number }>();
        failures.forEach((failure: BulkJobFailure) => {
          const key = failure.errorCode;
          if (failureMap.has(key)) {
            failureMap.get(key)!.count += 1;
          } else {
            failureMap.set(key, { errorMessage: failure.errorMessage, count: 1 });
          }
        });

        // Convert to array and take max 20 items
        const grouped = Array.from(failureMap.entries())
          .map(([errorCode, { errorMessage, count }]) => ({
            errorCode,
            errorMessage,
            count,
          }))
          .slice(0, 20);

        setGroupedFailures(grouped);
      } catch (error) {
        console.error("Failed to fetch job detail:", error);
        setJobDetail(null);
        setGroupedFailures([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchJobDetail();
  }, [isOpen, jobId]);

  if (!isOpen) return null;

  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).replace(/\./g, ".").replace(/, /g, " ");
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/30">
      {/* Modal */}
      <div className="relative w-[848px] max-h-[668px] bg-white rounded-[14px] shadow-[0px_13px_61px_rgba(169,169,169,0.366013)]">
        {/* Header */}
        <div className="flex items-center justify-between px-7 pt-6 pb-4">
          <h2 className="text-[18px] font-semibold leading-[21px] text-[#000000]">
            실패 내역 상세보기
          </h2>
          <button
            onClick={onClose}
            className="cursor-pointer w-6 h-6 flex items-center justify-center"
          >
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
              <path d="M6 18L18 6M6 6l12 12" stroke="#B0B0B0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        {/* Divider */}
        <div className="w-full h-[1px] bg-[#E2E2E266]"></div>

        {/* Content */}
        <div className="px-7 pt-[13px]">
          {isLoading ? (
            <div className="flex items-center justify-center h-[500px]">
              <div className="text-neutral-60">로딩 중...</div>
            </div>
          ) : jobDetail ? (
            <>
              {/* File Information */}
              <div className="bg-[#F8F8F8] rounded-[12px] px-4 py-3 mb-[23px]">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="text-[16px] font-semibold leading-[19px] text-[#000000] mb-1 truncate" title={jobDetail.fileName}>
                      {jobDetail.fileName}
                    </div>
                    <div className="text-[14px] font-medium leading-[17px] text-[#808080]">
                      업로드 시간 : {formatDateTime(jobDetail.createdAt)}
                    </div>
                  </div>
                  <div className="text-right ml-4 shrink-0">
                    <div className="text-[14px] font-medium leading-[17px] text-[#808080] mb-1">
                      총 {jobDetail.failureCount}건의 실패 항목
                    </div>
                    <div className="text-[14px] font-medium leading-[17px] text-[#B0B0B0]">
                      *최대 20개 항목까지 표시됩니다.
                    </div>
                  </div>
                </div>
              </div>

              {/* Failure Grid */}
              <div 
                className="mb-6 overflow-y-auto max-h-[336px] pr-2"
                style={{
                  scrollbarWidth: 'thin',
                  scrollbarColor: '#D0D0D0 transparent',
                }}
              >
                {groupedFailures.length === 0 ? (
                  <div className="flex items-center justify-center h-32 text-neutral-60">
                    실패 항목이 없습니다.
                  </div>
                ) : (
                  <div className="grid grid-cols-4 gap-[14px]">
                    {groupedFailures.map((failure, index) => (
                      <FailureCard
                        key={index}
                        errorCode={failure.errorCode}
                        errorMessage={failure.errorMessage}
                        count={failure.count}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Divider */}
              <div className="w-full h-[1px] bg-[#E2E2E2] mb-[13px]"></div>

              {/* Footer Buttons */}
              <div className="flex justify-end gap-3 mb-3">
                <button
                  onClick={onClose}
                  className="cursor-pointer px-3 py-[6px] h-[34px] border border-[#E2E2E2] rounded-[5px] text-[14px] font-semibold leading-[17px] tracking-[-0.02em] text-[#000000] hover:bg-gray-50 transition-colors"
                >
                  취소
                </button>
                <button
                  onClick={() => {
                    console.log("배정하기");
                    // TODO: Implement assignment logic
                  }}
                  className="cursor-pointer px-3 py-[6px] h-[34px] bg-[#252525] rounded-[5px] text-[14px] font-semibold leading-[17px] tracking-[-0.02em] text-[#EDEDED] hover:bg-[#404040] transition-colors"
                >
                  배정하기
                </button>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-[500px]">
              <div className="text-neutral-60">데이터를 불러올 수 없습니다.</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
