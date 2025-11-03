"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

type TeamValue = 'all' | 'A팀' | 'B팀' | 'C팀' | '배정되지않음';
type PositionValue = 'all' | '팀장' | '팀원';

export type AttendanceFilterState = { 
  team: TeamValue; 
  position: PositionValue; 
};

type Props = {
  open: boolean;
  onClose: () => void;
  onApply: (f: AttendanceFilterState) => void;
  defaults: AttendanceFilterState;
};

export default function AttendanceFilterModal({ open, onClose, onApply, defaults }: Props) {
  const [localTeam, setLocalTeam] = useState<TeamValue>(defaults.team);
  const [localPosition, setLocalPosition] = useState<PositionValue>(defaults.position);

  useEffect(() => {
    setLocalTeam(defaults.team);
    setLocalPosition(defaults.position);
  }, [defaults.team, defaults.position]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-[100]">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="absolute left-1/2 top-1/2 bg-card rounded-[14px] shadow-[0_13px_61px_rgba(169,169,169,0.37)]" style={{ width: 480, transform: 'translate(-50%, -50%)' }}>
        <div className="px-6 py-4 flex items-center justify-between border-b border-border">
          <div className="text-[18px] font-semibold text-foreground">필터설정</div>
          <button onClick={onClose} aria-label="close" className="w-6 h-6 grid place-items-center rounded hover:bg-neutral-10">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M6 18L18 6M6 6L18 18" stroke="var(--neutral-50)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
        <div className="px-6 py-4 space-y-6">
          <div>
            <div className="text-[14px] text-neutral-60 mb-3">팀별</div>
            <div className="flex flex-wrap gap-2">
              {[
                { label: '전체', value: 'all' as TeamValue, color: 'var(--primary-40)' },
                { label: 'A팀', value: 'A팀' as TeamValue, color: 'var(--primary-40)' },
                { label: 'B팀', value: 'B팀' as TeamValue, color: 'var(--warning-20)' },
                { label: 'C팀', value: 'C팀' as TeamValue, color: 'var(--danger-20)' },
                { label: '배정되지않음', value: '배정되지않음' as TeamValue, color: 'var(--secondary-20)' },
              ].map((opt) => (
                <button 
                  key={opt.value} 
                  onClick={() => setLocalTeam(opt.value)} 
                  className={`px-3 h-[28px] rounded-[6px] border flex items-center gap-2 ${
                    localTeam === opt.value 
                      ? 'bg-primary-10 border-primary-40 text-primary-100' 
                      : 'border-border text-foreground bg-card'
                  }`}
                >
                  {opt.value !== 'all' && (
                    <div 
                      className="w-2 h-2 rounded-full" 
                      style={{ backgroundColor: opt.color }}
                    />
                  )}
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <div className="text-[14px] text-neutral-60 mb-3">직급</div>
            <div className="flex gap-2">
              {[
                { label: '전체', value: 'all' as PositionValue },
                { label: '팀장', value: '팀장' as PositionValue },
                { label: '팀원', value: '팀원' as PositionValue },
              ].map((opt) => (
                <button 
                  key={opt.value} 
                  onClick={() => setLocalPosition(opt.value)} 
                  className={`px-3 h-[28px] rounded-[6px] border ${
                    localPosition === opt.value 
                      ? 'bg-primary-10 border-primary-40 text-primary-100' 
                      : 'border-border text-foreground bg-card'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="px-6 py-3 flex justify-end gap-2 border-t border-border">
          <button 
            className="h-[32px] px-4 rounded-[6px] border border-border text-foreground bg-card" 
            onClick={() => { 
              setLocalTeam('all'); 
              setLocalPosition('all'); 
            }}
          >
            초기화
          </button>
          <button 
            className="h-[32px] px-4 rounded-[6px] bg-primary-60 text-neutral-0" 
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
