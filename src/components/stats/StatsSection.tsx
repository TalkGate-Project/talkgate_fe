"use client";
import Panel from "@/components/common/Panel";
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
  DotProps,
} from "recharts";

const data = [
  { d: "09.11", v: 0 },
  { d: "09.12", v: 5 },
  { d: "09.13", v: 12 },
  { d: "09.14", v: 6 },
  { d: "09.15", v: 14 },
  { d: "09.16", v: 23 },
  { d: "09.17", v: 13 },
];

export default function StatsSection() {
  return (
    <Panel
      title={<span className="typo-title-2">통계</span>}
      action={<button className="h-[34px] px-3 rounded-[5px] border border-[var(--border)] bg-[var(--neutral-0)] text-[14px] font-semibold tracking-[-0.02em] text-foreground transition-colors hover:bg-[var(--neutral-10)]">더보기</button>}
      className="rounded-[14px]"
      style={{ height: 420 }}
      bodyClassName="px-6 pb-6 pt-4"
    >
      <div className="h-[320px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ left: 12, right: 12, top: 12, bottom: 12 }}>
            <defs>
              <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--primary-60)" stopOpacity={0.35} />
                <stop offset="100%" stopColor="var(--primary-60)" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="var(--neutral-20)" vertical={false} />
            <XAxis dataKey="d" tickMargin={8} stroke="var(--neutral-50)" tick={{ fill: "var(--neutral-60)" }} />
            <YAxis hide />
            <Tooltip
              cursor={{ stroke: "var(--primary-60)" }}
              contentStyle={{
                borderRadius: 8,
                backgroundColor: "var(--neutral-0)",
                border: `1px solid var(--border)`,
                color: "var(--foreground)",
              }}
            />
            <Area type="monotone" dataKey="v" stroke="var(--primary-60)" strokeWidth={3} fill="url(#g)" dot={{ r: 4, fill: "var(--primary-60)" }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Panel>
  );
}


