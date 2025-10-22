"use client";

import { ResponsiveContainer, BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, LabelList } from "recharts";

export default function PaymentBarChart() {
  const data = [
    { team: 'A팀', amount: 1560, count: 14 },
    { team: 'B팀', amount: 1430, count: 13 },
    { team: 'C팀', amount: 1280, count: 10 },
  ];
  return (
    <div className="w-full h-[320px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 16, left: 0, bottom: 24 }}>
          <defs>
            <linearGradient id="payGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#51F8A5" stopOpacity={0.75} />
              <stop offset="100%" stopColor="#5EEAD4" stopOpacity={0.35} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#EDEDED" vertical={false} />
          <XAxis dataKey="team" tick={{ fill: '#808080' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: '#808080' }} axisLine={false} tickLine={false} width={48} />
          <Tooltip cursor={{ fill: 'rgba(81,248,165,0.1)' }} content={({ active, payload }) => {
            if (!active || !payload?.length) return null;
            const a = payload[0].payload as any;
            return (
              <div className="px-3 py-1 bg-black text-white rounded-[6px] text-[12px]">{a.amount.toLocaleString()}만원</div>
            );
          }} />
          <Bar dataKey="amount" fill="url(#payGradient)" radius={[8, 8, 0, 0]} barSize={56}>
            <LabelList dataKey="amount" position="top" formatter={(label: any)=> (typeof label === 'number' ? `${label.toLocaleString()}만원` : label)} style={{ fill: '#808080', fontSize: 12 }} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <div className="mt-2 flex items-center justify-around text-[12px] text-[#808080]">
        {data.map((d) => (
          <div key={d.team} className="text-center">
            <div className="text-[#252525]">{d.team}</div>
            <div>{d.count}건</div>
          </div>
        ))}
      </div>
    </div>
  );
}


