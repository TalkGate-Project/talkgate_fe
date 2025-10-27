"use client";

export default function NotificationTab() {
  return (
    <div className="bg-white rounded-[14px] p-8">
      {/* Title */}
      <h1 className="text-[24px] font-bold text-[#252525] mb-4">
        개인 설정
      </h1>

      {/* Sub-title */}
      <h2 className="text-[16px] font-semibold text-[#000000] mb-1">
        알림 설정
      </h2>

      {/* Description */}
      <p className="text-[14px] font-medium text-[#808080] mb-6">
        서비스에서 받는 알림 정보를 설정합니다.
      </p>

      {/* Divider */}
      <div className="w-full h-[1px] bg-[#E2E2E2] mb-6"></div>

      {/* Content */}
      <div className="text-center py-20">
        <div className="text-[#808080] text-[16px]">
          알림 설정 페이지입니다.
        </div>
      </div>
    </div>
  );
}

