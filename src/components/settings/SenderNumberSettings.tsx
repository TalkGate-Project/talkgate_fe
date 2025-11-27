"use client";

import { useSelectedProjectId } from "@/hooks/useSelectedProjectId";

export default function SenderNumberSettings() {
  const [projectId, ready] = useSelectedProjectId();

  const showProjectMissing = ready && !projectId;

  return (
    <div className="bg-card rounded-[14px] pb-7">
      {/* Title */}
      <h1 className="px-7 text-[24px] font-bold text-neutral-90 h-[76px] flex items-center">
        발신번호 등록
      </h1>
      <p className="px-7 text-[14px] font-medium text-neutral-60 mb-6 leading-5">
        서비스에서 사용할 발신번호를 등록하고 관리할 수 있는 영역입니다.
        <br />
        향후 통신사 인증 및 발신번호 검수 API와 연동될 예정입니다.
      </p>

      <div className="mx-7 h-px bg-neutral-30 mb-6" />

      {showProjectMissing ? (
        <div className="flex items-center justify-center h-40 text-[14px] text-neutral-60">
          프로젝트를 먼저 선택해주세요.
        </div>
      ) : (
        <div className="px-7">
          {/* Table header skeleton */}
          <div className="bg-[#EDEDED] rounded-[8px] px-6 h-[40px] flex items-center gap-3 mb-4">
            <div className="w-[180px] text-[14px] font-semibold text-neutral-60">
              발신번호
            </div>
            <div className="w-[120px] text-[14px] font-semibold text-neutral-60">
              별칭
            </div>
            <div className="w-[140px] text-[14px] font-semibold text-neutral-60">
              상태
            </div>
            <div className="flex-1 text-[14px] font-semibold text-neutral-60">
              등록 일시
            </div>
          </div>

          {/* Empty state / groundwork */}
          <div className="flex flex-col items-center justify-center h-40 text-center border border-dashed border-neutral-30 rounded-[10px]">
            <p className="text-[14px] text-neutral-60 mb-2">
              아직 등록된 발신번호가 없습니다.
            </p>
            <p className="text-[12px] text-neutral-50 mb-4">
              추후 통신사 인증 및 발신번호 조회 API 연동 후 이 영역에서 관리할 수 있습니다.
            </p>
            <button
              type="button"
              disabled
              className="cursor-not-allowed h-[34px] px-4 rounded-[5px] bg-neutral-20 text-[14px] font-semibold text-neutral-60"
            >
              발신번호 추가 (준비 중)
            </button>
          </div>
        </div>
      )}
    </div>
  );
}


