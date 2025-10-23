"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

type TeamValue = 'all'|'A팀'|'B팀'|'C팀'|'배정되지않음';
type SortValue = 'desc'|'asc';

export type MemberFilterState = { team: TeamValue; sort: SortValue };

type Props = {
  open: boolean;
  title: string;
  onClose: () => void;
  onApply: (f: MemberFilterState) => void;
  defaults: MemberFilterState;
};

export default function MemberStatsFilterModal({ open, title, onClose, onApply, defaults }: Props) {
  const [localTeam, setLocalTeam] = useState<TeamValue>(defaults.team);
  const [localSort, setLocalSort] = useState<SortValue>(defaults.sort);

  useEffect(() => {
    setLocalTeam(defaults.team);
    setLocalSort(defaults.sort);
  }, [defaults.team, defaults.sort]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-[100]">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="absolute left-1/2 top-1/2 bg-white rounded-[14px] shadow-[0_13px_61px_rgba(169,169,169,0.37)]" style={{ width: 480, transform: 'translate(-50%, -50%)' }}>
        <div className="px-6 py-4 flex items-center justify-between border-b border-[#E2E2E2]">
          <div className="text-[18px] font-semibold">{title}</div>
          <button onClick={onClose} aria-label="close" className="w-6 h-6 grid place-items-center rounded hover:bg-[#F3F3F3]">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6 18L18 6M6 6L18 18" stroke="#111827" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
        </div>
        <div className="px-6 py-4 space-y-6">
          <div>
            <div className="text-[14px] text-[#808080] mb-2">팀별</div>
            <div className="flex flex-wrap gap-2">
              {[
                { label: '전체', value: 'all' as TeamValue },
                { label: 'A팀', value: 'A팀' as TeamValue },
                { label: 'B팀', value: 'B팀' as TeamValue },
                { label: 'C팀', value: 'C팀' as TeamValue },
                { label: '배정되지않음', value: '배정되지않음' as TeamValue },
              ].map((opt) => (
                <button key={opt.value} onClick={() => setLocalTeam(opt.value)} className={`px-3 h-[28px] rounded-[6px] border ${localTeam===opt.value? 'bg-[#D6FAE8] border-[#51F8A5] text-[#004824]' : 'border-[#E2E2E2] text-[#252525]'}`}>{opt.label}</button>
              ))}
            </div>
          </div>
          <div>
            <div className="text-[14px] text-[#808080] mb-2">정렬</div>
            <div className="flex gap-2">
              {[
                { label: '내림차순', value: 'desc' as SortValue },
                { label: '오름차순', value: 'asc' as SortValue },
              ].map((opt) => (
                <button key={opt.value} onClick={() => setLocalSort(opt.value)} className={`px-3 h-[28px] rounded-[6px] border ${localSort===opt.value? 'bg-[#D6FAE8] border-[#51F8A5] text-[#004824]' : 'border-[#E2E2E2] text-[#252525]'}`}>{opt.label}</button>
              ))}
            </div>
          </div>
        </div>
        <div className="px-6 py-3 flex justify-end gap-2 border-t border-[#E2E2E2]">
          <button className="h-[32px] px-4 rounded-[6px] border border-[#E2E2E2]" onClick={() => { setLocalTeam('all'); setLocalSort('desc'); }}>초기화</button>
          <button className="h-[32px] px-4 rounded-[6px] bg-[#252525] text-[#D0D0D0]" onClick={() => onApply({ team: localTeam, sort: localSort })}>적용완료</button>
        </div>
      </div>
    </div>,
    document.body
  );
}


