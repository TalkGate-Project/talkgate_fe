import Panel from "@/components/common/Panel";

type Notice = { id: number; title: string; author: string; time: string; badge?: string };

const notices: Notice[] = [
  { id: 1, title: "시스템 점검 안내", author: "관리자", time: "10분전", badge: "중요" },
  { id: 2, title: "신규 기능 업데이트 안내", author: "김영수", time: "10분전" },
  { id: 3, title: "9월 정기 팀 미팅 안내", author: "관리자", time: "10분전" },
  { id: 4, title: "[개인장비] 모니터 구매 요청", author: "관리자", time: "10분전" },
  { id: 5, title: "여름 휴가 신청 안내", author: "김아로마", time: "2025.09.19" },
];

export default function NoticeSection() {
  return (
    <Panel
      title={<span className="typo-title-2">공지사항</span>}
      action={
        <button className="h-[34px] px-3 rounded-[5px] border border-[#E2E2E2] text-[14px] font-semibold tracking-[-0.02em]">더보기</button>
      }
      className="rounded-[14px]"
    >
      <div className="divide-y divide-[#E2E2E2]/60">
        {notices.map((n) => (
          <div key={n.id} className="flex items-center justify-between py-4">
            <div className="flex items-center gap-3">
              {n.badge && (
                <span className="px-2 py-1 rounded-[5px] text-[12px] leading-[14px] bg-[#FFEBEB] text-[#D83232]">{n.badge}</span>
              )}
              <span className="typo-body-2 text-[#252525] opacity-80">{n.title}</span>
            </div>
            <div className="flex items-center gap-12">
              <span className="typo-body-2 text-[#252525] opacity-80">{n.author}</span>
              <span className="typo-body-2 text-[#252525] opacity-80">{n.time}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination mock */}
      <div className="mt-6 flex items-center justify-center gap-2">
        <button aria-label="prev" className="w-8 h-8 grid place-items-center text-[#B0B0B0]">
          <span className="block w-4 h-4 border-2 border-current rotate-90" style={{ borderLeft: "transparent", borderBottom: "transparent" }} />
        </button>
        {Array.from({ length: 10 }).map((_, i) => (
          <button
            key={i}
            className={`w-8 h-8 rounded-full grid place-items-center text-[14px] ${i === 0 ? "bg-[#252525] text-white" : "text-[#808080]"}`}
          >
            {i + 1}
          </button>
        ))}
        <button aria-label="next" className="w-8 h-8 grid place-items-center text-[#B0B0B0]">
          <span className="block w-4 h-4 border-2 border-current -rotate-90" style={{ borderLeft: "transparent", borderBottom: "transparent" }} />
        </button>
      </div>
    </Panel>
  );
}


