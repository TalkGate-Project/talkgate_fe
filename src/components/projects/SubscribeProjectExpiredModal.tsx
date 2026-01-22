"use client";

import { useRouter } from "next/navigation";
import type { MemberRole } from "@/types/members";

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
  userRole,
  onClose,
}: Props) {
  const router = useRouter();
  
  // 어드민 여부 확인 (admin 또는 subAdmin)
  const isAdmin = userRole === "admin" || userRole === "subAdmin";

  const handleButtonClick = () => {
    if (isAdmin) {
      // 어드민: 결제관리 페이지로 이동
      router.push("/my-settings?tab=billing");
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
        {/* 헤더 */}
        <div className="px-6 pt-6 pb-4">
          <div className="flex items-center justify-between">
            <h2 className="text-[18px] font-semibold text-foreground">
              구독 만료 안내
            </h2>
            <button
              aria-label="close"
              className="cursor-pointer w-6 h-6 flex items-center justify-center text-neutral-60 hover:text-foreground transition-colors"
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

        {/* 본문 */}
        <div className="px-6 pb-6">
          <div className="mb-6">
            <p className="text-[16px] text-foreground whitespace-pre-line">
              {isAdmin
                ? "구독 기간이 만료되었어요.\n서비스를 계속 이용하시려면 구독을 갱신해 주세요."
                : "구독 기간이 만료되었어요.\n프로젝트 관리자가 구독을 갱신하면 서비스를 계속 이용할 수 있어요."}
            </p>
          </div>

          {/* 버튼 */}
          <button
            onClick={handleButtonClick}
            className="cursor-pointer w-full h-[52px] bg-black rounded-[30px] flex items-center justify-center text-white text-[18px] font-semibold leading-[27px] tracking-[-0.02em] hover:bg-neutral-800 transition-colors"
          >
            {isAdmin ? "결제관리" : "확인"}
          </button>
        </div>
      </div>
    </div>
  );
}
