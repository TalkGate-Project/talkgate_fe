"use client";

type Props = {
  serviceName: string;
  setServiceName: (name: string) => void;
  originalServiceName: string;
  isSaving: boolean;
  onUpdate: () => void;
};

/**
 * 프로젝트 이름 설정 섹션 컴포넌트
 */
export default function ProjectNameSection({
  serviceName,
  setServiceName,
  originalServiceName,
  isSaving,
  onUpdate,
}: Props) {
  return (
    <div className="md:bg-card md:rounded-[14px] lg:rounded-[14px] rounded-t-none lg:rounded-t-[14px] md:shadow-sm pb-5 md:pb-7">
      <h1 className="text-[18px] py-[18px] md:py-0 md:text-[24px] font-bold text-neutral-90 leading-[20px] px-6 md:px-7 md:h-[76px] flex items-center">
        일반설정
      </h1>
      <div className="border-t border-neutral-30 mb-6"></div>
      <h3 className="text-[16px] font-semibold text-foreground mb-3 tracking-[0.2px] leading-[1] px-6 md:px-7">프로젝트 이름</h3>
      <div className="border-t border-neutral-30 mb-3 mx-6 md:mx-7"></div>
      <h6 className="text-[14px] text-neutral-60 font-medium mb-2 tracking-[0.2px] leading-[1] px-6 md:px-7">이름</h6>
      <div className="flex gap-3 px-6 md:px-7">
        <input
          type="text"
          value={serviceName}
          onChange={(e) => setServiceName(e.target.value)}
          className="flex-1 px-3 md:py-2 border border-neutral-30 rounded-[5px] text-[14px] text-foreground bg-card focus:outline-none focus:border-foreground"
          placeholder="이름"
          disabled={isSaving}
        />
        <button 
          onClick={onUpdate}
          disabled={isSaving || serviceName === originalServiceName}
          className="px-3 py-2 bg-neutral-90 text-neutral-20 text-[14px] font-semibold rounded-[5px] hover:opacity-90 transition-colors tracking-[-0.02em] leading-[17px] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSaving ? (
            "변경중..."
          ) : (
            <>
              <span className="md:hidden">변경</span>
              <span className="hidden md:inline">이름변경</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
