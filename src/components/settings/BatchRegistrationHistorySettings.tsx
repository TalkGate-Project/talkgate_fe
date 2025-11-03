"use client";

import { useState } from "react";
import Pagination from "@/components/common/Pagination";
import FailureDetailModal from "@/components/common/FailureDetailModal";

interface BatchRegistrationRecord {
  id: string;
  fileName: string;
  uploader: string;
  totalCustomers: number;
  successCount: number;
  failureCount: number;
  status: "완료" | "대기" | "진행중" | "필요" | "실패";
  uploadDate: string;
}

function StatusBadge({ status }: { status: string }) {
  const statusStyles = {
    완료: "bg-primary-10 text-primary-80",
    대기: "bg-warning-10 text-warning-60",
    진행중: "bg-secondary-10 text-secondary-40",
    필요: "bg-primary-10 text-primary-80",
    실패: "bg-danger-10 text-danger-40",
  };

  return (
    <div className={`flex items-center justify-center px-3 py-1 rounded-[30px] text-[12px] font-medium ${statusStyles[status as keyof typeof statusStyles]}`}>
      {status}
    </div>
  );
}

export default function BatchRegistrationHistorySettings() {
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = 10;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<BatchRegistrationRecord | null>(null);

  const [records] = useState<BatchRegistrationRecord[]>([
    {
      id: "1",
      fileName: "마케팅부서_캠페인_대상_고객...",
      uploader: "이영희",
      totalCustomers: 311,
      successCount: 264,
      failureCount: 264,
      status: "완료",
      uploadDate: "2024-01-01 10:52",
    },
    {
      id: "2",
      fileName: "마케팅부서_캠페인_대상_고객...",
      uploader: "정수진",
      totalCustomers: 311,
      successCount: 264,
      failureCount: 0,
      status: "대기",
      uploadDate: "2024-01-01 10:52",
    },
    {
      id: "3",
      fileName: "마케팅부서_캠페인_대상_고객...",
      uploader: "박인수",
      totalCustomers: 311,
      successCount: 264,
      failureCount: 264,
      status: "완료",
      uploadDate: "2024-01-01 10:52",
    },
    {
      id: "4",
      fileName: "마케팅부서_캠페인_대상_고객...",
      uploader: "김영업",
      totalCustomers: 311,
      successCount: 264,
      failureCount: 264,
      status: "진행중",
      uploadDate: "2024-01-01 10:52",
    },
    {
      id: "5",
      fileName: "마케팅부서_캠페인_대상_고객...",
      uploader: "이개발",
      totalCustomers: 311,
      successCount: 264,
      failureCount: 264,
      status: "완료",
      uploadDate: "2024-01-01 10:52",
    },
    {
      id: "6",
      fileName: "마케팅부서_캠페인_대상_고객...",
      uploader: "박인수",
      totalCustomers: 311,
      successCount: 264,
      failureCount: 264,
      status: "대기",
      uploadDate: "2024-01-01 10:52",
    },
    {
      id: "7",
      fileName: "마케팅부서_캠페인_대상_고객...",
      uploader: "박인수",
      totalCustomers: 311,
      successCount: 264,
      failureCount: 264,
      status: "실패",
      uploadDate: "2024-01-01 10:52",
    },
    {
      id: "8",
      fileName: "마케팅부서_캠페인_대상_고객...",
      uploader: "정수진",
      totalCustomers: 311,
      successCount: 264,
      failureCount: 264,
      status: "완료",
      uploadDate: "2024-01-01 10:52",
    },
    {
      id: "9",
      fileName: "마케팅부서_캠페인_대상_고객...",
      uploader: "김영업",
      totalCustomers: 311,
      successCount: 264,
      failureCount: 264,
      status: "완료",
      uploadDate: "2024-01-01 10:52",
    },
    {
      id: "10",
      fileName: "마케팅부서_캠페인_대상_고객...",
      uploader: "이프론트",
      totalCustomers: 311,
      successCount: 264,
      failureCount: 264,
      status: "완료",
      uploadDate: "2024-01-01 10:52",
    },
  ]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleFailureClick = (record: BatchRegistrationRecord) => {
    setSelectedRecord(record);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedRecord(null);
  };

  function RecordRow({ record }: { record: BatchRegistrationRecord }) {
    return (
      <>
        <div className="flex items-center py-4">
          {/* 파일명 */}
          <div className="w-[260px] text-[14px] font-semibold text-foreground opacity-80">
            {record.fileName}
          </div>

          {/* 업로더 */}
          <div className="w-[80px] text-[14px] font-semibold text-foreground opacity-80">
            {record.uploader}
          </div>

          {/* 전체 고객 수 */}
          <div className="w-[120px] text-right text-[14px] font-semibold text-foreground opacity-80">
            {record.totalCustomers}
          </div>

          {/* 성공 */}
          <div className="w-[80px] text-[14px] font-semibold text-primary-80 opacity-80">
            {record.successCount}
          </div>

          {/* 실패 */}
          <div 
            onClick={() => record.failureCount > 0 && handleFailureClick(record)}
            className="w-[80px] text-[14px] font-bold text-secondary-40 underline opacity-80 cursor-pointer"
          >
            {record.failureCount}
          </div>

          {/* 상태 */}
          <div className="w-[80px]">
            <StatusBadge status={record.status} />
          </div>

          {/* 업로드 일시 */}
          <div className="flex-1 text-[14px] font-semibold text-foreground opacity-80">
            {record.uploadDate}
          </div>
        </div>

        {/* Divider */}
        <div className="w-full h-[0.4px] bg-border"></div>
      </>
    );
  }

  return (
    <div className="bg-card rounded-[14px] p-8">
      {/* Title */}
      <h1 className="text-[24px] font-bold text-foreground mb-4">
        일괄 등록 이력
      </h1>

      {/* Sub-title */}
      <h2 className="text-[16px] font-semibold text-foreground mb-1">
        일괄 등록 이력
      </h2>

      {/* Description */}
      <p className="text-[14px] font-medium text-neutral-60 mb-6">
        엑셀 파일을 통한 고객 정보 일괄 등록 이력을 확인할 수 있습니다.
      </p>

      {/* Divider */}
      <div className="w-full h-[1px] bg-border mb-6"></div>

      {/* Table Header */}
      <div className="bg-neutral-20 rounded-[12px] px-6 py-3 mb-4">
        <div className="flex items-center">
          <div className="w-[260px] text-[16px] font-bold text-neutral-60">
            파일명
          </div>
          <div className="w-[80px] text-[16px] font-bold text-neutral-60">
            업로더
          </div>
          <div className="w-[120px] text-right text-[16px] font-bold text-neutral-60">
            전체 고객 수
          </div>
          <div className="w-[80px] text-[16px] font-bold text-neutral-60">
            성공
          </div>
          <div className="w-[80px] text-[16px] font-bold text-neutral-60">
            실패
          </div>
          <div className="w-[80px] text-[16px] font-bold text-neutral-60">
            상태
          </div>
          <div className="flex-1 text-[16px] font-bold text-neutral-60">
            업로드 일시
          </div>
        </div>
      </div>

      {/* Record List */}
      <div className="space-y-0 mb-6">
        {records.map((record) => (
          <RecordRow key={record.id} record={record} />
        ))}
      </div>

      {/* Pagination */}
      <div className="flex justify-center">
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
      </div>

      {/* Failure Detail Modal */}
      {selectedRecord && (
        <FailureDetailModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          fileName={selectedRecord.fileName}
          uploadTime={selectedRecord.uploadDate}
          failureCount={selectedRecord.failureCount}
          failures={generateMockFailures(selectedRecord.failureCount)}
        />
      )}
    </div>
  );
}

// Mock failure data generator
function generateMockFailures(count: number) {
  const categories = ["시스템 오류", "고객 중복", "필수필드 누락"];
  const failures = [];
  
  // 최대 20개만 표시
  const displayCount = Math.min(count, 20);
  
  // 균등하게 분배
  const perCategory = Math.floor(displayCount / 3);
  const remainder = displayCount % 3;
  
  categories.forEach((category, index) => {
    const categoryCount = perCategory + (index < remainder ? 1 : 0);
    if (categoryCount > 0) {
      failures.push({
        category,
        count: categoryCount + Math.floor(Math.random() * 100),
      });
    }
  });
  
  // 나머지 항목은 랜덤 카테고리로 채우기
  for (let i = failures.length; i < displayCount; i++) {
    const randomCategory = categories[Math.floor(Math.random() * categories.length)];
    failures.push({
      category: randomCategory,
      count: Math.floor(Math.random() * 150),
    });
  }
  
  return failures;
}