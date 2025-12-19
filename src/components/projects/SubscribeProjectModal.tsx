"use client";

import Image from "next/image";
import { useState } from "react";
import subscribeProjUpper from "@/assets/images/projects/subscribe_proj_upper.png";
import { showErrorModal } from "@/lib/errorModalEvents";

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

// 고객 관리 아이콘 (두 명의 사람)
function CustomerManagementIcon() {
  return (
    <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
      <circle cx="18" cy="18" r="18" fill="#00E272" fillOpacity="0.1" />
      <circle cx="18" cy="18" r="18" fill="#8280FF" fillOpacity="0.21" />
      <rect x="0" y="0" width="36" height="36" rx="12" fill="#8280FF" />
      {/* 첫 번째 사람 */}
      <circle cx="14" cy="16" r="4" fill="#00E272" fillOpacity="0.59" />
      <rect x="10" y="20" width="8" height="5" rx="2.5" fill="#00E272" />
      {/* 두 번째 사람 */}
      <circle cx="22" cy="16" r="4" fill="#00E272" />
      <rect x="18" y="20" width="8" height="5" rx="2.5" fill="#00E272" />
    </svg>
  );
}

// 판매 성과 분석 아이콘 (그래프)
function SalesAnalyticsIcon() {
  return (
    <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
      <circle cx="18" cy="18" r="18" fill="#00E272" fillOpacity="0.1" />
      <circle cx="18" cy="18" r="18" fill="#8280FF" fillOpacity="0.21" />
      <rect x="0" y="0" width="36" height="36" rx="12" fill="#8280FF" />
      {/* 그래프 라인 */}
      <path
        d="M8 24L12 18L16 20L20 12"
        stroke="#00E272"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12 18L16 20"
        stroke="#00E272"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.5"
      />
    </svg>
  );
}

// 팀 일정 관리 아이콘 (말풍선/메시지)
function TeamScheduleIcon() {
  return (
    <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
      <defs>
        <linearGradient id="teamScheduleGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#55E49D" />
          <stop offset="100%" stopColor="#00E272" />
        </linearGradient>
      </defs>
      <circle cx="18" cy="18" r="18" fill="#00E272" fillOpacity="0.1" />
      <circle cx="18" cy="18" r="18" fill="#8280FF" fillOpacity="0.21" />
      <rect x="0" y="0" width="36" height="36" rx="12" fill="#8280FF" />
      {/* 말풍선 */}
      <path
        d="M10 8C7 8 6 9 6 12V16C6 19 7 20 10 20H14L18 24L16 20H20C23 20 24 19 24 16V12C24 9 23 8 20 8H10Z"
        fill="url(#teamScheduleGradient)"
      />
    </svg>
  );
}

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
      showErrorModal({
        type: "error",
        headline: "구독에 실패했습니다. 잠시 후 다시 시도해주세요.",
        hideCancel: true,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const features = [
    {
      number: "01",
      title: "놓치지 않는 신규 고객 관리",
      icon: <CustomerManagementIcon />,
    },
    {
      number: "02",
      title: "한눈에 보는 판매 성과 분석",
      icon: <SalesAnalyticsIcon />,
    },
    {
      number: "03",
      title: "완벽한 팀 일정 및 계획 관리",
      icon: <TeamScheduleIcon />,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 배경 오버레이 */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => !submitting && onClose()}
      />

      {/* 모달 컨테이너 */}
      <div
        className="relative w-[440px] h-[601px] bg-white rounded-[14px] shadow-[0px_8px_12px_rgba(9,30,66,0.1)] flex flex-col overflow-hidden"
        style={{
          filter: "drop-shadow(0px 8px 12px rgba(9, 30, 66, 0.1))",
        }}
      >
        {/* 헤더 이미지 영역 */}
        <div className="relative w-full h-[155px] rounded-t-[14px] overflow-hidden">
          {/* 배경 패턴 (추상적인 기하학적 도형) */}
          <div className="absolute inset-0">
            <Image src={subscribeProjUpper.src} alt="Subscribe Project Modal Background" className="w-full h-full object-cover" fill />
          </div>
          
          {/* 우측 상단 아이콘 및 닫기 버튼 */}
          <div className="absolute top-4 right-4 flex items-center gap-2">
            <button
              aria-label="close"
              className="cursor-pointer w-6 h-6 flex items-center justify-center text-white hover:opacity-70 transition-opacity"
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
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* 본문 영역 */}
        <div className="flex-1 px-[48px] pt-8 pb-6 flex flex-col">
          {/* 제목 및 설명 */}
          <div className="text-center mb-8">
            <h2 className="text-[16px] font-semibold text-black mb-2">
              이 프로젝트는 아직 활성화되지 않았어요.
            </h2>
            <p className="text-[16px] font-semibold text-black">
              구독을 시작하고 모든 기능을 이용해보세요!
            </p>
          </div>

          {/* 기능 리스트 */}
          <div className="flex-1 space-y-4 mb-6">
            {features.map((feature) => (
              <div
                key={feature.number}
                className="w-full h-[64px] bg-[#F8F8F8] rounded-[12px] flex items-center gap-4 px-4"
              >
                {/* 번호 */}
                <span className="text-[16px] font-bold text-[#00E272] leading-[19px] min-w-[21px]">
                  {feature.number}
                </span>
                
                {/* 제목 */}
                <span className="text-[16px] font-bold text-black leading-[19px] flex-1">
                  {feature.title}
                </span>
                
                {/* 아이콘 */}
                <div className="flex-shrink-0">{feature.icon}</div>
              </div>
            ))}
          </div>

          {/* 구독하기 버튼 */}
          <button
            onClick={handleSubscribe}
            disabled={submitting}
            className="cursor-pointer w-[344px] h-[52px] bg-black rounded-[30px] flex items-center justify-center gap-[10px] text-white text-[18px] font-semibold leading-[27px] tracking-[-0.02em] hover:bg-neutral-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span>구독하기</span>
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M7 17L17 7M17 7H7M17 7V17"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
