"use client";

import { Suspense, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import KpiCard from "@/components/dashboard/KpiCard";
import GreetingBanner from "@/components/layout/GreetingBanner";
import AssignedCustomersTable from "@/components/customers/AssignedCustomersTable";
import SalesRanking from "@/components/dashboard/SalesRanking";
import CalendarSection from "@/components/dashboard/CalendarSection";
import NoticeSection from "@/components/notice/NoticeSection";
import StatsSection from "@/components/stats/StatsSection";
import { useSelectedProjectId } from "@/hooks/useSelectedProjectId";
import { StatisticsService } from "@/services/statistics";
import type { SummaryResponse } from "@/types/statistics";
import { useMe } from "@/hooks/useMe";

function DashboardContent() {
  const [projectId, projectReady] = useSelectedProjectId();
  const waitingForProject = !projectReady;
  const hasProject = projectReady && Boolean(projectId);
  const missingProject = projectReady && !projectId;
  const { user } = useMe();

  const {
    data: summaryData,
    isLoading: summaryLoading,
    isError: summaryError,
    isFetching: summaryFetching,
  } = useQuery<SummaryResponse>({
    queryKey: ["dashboard", "summary", projectId],
    enabled: hasProject,
    queryFn: async () => {
      if (!projectId) throw new Error("프로젝트를 선택해주세요.");
      const res = await StatisticsService.summary({ projectId });
      return res.data;
    },
    staleTime: 5 * 60 * 1000,
    placeholderData: (previous) => previous,
  });

  const summary = summaryData?.data;
  const cards = useMemo(() => {
    if (!summary) {
      return [
        { label: "최근 배정 고객", value: "-" },
        { label: "전체 배정 고객", value: "-" },
        { label: "결제율", value: "-" },
        { label: "결제 누적", value: "-" },
      ];
    }
    const rawRate = summary.paymentRate ?? 0;
    const normalizedRate = rawRate > 1 ? rawRate : rawRate * 100;
    const paymentAmount = summary.totalPaymentAmount ?? 0;
    return [
      { label: "최근 배정 고객", value: summary.recentlyAssignedCustomers.toLocaleString("ko-KR") },
      { label: "전체 배정 고객", value: summary.totalAssignedCustomers.toLocaleString("ko-KR") },
      { label: "결제율", value: `${Math.round(normalizedRate * 10) / 10}%` },
      { label: "결제 누적", value: `₩ ${paymentAmount.toLocaleString("ko-KR")}` },
    ];
  }, [summary]);

  const summaryErrorState = summaryError && !summaryFetching;
  const bannerLoading = waitingForProject || missingProject || (summaryLoading && !summary);

  return (
    <main className="min-h-[calc(100vh-54px)] bg-background text-foreground">
      <div className="mx-auto max-w-[1324px] w-full px-0 py-8">
        <GreetingBanner
          userName={user?.name ?? user?.email ?? null}
          todayQuote={summary?.todayQuote ?? null}
          loading={bannerLoading}
        />

        <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map((card) => (
            <KpiCard
              key={card.label}
              label={card.label}
              value={card.value}
              loading={bannerLoading || summaryErrorState}
            />
          ))}
        </div>

        {missingProject ? (
          <div className="mt-12 flex h-[240px] items-center justify-center rounded-[16px] border border-dashed border-neutral-30 bg-card text-neutral-60">
            프로젝트를 먼저 선택해주세요.
          </div>
        ) : (
          <>
            <div className="mt-6 grid grid-cols-12 gap-6">
              <div className="col-span-12 lg:col-span-9">
                <AssignedCustomersTable />
              </div>
              <div className="col-span-12 lg:col-span-3">
                <SalesRanking />
              </div>
            </div>

            <div className="mt-6 grid grid-cols-12 gap-6">
              <div className="col-span-12">
                <CalendarSection />
              </div>
            </div>

            <div className="mt-6 grid grid-cols-12 gap-6">
              <div className="col-span-12 lg:col-span-6">
                <NoticeSection />
              </div>
              <div className="col-span-12 lg:col-span-6">
                <StatsSection />
              </div>
            </div>
          </>
        )}
      </div>
    </main>
  );
}

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-[calc(100vh-54px)] bg-background text-foreground flex items-center justify-center">
          <div className="text-neutral-60">대시보드를 불러오는 중입니다...</div>
        </main>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}


