"use client";

type Props = {
  isAttendanceEnabled: boolean;
  isSaving: boolean;
  onToggle: () => void;
};

/**
 * 프로젝트 기능 설정 섹션 컴포넌트
 */
export default function ProjectFeaturesSection({
  isAttendanceEnabled,
  isSaving,
  onToggle,
}: Props) {
  return (
    <div className="md:bg-card md:rounded-[14px] md:shadow-sm px-6 md:px-7 md:py-[30px] mt-5 md:mt-0">
      <h3 className="text-[16px] font-semibold text-foreground mb-[10px] tracking-[0.2px] leading-[1]">프로젝트 기능</h3>
      <p className="hidden md:block text-[14px] text-neutral-60 mb-3 tracking-[0.2px] leading-[12px]">출퇴근 기능 및 근태메뉴를 활성화 합니다.</p>
      
      <div className="border-t border-neutral-30 mb-3"></div>
      
      <div className="flex items-center justify-between py-3 px-6 bg-[rgba(214,250,232,0.3)] dark:bg-[rgba(214,250,232,0.1)] rounded-[5px] h-[48px]">
        <span className="text-[16px] font-semibold text-foreground leading-[19px]">근태 메뉴 사용</span>
        <button
          onClick={onToggle}
          disabled={isSaving}
          className={`cursor-pointer relative w-10 h-6 rounded-full transition-colors flex items-center ${
            isAttendanceEnabled ? "bg-primary-60 justify-end" : "bg-neutral-30 justify-start"
          } px-1 disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          <div className="w-4 h-4 bg-neutral-0 dark:bg-white rounded-full" />
        </button>
      </div>
    </div>
  );
}
