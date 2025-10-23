"use client";

import { useState, useMemo } from "react";
import NoticeSearchPanel from "@/components/notice/NoticeSearchPanel";
import NoticeTable from "@/components/notice/NoticeTable";
import NoticePagination from "@/components/notice/NoticePagination";
import { mockNoticeData, NoticeRecord } from "@/data/mockNoticeData";

export default function NoticePage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const totalPages = 10;
  const itemsPerPage = 7;

  // 검색 필터링
  const filteredNotices = useMemo(() => {
    if (!searchTerm.trim()) return mockNoticeData;
    
    return mockNoticeData.filter((notice) =>
      notice.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notice.author.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm]);

  // 페이지네이션을 위한 데이터 슬라이싱
  const paginatedNotices = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredNotices.slice(startIndex, endIndex);
  }, [filteredNotices, currentPage, itemsPerPage]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    setCurrentPage(1); // 검색 시 첫 페이지로 이동
  };

  return (
    <main className="container mx-auto max-w-[1324px] pt-[90px] pb-12">
      {/* 검색 및 글쓰기 패널 */}
      <div className="mb-6">
        <NoticeSearchPanel onSearch={handleSearch} />
      </div>

      {/* 공지사항 목록 테이블 */}
      <div className="mb-6">
        <NoticeTable notices={paginatedNotices} />
      </div>

      {/* 페이지네이션 */}
      <div className="flex justify-center">
        <NoticePagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
      </div>
    </main>
  );
}
