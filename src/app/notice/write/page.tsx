"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Checkbox from "@/components/common/Checkbox";
import { mockNoticeData } from "@/data/mockNoticeData";

function NoticeWritePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isImportant, setIsImportant] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  useEffect(() => {
    const id = searchParams.get("id");
    if (id) {
      const noticeId = parseInt(id);
      const notice = mockNoticeData.find(n => n.id === noticeId);
      if (notice) {
        setTitle(notice.title);
        setContent(notice.content || "");
        setIsImportant(notice.isImportant);
        setIsEditMode(true);
      }
    }
  }, [searchParams]);

  const handleSave = () => {
    // TODO: 공지사항 저장 로직 구현
    console.log(isEditMode ? "공지사항 수정:" : "공지사항 저장:", { title, content, isImportant });
    router.push("/notice");
  };

  const handleCancel = () => {
    router.push("/notice");
  };

  return (
    <main className="container mx-auto max-w-[1324px] pt-[90px] pb-12">
      <div className="bg-white rounded-[14px] p-6">
        {/* 헤더 영역 */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <h1 className="text-[24px] font-bold text-[#252525]">
              {isEditMode ? "공지사항 수정" : "공지사항"}
            </h1>
            <div className="flex items-center gap-3">
              <Checkbox
                checked={isImportant}
                onChange={setIsImportant}
                size={24}
                ariaLabel="중요 공지 설정"
              />
              <span className="text-[18px] font-medium text-[#808080]">
                이 공지사항을 중요 공지로 설정
              </span>
            </div>
          </div>

          {/* 버튼들 */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleCancel}
              className="h-[34px] px-3 bg-white border border-[#E2E2E2] text-black rounded-[5px] text-[14px] font-semibold"
            >
              취소
            </button>
            <button
              onClick={handleSave}
              className="h-[34px] px-3 bg-[#252525] text-[#D0D0D0] rounded-[5px] text-[14px] font-semibold"
            >
{isEditMode ? "수정" : "저장"}
            </button>
          </div>
        </div>

        {/* 구분선 */}
        <div className="border-t border-[#E2E2E2] mb-6" />

        {/* 제목 입력 */}
        <div className="mb-6">
          <label className="block text-[14px] font-medium text-[#808080] mb-2">
            제목
          </label>
          <input
            type="text"
            placeholder="제목을 입력하세요"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full h-[34px] px-3 border border-[#E2E2E2] rounded-[5px] text-[14px] text-[#252525] placeholder:text-[#808080] focus:outline-none focus:border-[#252525]"
          />
        </div>

        {/* 내용 입력 */}
        <div>
          <label className="block text-[14px] font-medium text-[#808080] mb-2">
            내용
          </label>
          <textarea
            placeholder="내용을 입력하세요"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full h-[407px] px-3 py-3 border border-[#E2E2E2] rounded-[5px] text-[14px] text-[#252525] placeholder:text-[#808080] focus:outline-none focus:border-[#252525] resize-none"
          />
        </div>
      </div>
    </main>
  );
}

export default function NoticeWritePageWrapper() {
  return (
    <Suspense fallback={
      <main className="container mx-auto max-w-[1324px] pt-[90px] pb-12">
        <div className="bg-white rounded-[14px] p-6">
          <div className="text-center text-[#808080]">불러오는 중...</div>
        </div>
      </main>
    }>
      <NoticeWritePage />
    </Suspense>
  );
}
