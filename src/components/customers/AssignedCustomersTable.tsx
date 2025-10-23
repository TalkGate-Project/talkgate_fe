import Panel from "@/components/common/Panel";

type Row = {
  name: string;
  phone: string;
  sns: string;
  time: string;
};

const rows: Row[] = [
  { name: "홍길동", phone: "010-1234-5678", sns: "네이버", time: "10분전" },
  { name: "이철수", phone: "010-1234-5678", sns: "구글", time: "10분전" },
  { name: "김영희", phone: "010-1234-5678", sns: "페이스북", time: "10분전" },
  { name: "오영수", phone: "010-1234-5678", sns: "인스타그램", time: "2025.09.19" },
];

export default function AssignedCustomersTable() {
  return (
    <Panel
      title={<span className="typo-title-2">새로 할당된 고객 (4)</span>}
      action={
        <button className="h-[34px] px-3 rounded-[5px] border border-[#E2E2E2] text-[14px] font-semibold tracking-[-0.02em] text-[#000] bg-white">
          더보기
        </button>
      }
      className="rounded-[14px]"
      style={{ height: 420, boxShadow: "6px 6px 54px rgba(0,0,0,0.05)" }}
      bodyClassName="px-6 pb-0 pt-4 flex flex-col"
    >
      <div className="overflow-hidden rounded-[12px] grow" style={{ width: "100%" }}>
        <table className="w-full text-left border-separate border-spacing-0">
          <thead>
            <tr className="bg-[#EDEDED] text-[#808080]">
              {[
                "이름",
                "전화번호",
                "SNS",
                "시간",
                "정보",
              ].map((h, i) => (
                <th
                  key={h}
                  className={`typo-title-2 font-bold px-6 h-[48px] ${
                    i === 0 ? "rounded-l-[12px]" : i === 4 ? "rounded-r-[12px]" : ""
                  }`}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="typo-body-3">
            {rows.map((r) => (
              <tr key={r.name} className="border-b-[0.5px] border-[#E2E2E2]">
                <td className="px-6 h-[58px] align-middle text-[#252525] opacity-80">{r.name}</td>
                <td className="px-6 h-[58px] align-middle text-[#252525] opacity-80">{r.phone}</td>
                <td className="px-6 h-[58px] align-middle text-[#252525] opacity-80">{r.sns}</td>
                <td className="px-6 h-[58px] align-middle text-[#252525] opacity-80">{r.time}</td>
                <td className="px-6 h-[58px] align-middle">
                  <button className="h-[34px] px-3 rounded-[5px] bg-[#252525] text-[#D0D0D0] text-[14px] font-semibold tracking-[-0.02em]">
                    고객정보
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* pagination */}
      <div className="h-[64px] flex items-center justify-center gap-2">
        <button aria-label="prev" className="w-8 h-8 grid place-items-center text-[#B0B0B0]">
          <span className="block w-4 h-4 border-2 border-current rotate-90" style={{ borderLeft: "transparent", borderBottom: "transparent" }} />
        </button>
        {Array.from({ length: 10 }).map((_, i) => (
          <button
            key={i}
            className={`w-8 h-8 rounded-full grid place-items-center text-[14px] ${
              i === 0 ? "bg-[#252525] text-white" : "text-[#808080]"
            }`}
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


