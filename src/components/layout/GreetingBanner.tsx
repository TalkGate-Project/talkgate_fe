"use client";

import { useMemo, useState } from "react";

type GreetingBannerProps = {
  userName?: string | null;
  todayQuote?: string | null;
  loading?: boolean;
};

export default function GreetingBanner({ userName, todayQuote, loading }: GreetingBannerProps) {
  const gradient = "linear-gradient(90deg, var(--neutral-0) 65%, color-mix(in srgb, var(--primary-20) 35%, transparent))";
  const displayName = userName ? `${userName}님` : "팀원님";
  const [now] = useState(() => new Date());
  const formattedNow = useMemo(() => {
    return new Intl.DateTimeFormat("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "numeric",
      minute: "2-digit",
      second: "2-digit",
    })
      .format(now)
      .replace(".", ".");
  }, [now]);

  return (
    <section
      className="surface rounded-[32px] p-6 md:p-8 shadow-[6px_6px_54px_rgba(0,0,0,0.05)]"
      style={{
        background: gradient,
      }}
    >
      <div className="flex items-start justify-between gap-6">
        {/* Left: badge + title + quote */}
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-full bg-neutral-90 text-neutral-0 grid place-items-center">
              <span className="text-[14px] font-semibold">X</span>
            </div>
            <div className="text-[16px] font-medium leading-[19px] tracking-[-0.02em] text-neutral-90">
              거래소 텔레마케팅 관리
            </div>
          </div>
          <h1 className="mt-4 text-[32px] leading-[38px] font-bold tracking-[-0.114286px] text-foreground">
            {loading ? (
              <span className="inline-flex h-8 w-60 animate-pulse rounded bg-neutral-20" />
            ) : (
              <>안녕하세요, {displayName} 👋</>
            )}
          </h1>
          <p className="mt-3 text-[18px] leading-[21px] font-medium tracking-[-0.04em] text-figma-muted">
            {loading ? (
              <span className="inline-flex h-6 w-80 animate-pulse rounded bg-neutral-20" />
            ) : todayQuote ? (
              <>“{todayQuote}”</>
            ) : (
              "투자에서 가장 중요한 것은 시간이다."
            )}
          </p>
        </div>

        {/* Right: actions + timestamp */}
        <div className="flex flex-col items-end gap-3 self-center">
          <div className="flex items-center gap-3">
            <button className="h-[34px] px-3 rounded-[5px] border border-neutral-50 bg-neutral-0 text-[14px] font-semibold tracking-[-0.02em] text-danger-40">
              ● 퇴근상태
            </button>
            <button className="h-[34px] px-3 rounded-[5px] text-[14px] font-semibold tracking-[-0.02em] bg-neutral-90 text-neutral-40">
              퇴근하기
            </button>
          </div>
          <div className="text-[18px] leading-[21px] font-medium tracking-[-0.04em] text-figma-muted">
            {loading ? (
              <span className="inline-flex h-5 w-44 animate-pulse rounded bg-neutral-20" />
            ) : (
              formattedNow
            )}
          </div>
        </div>
      </div>
    </section>
  );
}


