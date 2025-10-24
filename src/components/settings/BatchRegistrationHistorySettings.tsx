"use client";

import { useState } from "react";

export default function BatchRegistrationHistorySettings() {
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = 10;

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <div className="w-full h-full bg-white rounded-[14px] p-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-[24px] font-bold text-[#252525]">일괄 등록 이력</h1>
      </div>

      {/* Divider */}
      <div className="w-full h-px bg-[#E2E2E2] mb-6" />

      {/* Content */}
      <div className="text-center py-20">
        <div className="text-[#808080] text-[16px]">
          일괄 등록 이력 페이지입니다.
        </div>
      </div>
    </div>
  );
}