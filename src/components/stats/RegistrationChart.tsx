import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Area } from "recharts";

const NUMBER_FORMATTER = new Intl.NumberFormat("ko-KR");

type RegistrationChartProps = {
  data: { x: string; y: number }[];
  isLoading: boolean;
  isError: boolean;
  hasProject: boolean;
};

export default function RegistrationChart({ data, isLoading, isError, hasProject }: RegistrationChartProps) {
  if (!hasProject) {
    return (
      <div className="flex h-full items-center justify-center rounded-[12px] border border-dashed border-neutral-30 bg-neutral-10 text-[14px] text-neutral-60">
        프로젝트를 먼저 선택해주세요.
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-neutral-20 border-t-primary-60" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex h-full items-center justify-center rounded-[12px] border border-dashed border-danger-20 bg-danger-10 text-[14px] text-danger-40">
        신청 통계를 불러오는 중 문제가 발생했습니다.
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="flex h-full items-center justify-center rounded-[12px] border border-dashed border-neutral-30 bg-neutral-10 text-[14px] text-neutral-60">
        표시할 데이터가 없습니다.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 10, right: 16, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id="applyGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--primary-40)" stopOpacity={0.3} />
            <stop offset="100%" stopColor="var(--primary-40)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="var(--neutral-20)" vertical={false} />
        <XAxis dataKey="x" tick={{ fill: "var(--neutral-60)" }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: "var(--neutral-60)" }} axisLine={false} tickLine={false} width={40} />
        <Tooltip
          cursor={{ stroke: "var(--primary-40)", strokeWidth: 1, opacity: 0.25 }}
          content={({ active, payload }) => {
            if (!active || !payload?.length) return null;
            const v = payload[0].value as number;
            return (
              <div className="rounded-[6px] bg-neutral-90 px-3 py-1 text-[12px] text-neutral-0">
                {NUMBER_FORMATTER.format(v)}건
              </div>
            );
          }}
        />
        <Area type="monotone" dataKey="y" stroke="none" fill="url(#applyGradient)" />
        <Line type="monotone" dataKey="y" stroke="var(--primary-40)" strokeWidth={2} dot={{ r: 5, fill: "var(--primary-60)", stroke: "var(--primary-40)", strokeWidth: 2 }} activeDot={{ r: 6 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}

