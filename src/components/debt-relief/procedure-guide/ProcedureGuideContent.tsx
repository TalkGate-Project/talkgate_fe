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
        <header className="flex h-[55px] items-center gap-2 border-b-0 border-neutral-30 px-[clamp(16px,6.4vw,24px)] py-0 md:h-auto md:min-h-[76px] md:gap-4 md:border-b md:px-7 md:py-4">
          <button
            type="button"
            onClick={() => router.push("/debt-relief")}
            className="grid h-6 w-6 shrink-0 cursor-pointer place-items-center rounded-[6px] text-foreground transition-colors hover:bg-neutral-10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-80 md:-ml-1 md:h-8 md:w-8 md:rounded-[8px]"
            aria-label="채무조정으로 돌아가기"
          >
            <BackIcon />
          </button>
          <div className="flex min-w-0 flex-col gap-1 md:flex-row md:items-center md:gap-3">
            <h1 className="shrink-0 text-[18px] font-semibold leading-[21px] text-foreground md:text-[24px] md:font-bold md:leading-[29px] md:tracking-[-0.02em]">
              채무조정 제도 안내
            </h1>
            <span className="hidden h-4 w-px bg-neutral-40 md:block" aria-hidden />
            <p className="hidden truncate text-[18px] font-medium leading-[22px] tracking-[-0.02em] text-neutral-60 md:block">
              6가지 채무조정 제도의 절차·조건·효과를 확인하세요.
            </p>
          </div>
        </header>

        <div
          role="tablist"
          aria-label="채무조정 제도"
          className="scrollbar-hide flex h-[34px] items-stretch gap-6 overflow-x-auto border-b border-neutral-30 px-[clamp(16px,6.4vw,24px)] shadow-none md:h-12 md:gap-0 md:border-b-0 md:px-0 md:shadow-[0_8px_12px_rgba(9,30,66,0.08)]"
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "all"}
            onClick={() => selectTab("all")}
            className={`relative shrink-0 cursor-pointer whitespace-nowrap px-0 text-[16px] leading-[19px] tracking-[0.2px] transition-colors md:px-5 md:text-[14px] md:leading-[17px] md:tracking-normal ${
              activeTab === "all"
                ? "font-semibold text-foreground after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:bg-primary-80 md:font-bold"
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
              className={`relative shrink-0 cursor-pointer whitespace-nowrap px-0 text-[16px] leading-[19px] tracking-[0.2px] transition-colors md:px-5 md:text-[14px] md:leading-[17px] md:tracking-normal ${
                activeTab === item.key
                  ? "font-semibold text-foreground after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:bg-primary-80 md:font-bold"
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
