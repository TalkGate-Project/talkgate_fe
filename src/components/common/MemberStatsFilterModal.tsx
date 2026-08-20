"use client";

import { useEffect, useState } from "react";
import { useIsMobile } from "@/hooks/useIsMobile";
import BaseModal from "@/components/common/BaseModal";

type TeamValue = string;

export type MemberFilterState = { team: TeamValue };

type TeamOption = { label: string; value: TeamValue };

type Props = {
  open: boolean;
  title: string;
  onClose: () => void;
  onApply: (f: MemberFilterState) => void;
  defaults: MemberFilterState;
  teamOptions?: TeamOption[];
};

const FALLBACK_TEAM_OPTIONS: TeamOption[] = [
  { label: "전체", value: "all" },
  { label: "A팀", value: "A팀" },
  { label: "B팀", value: "B팀" },
  { label: "C팀", value: "C팀" },
  { label: "배정되지않음", value: "배정되지않음" },
];

export default function MemberStatsFilterModal({
  open,
  title,
  onClose,
  onApply,
  defaults,
  teamOptions,
}: Props) {
  const availableTeamOptions = teamOptions?.length ? teamOptions : FALLBACK_TEAM_OPTIONS;
  const teamDotColors = ["var(--primary-40)", "var(--warning-20)", "var(--danger-20)", "var(--secondary-20)"];

  const [localTeam, setLocalTeam] = useState<TeamValue>(defaults.team);
  const isMobile = useIsMobile();

  useEffect(() => {
    setLocalTeam(defaults.team);
  }, [defaults.team]);

  if (!open) return null;

  return (
    <BaseModal
      onClose={onClose}
      overlayClassName="bg-black/30 dark:bg-[#000000CC]"
      ariaLabel={title}
      disableAutoContainerSizing
      positionerClassName="absolute inset-0 md:left-1/2 md:top-1/2 md:inset-auto md:w-[480px] md:h-auto md:max-h-[90vh]"
      positionerStyle={{ transform: !isMobile ? 'translate(-50%, -50%)' : 'none' }}
      containerClassName="relative w-full h-full md:h-auto bg-white dark:bg-neutral-10 rounded-t-[14px] md:rounded-[14px] flex flex-col"
    >
        {/* Header */}
        <div className="px-4 md:px-7 pt-4 md:pt-7 pb-3 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <button onClick={onClose} className="md:hidden cursor-pointer p-1 -ml-1">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M15 19L8 12L15 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-black dark:text-neutral-80" />
              </svg>
            </button>
            <div className="text-[18px] leading-[21px] font-semibold text-black dark:text-neutral-80">{title}</div>
          </div>
          <button
            onClick={onClose}
            aria-label="close"
            className="hidden md:block cursor-pointer w-6 h-6 grid place-items-center rounded hover:bg-neutral-10 text-[#111827] dark:text-neutral-70"
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
        {/* Body */}
        <div className="px-4 md:px-7 pt-[18px] pb-7 space-y-3 md:space-y-6 overflow-y-auto flex-1">
          <div>
            <div className="text-[14px] text-[#808080] dark:text-neutral-60 mb-2">팀별</div>
            <div className="flex flex-wrap gap-2">
            {availableTeamOptions.map((opt, index) => (
                <button
                  key={opt.value}
                  onClick={() => setLocalTeam(opt.value)}
                className={`cursor-pointer px-3 h-[34px] rounded-[5px] border flex items-center gap-2 text-[14px] ${
                    localTeam === opt.value
                    ? "border-2 border-primary-40 bg-primary-10/30 text-foreground font-bold"
                    : "border-[#E2E2E2] dark:border-[#444444] bg-white dark:bg-neutral-20 text-foreground"
                  }`}
                >
                {opt.value !== "all" && (
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: teamDotColors[index % teamDotColors.length] }}
                  />
                )}
                <span>{opt.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
        {/* Footer */}
        <div className="border-t border-[#E2E2E2] dark:border-[#444444] shrink-0" />
        <div className="px-4 md:px-7 py-3 flex items-center justify-end gap-3 shrink-0">
          <button
            className="cursor-pointer w-[60px] md:w-[60px] h-[40px] md:h-[34px] rounded-[5px] border border-[#E2E2E2] dark:border-[#444444] text-[14px] font-semibold tracking-[-0.02em] text-[#000] dark:text-neutral-80 bg-white dark:bg-neutral-20 hover:bg-neutral-10 dark:hover:bg-neutral-30"
            onClick={() => {
              setLocalTeam(availableTeamOptions[0]?.value ?? "all");
            }}
          >
            초기화
          </button>
          <button
            className="cursor-pointer w-[72px] md:w-[72px] h-[40px] md:h-[34px] rounded-[5px] bg-[#252525] dark:bg-neutral-80 text-[#D0D0D0] dark:text-neutral-10 text-[14px] font-semibold tracking-[-0.02em] hover:bg-[#353535] dark:hover:bg-neutral-70"
            onClick={() => onApply({ team: localTeam })}
          >
            적용완료
          </button>
        </div>
    </BaseModal>
  );
}
