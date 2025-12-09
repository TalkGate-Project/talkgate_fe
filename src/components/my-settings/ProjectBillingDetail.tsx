"use client";

import { useState, useEffect } from "react";
import Pagination from "@/components/common/Pagination";
import DemoModeToggle from "@/components/common/DemoModeToggle";
import { useBilling, type BillingInfo } from "@/hooks/useBilling";
import {
  useSubscription,
  usePaymentHistory,
  type Payment,
} from "@/hooks/useSubscription";
import { setSelectedProjectId, getSelectedProjectId } from "@/lib/project";

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
  return date
    .toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })
    .replace(/\. /g, ".")
    .replace(/\.$/, "");
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

interface ProjectBillingDetailProps {
  projectId: string | number;
  projectName: string;
  onBack: () => void;
}

export default function ProjectBillingDetail({
  projectId,
  projectName,
  onBack,
}: ProjectBillingDetailProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // 프로젝트 선택 (구독 정보를 가져오기 위해)
  useEffect(() => {
    const currentProjectId = getSelectedProjectId();
    setSelectedProjectId(projectId);

    return () => {
      // 이전 프로젝트로 복원
      if (currentProjectId) {
        setSelectedProjectId(currentProjectId);
      }
    };
  }, [projectId]);

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

  const isLoading = subscriptionLoading || billingLoading;

  return (
    <div className="space-y-6">
      {/* 프로젝트 관리 헤더 및 구독 정보 통합 섹션 */}
      <div className="bg-card rounded-[14px]">
        <div className="py-7">
          {/* 헤더 */}
          <div className="flex items-center gap-2 pb-6 px-7">
            <button
              onClick={onBack}
              className="cursor-pointer flex items-center gap-2 text-foreground hover:text-primary-80 transition-colors"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path
                  d="M15 18L9 12L15 6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            <h1 className="text-[24px] font-bold text-foreground">
              프로젝트 관리
            </h1>
          </div>

          {/* 구분선 - 패딩에 영향받지 않도록 */}
          <div className="w-full h-[1px] bg-border mb-6"></div>

          {/* 구독 정보 */}
          <div className="flex items-center justify-between px-7">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#252525] flex items-center justify-center">
                <span className="text-white text-[16px] font-bold">X</span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-[18px] font-bold text-foreground">
                    {projectName}
                  </h2>
                  {subscription?.plan && (
                    <span className="px-2 py-0.5 bg-neutral-20 text-neutral-70 text-[12px] font-medium rounded-full mt-1 inline-block">
                      {subscription.plan.name}
                    </span>
                  )}
                </div>
                {isLoading ? (
                  <div className="h-5 w-60 bg-neutral-20 rounded animate-pulse mt-1" />
                ) : subscription ? (
                  <p className="text-[14px] text-neutral-60 mt-1">
                    {formatDate(subscription.startDate)} ~{" "}
                    {formatDate(subscription.endDate)} (
                    {subscription.billingCycle === "monthly"
                      ? "월마다"
                      : "연마다"}{" "}
                    결제)
                  </p>
                ) : (
                  <p className="text-[14px] text-neutral-60 mt-1">
                    구독 정보가 없습니다
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {subscription?.isActive && (
                <button className="cursor-pointer px-4 py-2 bg-neutral-90 text-white text-[14px] font-medium rounded-[8px] hover:bg-neutral-80 transition-colors">
                  업그레이드
                </button>
              )}
              {subscription?.isActive && (
                <button className="cursor-pointer px-4 py-2 border border-neutral-30 text-[14px] font-medium text-neutral-70 rounded-[8px] hover:bg-neutral-10 transition-colors">
                  구독취소
                </button>
              )}
            </div>
          </div>
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

        {/* 구분선 */}
        <div className="w-full h-[1px] bg-border opacity-70 mb-6"></div>

        <div className="space-y-4">
          {/* 구독 */}
          <div className="flex items-center">
            <span className="w-[120px] text-[14px] text-neutral-60">구독</span>
            {subscriptionLoading ? (
              <div className="h-5 w-32 bg-neutral-20 rounded animate-pulse" />
            ) : subscription ? (
              <div className="flex items-center gap-2">
                <span className="text-[14px] text-foreground">
                  프로젝트 구독
                </span>
                <span className="px-2 py-0.5 bg-neutral-20 text-neutral-70 text-[12px] font-medium rounded">
                  {subscription.plan?.name || "-"}
                </span>
              </div>
            ) : (
              <span className="text-[14px] text-neutral-60">
                구독 정보 없음
              </span>
            )}
          </div>

          {/* 결제 수단 */}
          <div className="flex items-center">
            <span className="w-[120px] text-[14px] text-neutral-60">
              결제 수단
            </span>
            <div className="flex items-center gap-3">
              {billingLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-6 h-4 bg-neutral-20 rounded-sm animate-pulse" />
                  <div className="w-40 h-4 bg-neutral-20 rounded animate-pulse" />
                </div>
              ) : activeBillingInfo ? (
                <PaymentMethodDisplay billingInfo={activeBillingInfo} />
              ) : (
                <span className="text-[14px] text-neutral-60">
                  등록된 결제 수단이 없습니다
                </span>
              )}
            </div>
          </div>

          {/* 이용시작 일시 */}
          <div className="flex items-center">
            <span className="w-[120px] text-[14px] text-neutral-60">
              이용시작 일시
            </span>
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
            <span className="w-[120px] text-[14px] text-neutral-60">
              다음 결제 예정일
            </span>
            {subscriptionLoading ? (
              <div className="h-5 w-32 bg-neutral-20 rounded animate-pulse" />
            ) : (
              <span className="text-[14px] text-foreground">
                {subscription?.nextBillingDate
                  ? formatDateTime(subscription.nextBillingDate)
                  : "-"}
              </span>
            )}
          </div>

          {/* 결제 예정 금액 */}
          <div className="flex items-center">
            <span className="w-[120px] text-[14px] text-neutral-60">
              결제 예정 금액
            </span>
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
                      <span className="text-neutral-60 ml-1">
                        (부가세 포함)
                      </span>
                    </>
                  ) : (
                    "-"
                  )}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 결제내역 섹션 */}
      <div className="bg-card rounded-[14px] pb-7">
        {/* 제목 */}
        <h2 className="px-7 py-6 text-[18px] font-bold text-foreground">
          결제내역
        </h2>

        {/* 구분선 */}
        <div className="w-full h-[1px] bg-border opacity-70 mb-6"></div>

        {/* 테이블 */}
        <div className="px-7">
          {/* 테이블 헤더 */}
          <div className="bg-neutral-20 rounded-[8px] h-[40px] flex items-center px-6">
            <div className="flex-[1.5] text-[16px] font-medium text-neutral-60">
              결제날짜
            </div>
            <div className="flex-[1] text-[16px] font-medium text-neutral-60">
              금액
            </div>
            <div className="flex-[1] text-[16px] font-medium text-neutral-60">
              결제 상태
            </div>
            <div className="flex-[1] text-[16px] font-medium text-neutral-60">
              구독
            </div>
          </div>

          {/* 테이블 본문 */}
          <div>
            {paymentsLoading ? (
              // 로딩 스켈레톤
              Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="flex items-center px-6 py-4 border-b border-neutral-10"
                >
                  <div className="flex-[1.5]">
                    <div className="h-4 w-24 bg-neutral-20 rounded animate-pulse" />
                  </div>
                  <div className="flex-[1]">
                    <div className="h-4 w-20 bg-neutral-20 rounded animate-pulse" />
                  </div>
                  <div className="flex-[1]">
                    <div className="h-4 w-12 bg-neutral-20 rounded animate-pulse" />
                  </div>
                  <div className="flex-[1]">
                    <div className="h-4 w-16 bg-neutral-20 rounded animate-pulse" />
                  </div>
                </div>
              ))
            ) : paginatedPayments.length === 0 ? (
              <div className="py-12 text-center text-[14px] text-neutral-60">
                결제 내역이 없습니다
              </div>
            ) : (
              paginatedPayments.map((payment) => (
                <PaymentRow
                  key={payment.id}
                  payment={payment}
                  subscription={subscription}
                />
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

      {/* 더미 데이터 모드 토글 */}
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
        <span className="text-white text-[8px] font-bold">
          {cardCompanyAbbr}
        </span>
      </div>
      <span className="text-[14px] text-foreground">
        카드 결제 ({billingInfo.cardCompany} **** ****{" "}
        {billingInfo.lastFourDigits})
      </span>
    </div>
  );
}

// 결제 내역 행 컴포넌트
function PaymentRow({
  payment,
  subscription,
}: {
  payment: Payment;
  subscription: any;
}) {
  const statusLabel = getPaymentStatusLabel(payment.status);
  const statusColor = getPaymentStatusColor(payment.status);

  return (
    <div className="flex items-center px-6 py-3 border-b border-neutral-10">
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
        {subscription?.plan ? `프로젝트 구독 ${subscription.plan.name}` : "-"}
      </div>
      <div className="flex items-center justify-end">
        <button className="cursor-pointer p-2 hover:bg-neutral-10 rounded transition-colors">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M8 7H5C3.89543 7 3 7.89543 3 9V18C3 19.1046 3.89543 20 5 20H19C20.1046 20 21 19.1046 21 18V9C21 7.89543 20.1046 7 19 7H16M15 11L12 14M12 14L9 11M12 14L12 4"
              stroke="#B0B0B0"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
