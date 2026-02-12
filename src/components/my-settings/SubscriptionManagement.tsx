"use client";

import { useSubscription, useSubscriptionPlans } from "@/hooks/useSubscription";
import DemoModeToggle from "@/components/common/DemoModeToggle";
import type { Subscription, SubscriptionPlan } from "@/types/subscription";

interface SubscriptionManagementProps {
  onBack: () => void;
}

export default function SubscriptionManagement({ onBack }: SubscriptionManagementProps) {
  const { subscription, loading: subscriptionLoading } = useSubscription();
  const { plans, loading: plansLoading } = useSubscriptionPlans();

  const isLoading = subscriptionLoading || plansLoading;

  return (
    <div className="bg-[#FFFFFF] rounded-[14px]">
      {/* 헤더 */}
      <div className="flex items-center justify-between px-7 py-7">
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
          <span className="text-[24px] font-bold">구독 관리</span>
        </button>
        <span className="px-3 py-1 bg-primary-10 text-primary-80 text-[12px] leading-[1] font-medium rounded-full">
          프로젝트 구독 : {subscription?.isActive ? "1개" : "0개"}
        </span>
      </div>
      
      <div className="border-b border-[#e9e9e9] dark:!border-[#44444455] mb-7"></div>

      {/* 구독 카드 그리드 */}
      <div className="px-7 pb-7">
        {isLoading ? (
          // 로딩 스켈레톤
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[1, 2].map((i) => (
              <div key={i} className="bg-card rounded-[14px] p-6 border border-neutral-20 animate-pulse">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-full bg-neutral-20" />
                  <div className="h-5 w-40 bg-neutral-20 rounded" />
                </div>
                <div className="space-y-4">
                  {[1, 2, 3].map((j) => (
                    <div key={j}>
                      <div className="flex justify-between mb-2">
                        <div className="h-4 w-20 bg-neutral-20 rounded" />
                        <div className="h-4 w-24 bg-neutral-20 rounded" />
                      </div>
                      <div className="h-2 bg-neutral-20 rounded-full" />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : subscription ? (
          // 현재 구독 정보 표시
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SubscriptionCard subscription={subscription} />
            
            {/* 업그레이드 가능한 플랜들 표시 */}
            {plans
              .filter((plan) => plan.id !== subscription.plan?.id && plan.sortOrder > (subscription.plan?.sortOrder || 0))
              .slice(0, 1)
              .map((plan) => (
                <PlanCard key={plan.id} plan={plan} currentSubscription={subscription} />
              ))}
          </div>
        ) : (
          // 구독 없음
          <div className="text-center py-12">
            <p className="text-[16px] text-neutral-60 mb-4">현재 활성화된 구독이 없습니다</p>
            {plans.length > 0 && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                {plans.slice(0, 2).map((plan) => (
                  <PlanCard key={plan.id} plan={plan} currentSubscription={null} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 더미 데이터 모드 토글 (결제관리 페이지에서만 표시) */}
      <DemoModeToggle />
    </div>
  );
}

// 현재 구독 카드 컴포넌트
function SubscriptionCard({ subscription }: { subscription: Subscription }) {
  const plan = subscription.plan;
  
  // 사용량 비율 계산 (실제 사용량 API가 있으면 연동 필요)
  const memberUsage = 26; // 임시 값 - 실제 사용량 API 연동 필요
  const memberLimit = plan?.memberCountLimit ?? plan?.maxMembers ?? 1;
  const memberPercentage = plan ? Math.min(100, (memberUsage / memberLimit) * 100) : 0;
  const aiUsage = 50; // 임시 값
  const aiPercentage = plan ? Math.min(100, (aiUsage / plan.aiUsageLimit) * 100) : 0;
  const smsUsage = 30; // 임시 값
  const smsPercentage = plan ? Math.min(100, (smsUsage / plan.smsUsageLimit) * 100) : 0;

  return (
    <div className="bg-card rounded-[14px] p-6 border border-neutral-20">
      {/* 카드 헤더 */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-full bg-[#252525] flex items-center justify-center">
          <span className="text-white text-[16px] font-bold">
            {plan?.name?.charAt(0) || "P"}
          </span>
        </div>
        <div>
          <h3 className="text-[16px] font-bold text-foreground">{plan?.name || "구독 플랜"}</h3>
          {plan?.description && (
            <p className="text-[12px] text-neutral-60">{plan.description}</p>
          )}
        </div>
      </div>

      {/* 사용량 정보 */}
      <div className="space-y-4">
        {/* 멤버 수 */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[14px] text-neutral-60">멤버 수</span>
            <span className="text-[14px] text-foreground">
              <span className="font-bold">{memberUsage}명</span>
              <span className="text-neutral-60"> / {plan?.maxMembers || 0}명</span>
            </span>
          </div>
          <div className="h-2 bg-neutral-20 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${memberPercentage}%`, backgroundColor: "#ADF6D2" }}
            />
          </div>
        </div>

        {/* AI 상담 도우미 토큰 */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[14px] text-neutral-60">AI 상담 도우미 토큰</span>
            <span className="text-[14px] text-foreground">
              <span className="font-bold">월 {aiUsage}회</span>
              <span className="text-neutral-60"> / 월 {plan?.aiUsageLimit || 0}회</span>
            </span>
          </div>
          <div className="h-2 bg-neutral-20 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${aiPercentage}%`, backgroundColor: "#ADF6D2" }}
            />
          </div>
        </div>

        {/* 문자 전송 횟수 */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[14px] text-neutral-60">문자 전송 횟수</span>
            <span className="text-[14px] text-foreground">
              <span className="font-bold">월 {smsUsage}회</span>
              <span className="text-neutral-60"> / 월 {plan?.smsUsageLimit || 0}회</span>
            </span>
          </div>
          <div className="h-2 bg-neutral-20 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${smsPercentage}%`, backgroundColor: "#ADF6D2" }}
            />
          </div>
        </div>
      </div>

      {/* 액션 버튼 */}
      <div className="flex items-center justify-end gap-3 mt-6">
        {subscription.autoRenewal ? (
          <button className="cursor-pointer px-4 py-2 border border-neutral-30 text-[14px] font-medium text-neutral-70 rounded-[8px] hover:bg-neutral-10 transition-colors">
            구독취소
          </button>
        ) : (
          <button className="cursor-pointer px-4 py-2 border border-primary-80 text-[14px] font-medium text-primary-80 rounded-[8px] hover:bg-primary-10 transition-colors">
            재활성화
          </button>
        )}
        <button className="cursor-pointer px-4 py-2 bg-[#252525] text-white text-[14px] font-medium rounded-[8px] hover:bg-[#3a3a3a] transition-colors">
        플랜변경
        </button>
      </div>
    </div>
  );
}

// 플랜 카드 컴포넌트 (업그레이드용)
function PlanCard({ plan, currentSubscription }: { plan: SubscriptionPlan; currentSubscription: Subscription | null }) {
  const isUpgrade = currentSubscription && plan.sortOrder > (currentSubscription.plan?.sortOrder || 0);

  // 금액 포맷팅
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("ko-KR").format(price) + "원";
  };

  return (
    <div className="bg-card rounded-[14px] p-6 border border-neutral-20 border-dashed">
      {/* 카드 헤더 */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-full bg-primary-10 flex items-center justify-center">
          <span className="text-primary-80 text-[16px] font-bold">
            {plan.name?.charAt(0) || "P"}
          </span>
        </div>
        <div>
          <h3 className="text-[16px] font-bold text-foreground">{plan.name}</h3>
          {plan.description && (
            <p className="text-[12px] text-neutral-60">{plan.description}</p>
          )}
        </div>
      </div>

      {/* 플랜 정보 */}
      <div className="space-y-3 mb-6">
        <div className="flex justify-between text-[14px]">
          <span className="text-neutral-60">멤버 수</span>
          <span className="text-foreground font-medium">최대 {plan.maxMembers}명</span>
        </div>
        <div className="flex justify-between text-[14px]">
          <span className="text-neutral-60">AI 토큰</span>
          <span className="text-foreground font-medium">월 {plan.aiUsageLimit}회</span>
        </div>
        <div className="flex justify-between text-[14px]">
          <span className="text-neutral-60">문자 전송</span>
          <span className="text-foreground font-medium">월 {plan.smsUsageLimit}회</span>
        </div>
        <div className="border-t border-neutral-20 pt-3 flex justify-between text-[14px]">
          <span className="text-neutral-60">월 요금</span>
          <span className="text-foreground font-bold">{formatPrice(plan.monthlyPrice)}</span>
        </div>
      </div>

      {/* 액션 버튼 */}
      <div className="flex items-center justify-end">
        <button className="cursor-pointer px-4 py-2 bg-[#252525] text-white text-[14px] font-medium rounded-[8px] hover:bg-[#3a3a3a] transition-colors">
          {isUpgrade ? "플랜변경" : "구독하기"}
        </button>
      </div>
    </div>
  );
}
