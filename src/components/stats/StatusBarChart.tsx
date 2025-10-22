"use client";

import { ResponsiveContainer, BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, LabelList, Cell } from "recharts";

export default function StatusBarChart() {
  const data = [
    { label: '부재', value: 25, color: '#D9534F' },
    { label: '재상담', value: 12, color: '#F0AD4E' },
    { label: 'AS요청', value: 26, color: '#C0C0C0' },
    { label: '무료방안내', value: 3, color: '#93C5FD' },
    { label: '결제완료', value: 5, color: '#34D399' },
    { label: '실패', value: 25, color: '#F78DA7' },
    { label: '관리중', value: 12, color: '#FDE68A' },
    { label: 'AS확정', value: 20, color: '#C0C0C0' },
    { label: '무료방입장', value: 25, color: '#93C5FD' },
    { label: '결제유력', value: 6, color: '#86EFAC' },
  ];
  return (
    <div className="w-full h-[320px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 16, left: 0, bottom: 24 }}>
          <CartesianGrid stroke="#EDEDED" vertical={false} />
          <XAxis dataKey="label" tick={{ fill: '#808080' }} axisLine={false} tickLine={false} interval={0} angle={0} height={40} />
          <YAxis tick={{ fill: '#808080' }} axisLine={false} tickLine={false} width={32} />
          <Tooltip cursor={{ fill: 'rgba(0,0,0,0.04)' }} content={({ active, payload }) => {
            if (!active || !payload?.length) return null;
            const p: any = payload[0].payload;
            return <div className="px-3 py-1 bg-black text-white rounded-[6px] text-[12px]">{p.label}: {p.value}</div>;
          }} />
          <Bar dataKey="value" radius={[6,6,0,0]}>
            {data.map((e, i) => (
              <Cell key={`c-${i}`} fill={e.color} />
            ))}
            <LabelList dataKey="value" position="top" style={{ fill: '#808080', fontSize: 12 }} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}


