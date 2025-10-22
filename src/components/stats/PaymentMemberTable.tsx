"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import MemberStatsFilterModal, { type MemberFilterState } from "@/components/MemberStatsFilterModal";

export default function PaymentMemberTable() {
  const baseRows = [
    { name: '김영업', team: 'A팀', color: '#ADF6D2', amount: 8200000, count: 25 },
    { name: '이마케팅', team: 'B팀', color: '#FFDE81', amount: 7400000, count: 35 },
    { name: '박세일즈', team: 'A팀', color: '#ADF6D2', amount: 7100000, count: 31 },
    { name: '최고객', team: 'C팀', color: '#FC9595', amount: 5600000, count: 20 },
    { name: '오과장', team: 'B팀', color: '#FFDE81', amount: 4200000, count: 3 },
    { name: '박사원', team: 'A팀', color: '#ADF6D2', amount: 3200000, count: 12 },
    { name: '배정되지않음', team: '배정되지않음', color: '#7EA5F8', amount: 1200000, count: 15 },
  ];
  const router = useRouter();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);
  const [teamFilter, setTeamFilter] = useState<MemberFilterState['team']>((searchParams.get('payTeam') as any) || 'all');
  const [sortOrder, setSortOrder] = useState<MemberFilterState['sort']>((searchParams.get('paySort') as any) || 'desc');

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    if (teamFilter && teamFilter !== 'all') params.set('payTeam', teamFilter); else params.delete('payTeam');
    if (sortOrder && sortOrder !== 'desc') params.set('paySort', sortOrder); else params.delete('paySort');
    router.replace(`?${params.toString()}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teamFilter, sortOrder]);

  const rows = useMemo(() => {
    let r = baseRows.slice();
    if (teamFilter !== 'all') r = r.filter(x => x.team === teamFilter);
    r.sort((a,b)=> sortOrder==='desc' ? b.amount - a.amount : a.amount - b.amount);
    return r;
  }, [teamFilter, sortOrder]);

  return (
    <div className="mt-1">
      <div className="mb-3 flex items-center gap-2">
        <div className="text-[16px] font-semibold text-[#252525]">팀원별 결제 현황</div>
        <button aria-label="filter" className="w-[26px] h-[26px] grid place-items-center rounded-[6px] border border-[#E2E2E2]" onClick={()=> setOpen(true)}>
          <svg width="18" height="18" viewBox="0 0 26 26" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M7 8C7 7.45 7.45 7 8 7H18C18.55 7 19 7.45 19 8V9.25C19 9.52 18.89 9.77 18.71 9.96L14.63 14.04C14.44 14.23 14.33 14.48 14.33 14.75V16.33L11.67 19V14.75C11.67 14.48 11.56 14.23 11.37 14.04L7.29 9.96C7.11 9.77 7 9.52 7 9.25V8Z" stroke="#B0B0B0" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path></svg>
        </button>
      </div>
      <div className="h-[48px] bg-[#EDEDED] rounded-[12px] grid grid-cols-4 items-center px-6 text-[16px] text-[#808080] font-semibold">
        <div>이름</div>
        <div>팀</div>
        <div>결제금액</div>
        <div>배정 건수</div>
      </div>
      <div className="divide-y divide-[#E2E2E2]">
        {rows.map((r) => (
          <div key={`${r.name}-${r.team}`} className="h-[56px] grid grid-cols-4 items-center px-6">
            <div className="text-[14px] text-[#252525] opacity-80">{r.name}</div>
            <div className="flex items-center gap-2 text-[14px] text-[#252525]">
              <span className="w-3 h-3 rounded-full" style={{ background: r.color }} />
              {r.team}
            </div>
            <div className="text-[14px] text-[#252525]">{r.amount.toLocaleString()}원</div>
            <div className="text-[14px] text-[#252525]">{r.count}건</div>
          </div>
        ))}
      </div>
      <div className="mt-4 flex items-center justify-center gap-2 text-[14px] text-[#808080]">
        <button className="w-8 h-8 rounded-full grid place-items-center border-2 border-[#B0B0B0] rotate-90" />
        {Array.from({ length: 10 }).map((_, i) => (
          <button key={i} className={`w-8 h-8 rounded-full grid place-items-center ${i===0? 'bg-[#252525] text-white' : ''}`}>{i+1}</button>
        ))}
        <button className="w-8 h-8 rounded-full grid place-items-center border-2 border-[#B0B0B0] -rotate-90" />
      </div>
      <MemberStatsFilterModal
        open={open}
        title="필터설정"
        onClose={()=> setOpen(false)}
        onApply={(f)=> { setTeamFilter(f.team); setSortOrder(f.sort); setOpen(false); }}
        defaults={{ team: teamFilter, sort: sortOrder }}
      />
    </div>
  );
}


