"use client";
import Panel from "./Panel";
import { useMemo, useState } from "react";

const days = ["일", "월", "화", "수", "목", "금", "토"];

export default function CalendarSection() {
  const [current, setCurrent] = useState(new Date(2025, 8, 1)); // 2025.09 기준
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date(2025, 8, 9));
  const ym = `${current.getFullYear()}.${String(current.getMonth() + 1).padStart(2, "0")}`;

  const goPrev = () => {
    const y = current.getFullYear();
    const m = current.getMonth();
    setCurrent(new Date(y, m - 1, 1));
  };
  const goNext = () => {
    const y = current.getFullYear();
    const m = current.getMonth();
    setCurrent(new Date(y, m + 1, 1));
  };

  type Cell = { date: Date; inCurrent: boolean };
  const cells: Cell[] = useMemo(() => {
    const y = current.getFullYear();
    const m = current.getMonth();
    const first = new Date(y, m, 1);
    const startDow = first.getDay(); // 0=Sun
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    const daysInPrev = new Date(y, m, 0).getDate();
    const totalCells = startDow + daysInMonth <= 35 ? 35 : 42; // 5주 또는 6주
    const result: Cell[] = [];
    for (let i = 0; i < totalCells; i++) {
      if (i < startDow) {
        const d = daysInPrev - startDow + 1 + i;
        result.push({ date: new Date(y, m - 1, d), inCurrent: false });
      } else if (i < startDow + daysInMonth) {
        const d = i - startDow + 1;
        result.push({ date: new Date(y, m, d), inCurrent: true });
      } else {
        const d = i - (startDow + daysInMonth) + 1;
        result.push({ date: new Date(y, m + 1, d), inCurrent: false });
      }
    }
    return result;
  }, [current]);
  return (
    <Panel
      title={<span className="typo-title-2">달력 & 일정</span>}
      action={
        <div className="flex items-center gap-2">
          <button onClick={goPrev} className="w-[34px] h-[34px] rounded-[5px] border border-[#E2E2E2] grid place-items-center">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#B0B0B0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <div className="px-3 h-[34px] grid place-items-center text-[#252525] font-[var(--font-montserrat)] font-bold text-[18px] leading-[22px] tracking-[1px]">
            {ym}
          </div>
          <button onClick={goNext} className="w-[34px] h-[34px] rounded-[5px] border border-[#E2E2E2] grid place-items-center">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#B0B0B0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        </div>
      }
      className="rounded-[14px]"
      style={{ boxShadow: "6px 6px 54px rgba(0,0,0,0.05)" }}
      bodyClassName="px-6 pb-6 pt-4"
    >
      <div className="w-[1324px] h-full gap-6 grid lg:flex lg:items-start">
        {/* Calendar grid */}
        <div className="order-2 lg:order-1 lg:w-[896px]">
          {/* Week header bar */}
          <div className="mb-2 bg-[#EDEDED] rounded-[12px]">
            <div className="grid" style={{ gridTemplateColumns: "repeat(7, 128px)" }}>
              {days.map((d) => (
                <div key={d} className="h-12 grid place-items-center text-[#808080] typo-title-4">
                  {d}
                </div>
              ))}
            </div>
          </div>
          {/* Days */}
          <div className="grid gap-0" style={{ gridTemplateColumns: "repeat(7, 128px)" }}>
            {cells.map((cell, i) => {
              const isPrevMonth = !cell.inCurrent;
              const isSelected =
                selectedDate &&
                cell.date.getFullYear() === selectedDate.getFullYear() &&
                cell.date.getMonth() === selectedDate.getMonth() &&
                cell.date.getDate() === selectedDate.getDate();
              return (
                <div
                  key={i}
                  onClick={() => {
                    setSelectedDate(cell.date);
                    if (!cell.inCurrent) {
                      // 클릭 시 해당 월로 이동
                      setCurrent(new Date(cell.date.getFullYear(), cell.date.getMonth(), 1));
                    }
                  }}
                  className={`relative min-h-[93px] border-[0.5px] ${
                    isSelected ? "border-2 border-[#51F8A5]" : "border-[#EDEDED]"
                  } ${
                    isPrevMonth ? "bg-[#F8F8F8]" : "bg-white"
                  } flex flex-col`}
                >
                  <div className="font-[var(--font-montserrat)] text-[16px] leading-[20px] text-[#808080] ml-2 mt-2">
                    {cell.date.getDate()}
                  </div>
                  <div className="space-y-1 mt-auto mb-2 ml-2 mr-2">
                    {cell.inCurrent && cell.date.getDate() === 9 && (
                      <>
                        <div className="flex items-center gap-1 text-[12px] text-[#595959]">
                          <span className="w-3 h-3 rounded-full bg-[#00E272]" /> 박지율 전화상담
                        </div>
                        <div className="flex items-center gap-1 text-[12px] text-[#595959]">
                          <span className="w-3 h-3 rounded-full bg-[#00B55B]" /> 김지우 전화상담
                        </div>
                        <div className="flex items-center gap-1 text-[10px] text-[#808080]">그 외 2건</div>
                      </>
                    )}
                    {!cell.inCurrent && i === 2 && (
                      <>
                        <div className="flex items-center gap-1 text-[12px] text-[#595959]">
                          <span className="w-3 h-3 rounded-full bg-[#EFB008]" /> 월 콜 리스트 검토
                        </div>
                        <div className="flex items-center gap-1 text-[12px] text-[#595959]">
                          <span className="w-3 h-3 rounded-full bg-[#D83232]" /> 신규 고객 상담
                        </div>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right schedule list */}
        <aside className="order-1 lg:order-2 lg:shrink-0">
          <div className="bg-[#F8F8F8] rounded-[12px] p-4 h-full relative flex flex-col">
            <div className="flex items-center justify-between mb-4 gap-2">
              <div className="typo-title-2">09.09 목요일 (8)</div>
              <button className="h-[34px] px-3 rounded-[5px] bg-[#252525] text-[#D0D0D0] text-[14px] font-semibold tracking-[-0.02em]">고객정보</button>
            </div>
            <div className="space-y-3 pr-3 overflow-y-auto" style={{ maxHeight: 405 }}>
              {[
                { c: "#00E272", t: "All day", d: "박지율 전화상담" },
                { c: "#00B55B", t: "13:00", d: "김지우 전화상담" },
                { c: "#7EA5F8", t: "14:00", d: "오주영 전화상담" },
                { c: "#2563EB", t: "16:00", d: "박지율 전화 예약 상담 요청 안내", tall: true },
                { c: "#EFB008", t: "17:00", d: "박지율 전화상담" },
                { c: "#976400", t: "18:00", d: "박지율 전화상담" },
                { c: "#D83232", t: "19:00", d: "박지율 전화상담" },
                { c: "#FC9595", t: "20:00", d: "박지율 전화상담" },
              ].map((it, idx) => (
                <div key={idx} className="flex items-center gap-4 bg-white rounded-[12px] p-4" style={{ maxWidth: 304 }}>
                  <span className="w-4 h-4 rounded-full shrink-0" style={{ background: it.c }} />
                  <span className="typo-body-2 text-[#595959] w-[61px] text-center self-center shrink-0">{it.t}</span>
                  <span className={`typo-body-2 text-[#595959] flex-1 break-words whitespace-normal ${it.tall ? "" : ""}`}>{it.d}</span>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </Panel>
  );
}


