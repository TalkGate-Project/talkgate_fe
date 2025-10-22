"use client";

export default function AssignProgressList() {
  const rows = [
    { label: 'A팀', value: 45, max: 45, color: '#ADF6D2' },
    { label: 'B팀', value: 38, max: 45, color: '#FFDE81' },
    { label: 'C팀', value: 39, max: 45, color: '#FC9595' },
    { label: '배정되지 않음', value: 15, max: 45, color: '#7EA5F8' },
  ];
  return (
    <div className="mt-6 space-y-4">
      {rows.map((r) => {
        const pct = Math.max(0, Math.min(100, (r.value / r.max) * 100));
        return (
          <div key={r.label} className="bg-[#F8F8F8] rounded-[12px] px-4 py-3">
            <div className="flex items-center justify-between text-[14px]">
              <span className="text-[#000]">{r.label}</span>
              <span className="text-[#252525]">{r.value}건</span>
            </div>
            <div className="mt-2 h-3 rounded-full bg-[#E2E2E2]">
              <div className="h-3 rounded-full" style={{ width: `${pct}%`, background: r.color }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}


