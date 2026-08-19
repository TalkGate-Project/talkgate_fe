"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { RecommendedProcedure } from "@/types/debtRelief";
import ComparisonTable from "./ComparisonTable";
import ProcedureDetailView from "./ProcedureDetailView";
import { PROCEDURE_GUIDE_DETAILS } from "./procedureGuideData";

type TabKey = "all" | RecommendedProcedure;

function BackIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M15 19L8 12L15 5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function ProcedureGuideContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialTab = useMemo<TabKey>(() => {
    const procedureParam = searchParams.get("procedure");
    const matched = PROCEDURE_GUIDE_DETAILS.find((item) => item.key === procedureParam);
    return matched ? matched.key : "all";
  }, [searchParams]);

  const [activeTab, setActiveTab] = useState<TabKey>(initialTab);

  const activeDetail = PROCEDURE_GUIDE_DETAILS.find((item) => item.key === activeTab) ?? null;

  return (
    <div className="mx-auto max-w-[1324px] w-full px-4 md:px-6 lg:px-0 py-6 md:py-9 flex flex-col gap-4 md:gap-5">
      {/* 헤더: 뒤로 + 제목 + 부제 */}
      <div className="flex flex-col gap-3">
        <button
          type="button"
          onClick={() => router.push("/debt-relief")}
          className="cursor-pointer inline-flex w-fit items-center gap-1.5 h-8 px-3 rounded-[8px] border border-neutral-30 text-[13px] font-medium leading-4 text-neutral-70 hover:bg-neutral-10 transition-colors"
        >
          <BackIcon />
          뒤로
        </button>
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <h1 className="text-[20px] md:text-[24px] font-bold leading-7 text-foreground">
            채무조정 제도 안내
          </h1>
          <p className="text-[14px] font-medium leading-[17px] text-neutral-60">
            6가지 채무조정 제도의 절차·조건·효과를 확인하세요.
          </p>
        </div>
      </div>

      {/* 탭 */}
      <div className="flex items-center gap-5 md:gap-6 overflow-x-auto border-b border-neutral-30">
        <button
          type="button"
          onClick={() => setActiveTab("all")}
          className={`cursor-pointer shrink-0 whitespace-nowrap pb-3 text-[14px] leading-[17px] border-b-2 -mb-px transition-colors ${
            activeTab === "all"
              ? "font-bold text-foreground border-foreground"
              : "font-medium text-neutral-50 border-transparent hover:text-neutral-70"
          }`}
        >
          전체 비교
        </button>
        {PROCEDURE_GUIDE_DETAILS.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => setActiveTab(item.key)}
            className={`cursor-pointer shrink-0 whitespace-nowrap pb-3 text-[14px] leading-[17px] border-b-2 -mb-px transition-colors ${
              activeTab === item.key
                ? "font-bold text-foreground border-foreground"
                : "font-medium text-neutral-50 border-transparent hover:text-neutral-70"
            }`}
          >
            {item.tabLabel}
          </button>
        ))}
      </div>

      {/* 본문 */}
      <section className="surface rounded-[14px] px-4 md:px-7 py-5 md:py-7 shadow-[0_13px_61px_rgba(169,169,169,0.12)] dark:shadow-none">
        {activeTab === "all" || !activeDetail ? (
          <ComparisonTable onSelectProcedure={(key) => setActiveTab(key)} />
        ) : (
          <ProcedureDetailView detail={activeDetail} />
        )}
      </section>
    </div>
  );
}
