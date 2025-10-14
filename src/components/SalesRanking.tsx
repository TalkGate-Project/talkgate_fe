import Panel from "./Panel";

const items = [
  { rank: 1, team: "A팀", amount: "7560만원", diff: "+120만원" },
  { rank: 2, team: "AB팀", amount: "4560만원", diff: "+90만원" },
  { rank: 3, team: "ABC팀", amount: "3560만원", diff: "+80만원" },
  { rank: 4, team: "CDF팀", amount: "560만원", diff: "+20만원" },
  { rank: 5, team: "D팀", amount: "360만원", diff: "+10만원" },
];

export default function SalesRanking() {
  return (
    <Panel
      title={<span className="typo-title-2">이달 판매 랭킹</span>}
      action={
        <button className="h-[34px] px-3 rounded-[5px] border border-[#E2E2E2] text-[14px] font-semibold tracking-[-0.02em] text-[#000] bg-white">
          더보기
        </button>
      }
      className="rounded-[14px]"
      style={{ height: 420, boxShadow: "6px 6px 54px rgba(0,0,0,0.05)" }}
    >
      {/* Segmented control – 컨테이너 전체 폭을 채우고 2등분 */}
      <div className="w-full bg-[#EDEDED] rounded-[12px] p-1 grid grid-cols-2">
        <button className="h-[31px] rounded-[5px] bg-white text-[#252525] typo-title-4">팀별</button>
        <button className="h-[31px] rounded-[5px] text-[#808080] typo-title-4">팀원별</button>
      </div>

      <ol className="mt-6">
        {items.map((item) => (
          <li key={item.rank} className="flex items-center justify-between py-3 border-b border-[#E2E2E2] last:border-b-0">
            <div className="flex items-center gap-3">
              <span
                className={`grid place-items-center w-6 h-6 rounded-full text-[14px] ${
                  item.rank <= 3 ? "bg-[#252525] text-white" : "bg-[#EDEDED] text-[#808080]"
                }`}
              >
                {item.rank}
              </span>
              <span className="typo-title-4 text-[#252525]">{item.team}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="typo-body-3 text-[#252525]">{item.amount}</span>
              <span className="px-2 py-1 bg-[#EDEDED] rounded-[5px] typo-caption-2 text-[#595959] leading-none">{item.diff}</span>
            </div>
          </li>
        ))}
      </ol>
    </Panel>
  );
}


