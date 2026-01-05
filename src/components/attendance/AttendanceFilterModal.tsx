"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

type TeamValue = string;
type PositionValue = 'all' | '팀장' | '팀원';

export type AttendanceFilterState = { 
  team: TeamValue; 
  position: PositionValue; 
};

type TeamOption = { label: string; value: TeamValue };

type Props = {
  open: boolean;
  onClose: () => void;
  onApply: (f: AttendanceFilterState) => void;
  defaults: AttendanceFilterState;
  teamOptions?: TeamOption[];
};

const FALLBACK_TEAM_OPTIONS: TeamOption[] = [
  { label: "전체", value: "all" },
];

const TEAM_DOT_COLORS = ["var(--primary-40)", "var(--warning-20)", "var(--danger-20)", "var(--secondary-20)"];

export default function AttendanceFilterModal({ open, onClose, onApply, defaults, teamOptions }: Props) {
  const [localTeam, setLocalTeam] = useState<TeamValue>(defaults.team);
  const [localPosition, setLocalPosition] = useState<PositionValue>(defaults.position);
  const [isMobile, setIsMobile] = useState(false);

  const availableTeamOptions = teamOptions?.length ? teamOptions : FALLBACK_TEAM_OPTIONS;

  useEffect(() => {
    setLocalTeam(defaults.team);
    setLocalPosition(defaults.position);
  }, [defaults.team, defaults.position]);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    function onEsc(e: KeyboardEvent) {
      if (!open) return;
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, [open, onClose]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-[100]">
      <div className="absolute inset-0 bg-black/30 dark:bg-[#000000CC]" onClick={onClose} />
      <div
        className="absolute inset-0 md:left-1/2 md:top-1/2 md:inset-auto bg-card dark:bg-neutral-10 rounded-t-[14px] md:rounded-[14px] md:w-[480px] flex flex-col max-h-[90vh] md:max-h-none"
        style={{ transform: !isMobile ? 'translate(-50%, -50%)' : 'none' }}
      >
        {/* Header */}
        <div className="px-4 md:px-7 py-4 flex items-center justify-between shrink-0">
          <div className="text-[18px] font-semibold text-foreground">필터설정</div>
          <button
            onClick={onClose}
            aria-label="close"
            className="cursor-pointer w-6 h-6 grid place-items-center rounded hover:bg-neutral-10"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M6 18L18 6M6 6L18 18"
                stroke="var(--neutral-50)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
        {/* Body */}
        <div className="px-4 md:px-7 py-4 space-y-4 md:space-y-6 overflow-y-auto flex-1">
          <div>
            <div className="text-[14px] text-neutral-60 mb-2 md:mb-3">팀별</div>
            <div className="flex flex-wrap gap-2">
              {availableTeamOptions.map((opt, index) => (
                <button
                  key={opt.value}
                  onClick={() => setLocalTeam(opt.value)}
                  className={`cursor-pointer px-3 h-[34px] rounded-[5px] border flex items-center gap-2 text-[14px] ${
                    localTeam === opt.value
                      ? "border-2 border-primary-40 bg-primary-10/30 text-foreground font-bold"
                      : "border-border bg-card text-foreground"
                  }`}
                >
                  {opt.value !== "all" && (
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: TEAM_DOT_COLORS[index % TEAM_DOT_COLORS.length] }}
                    />
                  )}
                  <span>{opt.label}</span>
                </button>
              ))}
            </div>
          </div>
          <div>
            <div className="text-[14px] text-neutral-60 mb-2 md:mb-3">직급</div>
            <div className="flex flex-wrap gap-2">
              {[
                { label: "전체", value: "all" as PositionValue },
                { label: "팀장", value: "팀장" as PositionValue },
                { label: "팀원", value: "팀원" as PositionValue },
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setLocalPosition(opt.value)}
                  className={`cursor-pointer px-3 h-[34px] rounded-[5px] border text-[14px] ${
                    localPosition === opt.value
                      ? "border-2 border-primary-40 bg-primary-10/30 text-foreground font-bold"
                      : "border-border bg-card text-foreground"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
        {/* Footer */}
        <div className="px-4 md:px-7 py-3 flex justify-end gap-2 border-t border-border shrink-0">
          <button
            className="cursor-pointer h-[32px] text-[14px] px-4 rounded-[6px] border border-border text-foreground bg-card"
            onClick={() => {
              setLocalTeam(availableTeamOptions[0]?.value ?? "all");
              setLocalPosition("all");
            }}
          >
            초기화
          </button>
          <button
            className="cursor-pointer h-[32px] text-[14px] px-4 rounded-[6px] bg-[#252525] text-neutral-0 dark:bg-[#252525] dark:text-neutral-0"
            onClick={() => onApply({ team: localTeam, position: localPosition })}
          >
            적용완료
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
