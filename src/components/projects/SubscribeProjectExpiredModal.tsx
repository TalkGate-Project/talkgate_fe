"use client";

import Image from "next/image";
import type { MemberRole } from "@/types/members";
import { useMyMember } from "@/hooks/useMyMember";
import { LANDING_URLS } from "@/lib/constants";
import subscribeProjUpper from "@/assets/images/projects/subscribe_proj_upper.png";

type Project = {
  id: number;
  name: string;
  logoUrl?: string | null | undefined;
  memberCount?: number;
};

type Props = {
  project: Project;
  userRole?: MemberRole;
  onClose: () => void;
};

export default function SubscribeProjectExpiredModal({
  project,
  userRole: userRoleProp,
  onClose,
}: Props) {
  // 프로젝트 ID를 사용하여 현재 사용자의 role 조회
  const { role: userRoleFromApi } = useMyMember(String(project.id));
  
  // userRole prop이 있으면 우선 사용, 없으면 API에서 가져온 값 사용
  const userRole = userRoleProp ?? userRoleFromApi;
  
  // 어드민 여부 확인 (admin 또는 subAdmin)
  const isAdmin = userRole === "admin" || userRole === "subAdmin";

  const handleButtonClick = () => {
    if (isAdmin) {
      // 어드민: 랜딩페이지 구독 상품 페이지로 이동
      // useProjectBilling.ts:55 패턴을 참고하여 프로젝트 정보를 쿼리스트링에 포함
      const encodedProjectName = encodeURIComponent(project.name);
      const checkoutUrl = `${LANDING_URLS.PRICING}?step=checkout&projectId=${project.id}&projectName=${encodedProjectName}`;
      window.location.href = checkoutUrl;
    } else {
      // 일반 멤버: 모달 닫기
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 배경 오버레이 */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* 모달 컨테이너 */}
      <div
        className="relative w-[440px] bg-white rounded-[14px] shadow-[0px_8px_12px_rgba(9,30,66,0.1)] flex flex-col overflow-hidden"
        style={{
          filter: "drop-shadow(0px 8px 12px rgba(9, 30, 66, 0.1))",
        }}
      >
        {/* 헤더 이미지 영역 */}
        <div className="relative w-full h-[155px] rounded-t-[14px] overflow-hidden flex-shrink-0">
          {/* 배경 패턴 (추상적인 기하학적 도형) */}
          <div className="absolute inset-0">
            <Image
              src={subscribeProjUpper.src}
              alt="Subscribe Project Expired Modal Background"
              className="w-full h-full object-cover"
              fill
            />
          </div>

          {/* 우측 상단 아이콘 및 닫기 버튼 */}
          <div className="absolute top-6 right-7 flex items-center gap-2">
            <button
              aria-label="close"
              className="cursor-pointer w-6 h-6 flex items-center justify-center text-white hover:opacity-70 transition-opacity"
              onClick={onClose}
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
        <div className="px-[48px] pt-8 pb-6 flex flex-col">
          {/* 제목 및 설명 */}
          <div className="text-center mb-8">
            <h2 className="text-[16px] font-semibold text-black">
              구독 기간이 만료되었어요.
            </h2>
            <p className="text-[16px] font-semibold text-black mt-2 whitespace-pre-line">
              {isAdmin
                ? "서비스를 계속 이용하시려면\n구독을 갱신해 주세요."
                : "프로젝트 관리자가 구독을 갱신하면\n서비스를 계속 이용할 수 있어요."}
            </p>
          </div>

          {/* 버튼 */}
          <div>
            <button
              onClick={handleButtonClick}
              className="cursor-pointer w-[344px] h-[52px] bg-black rounded-[30px] flex items-center justify-center gap-[10px] text-white text-[18px] font-semibold leading-[27px] tracking-[-0.02em] hover:bg-neutral-800 transition-colors"
            >
              <span>{isAdmin ? "구독하기" : "확인"}</span>
              {isAdmin && (
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
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
