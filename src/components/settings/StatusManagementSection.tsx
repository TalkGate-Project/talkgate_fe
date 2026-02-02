"use client";

import type { CustomerNoteCategory } from "@/types/customerNoteCategories";

type Props = {
  newStatusName: string;
  setNewStatusName: (name: string) => void;
  statuses: CustomerNoteCategory[];
  onAddStatus: () => void;
  onModifyStatus: (id: number, currentName: string) => void;
  onDeleteStatus: (id: number) => void;
};

/**
 * 처리상태 관리 섹션 컴포넌트
 */
export default function StatusManagementSection({
  newStatusName,
  setNewStatusName,
  statuses,
  onAddStatus,
  onModifyStatus,
  onDeleteStatus,
}: Props) {
  return (
    <div className="md:bg-card md:rounded-[14px] md:shadow-sm px-6 md:px-7 md:py-[30px] mt-5 md:mt-0">
      <h3 className="text-[16px] font-semibold text-foreground mb-2 tracking-[0.2px] leading-[1]">처리상태 관리</h3>
      <p className="hidden md:block text-[14px] text-neutral-60 mb-3 font-medium tracking-[0.2px]">고객 상담에서 사용될 처리상태를 관리합니다.</p>
      
      <div className="border-t border-neutral-30 mb-3"></div>
      
      <div className="flex gap-3 mb-2">
        <input
          type="text"
          value={newStatusName}
          onChange={(e) => setNewStatusName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onAddStatus()}
          className="w-full px-3 h-[34px] border border-neutral-30 rounded-[5px] text-[14px] text-foreground bg-card focus:outline-none focus:border-foreground tracking-[-0.02em]"
          placeholder="새 상태 이름을 입력하세요"
        />
        <button 
          onClick={onAddStatus}
          className="cursor-pointer min-w-[48px] h-[34px] py-2 bg-neutral-90 text-neutral-20 text-[14px] font-semibold rounded-[5px] hover:opacity-90 transition-colors tracking-[-0.02em] leading-[17px]"
        >
          추가
        </button>
      </div>

      {/* 상태 목록 */}
      <div className="space-y-3">
        {statuses.map((status) => (
          <div key={status.id} className="flex items-center justify-between py-2 px-4 md:px-6 bg-neutral-10 rounded-[5px] h-[50px]">
            <span className="text-[16px] font-semibold text-foreground leading-[19px]">{status.name}</span>
            <div className="flex gap-3">
              <button
                onClick={() => onModifyStatus(status.id, status.name)}
                className="cursor-pointer w-[48px] h-[34px] text-[14px] font-semibold text-foreground bg-card border border-neutral-30 rounded-[5px] hover:bg-neutral-10 transition-colors tracking-[-0.02em] leading-[17px]"
              >
                수정
              </button>
              <button
                onClick={() => onDeleteStatus(status.id)}
                className="cursor-pointer w-[48px] h-[34px] text-[14px] font-semibold text-foreground bg-card border border-neutral-30 rounded-[5px] hover:bg-neutral-10 transition-colors tracking-[-0.02em] leading-[17px]"
              >
                삭제
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
