"use client";

import { Suspense, useMemo, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Area, BarChart, Bar, LabelList, Cell } from "recharts";
import AssignMemberTable from "@/components/stats/AssignMemberTable";
import AssignProgressList from "@/components/stats/AssignProgressList";
import PaymentMemberTable from "@/components/stats/PaymentMemberTable";
import PaymentBarChart from "@/components/stats/PaymentBarChart";
import StatusBarChart from "@/components/stats/StatusBarChart";

type TabKey = "apply" | "assign" | "payment" | "status" | "ranking";
const TAB_ITEMS: { key: TabKey; label: string }[] = [
  { key: "apply", label: "신청통계" },
  { key: "assign", label: "배정통계" },
  { key: "payment", label: "결제통계" },
  { key: "status", label: "처리상태" },
  { key: "ranking", label: "전체랭킹" },
];

function StatsPage() {
  const router = useRouter();
  const search = useSearchParams();
  const [applyMode, setApplyMode] = useState<"daily" | "monthly">((search.get("mode") as any) === "monthly" ? "monthly" : "daily");
  const [assignMode, setAssignMode] = useState<"team" | "member">((search.get("assign") as any) === "member" ? "member" : "team");
  const [paymentMode, setPaymentMode] = useState<"team" | "member">((search.get("pay") as any) === "member" ? "member" : "team");
  const [rankingMode, setRankingMode] = useState<"team" | "member">((search.get("rank") as any) === "member" ? "member" : "team");
  const active: TabKey = useMemo(() => {
    const q = (search.get("tab") || "apply").toLowerCase();
    return (TAB_ITEMS.find((t) => t.key === (q as TabKey))?.key ?? "apply") as TabKey;
  }, [search]);

  function setTab(key: TabKey) {
    const params = new URLSearchParams(search.toString());
    if (key === "apply") params.delete("tab"); else params.set("tab", key);
    router.replace(`?${params.toString()}`);
  }

  function setApplyModeQS(mode: "daily" | "monthly") {
    const params = new URLSearchParams(search.toString());
    if (mode === "daily") params.delete("mode"); else params.set("mode", mode);
    router.replace(`?${params.toString()}`);
    setApplyMode(mode);
  }

  function setAssignModeQS(mode: "team" | "member") {
    const params = new URLSearchParams(search.toString());
    if (mode === "team") params.delete("assign"); else params.set("assign", mode);
    router.replace(`?${params.toString()}`);
    setAssignMode(mode);
  }

  function setPaymentModeQS(mode: "team" | "member") {
    const params = new URLSearchParams(search.toString());
    if (mode === "team") params.delete("pay"); else params.set("pay", mode);
    router.replace(`?${params.toString()}`);
    setPaymentMode(mode);
  }

  function setRankingModeQS(mode: "team" | "member") {
    const params = new URLSearchParams(search.toString());
    if (mode === "team") params.delete("rank"); else params.set("rank", mode);
    router.replace(`?${params.toString()}`);
    setRankingMode(mode);
  }

  const dailyData = [
    { x: "09.11", y: 0 },
    { x: "09.12", y: 5 },
    { x: "09.13", y: 12 },
    { x: "09.14", y: 6 },
    { x: "09.15", y: 14 },
    { x: "09.16", y: 23, peak: true },
    { x: "09.17", y: 13 },
  ];
  const monthlyData = [
    { x: "04", y: 51 },
    { x: "05", y: 72 },
    { x: "06", y: 66 },
    { x: "07", y: 98 },
    { x: "08", y: 132, peak: true },
    { x: "09", y: 117 },
  ];

  return (
    <main className="min-h-[calc(100vh-54px)] bg-[#F8F8F8]">
      <div className="mx-auto max-w-[1324px] w-full px-0 pt-6 pb-12">
        {/* Top card with tabs */}
        <section className="bg-white rounded-[14px] p-6 shadow-[0_13px_61px_rgba(169,169,169,0.12)]">
          <div className="flex items-center gap-4">
            <h1 className="text-[24px] font-bold text-[#252525]">통계</h1>
            <span className="w-px h-4 bg-[#808080] opacity-60" />
            <p className="text-[18px] text-[#808080]">고객 신청, 배정, 처리상태, 결제, 랭킹 통계를 한눈에 확인하세요</p>
          </div>
          <div className="mt-5 h-[48px] bg-[#EDEDED] rounded-[12px] px-3 flex items-center">
            <div className="flex items-center gap-2">
              {TAB_ITEMS.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={`h-[31px] rounded-[5px] px-8 text-[16px] cursor-pointer ${active===t.key? 'bg-white text-[#252525] font-bold' : 'text-[#808080]'} `}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Dynamic containers per tab */}
        {active === "apply" && (
          <>
            {/* 신청통계 그래프 카드 */}
            <section className="mt-6 bg-white rounded-[14px] p-6 border border-[#E2E2E2]">
              <div className="flex items-center justify-between">
                <h2 className="text-[18px] font-semibold text-[#252525]">신청통계</h2>
                <div className="h-[36px] w-[240px] bg-[#EDEDED] rounded-[8px] grid grid-cols-2 p-1">
                  <button className={`rounded-[6px] text-[14px] ${applyMode==='daily'?'bg-white font-semibold text-[#252525]':'text-[#808080]'}`} onClick={()=> setApplyModeQS('daily')}>일간</button>
                  <button className={`rounded-[6px] text-[14px] ${applyMode==='monthly'?'bg-white font-semibold text-[#252525]':'text-[#808080]'}`} onClick={()=> setApplyModeQS('monthly')}>월간</button>
                </div>
              </div>
              <div className="mt-4 h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={applyMode==='daily'? dailyData : monthlyData} margin={{ top: 10, right: 16, bottom: 0, left: 0 }}>
                    <defs>
                      <linearGradient id="applyGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#51F8A5" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="#51F8A5" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="#EDEDED" vertical={false} />
                    <XAxis dataKey="x" tick={{ fill: "#808080" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "#808080" }} axisLine={false} tickLine={false} width={32} />
                    <Tooltip
                      cursor={{ stroke: "#51F8A5", strokeWidth: 1, opacity: 0.25 }}
                      content={({ active, payload }) => {
                        if (!active || !payload?.length) return null;
                        const v = payload[0].value as number;
                        return (
                          <div className="px-3 py-1 bg-black text-white rounded-[6px] text-[12px]">{v}</div>
                        );
                      }}
                    />
                    <Area type="monotone" dataKey="y" stroke="none" fill="url(#applyGradient)" />
                    <Line type="monotone" dataKey="y" stroke="#51F8A5" strokeWidth={2} dot={{ r: 5, fill: "#00E272", stroke: "#51F8A5", strokeWidth: 2 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </section>
            {/* 상세 데이터 테이블 카드 */}
            <section className="mt-6 bg-white rounded-[14px] p-6">
              <div className="flex items-center justify-between">
                <h3 className="text-[18px] font-semibold text-[#000]">상세 데이터</h3>
                <div className="flex items-center gap-3">
                  <div className="w-[175px] h-[34px] border border-[#E2E2E2] rounded-[5px] px-2 grid grid-cols-[1fr_auto] items-center text-[14px]"><span className="opacity-90">연도 . 월 . 일</span><span className="w-5 h-5 border-2 border-[#B0B0B0] rounded" /></div>
                  <span className="mx-1">-</span>
                  <div className="w-[175px] h-[34px] border border-[#E2E2E2] rounded-[5px] px-2 grid grid-cols-[1fr_auto] items-center text-[14px]"><span className="opacity-90">연도 . 월 . 일</span><span className="w-5 h-5 border-2 border-[#B0B0B0] rounded" /></div>
                </div>
              </div>
              <div className="mt-4 h-px bg-[#E2E2E2]" />
              <div className="mt-4">
                <div className="grid grid-cols-5 text-[16px] text-[#808080] font-semibold">
                  <div className="px-4 py-2">날짜</div>
                  <div className="px-4 py-2">신청 건수</div>
                  <div className="px-4 py-2">직접입력</div>
                  <div className="px-4 py-2">엑셀 업로드</div>
                  <div className="px-4 py-2">API</div>
                </div>
                {Array.from({ length: 10 }).map((_, i) => (
                  <div key={i} className="grid grid-cols-5 text-[14px] text-[#252525] opacity-80">
                    <div className="px-4 py-3">9월 {11 + i}일</div>
                    <div className="px-4 py-3">8건</div>
                    <div className="px-4 py-3">3건</div>
                    <div className="px-4 py-3">2건</div>
                    <div className="px-4 py-3">3건</div>
                  </div>
                ))}
                <div className="mt-3 flex items-center justify-center gap-2">
                  <button className="w-8 h-8 rounded-full grid place-items-center border-2 border-[#B0B0B0] rotate-90" />
                  {Array.from({ length: 10 }).map((_, i) => (
                    <button key={i} className={`w-8 h-8 rounded-full grid place-items-center ${i===0? 'bg-[#252525] text-white' : 'text-[#808080]'}`}>{i+1}</button>
                  ))}
                  <button className="w-8 h-8 rounded-full grid place-items-center border-2 border-[#B0B0B0] -rotate-90" />
                </div>
              </div>
            </section>
          </>
        )}

        {active === "assign" && (
          <section className="mt-6 bg-white rounded-[14px] p-6 border border-[#E2E2E2]">
            <div className="flex items-center justify-between">
              <h2 className="text-[18px] font-semibold text-[#252525]">배정통계</h2>
              <div className="h-[36px] w-[180px] bg-[#EDEDED] rounded-[8px] grid grid-cols-2 p-1">
                <button className={`rounded-[6px] text-[14px] ${assignMode==='team'?'bg-white font-semibold text-[#252525]':'text-[#808080]'} cursor-pointer`} onClick={()=> setAssignModeQS('team')}>팀별</button>
                <button className={`rounded-[6px] text-[14px] ${assignMode==='member'?'bg-white font-semibold text-[#252525]':'text-[#808080]'} cursor-pointer`} onClick={()=> setAssignModeQS('member')}>팀원별</button>
              </div>
            </div>
            {assignMode === 'team' ? (
              <>
                {/* 팀별 배정 현황 카드들 */}
                <div className="mt-5 grid grid-cols-4 gap-4">
                  {[
                    { label: 'A팀', count: 45, color: '#ADF6D2' },
                    { label: 'B팀', count: 38, color: '#FFDE81' },
                    { label: 'C팀', count: 39, color: '#FC9595' },
                    { label: '배정되지 않음', count: 15, color: '#7EA5F8' },
                  ].map((i) => (
                    <div key={i.label} className="h-[70px] bg-[#F8F8F8] rounded-[12px] px-4 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-4 h-4 rounded-full" style={{ background: i.color }} />
                        <span className="text-[18px] font-bold text-[#000]">{i.label}</span>
                      </div>
                      <span className="text-[14px] text-[#252525]">{i.count}건</span>
                    </div>
                  ))}
                </div>
                {/* 진행바 목록 */}
                <AssignProgressList />
              </>
            ) : (
              <AssignMemberTable />
            )}
          </section>
        )}

        {active === "payment" && (
          <section className="mt-6 bg-white rounded-[14px] p-6 border border-[#E2E2E2]">
            <div className="flex items-center justify-between">
              <h2 className="text-[18px] font-semibold text-[#252525]">결제통계</h2>
              <div className="h-[36px] w-[180px] bg-[#EDEDED] rounded-[8px] grid grid-cols-2 p-1">
                <button className={`rounded-[6px] text-[14px] ${paymentMode==='team'?'bg-white font-semibold text-[#252525]':'text-[#808080]'} cursor-pointer`} onClick={()=> setPaymentModeQS('team')}>팀별</button>
                <button className={`rounded-[6px] text-[14px] ${paymentMode==='member'?'bg-white font-semibold text-[#252525]':'text-[#808080]'} cursor-pointer`} onClick={()=> setPaymentModeQS('member')}>팀원별</button>
              </div>
            </div>
            <div className="mt-6" />
            {paymentMode === 'team' ? <PaymentBarChart /> : <PaymentMemberTable />}
          </section>
        )}

        {active === "status" && (
          <section className="mt-6 bg-white rounded-[14px] p-6 border border-[#E2E2E2]">
            <h2 className="text-[18px] font-semibold text-[#252525]">처리상태통계</h2>
            <div className="mt-2 text-[16px] text-[#252525] opacity-80">상태별 분포</div>
            <div className="mt-4">
              <StatusBarChart />
            </div>
          </section>
        )}

        {active === "ranking" && (
          <section className="mt-6 bg-white rounded-[14px] p-6 border border-[#E2E2E2]">
            <div className="flex items-center justify-between">
              <h2 className="text-[18px] font-semibold text-[#252525]">전체랭킹</h2>
              <div className="h-[36px] w-[180px] bg-[#EDEDED] rounded-[8px] grid grid-cols-2 p-1">
                <button className={`rounded-[6px] text-[14px] ${rankingMode==='team'?'bg-white font-semibold text-[#252525]':'text-[#808080]'} cursor-pointer`} onClick={()=> setRankingModeQS('team')}>팀별</button>
                <button className={`rounded-[6px] text-[14px] ${rankingMode==='member'?'bg-white font-semibold text-[#252525]':'text-[#808080]'} cursor-pointer`} onClick={()=> setRankingModeQS('member')}>팀원별</button>
              </div>
            </div>

            {rankingMode === 'team' ? <TeamRankingList /> : <TeamMemberRankingList />}
          </section>
        )}
      </div>
    </main>
  );
}

// components moved out to '@/components/stats/*'

// inlined modal removed; using '@/components/MemberStatsFilterModal'

function TeamRankingList() {
  const rows = [
    { rank: 1, team: 'A팀', amount: 15500000, delta: 1200000 },
    { rank: 2, team: 'B팀', amount: 15500000, delta: 800000 },
    { rank: 3, team: 'C팀', amount: 15500000, delta: 700000 },
    { rank: 4, team: 'D팀', amount: 15500000, delta: 40000 },
  ];
  return (
    <div className="mt-6 bg-[#F8F8F8] rounded-[12px] p-5">
      <div className="space-y-3">
        {rows.map((r) => (
          <div key={r.team} className="bg-white rounded-[12px] h-[88px] flex items-center px-5 justify-between">
            <div className="flex items-center gap-4">
              <div className="w-[60px] h-[60px] rounded-[12px] bg-[#F5F5FF] grid place-items-center text-[18px] font-bold text-[#808080]">{r.rank === 4 ? '#4' : ''}</div>
              <div>
                <div className="text-[18px] font-bold text-[#000]">{r.team}</div>
                <div className="mt-1 text-[14px] text-[#252525]">₩ {r.amount.toLocaleString()}원</div>
              </div>
            </div>
            <div className="px-3 h-[25px] rounded-full bg-[#D6FAE8] grid place-items-center text-[14px] font-bold text-[#004824]">+{r.delta.toLocaleString()}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TeamMemberRankingList() {
  const rows = [
    { name: '김영업', team: 'A팀', amount: 15500000, changePct: 18.5 },
    { name: '이마케팅', team: 'B팀', amount: 15500000, changePct: 12.8 },
    { name: '박세일즈', team: 'B팀', amount: 15500000, changePct: 12.8 },
    { name: '최고객', team: 'C팀', amount: 15500000, changePct: 12.8, rank: 4 },
    { name: '정상담', team: 'B팀', amount: 15500000, changePct: 12.8, rank: 5 },
  ];
  return (
    <div className="mt-6 bg-[#F8F8F8] rounded-[12px] p-5">
      <div className="space-y-3">
        {rows.map((r, idx) => (
          <div key={r.name} className="bg-white rounded-[12px] h-[88px] flex items-center px-5 justify-between">
            <div className="flex items-center gap-4">
              <div className="w-[60px] h-[60px] rounded-[12px] bg-[#F5F5FF] grid place-items-center text-[18px] font-bold text-[#808080]">
                {r.rank ? `#${r.rank}` : ''}
              </div>
              <div>
                <div className="text-[18px] font-bold text-[#000] flex items-center gap-2">
                  {r.name}
                  <span className="text-[14px] font-medium text-[#808080]">| {r.team}</span>
                </div>
                <div className="mt-1 text-[14px] text-[#252525]">₩ {r.amount.toLocaleString()}원</div>
              </div>
            </div>
            <div className="px-3 h-[25px] rounded-full bg-[#D6FAE8] grid place-items-center text-[14px] font-bold text-[#004824]">+{r.changePct}%</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function StatsPageWrapper() {
  return (
    <Suspense fallback={
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-[#808080]">불러오는 중...</div>
      </main>
    }>
      <StatsPage />
    </Suspense>
  );
}
