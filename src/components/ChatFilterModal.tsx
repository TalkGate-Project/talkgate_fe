"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Checkbox from "@/components/Checkbox";

export type Messenger = "all" | "telegram" | "instagram" | "line" | "kakao" | "facebook" | "x";

export type ChatFilterDefaults = {
  messenger?: Messenger;
  statuses?: string[]; // ex) ["일반","부재"]
};

export default function ChatFilterModal({ open, defaults, onClose, onApply }: { open: boolean; defaults?: ChatFilterDefaults; onClose: () => void; onApply: (next: ChatFilterDefaults) => void; }) {
  const [messenger, setMessenger] = useState<Messenger>(defaults?.messenger ?? "all");
  const [statuses, setStatuses] = useState<string[]>(defaults?.statuses ?? []);
  const [statusOpen, setStatusOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    setMessenger(defaults?.messenger ?? "all");
    setStatuses(defaults?.statuses ?? []);
  }, [open, defaults]);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!statusOpen) return;
      if (!dropdownRef.current) return;
      if (!dropdownRef.current.contains(e.target as Node)) setStatusOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [statusOpen]);

  if (!open) return null;

  const items: { key: Messenger; label: string; icon?: string }[] = [
    { key: "all", label: "전체" },
    { key: "telegram", label: "텔레그램", icon: "/telegram.png" },
    { key: "instagram", label: "인스타그램", icon: "/instagram.png" },
    { key: "line", label: "네이버앱", icon: "/naver_line.png" },
    { key: "kakao", label: "카카오톡", icon: "/kakao_icon.png" },
    { key: "facebook", label: "페이스북", icon: "/facebook.png" },
    { key: "x", label: "트위터(X)", icon: "/x_twitter.png" },
  ];

  const statusOptions = ["일반", "부재", "재상담", "관리중", "AS요청"] as const;

  return (
    <div className="fixed inset-0 z-[100]">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      {/* POP-UP 440x336 centered */}
      <div className="absolute" style={{ width: 440, height: 336, left: "50%", top: "50%", transform: "translate(-50%, -50%)" }}>
        <div className="relative w-full h-full bg-white rounded-[14px] shadow-[0px_13px_61px_rgba(169,169,169,0.366013)]">
          {/* Header */}
          <div className="px-6 pt-5 pb-3 flex items-center justify-between">
            <h2 className="text-[18px] leading-[21px] font-semibold text-[#000]">필터설정</h2>
            <button aria-label="close" onClick={onClose} className="w-6 h-6 grid place-items-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M6 18L18 6M6 6L18 18" stroke="#B0B0B0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>

          {/* Body */}
          <div className="px-6 space-y-4" style={{ height: 336 - 56 - 64 }}>
            {/* 메신저 아이콘 */}
            <div>
              <div className="text-[14px] text-[#808080] mb-2">메신저</div>
              <div className="flex items-center gap-3">
                {/* 전체 버튼 */}
                <button
                  onClick={() => setMessenger("all")}
                  className={`h-[34px] px-3 rounded-[8px] border text-[14px] ${messenger==='all' ? 'border-[#51F8A5] bg-[rgba(214,250,232,0.3)]' : 'border-[#E2E2E2] bg-white'}`}
                >
                  전체
                </button>
                {items.filter(i=>i.key!=='all').map((it) => (
                  <button
                    key={it.key}
                    onClick={() => setMessenger(it.key)}
                    className={`w-[44px] h-[34px] rounded-[5px] border grid place-items-center ${messenger===it.key? 'border-[#E2E2E2] bg-white' : 'border-[#E2E2E2] bg-white'}`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={it.icon!} alt="" className="w-5 h-5" />
                  </button>
                ))}
              </div>
            </div>

            {/* 처리상태 멀티 선택 */}
            <div ref={dropdownRef} className="relative">
              <div className="text-[14px] text-[#808080] mb-2">처리상태</div>
              <button
                type="button"
                onClick={() => setStatusOpen((v)=>!v)}
                className="w-full h-[34px] border border-[#E2E2E2] rounded-[5px] px-3 flex items-center justify-between"
              >
                <span className="text-[14px] leading-[17px] tracking-[-0.02em] text-[#000] opacity-90">{statuses.length ? `${statuses.length}개 선택됨` : '상태 선택'}</span>
                <svg width="10" height="8" viewBox="0 0 10 8" fill="none" xmlns="http://www.w3.org/2000/svg" className={`${statusOpen? 'rotate-180' : ''}`}>
                  <path d="M5.5068 7.25009C5.22417 7.61647 4.67583 7.61647 4.3932 7.25009L0.430435 2.13452C0.00873756 1.58913 0.396109 0.800097 1.03724 0.800097L8.86276 0.800098C9.50389 0.800098 9.89126 1.58913 9.46957 2.13452L5.5068 7.25009Z" fill="#000"/>
                </svg>
              </button>

              {statuses.length > 0 && (
                <div className="mt-3 flex items-center gap-2 flex-wrap">
                  {statuses.map((s) => (
                    <span key={s} className="inline-flex items-center h-[22px] rounded-full px-3 bg-[#D6FAE8] text-[#00B55B] text-[12px] opacity-80">
                      {s}
                      <button className="ml-2 w-3 h-3 grid place-items-center" aria-label="remove" onClick={() => setStatuses((prev)=> prev.filter((x)=> x!==s))}>
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M3 9L9 3M3 3L9 9" stroke="#00B55B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {statusOpen && (
                <div className="absolute left-0 right-0 z-10 mt-2 bg-white border border-[#E2E2E2] rounded-[8px] shadow-[0_8px_20px_rgba(0,0,0,0.08)] max-h-[220px] overflow-auto p-3">
                  {statusOptions.map((opt) => {
                    const checked = statuses.includes(opt);
                    return (
                      <label key={opt} className="flex items-center gap-3 h-10 px-1">
                        <Checkbox checked={checked} onChange={(next)=> setStatuses((prev)=> next ? [...prev, opt] : prev.filter((x)=> x!==opt))} ariaLabel={opt} />
                        <span className="text-[14px] text-[#000]">{opt}</span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 flex items-center justify-end gap-3 border-t border-[#E2E2E2]">
            <button className="h-[34px] px-3 rounded-[5px] border border-[#E2E2E2] text-[14px] font-semibold tracking-[-0.02em] text-[#000] bg-white" onClick={()=>{ setMessenger('all'); setStatuses([]); }}>초기화</button>
            <button className="h-[34px] px-3 rounded-[5px] bg-[#252525] text-[#D0D0D0] text-[14px] font-semibold tracking-[-0.02em]" onClick={()=> onApply({ messenger, statuses })}>적용완료</button>
          </div>
        </div>
      </div>
    </div>
  );
}


