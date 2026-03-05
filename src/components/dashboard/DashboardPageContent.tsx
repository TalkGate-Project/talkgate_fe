"use client";

import { Suspense, useMemo, useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import KpiCard from "@/components/dashboard/KpiCard";
import GreetingBanner from "@/components/layout/GreetingBanner";
import AssignedCustomersTable from "@/components/customers/AssignedCustomersTable";
import SalesRanking from "@/components/dashboard/SalesRanking";
import CalendarSection from "@/components/dashboard/CalendarSection";
import NoticeSection from "@/components/notice/NoticeSection";
import StatsSection from "@/components/stats/StatsSection";
import PartnerRequestModal from "@/components/dashboard/PartnerRequestModal";
import { useSelectedProjectId } from "@/hooks/useSelectedProjectId";
import { StatisticsService } from "@/services/statistics";
import { ProjectPartnersService } from "@/services/projectPartners";
import type { SummaryResponse } from "@/types/statistics";
import type { ProjectPartnerRequest } from "@/types/projectPartners";
import { useMyMember } from "@/hooks/useMyMember";
import { hasAdminAccess } from "@/utils/permissions";
import RecentCustomersIcon from "@/components/common/icons/RecentCustomersIcon";
import TotalCustomersIcon from "@/components/common/icons/TotalCustomersIcon";
import PaymentRateIcon from "@/components/common/icons/PaymentRateIcon";
import PaymentAmountIcon from "@/components/common/icons/PaymentAmountIcon";
import { formatCurrencyKR } from "@/utils/format";

function PaymentAmountDisplay({ formattedValue }: { formattedValue: string }) {
  const segments = formattedValue.split(" ").filter(Boolean);
  if (segments.length === 0) {
    return (
      <span className="inline-flex items-end">
        <span>0</span>
        <span className="text-[20px] font-semibold leading-[28px] tracking-[0.5px]">원</span>
      </span>
    );
  }

  const lastIndex = segments.length - 1;

  return (
    <span className="inline-flex items-end">
      {segments.map((segment, index) => {
        const match = segment.match(/^([\d,]+)(.*)$/u);
        const digits = match?.[1] ?? segment;
        const suffix = match?.[2] ?? "";
        const isLast = index === lastIndex;
        const suffixWithWon = isLast ? `${suffix}원` : suffix;
        return (
          <span className="inline-flex items-end" key={`${segment}-${index}`}>
            {index > 0 && <span className="text-[28px] leading-[34px]"> </span>}
            <span>{digits}</span>
            {suffixWithWon && (
              <span className="text-[14px] md:text-[20px] font-semibold leading-[1] md:leading-[34px] tracking-[0.5px]">
                {suffixWithWon}
              </span>
            )}
          </span>
        );
      })}
    </span>
  );
}

function DashboardContentInner() {
  const [projectId, projectReady] = useSelectedProjectId();
  const waitingForProject = !projectReady;
  const hasProject = projectReady && Boolean(projectId);
  const missingProject = projectReady && !projectId;
  const { member } = useMyMember();
  const queryClient = useQueryClient();
  const hasRefetchedRef = useRef(false);
  const hasCheckedPartnerRequestsRef = useRef(false);

  // 파트너 요청 모달 상태
  const [partnerRequests, setPartnerRequests] = useState<ProjectPartnerRequest[]>([]);
  const [isPartnerRequestModalOpen, setIsPartnerRequestModalOpen] = useState(false);

  // Admin/SubAdmin 권한 확인
  const isAdminOrSubAdmin = hasAdminAccess(member?.role);

  // 대시보드 첫 진입 시 사용자 정보 refetch
  useEffect(() => {
    if (!hasRefetchedRef.current && hasProject) {
      hasRefetchedRef.current = true;
      queryClient.invalidateQueries({ queryKey: ["auth", "user"] });
    }
  }, [hasProject, queryClient]);

  // 대시보드 진입 시 파트너 요청 조회 (Admin/SubAdmin만)
  useEffect(() => {
    const fetchPartnerRequests = async () => {
      if (!projectId || !isAdminOrSubAdmin || hasCheckedPartnerRequestsRef.current) return;
      
      hasCheckedPartnerRequestsRef.current = true;
      
      try {
        const headers = { "x-project-id": projectId };
        const response = await ProjectPartnersService.listRequests(
          { page: 1, limit: 100, status: "pending" },
          headers
        );

        if (response.data?.data?.list && response.data.data.list.length > 0) {
          setPartnerRequests(response.data.data.list);
          setIsPartnerRequestModalOpen(true);
        }
      } catch (err) {
        console.error("[Dashboard] Failed to fetch partner requests", err);
      }
    };

    if (hasProject && isAdminOrSubAdmin) {
      fetchPartnerRequests();
    }
  }, [projectId, hasProject, isAdminOrSubAdmin]);

  // 파트너 요청 모달 닫기
  const handlePartnerRequestModalClose = () => {
    setIsPartnerRequestModalOpen(false);
  };

  // 파트너 요청 처리 완료 시 목록 갱신
  const handlePartnerRequestActionComplete = () => {
    setPartnerRequests([]);
  };

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
        { label: "새로 배정된 고객", value: "-", icon: <RecentCustomersIcon /> },
        { label: "전체 배정된 고객", value: "-", icon: <TotalCustomersIcon /> },
        { label: "결제율", value: "-", icon: <PaymentRateIcon /> },
        { label: "결제누적액", value: "-", icon: <PaymentAmountIcon /> },
      ];
    }
    const rawRate = summary.paymentRate ?? 0;
    const paymentAmount = summary.totalPaymentAmount ?? 0;
    const paymentAmountFormatted = formatCurrencyKR(paymentAmount);
    return [
      { label: "새로 배정된 고객", value: summary.recentlyAssignedCustomers.toLocaleString("ko-KR"), icon: <RecentCustomersIcon /> },
      { label: "전체 배정된 고객", value: summary.totalAssignedCustomers.toLocaleString("ko-KR"), icon: <TotalCustomersIcon /> },
      { label: "결제율", value: `${rawRate}%`, icon: <PaymentRateIcon /> },
      {
        label: "결제누적액",
        value: <PaymentAmountDisplay formattedValue={paymentAmountFormatted} />,
        icon: <PaymentAmountIcon />,
      },
    ];
  }, [summary]);

  const summaryErrorState = summaryError && !summaryFetching;
  const bannerLoading = waitingForProject || missingProject || (summaryLoading && !summary);

  return (
    <main className="min-h-[calc(100vh-54px)] bg-background text-foreground">
      <div className="mx-auto max-w-[1324px] w-full px-0 md:px-6 lg:px-0 pt-0 md:pt-9 pb-6">
        <GreetingBanner
          userName={member?.name ?? member?.email ?? null}
          todayQuote={summary?.todayQuote ?? null}
          loading={bannerLoading}
        />

        <div className="mt-4 md:mt-9 grid grid-cols-2 gap-4 md:gap-8 lg:gap-9 md:grid-cols-2 lg:grid-cols-4 px-6 md:px-0">
          {cards.map((card) => (
            <KpiCard
              key={card.label}
              label={card.label}
              value={card.value}
              icon={card.icon}
              loading={bannerLoading || summaryErrorState}
            />
          ))}
        </div>

        {missingProject ? (
          <div className="mt-4 md:mt-12 flex h-[240px] items-center justify-center rounded-[16px] border border-dashed border-neutral-30 bg-card text-neutral-60">
            프로젝트를 먼저 선택해주세요.
          </div>
        ) : (
          <>
            <div className="mt-4 md:mt-9 grid grid-cols-12 gap-0 md:gap-9 px-6 md:px-0">
              <div className="col-span-12 lg:col-span-9 mb-4 md:mb-0">
                <AssignedCustomersTable />
              </div>
              <div className="col-span-12 lg:col-span-3">
                <SalesRanking />
              </div>
            </div>

            <div className="mt-4 md:mt-9 grid grid-cols-12 gap-6 px-6 md:px-0">
              <div className="col-span-12">
                <CalendarSection />
              </div>
            </div>

            <div className="mt-4 md:mt-9 mb-7 grid grid-cols-12 gap-0 md:gap-9 px-6 md:px-0">
              <div className="col-span-12 lg:col-span-6 mb-4 md:mb-0">
                <NoticeSection />
              </div>
              <div className="col-span-12 lg:col-span-6">
                <StatsSection />
              </div>
            </div>
          </>
        )}
      </div>

      {/* Partner Request Modal */}
      {projectId && (
        <PartnerRequestModal
          isOpen={isPartnerRequestModalOpen}
          onClose={handlePartnerRequestModalClose}
          requests={partnerRequests}
          projectId={projectId}
          onActionComplete={handlePartnerRequestActionComplete}
        />
      )}
    </main>
  );
}

export default function DashboardPageContent() {
  return (
    <Suspense
      fallback={
        <main className="min-h-[calc(100vh-54px)] bg-background text-foreground flex items-center justify-center">
          <div className="text-neutral-60">대시보드를 불러오는 중입니다...</div>
        </main>
      }
    >
      <DashboardContentInner />
    </Suspense>
  );
}

