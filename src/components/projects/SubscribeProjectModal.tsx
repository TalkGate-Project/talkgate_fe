"use client";

import Image from "next/image";
import { useState } from "react";
import subscribeProjUpper from "@/assets/images/projects/subscribe_proj_upper.png";
import { showErrorModal } from "@/lib/errorModalEvents";
import { LANDING_URLS } from "@/lib/constants";

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
    <svg
      width="36"
      height="36"
      viewBox="0 0 36 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        opacity="0.1"
        d="M24 0C30.6274 7.11267e-05 36 5.37263 36 12V24C35.9999 30.6272 30.6273 35.9999 24 36H12C5.37267 36 0.0001476 30.6273 0 24V12C0 5.37258 5.37258 0 12 0H24Z"
        fill="#00E272"
      />
      <path
        opacity="0.587821"
        d="M22.8001 14.7996C24.1255 14.7997 25.1995 15.8746 25.1995 17.2C25.1994 18.5253 24.1254 19.5992 22.8001 19.5994C21.4747 19.5994 20.3998 18.5254 20.3997 17.2C20.3997 15.8745 21.4746 14.7996 22.8001 14.7996ZM15.5999 10.7996C17.3671 10.7996 18.8 12.2326 18.8001 13.9998C18.8001 15.7671 17.3672 17.2 15.5999 17.2C13.8327 17.1999 12.3997 15.767 12.3997 13.9998C12.3998 12.2326 13.8327 10.7996 15.5999 10.7996Z"
        fill="#00E272"
      />
      <path
        d="M15.5867 18.7997C19.417 18.7997 22.5642 20.635 22.7986 24.5604C22.8079 24.7173 22.7975 25.2001 22.1971 25.2001H8.98224C8.78164 25.2001 8.38344 24.7675 8.40021 24.5594C8.71029 20.7413 11.8096 18.7997 15.5867 18.7997ZM22.4813 20.4012C25.2061 20.4312 27.4309 21.8081 27.5984 24.7196C27.6052 24.8369 27.5985 25.1999 27.1649 25.2001H24.0799C24.0799 23.3997 23.485 21.7381 22.4813 20.4012Z"
        fill="#00E272"
      />
    </svg>
  );
}

// 판매 성과 분석 아이콘 (그래프)
function SalesAnalyticsIcon() {
  return (
    <svg
      width="36"
      height="36"
      viewBox="0 0 36 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        opacity="0.1"
        d="M24 0C30.6274 7.11267e-05 36 5.37263 36 12V24C35.9999 30.6272 30.6273 35.9999 24 36H12C5.37267 36 0.0001476 30.6273 0 24V12C0 5.37258 5.37258 0 12 0H24Z"
        fill="#00E272"
      />
      <path
        d="M11.4666 24.5332H25.4666C25.982 24.5332 26.3999 24.9511 26.3999 25.4665C26.3999 25.982 25.982 26.3999 25.4666 26.3999H10.5333C10.0178 26.3999 9.59995 25.982 9.59995 25.4665V10.5332C9.59995 10.0177 10.0178 9.59985 10.5333 9.59985C11.0487 9.59985 11.4666 10.0177 11.4666 10.5332V24.5332Z"
        fill="#00E272"
      />
      <path
        opacity="0.5"
        d="M14.9475 20.5048C14.5949 20.8809 14.0043 20.8999 13.6282 20.5474C13.2522 20.1948 13.2331 19.6042 13.5857 19.2281L17.0857 15.4948C17.4266 15.1311 17.9932 15.0996 18.3724 15.4232L21.1348 17.7805L24.734 13.2215C25.0534 12.8169 25.6403 12.7479 26.0449 13.0673C26.4495 13.3867 26.5185 13.9736 26.1991 14.3782L21.9991 19.6982C21.6711 20.1137 21.0634 20.1735 20.6607 19.8298L17.8383 17.4213L14.9475 20.5048Z"
        fill="#00E272"
      />
    </svg>
  );
}

// 팀 일정 관리 아이콘 (말풍선/메시지)
function TeamScheduleIcon() {
  return (
    <svg
      width="36"
      height="36"
      viewBox="0 0 36 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        opacity="0.1"
        d="M24 0C30.6274 7.11267e-05 36 5.37263 36 12V24C35.9999 30.6272 30.6273 35.9999 24 36H12C5.37267 36 0.0001476 30.6273 0 24V12C0 5.37258 5.37258 0 12 0H24Z"
        fill="#00E272"
      />
      <path
        fill-rule="evenodd"
        clip-rule="evenodd"
        d="M10 12.2857C10 11.0233 11.0233 10 12.2857 10H23.7143C24.9767 10 26 11.0233 26 12.2857V23.7143C26 24.9767 24.9767 26 23.7143 26H12.2857C11.0233 26 10 24.9767 10 23.7143V12.2857ZM22.5714 13.4286H13.4286V22.5714L18 20.2857L22.5714 22.5714V13.4286Z"
        fill="url(#paint0_linear_2562_32580)"
      />
      <defs>
        <linearGradient
          id="paint0_linear_2562_32580"
          x1="18"
          y1="10"
          x2="18"
          y2="34.1538"
          gradientUnits="userSpaceOnUse"
        >
          <stop stop-color="#55E49D" />
          <stop offset="1" stop-color="#00E272" />
        </linearGradient>
      </defs>
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
    /**
     * 현재 페이지에서는 구독을 진행할 수 없습니다. 구독 페이지를 새 탭에서 띄웁니다.
     * 프로젝트 정보를 쿼리스트링에 포함하여 랜딩 페이지에서 바로 해당 프로젝트 선택 가능하도록 함
     */
    const encodedProjectName = encodeURIComponent(project.name);
    const pricingUrl = `${LANDING_URLS.PRICING}?projectId=${project.id}&projectName=${encodedProjectName}`;
    window.open(pricingUrl, "_blank");
    onClose();
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
            <Image
              src={subscribeProjUpper.src}
              alt="Subscribe Project Modal Background"
              className="w-full h-full object-cover"
              fill
            />
          </div>

          {/* 우측 상단 아이콘 및 닫기 버튼 */}
          <div className="absolute top-6 right-7 flex items-center gap-2">
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
          <div className="text-center mb-[30px]">
            <h2 className="text-[16px] font-semibold text-black">
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
                className="w-full h-[64px] bg-[#F8F8F8] rounded-[12px] flex items-center gap-4 px-10"
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
                d="M10 6H6C4.89543 6 4 6.89543 4 8V18C4 19.1046 4.89543 20 6 20H16C17.1046 20 18 19.1046 18 18V14M14 4H20M20 4V10M20 4L10 14"
                stroke="white"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
