"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { RecommendedProcedure } from "@/types/debtRelief";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import ComparisonTable from "./ComparisonTable";
import ProcedureDetailView, { ProcedureSummary } from "./ProcedureDetailView";
import { fetchProcedureGuideDetails, type ProcedureGuideDetail } from "@/services/procedureGuide";

type TabKey = "all" | RecommendedProcedure;

function BackIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
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
    return (procedureParam as TabKey | null) ?? "all";
  }, [searchParams]);

  const [activeTab, setActiveTab] = useState<TabKey>(initialTab);
  const [details, setDetails] = useState<ProcedureGuideDetail[] | null>(null);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoadError(false);
    fetchProcedureGuideDetails()
      .then((data) => {
        if (!cancelled) setDetails(data);
      })
      .catch((error) => {
        console.error("Failed to load procedure guide data:", error);
        if (!cancelled) setLoadError(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const activeDetail = details?.find((item) => item.key === activeTab) ?? null;

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  const selectTab = (tab: TabKey) => {
    setActiveTab(tab);

    const nextSearchParams = new URLSearchParams(searchParams.toString());
    if (tab === "all") {
      nextSearchParams.delete("procedure");
    } else {
      nextSearchParams.set("procedure", tab);
    }

    const queryString = nextSearchParams.toString();
    router.replace(
      queryString
        ? `/debt-relief/procedure-guide?${queryString}`
        : "/debt-relief/procedure-guide",
      { scroll: false },
    );
  };

  if (loadError) {
    return (
      <div className="mx-auto max-w-[1324px] w-full px-4 md:px-6 lg:px-0 py-6 md:py-9">
        <div className="flex h-[240px] items-center justify-center rounded-[14px] border border-dashed border-danger-20 bg-danger-10 px-6 text-[14px] text-danger-40">
          제도 안내 정보를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.
        </div>
      </div>
    );
  }

  if (!details) {
    return (
      <div className="min-h-[400px] grid place-items-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-[1324px] flex-col gap-5 px-0 pb-8 pt-0 md:gap-9 md:px-6 md:pb-12 md:pt-9 lg:px-0">
      <section
        className={`surface overflow-hidden md:rounded-[14px] md:shadow-[0_13px_61px_rgba(169,169,169,0.12)] dark:shadow-none ${
          activeTab === "all" ? "md:min-h-[835px]" : ""
        }`}
      >
        <header className="flex min-h-[76px] items-center gap-3 border-b border-neutral-30 px-4 py-4 md:gap-4 md:px-7">
          <button
            type="button"
            onClick={() => router.push("/debt-relief")}
            className="-ml-1 grid h-8 w-8 shrink-0 cursor-pointer place-items-center rounded-[8px] text-foreground transition-colors hover:bg-neutral-10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-40"
            aria-label="채무조정으로 돌아가기"
          >
            <BackIcon />
          </button>
          <div className="flex min-w-0 flex-col gap-1 md:flex-row md:items-center md:gap-3">
            <h1 className="shrink-0 text-[20px] font-bold leading-6 tracking-[-0.02em] text-foreground md:text-[24px] md:leading-[29px]">
              채무조정 제도 안내
            </h1>
            <span className="hidden h-4 w-px bg-neutral-40 md:block" aria-hidden />
            <p className="truncate text-[13px] font-medium leading-4 tracking-[-0.02em] text-neutral-60 md:text-[18px] md:leading-[22px]">
              6가지 채무조정 제도의 절차·조건·효과를 확인하세요.
            </p>
          </div>
        </header>

        <div
          role="tablist"
          aria-label="채무조정 제도"
          className="scrollbar-hide flex h-12 items-stretch overflow-x-auto px-1 shadow-[0_8px_12px_rgba(9,30,66,0.08)] md:px-0"
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "all"}
            onClick={() => selectTab("all")}
            className={`relative shrink-0 cursor-pointer whitespace-nowrap px-4 text-[14px] leading-[17px] transition-colors md:px-5 ${
              activeTab === "all"
                ? "font-bold text-foreground after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:bg-primary-40"
                : "font-medium text-neutral-60 hover:text-foreground"
            }`}
          >
            전체 비교
          </button>
          {details.map((item) => (
            <button
              key={item.key}
              type="button"
              role="tab"
              aria-selected={activeTab === item.key}
              onClick={() => selectTab(item.key)}
              className={`relative shrink-0 cursor-pointer whitespace-nowrap px-4 text-[14px] leading-[17px] transition-colors md:px-5 ${
                activeTab === item.key
                  ? "font-bold text-foreground after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:bg-primary-40"
                  : "font-medium text-neutral-60 hover:text-foreground"
              }`}
            >
              {item.tabLabel}
            </button>
          ))}
        </div>

        {activeTab === "all" || !activeDetail ? (
          <div className="px-4 py-5 md:px-7 md:py-7">
            <ComparisonTable details={details} onSelectProcedure={selectTab} />
          </div>
        ) : (
          <ProcedureSummary detail={activeDetail} />
        )}
      </section>

      {activeDetail && activeTab !== "all" && <ProcedureDetailView detail={activeDetail} />}
    </main>
  );
}
