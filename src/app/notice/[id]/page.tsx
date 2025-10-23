"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { mockNoticeData, NoticeRecord } from "@/data/mockNoticeData";

export default function NoticeDetailPage() {
  const router = useRouter();
  const params = useParams();
  const [notice, setNotice] = useState<NoticeRecord | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (params.id) {
      const noticeId = parseInt(params.id as string);
      const foundNotice = mockNoticeData.find(n => n.id === noticeId);
      if (foundNotice) {
        setNotice(foundNotice);
        const index = mockNoticeData.findIndex(n => n.id === noticeId);
        setCurrentIndex(index);
      }
    }
  }, [params.id]);

  if (!notice) {
    return (
      <main className="container mx-auto max-w-[1324px] pt-[90px] pb-12">
        <div className="bg-white rounded-[14px] p-6 text-center">
          <p>공지사항을 찾을 수 없습니다.</p>
        </div>
      </main>
    );
  }

  const handleEdit = () => {
    router.push(`/notice/write?id=${notice.id}`);
  };

  const handleDelete = () => {
    if (confirm("정말로 이 공지사항을 삭제하시겠습니까?")) {
      // TODO: 삭제 로직 구현
      console.log("공지사항 삭제:", notice.id);
      router.push("/notice");
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      const prevNotice = mockNoticeData[currentIndex - 1];
      router.push(`/notice/${prevNotice.id}`);
    }
  };

  const handleNext = () => {
    if (currentIndex < mockNoticeData.length - 1) {
      const nextNotice = mockNoticeData[currentIndex + 1];
      router.push(`/notice/${nextNotice.id}`);
    }
  };

  const handleBackToList = () => {
    router.push("/notice");
  };

  return (
    <main className="container mx-auto max-w-[1324px] pt-[90px] pb-12">
      <div className="bg-white rounded-[14px] p-6">
        {/* 헤더 영역 */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            {/* 뒤로가기 버튼 */}
            <button
              onClick={handleBackToList}
              className="w-6 h-6 flex items-center justify-center"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M15 18L9 12L15 6" stroke="#252525" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>

            {/* 중요 태그 */}
            {notice.isImportant && (
              <div className="px-3 py-1 bg-[#FFEBEB] rounded-[30px]">
                <span className="text-[12px] font-medium text-[#D83232]">중요</span>
              </div>
            )}

            {/* 제목 */}
            <h1 className="text-[24px] font-bold text-[#252525]">{notice.title}</h1>

            {/* 첨부파일 아이콘 */}
            <div className="w-6 h-6 flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M21.44 11.05L12.25 20.24C11.1242 21.3658 9.59722 21.9983 8.005 21.9983C6.41278 21.9983 4.88583 21.3658 3.76 20.24C2.63417 19.1142 2.00167 17.5872 2.00167 15.995C2.00167 14.4028 2.63417 12.8758 3.76 11.75L12.95 2.56C13.7006 1.80944 14.7186 1.38778 15.79 1.38778C16.8614 1.38778 17.8794 1.80944 18.63 2.56C19.3806 3.31056 19.8022 4.32856 19.8022 5.4C19.8022 6.47144 19.3806 7.48944 18.63 8.24L9.41 17.46C9.03473 17.8353 8.53127 18.0493 8.005 18.0493C7.47873 18.0493 6.97527 17.8353 6.6 17.46C6.22473 17.0847 6.01071 16.5813 6.01071 16.055C6.01071 15.5287 6.22473 15.0253 6.6 14.65L15.07 6.18" stroke="#B0B0B0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>

          {/* 수정/삭제 버튼 (내가 작성한 공지사항인 경우만) */}
          {notice.isMyNotice && (
            <div className="flex items-center gap-3">
              <button
                onClick={handleEdit}
                className="h-[34px] px-3 bg-white border border-[#E2E2E2] text-black rounded-[5px] text-[14px] font-semibold"
              >
                수정
              </button>
              <button
                onClick={handleDelete}
                className="h-[34px] px-3 bg-[#252525] text-white rounded-[5px] text-[14px] font-semibold"
              >
                삭제
              </button>
            </div>
          )}
        </div>

        {/* 구분선 */}
        <div className="border-t border-[#E2E2E2] mb-6" />

        {/* 메타 정보 */}
        <div className="flex items-center gap-6 mb-6 text-[14px] text-[#808080]">
          <div>
            <span className="font-medium">작성일: </span>
            <span>{notice.date}</span>
          </div>
          <div>
            <span className="font-medium">작성자: </span>
            <span>{notice.author}</span>
          </div>
        </div>

        {/* 구분선 */}
        <div className="border-t border-[#E2E2E2] mb-6" />

        {/* 내용 */}
        <div className="mb-8 min-h-[400px]">
          <div className="text-[14px] text-[#252525] leading-6 whitespace-pre-line">
            {notice.content}
          </div>
        </div>

        {/* 구분선 */}
        <div className="border-t border-[#E2E2E2] mb-6" />

        {/* 하단 네비게이션 */}
        <div className="flex items-center justify-end gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrevious}
              disabled={currentIndex === 0}
              className="w-8 h-8 bg-[#F5F5F5] rounded-full flex items-center justify-center disabled:opacity-50"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 19L12 5M5 12L12 5L19 12" stroke="#808080" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <button
              onClick={handleNext}
              disabled={currentIndex === mockNoticeData.length - 1}
              className="w-8 h-8 bg-[#F5F5F5] rounded-full flex items-center justify-center disabled:opacity-50"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 5L12 19M19 12L12 19L5 12" stroke="#808080" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>

          <button
            onClick={handleBackToList}
            className="h-[34px] px-4 bg-[#252525] text-white rounded-[5px] text-[14px] font-semibold"
          >
            목록으로
          </button>
        </div>
      </div>
    </main>
  );
}
