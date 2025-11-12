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

  function RecordRow({ record }: { record: BulkJob }) {
    const isFailureZero = record.failureCount === 0;

    return (
      <>
        <div className="flex items-center h-12 gap-3">
          {/* 파일명 */}
          <div className="w-[189px] text-[14px] font-semibold text-neutral-90 opacity-80 leading-[17px] shrink-0 truncate" title={record.fileName}>
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

        {/* Divider */}
        <div className="w-full h-[0.4px] bg-neutral-30"></div>
      </>
    );
  }

  if (isLoading) {
    return (
      <div className="bg-card rounded-[14px] py-7">
        <h1 className="px-7 text-[24px] font-bold text-neutral-90 mb-7">
          일괄 등록 이력
        </h1>
        <div className="flex items-center justify-center h-64">
          <div className="text-neutral-60">로딩 중...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-[14px] py-7">
      {/* Title */}
      <h1 className="px-7 text-[24px] font-bold text-neutral-90 mb-7">
        일괄 등록 이력
      </h1>

      <div className="border-b border-[#E2E2E266]"></div>

      {/* Sub-title */}
      <h2 className="px-7 pt-[30px] text-[16px] font-semibold text-foreground mb-1 tracking-[0.2px]">
        일괄 고객 등록 이력
      </h2>

      {/* Description */}
      <p className="px-7 text-[14px] font-medium text-neutral-60 leading-5 mb-2">
        엑셀 파일을 통한 고객 정보 일괄 등록 이력을 확인할 수 있습니다.
      </p>

      {/* Divider */}
      <div className="mx-7 h-px bg-neutral-30 mb-6"></div>

      {/* Table Header */}
      <div className="mx-7 bg-neutral-20 rounded-[12px] px-10 h-12 flex items-center gap-3">
        <div className="w-[162px] text-[16px] font-bold text-neutral-60 leading-[19px] shrink-0">
          파일명
        </div>
        <div className="w-[60px] text-[16px] font-bold text-neutral-60 leading-[19px] shrink-0">
          업로더
        </div>
        <div className="w-[120px] text-right text-[16px] font-bold text-neutral-60 leading-[19px] shrink-0">
          전체 고객 수
        </div>
        <div className="w-[60px] text-right text-[16px] font-bold text-neutral-60 leading-[19px] shrink-0">
          성공
        </div>
        <div className="w-[60px] text-right text-[16px] font-bold text-neutral-60 leading-[19px] shrink-0 mr-6">
          실패
        </div>
        <div className="w-[105px] text-[16px] font-bold text-neutral-60 leading-[19px] shrink-0">
          상태
        </div>
        <div className="flex-1 text-[16px] font-bold text-neutral-60 leading-[19px] min-w-0">
          업로드 일시
        </div>
      </div>

      {/* Record List */}
      <div className="px-10">
        {records.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-neutral-60">
            등록된 이력이 없습니다.
          </div>
        ) : (
          records.map((record) => (
            <RecordRow key={record.id} record={record} />
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 0 && (
        <div className="flex justify-center mt-4">
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
