"use client";

import { useState } from "react";
import SubscriptionManagement from "./SubscriptionManagement";
import Pagination from "@/components/common/Pagination";
import DemoModeToggle from "@/components/common/DemoModeToggle";
import { useBilling, type BillingInfo } from "@/hooks/useBilling";
import { useSubscription, usePaymentHistory, type Payment } from "@/hooks/useSubscription";

// 카드사 색상 매핑
const CARD_COMPANY_COLORS: Record<string, string> = {
  BC: "#F04452",
  삼성: "#1428A0",
  신한: "#0046FF",
  현대: "#00693E",
  롯데: "#ED1C24",
  하나: "#009490",
  국민: "#FFBC00",
  농협: "#006747",
  우리: "#004B9C",
};

// 카드사 약어 가져오기
function getCardCompanyAbbr(cardCompany: string): string {
  if (!cardCompany) return "카드";
  if (cardCompany.length <= 2) return cardCompany;
  return cardCompany.replace(/카드$/, "").slice(0, 2);
}

// 카드사 색상 가져오기
function getCardCompanyColor(cardCompany: string): string {
  const abbr = getCardCompanyAbbr(cardCompany);
  return CARD_COMPANY_COLORS[abbr] || "#808080";
}

// 날짜 포맷팅
function formatDate(dateString: string | null): string {
  if (!dateString) return "-";
  const date = new Date(dateString);
  return date.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).replace(/\. /g, ".").replace(/\.$/, "");
}

// 날짜+시간 포맷팅
function formatDateTime(dateString: string | null): string {
  if (!dateString) return "-";
  const date = new Date(dateString);
  const dateStr = formatDate(dateString);
  const timeStr = date.toLocaleTimeString("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  return `${dateStr}  ${timeStr}`;
}

// 금액 포맷팅
function formatAmount(amount: number): string {
  return new Intl.NumberFormat("ko-KR").format(amount) + "원";
}

// 결제 상태 한글 변환
function getPaymentStatusLabel(status: string): string {
  const statusMap: Record<string, string> = {
    pending: "대기",
    completed: "완료",
    failed: "실패",
    refunded: "환불",
  };
  return statusMap[status] || status;
}

// 결제 상태 색상
function getPaymentStatusColor(status: string): "green" | "yellow" | "red" {
  if (status === "completed") return "green";
  if (status === "pending") return "yellow";
  return "red";
}

type ViewMode = "main" | "subscription";

export default function BillingTab() {
  const [viewMode, setViewMode] = useState<ViewMode>("main");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // API 데이터 가져오기
  const { activeBillingInfo, loading: billingLoading } = useBilling();
  const { subscription, loading: subscriptionLoading } = useSubscription();
  const { payments, loading: paymentsLoading } = usePaymentHistory();

  // 페이지네이션
  const totalPages = Math.max(1, Math.ceil(payments.length / itemsPerPage));
  const paginatedPayments = payments.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  if (viewMode === "subscription") {
    return <SubscriptionManagement onBack={() => setViewMode("main")} />;
  }

  const isLoading = subscriptionLoading || billingLoading;

  return (
    <div className="space-y-6">
      {/* 결제관리 + 프로젝트 구독 섹션 (통합 카드) */}
      <div className="bg-card rounded-[14px]">
        {/* 페이지 제목 */}
        <h1 className="px-7 py-7 text-[24px] font-bold text-foreground">결제관리</h1>

        {/* 구분선 */}
        <div className="border-b border-[#E2E2E266]"></div>

        {/* 프로젝트 구독 섹션 */}
        <div className="px-10 py-[30px]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2">
                <span className="text-[18px] font-bold text-foreground">프로젝트 구독</span>
                {subscription?.isActive && (
                  <span className="px-2 py-0.5 bg-primary-10 text-primary-80 text-[12px] font-medium rounded-full">
                    {subscription.plan?.name || "구독중"}
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={() => setViewMode("subscription")}
              className="cursor-pointer px-4 py-2 bg-[#252525] text-white text-[14px] font-medium rounded-[8px] hover:bg-[#3a3a3a] transition-colors"
            >
              구독 관리
            </button>
          </div>
          {isLoading ? (
            <div className="h-5 w-60 bg-neutral-20 rounded animate-pulse" />
          ) : subscription ? (
            <p className="text-[14px] text-neutral-60">
              {formatDate(subscription.startDate)} ~ {formatDate(subscription.endDate)} (
              {subscription.billingCycle === "monthly" ? "월마다" : "연마다"} 결제)
            </p>
          ) : (
            <p className="text-[14px] text-neutral-60">
              구독 정보가 없습니다
            </p>
          )}
        </div>
      </div>

      {/* 결제정보 섹션 */}
      <div className="bg-card rounded-[14px] p-6">
        <div className="mb-6">
          <h2 className="text-[18px] font-bold text-foreground">결제정보</h2>
          <p className="text-[14px] text-neutral-60 mt-1">
            결제 상태 및 처리 내역을 관리합니다.
          </p>
        </div>

        <div className="space-y-4">
          {/* 구독 */}
          <div className="flex items-center">
            <span className="w-[120px] text-[14px] text-neutral-60">구독</span>
            {subscriptionLoading ? (
              <div className="h-5 w-32 bg-neutral-20 rounded animate-pulse" />
            ) : subscription ? (
              <div className="flex items-center gap-2">
                <span className="text-[14px] text-foreground">프로젝트 구독</span>
                <span className="px-2 py-0.5 bg-neutral-20 text-neutral-70 text-[12px] font-medium rounded">
                  {subscription.plan?.name || "-"}
                </span>
              </div>
            ) : (
              <span className="text-[14px] text-neutral-60">구독 정보 없음</span>
            )}
          </div>

          {/* 결제 수단 */}
          <div className="flex items-center">
            <span className="w-[120px] text-[14px] text-neutral-60">결제 수단</span>
            <div className="flex items-center gap-3">
              {billingLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-6 h-4 bg-neutral-20 rounded-sm animate-pulse" />
                  <div className="w-40 h-4 bg-neutral-20 rounded animate-pulse" />
                </div>
              ) : activeBillingInfo ? (
                <PaymentMethodDisplay billingInfo={activeBillingInfo} />
              ) : (
                <span className="text-[14px] text-neutral-60">등록된 결제 수단이 없습니다</span>
              )}
              <button className="cursor-pointer px-3 py-1.5 border border-neutral-30 text-[13px] text-neutral-70 rounded-[6px] hover:bg-neutral-10 transition-colors">
                결제 수단 변경
              </button>
            </div>
          </div>

          {/* 이용시작 일시 */}
          <div className="flex items-center">
            <span className="w-[120px] text-[14px] text-neutral-60">이용시작 일시</span>
            {subscriptionLoading ? (
              <div className="h-5 w-32 bg-neutral-20 rounded animate-pulse" />
            ) : (
              <span className="text-[14px] text-foreground">
                {subscription ? formatDateTime(subscription.startDate) : "-"}
              </span>
            )}
          </div>

          {/* 다음 결제 예정일 */}
          <div className="flex items-center">
            <span className="w-[120px] text-[14px] text-neutral-60">다음 결제 예정일</span>
            {subscriptionLoading ? (
              <div className="h-5 w-32 bg-neutral-20 rounded animate-pulse" />
            ) : (
              <span className="text-[14px] text-foreground">
                {subscription?.nextBillingDate ? formatDateTime(subscription.nextBillingDate) : "-"}
              </span>
            )}
          </div>

          {/* 결제 예정 금액 */}
          <div className="flex items-center">
            <span className="w-[120px] text-[14px] text-neutral-60">결제 예정 금액</span>
            <div className="flex items-center gap-3">
              {subscriptionLoading ? (
                <div className="h-5 w-32 bg-neutral-20 rounded animate-pulse" />
              ) : (
                <span className="text-[14px] text-foreground">
                  {subscription?.plan ? (
                    <>
                      <span className="font-bold">
                        {formatAmount(
                          subscription.billingCycle === "monthly"
                            ? subscription.plan.monthlyPrice
                            : subscription.plan.yearlyPrice
                        )}
                      </span>
                      <span className="text-neutral-60 ml-1">(부가세 포함)</span>
                    </>
                  ) : (
                    "-"
                  )}
                </span>
              )}
              {subscription?.isActive && (
                <button className="cursor-pointer px-3 py-1.5 border border-neutral-30 text-[13px] text-neutral-70 rounded-[6px] hover:bg-neutral-10 transition-colors">
                  구독 취소
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 결제내역 섹션 */}
      <div className="bg-card rounded-[14px] pb-7">
        {/* 제목 */}
        <h2 className="px-7 py-6 text-[18px] font-bold text-foreground">결제내역</h2>

        {/* 구분선 */}
        <div className="w-full h-[1px] bg-border opacity-70 mb-6"></div>

        {/* 테이블 */}
        <div className="px-7">
          {/* 테이블 헤더 */}
          <div className="bg-[#EDEDED] rounded-[8px] h-[40px] flex items-center px-6">
            <div className="flex-[1.5] text-[16px] font-medium text-neutral-60">결제날짜</div>
            <div className="flex-[1] text-[16px] font-medium text-neutral-60">금액</div>
            <div className="flex-[1] text-[16px] font-medium text-neutral-60">결제 상태</div>
            <div className="flex-[1] text-[16px] font-medium text-neutral-60">결제 방법</div>
          </div>

          {/* 테이블 본문 */}
          <div>
            {paymentsLoading ? (
              // 로딩 스켈레톤
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center px-6 py-4 border-b border-neutral-10">
                  <div className="flex-[1.5]"><div className="h-4 w-24 bg-neutral-20 rounded animate-pulse" /></div>
                  <div className="flex-[1]"><div className="h-4 w-20 bg-neutral-20 rounded animate-pulse" /></div>
                  <div className="flex-[1]"><div className="h-4 w-12 bg-neutral-20 rounded animate-pulse" /></div>
                  <div className="flex-[1]"><div className="h-4 w-16 bg-neutral-20 rounded animate-pulse" /></div>
                </div>
              ))
            ) : paginatedPayments.length === 0 ? (
              <div className="py-12 text-center text-[14px] text-neutral-60">
                결제 내역이 없습니다
              </div>
            ) : (
              paginatedPayments.map((payment) => (
                <PaymentRow key={payment.id} payment={payment} />
              ))
            )}
          </div>
        </div>

        {/* 페이지네이션 */}
        {payments.length > 0 && (
          <div className="flex justify-center mt-6">
            <Pagination
              page={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </div>

      {/* 더미 데이터 모드 토글 (결제관리 페이지에서만 표시) */}
      <DemoModeToggle />
    </div>
  );
}

// 결제 수단 표시 컴포넌트
function PaymentMethodDisplay({ billingInfo }: { billingInfo: BillingInfo }) {
  const cardCompanyAbbr = getCardCompanyAbbr(billingInfo.cardCompany);
  const cardCompanyColor = getCardCompanyColor(billingInfo.cardCompany);

  return (
    <div className="flex items-center gap-2">
      <div
        className="w-6 h-4 rounded-sm flex items-center justify-center"
        style={{ backgroundColor: cardCompanyColor }}
      >
        <span className="text-white text-[8px] font-bold">{cardCompanyAbbr}</span>
      </div>
      <span className="text-[14px] text-foreground">
        카드 결제 ({billingInfo.cardCompany} **** **** {billingInfo.lastFourDigits})
      </span>
    </div>
  );
}

// 결제 내역 행 컴포넌트
function PaymentRow({ payment }: { payment: Payment }) {
  const statusLabel = getPaymentStatusLabel(payment.status);
  const statusColor = getPaymentStatusColor(payment.status);

  return (
    <div className="flex items-center px-6 py-4 border-b border-neutral-10">
      <div className="flex-[1.5] text-[14px] text-foreground">
        {formatDate(payment.createdAt)}
      </div>
      <div className="flex-[1] text-[14px] text-foreground">
        {formatAmount(payment.amount)}
      </div>
      <div className="flex-[1]">
        <span
          className={`px-2 py-1 text-[12px] font-medium rounded ${
            statusColor === "green"
              ? "bg-primary-10 text-primary-80"
              : statusColor === "yellow"
              ? "bg-yellow-100 text-yellow-700"
              : "bg-red-100 text-red-700"
          }`}
        >
          {statusLabel}
        </span>
      </div>
      <div className="flex-[1] text-[14px] text-foreground">
        {payment.method || "-"}
      </div>
    </div>
  );
}
