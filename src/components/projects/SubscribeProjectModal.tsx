"use client";

import { useState } from "react";

type Project = {
  id: string;
  name: string;
  logoUrl?: string;
  memberCount?: number;
};

type Props = {
  project: Project;
  onClose: () => void;
  onSubscribe: (projectId: string) => Promise<void>;
};

export default function SubscribeProjectModal({
  project,
  onClose,
  onSubscribe,
}: Props) {
  const [submitting, setSubmitting] = useState(false);

  const handleSubscribe = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      await onSubscribe(project.id);
      onClose();
    } catch (error) {
      console.error("Subscription failed:", error);
      alert("구독에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 배경 오버레이 */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={() => !submitting && onClose()}
      />

      {/* 모달 */}
      <div className="relative bg-white rounded-[14px] shadow-[0px_13px_61px_rgba(169,169,169,0.37)] w-[440px] flex flex-col">
        {/* 헤더 */}
        <div className="flex items-center justify-between px-7 pt-6 pb-4">
          <h2 className="text-[18px] font-semibold text-[#000]">구독하기</h2>
          <button
            aria-label="close"
            className="cursor-pointer w-6 h-6 grid place-items-center"
            onClick={() => !submitting && onClose()}
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M6 18L18 6M6 6L18 18"
                stroke="#B0B0B0"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>

        {/* 본문 */}
        <div className="px-7 pb-6">
          {/* 체크 아이콘 */}
          <div className="flex justify-center mb-4">
            <div className="w-14 h-14 rounded-full bg-[#D6FAE8] flex items-center justify-center">
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M5 13L9 17L19 7"
                  stroke="#00B55B"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>

          {/* 메시지 */}
          <h3 className="text-[18px] font-semibold text-[#252525] text-center mb-2">
            프로젝트를 구독하시겠습니까?
          </h3>
          <p className="text-[14px] text-[#808080] text-center leading-[1.6]">
            본 프로젝트를 구독하면 모든 콘텐츠에 자유롭게 접근하고
            <br />
            프로젝트를 사용할 수 있습니다.
          </p>

          {/* 프로젝트 정보 */}
          <div className="mt-6">
            <div className="text-[14px] text-[#808080] mb-2">프로젝트 정보</div>
            <div className="flex items-center gap-3 p-4 bg-[#F8F8F8] rounded-[8px]">
              {project.logoUrl ? (
                <img
                  src={project.logoUrl}
                  alt={`${project.name} 로고`}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-[#EDEDED] flex items-center justify-center">
                  <span className="text-[16px] font-semibold text-[#808080]">
                    {project.name?.charAt(0) || "P"}
                  </span>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="text-[16px] font-semibold text-[#252525] truncate">
                  {project.name}
                </div>
                {project.memberCount !== undefined && (
                  <div className="text-[12px] text-[#808080]">
                    멤버 {project.memberCount}명
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 하단 버튼 영역 */}
        <div className="border-t border-[#E2E2E2] px-7 py-4 flex items-center justify-end gap-3">
          <button
            className="cursor-pointer h-[38px] px-5 rounded-[8px] border border-[#E2E2E2] text-[14px] font-semibold text-[#252525] bg-white hover:bg-[#F8F8F8] transition-colors disabled:opacity-50"
            onClick={() => !submitting && onClose()}
            disabled={submitting}
          >
            취소
          </button>
          <button
            className="cursor-pointer h-[38px] px-5 rounded-[8px] bg-[#252525] text-white text-[14px] font-semibold hover:bg-[#3a3a3a] transition-colors disabled:opacity-50"
            onClick={handleSubscribe}
            disabled={submitting}
          >
            {submitting ? "처리 중..." : "구독하기"}
          </button>
        </div>
      </div>
    </div>
  );
}





