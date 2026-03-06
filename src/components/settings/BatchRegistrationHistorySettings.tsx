"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Pagination from "@/components/common/Pagination";
import FailureDetailModal from "@/components/common/FailureDetailModal";
import { CustomersBulkService } from "@/services/customersBulk";
import { getSelectedProjectId } from "@/lib/project";
import type { BulkJob, BulkJobStatus } from "@/types/customersBulk";

const STATUS_DISPLAY: Record<BulkJobStatus, string> = {
  pending: "대기",
  processing: "진행중",
  completed: "완료",
  failed: "실패",
};

function StatusBadge({ status }: { status: BulkJobStatus }) {
  const statusStyles: Record<BulkJobStatus, string> = {
    completed: "bg-primary-10 text-primary-80",
    pending: "bg-warning-10 text-warning-60",
    processing: "bg-secondary-10 text-secondary-40",
    failed: "bg-danger-10 text-danger-40",
  };

  return (
    <div 
      className={`inline-flex items-center justify-center px-3 py-1 rounded-[30px] text-[12px] font-medium leading-[14px] ${statusStyles[status]}`}
      style={{ opacity: 0.8 }}
    >
      {STATUS_DISPLAY[status]}
    </div>
  );
}

export default function BatchRegistrationHistorySettings() {
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState(1);
  const [records, setRecords] = useState<BulkJob[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState<number | null>(null);
  const pageSize = 10;

  const totalPages = Math.ceil(total / pageSize);

  // Fetch bulk import jobs
  useEffect(() => {
    const fetchJobs = async () => {
      const projectId = getSelectedProjectId();
      if (!projectId) {
        router.push("/");
        return;
      }

      try {
        setIsLoading(true);
        const response = await CustomersBulkService.listImports({
          projectId,
          page: currentPage,
          limit: pageSize,
        });

        // API response structure: { ok, status, data: { result, data: { jobs, total, ... } } }
        const responseData = response.data as any;
        const actualData = responseData.data || responseData;
        
        setRecords(actualData.jobs || []);
        setTotal(actualData.total || 0);
      } catch (error) {
        console.error("Failed to fetch bulk import jobs:", error);
        setRecords([]);
        setTotal(0);
      } finally {
        setIsLoading(false);
      }
    };

    fetchJobs();
  }, [currentPage, router]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleFailureClick = (jobId: number) => {
    setSelectedJobId(jobId);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedJobId(null);
  };

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
    }).replace(/\. /g, "-").replace(".", "");
  };

  const formatDateTimeMobile = (dateString: string | null) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    const year = date.getFullYear().toString().slice(-2);
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hour = String(date.getHours()).padStart(2, "0");
    const minute = String(date.getMinutes()).padStart(2, "0");
    return `${year}.${month}.${day} ${hour}:${minute}`;
  };

  function RecordRow({ record }: { record: BulkJob }) {
    const isFailureZero = record.failureCount === 0;

    return (
      <>
        {/* 모바일 카드 */}
        <div className="md:hidden bg-white dark:bg-neutral-10 border border-neutral-30 dark:border-neutral-30 rounded-[12px] p-4 mb-3">
          {/* 상단: 파일명(왼쪽), 날짜/시간(오른쪽) */}
          <div className="flex items-center justify-between mb-2">
            <div className="text-[14px] font-semibold text-neutral-90 dark:text-neutral-80 leading-[17px] flex-1 min-w-0 truncate" title={record.fileName}>
              {record.fileName}
            </div>
            <div className="text-[14px] font-semibold text-neutral-60 dark:text-neutral-60 opacity-80 flex-shrink-0 ml-2 leading-[17px]">
              {formatDateTimeMobile(record.createdAt)}
            </div>
          </div>

          {/* 하단: 성공/실패 정보(왼쪽), 상태 뱃지와 업로더 이름(오른쪽) */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <span className="text-[13px] font-medium text-neutral-90 dark:text-neutral-80 leading-[16px]">성공</span>
              <span className="text-[14px] font-bold text-primary-80 leading-[14px]">
                {record.successCount}
              </span>
              <span className="text-[13px] font-medium text-neutral-90 dark:text-neutral-80 leading-[16px]">실패</span>
              <span 
                onClick={() => record.failureCount > 0 && handleFailureClick(record.id)}
                className={`text-[14px] font-bold leading-[14px] ${
                  isFailureZero 
                    ? "text-primary-80"
                    : "text-secondary-60 underline cursor-pointer"
                }`}
              >
                {record.failureCount}
              </span>
              <span className="text-[13px] font-medium text-neutral-90 dark:text-neutral-80 leading-[16px]">상태</span>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0 ml-2">
              <StatusBadge status={record.status} />
              <span className="text-[14px] font-semibold text-neutral-90 dark:text-neutral-80 opacity-80 leading-[17px]">
                {record.memberName}
              </span>
            </div>
          </div>
        </div>

        {/* 데스크탑 테이블 행 */}
        <div className="hidden md:flex items-center h-12 gap-3 pl-10">
          {/* 파일명 */}
          <div className="w-[150px] text-[14px] font-semibold text-neutral-90 opacity-80 leading-[17px] shrink-0 truncate" title={record.fileName}>
            {record.fileName}
          </div>

          {/* 업로더 */}
          <div className="w-[120px] text-[14px] font-semibold text-neutral-90 opacity-80 leading-[17px] shrink-0">
            {record.memberName}
          </div>

          {/* 전체 고객 수 */}
          <div className="w-[60px] text-right text-[14px] font-semibold text-neutral-90 opacity-80 leading-[17px] shrink-0">
            {record.totalRows}
          </div>

          {/* 성공 */}
          <div className="w-[60px] text-right text-[14px] font-semibold text-primary-80 opacity-80 leading-[17px] underline shrink-0">
            {record.successCount}
          </div>

          {/* 실패 */}
          <div 
            onClick={() => record.failureCount > 0 && handleFailureClick(record.id)}
            className={`w-[60px] text-right text-[14px] font-bold opacity-80 leading-[17px] shrink-0 mr-6 ${
              isFailureZero 
                ? "text-primary-80"
                : "text-secondary-60 underline cursor-pointer"
            }`}
          >
            {record.failureCount}
          </div>

          {/* 상태 */}
          <div className="w-[105px] shrink-0">
            <StatusBadge status={record.status} />
          </div>

          {/* 업로드 일시 */}
          <div className="flex-1 text-[14px] font-semibold text-neutral-90 opacity-80 leading-[17px] min-w-0">
            {formatDateTime(record.createdAt)}
          </div>
        </div>

        {/* Divider (데스크탑만) */}
        <div className="hidden md:block w-full h-[0.4px] bg-neutral-30"></div>
      </>
    );
  }

  if (isLoading) {
    return (
      <div className="bg-card rounded-[14px] pb-7">
        <h1 className="px-4 md:px-7 text-[20px] md:text-[24px] font-bold text-neutral-90 h-[64px] md:h-[76px] flex items-center">
          일괄 등록 이력
        </h1>
        <div className="flex items-center justify-center h-64">
          <div className="text-neutral-60">로딩 중...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-[14px] rounded-t-none md:rounded-t-[14px] pb-7 flex flex-col min-h-screen md:min-h-0 md:pb-7">
      {/* Title */}
      <h1 className="px-4 md:px-7 text-[20px] md:text-[24px] font-bold text-neutral-90 h-[64px] md:h-[76px] flex items-center flex-shrink-0">
        일괄 등록 이력
      </h1>

      <div className="border-b border-neutral-30/40 flex-shrink-0"></div>

      {/* Sub-title */}
      <h2 className="px-4 md:px-7 pt-4 md:pt-[30px] text-[14px] md:text-[16px] font-semibold text-foreground mb-1 tracking-[0.2px] flex-shrink-0">
        일괄 고객 등록 이력
      </h2>

      {/* Description */}
      <p className="px-4 md:px-7 text-[13px] md:text-[14px] font-medium text-neutral-60 leading-5 mb-2 flex-shrink-0">
        엑셀 파일을 통한 고객 정보 일괄 등록 이력을 확인할 수 있습니다.
      </p>

      {/* Divider */}
      <div className="mx-4 md:mx-7 h-px bg-neutral-30 mb-4 md:mb-6 flex-shrink-0"></div>

      {/* Table Header (데스크탑만) */}
      <div className="hidden md:flex mx-7 bg-neutral-20 dark:bg-neutral-20 rounded-[8px] px-10 h-[40px] items-center gap-3 flex-shrink-0">
        <div className="w-[162px] text-[16px] font-medium text-neutral-60 dark:text-neutral-60 leading-[19px] shrink-0">
          파일명
        </div>
        <div className="w-[60px] text-[16px] font-medium text-neutral-60 dark:text-neutral-60 leading-[19px] shrink-0">
          업로더
        </div>
        <div className="w-[120px] text-right text-[16px] font-medium text-neutral-60 dark:text-neutral-60 leading-[19px] shrink-0">
          전체 고객 수
        </div>
        <div className="w-[60px] text-right text-[16px] font-medium text-neutral-60 dark:text-neutral-60 leading-[19px] shrink-0">
          성공
        </div>
        <div className="w-[60px] text-right text-[16px] font-medium text-neutral-60 dark:text-neutral-60 leading-[19px] shrink-0 mr-6">
          실패
        </div>
        <div className="w-[105px] text-[16px] font-medium text-neutral-60 dark:text-neutral-60 leading-[19px] shrink-0">
          상태
        </div>
        <div className="flex-1 text-[16px] font-medium text-neutral-60 dark:text-neutral-60 leading-[19px] min-w-0">
          업로드 일시
        </div>
      </div>

      {/* Record List - 모바일에서 flex-1로 남은 공간 채우기 */}
      <div className="px-4 md:px-10 flex-1 flex flex-col min-h-0">
        {records.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-neutral-60 flex-shrink-0">
            등록된 이력이 없습니다.
          </div>
        ) : (
          <>
            {/* 모바일 카드 리스트 - 스크롤 가능하도록 */}
            <div className="md:hidden space-y-3 flex-1 overflow-y-auto min-h-0">
              {records.map((record) => (
                <RecordRow key={record.id} record={record} />
              ))}
            </div>
            {/* 데스크탑 테이블 */}
            <div className="hidden md:block flex-shrink-0">
              {records.map((record) => (
                <RecordRow key={record.id} record={record} />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Pagination - 하단 고정 */}
      {totalPages > 0 && (
        <div className="flex justify-center mt-4 md:mt-4 flex-shrink-0">
          <Pagination
            page={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </div>
      )}

      {/* Failure Detail Modal */}
      {selectedJobId && (
        <FailureDetailModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          jobId={selectedJobId}
        />
      )}
    </div>
  );
}
