"use client";

import { useSelectedProjectId } from "@/hooks/useSelectedProjectId";

export default function SmsHistorySettings() {
  const [projectId, ready] = useSelectedProjectId();

  const showProjectMissing = ready && !projectId;

  return (
    <div className="bg-card rounded-[14px] py-7">
      {/* Title */}
      <h1 className="px-7 text-[24px] font-bold text-neutral-90 mb-2">
        문자 발송 이력
      </h1>
      <p className="px-7 text-[14px] font-medium text-neutral-60 mb-6 leading-5">
        고객에게 발송된 문자 메시지 이력을 조회할 수 있는 영역입니다.
        <br />
        향후 문자 발송 API와 연동하여 실제 발송 결과 및 상태를 표시할 예정입니다.
      </p>

      <div className="mx-7 h-px bg-neutral-30 mb-6" />

      {showProjectMissing ? (
        <div className="flex items-center justify-center h-40 text-[14px] text-neutral-60">
          프로젝트를 먼저 선택해주세요.
        </div>
      ) : (
        <div className="px-7">
          {/* Filter / search bar groundwork */}
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <div className="h-[34px] px-3 rounded-[5px] border border-neutral-30 text-[13px] text-neutral-60 flex items-center bg-neutral-0">
              날짜 범위 선택 (준비 중)
            </div>
            <div className="h-[34px] px-3 rounded-[5px] border border-neutral-30 text-[13px] text-neutral-60 flex items-center bg-neutral-0">
              발송 상태 필터 (준비 중)
            </div>
          </div>

          {/* Table header skeleton */}
          <div className="bg-[#EDEDED] rounded-[8px] px-6 h-[40px] flex items-center gap-3 mb-4">
            <div className="w-[180px] text-[14px] font-semibold text-neutral-60">
              발송 일시
            </div>
            <div className="w-[140px] text-[14px] font-semibold text-neutral-60">
              발신번호
            </div>
            <div className="w-[160px] text-[14px] font-semibold text-neutral-60">
              수신자
            </div>
            <div className="w-[120px] text-[14px] font-semibold text-neutral-60">
              유형
            </div>
            <div className="w-[120px] text-[14px] font-semibold text-neutral-60">
              상태
            </div>
            <div className="flex-1 text-[14px] font-semibold text-neutral-60">
              내용
            </div>
          </div>

          {/* Empty state / groundwork */}
          <div className="flex items-center justify-center h-40 text-[14px] text-neutral-60 border border-dashed border-neutral-30 rounded-[10px] text-center">
            문자 발송 이력 데이터가 없습니다.
            <br />
            문자 전송 기능 및 이력 조회 API가 연동되면 이 영역에 리스트가 표시됩니다.
          </div>
        </div>
      )}
    </div>
  );
}


