"use client";

type Props = {
  serviceName: string;
  onDelete: () => void;
};

/**
 * 프로젝트 삭제 섹션 컴포넌트
 */
export default function ProjectDeleteSection({ serviceName, onDelete }: Props) {
  return (
    <div className="md:bg-card md:rounded-[14px] md:shadow-sm p-6 md:p-7">
      <div className="flex items-center gap-3 mb-[6px]">
        <h3 className="text-[16px] font-semibold text-danger-40 tracking-[0.2px] leading-[1]">프로젝트 삭제</h3>
        <span className="w-[44px] bg-danger-10 dark:bg-danger-10/30 text-[12px] font-medium text-danger-40 dark:text-danger-40 rounded-[30px] text-center h-[22px] leading-[22px] opacity-80">
          주의
        </span>
      </div>
      <p className="hidden md:block text-[14px] text-danger-40 dark:text-danger-40 font-medium mb-3 tracking-[0.2px] leading-[1]">
        프로젝트를 삭제하면 모든 데이터가 영구적으로 삭제되며 복구할 수 없습니다.
      </p>
      <div className="border-t border-neutral-30 dark:border-neutral-30 mb-3"></div>
      
      <div className="flex items-center justify-between py-3 px-6 bg-[rgba(255,235,235,0.5)] dark:bg-neutral-20 rounded-[5px] h-[48px]">
        <span className="text-[16px] font-semibold text-danger-40 dark:text-danger-40 leading-[19px]">프로젝트 삭제</span>
        <button 
          onClick={onDelete}
          className="cursor-pointer px-3 py-1.5 bg-danger-40 dark:bg-danger-40 text-neutral-0 dark:text-neutral-100 text-[14px] font-semibold rounded-[5px] hover:opacity-90 transition-colors tracking-[-0.02em] leading-[17px] h-[34px]"
        >
          프로젝트 삭제
        </button>
      </div>
      <p className="block md:hidden text-[14px] text-danger-40 dark:text-danger-40 font-medium mt-2 mb-3 tracking-[0.2px] leading-[1]">
        프로젝트를 삭제하면 모든 데이터가 영구적으로 삭제되며 복구할 수 없습니다.
      </p>
    </div>
  );
}
