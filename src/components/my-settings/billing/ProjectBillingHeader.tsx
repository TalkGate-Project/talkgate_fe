import type { Subscription } from "@/hooks/useSubscription";
import { formatDateCompact } from "@/utils/datetime";

interface ProjectBillingHeaderProps {
  projectName: string;
  subscription: Subscription | null;
  isLoading: boolean;
  onBack: () => void;
  onPlanChange: () => void;
  onCancelSubscription: () => void;
  onReactivateSubscription: () => void;
}

export default function ProjectBillingHeader({
  projectName,
  subscription,
  isLoading,
  onBack,
  onPlanChange,
  onCancelSubscription,
  onReactivateSubscription,
}: ProjectBillingHeaderProps) {
  return (
    <div className="bg-card rounded-[14px]">
      <div className="py-5 md:py-7">
        {/* 헤더 */}
        <div className="flex items-center gap-2 pb-4 md:pb-6 px-6 md:px-7">
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
          <h1 className="text-[18px] md:text-[24px] font-bold text-foreground">
            프로젝트 관리
          </h1>
        </div>

        {/* 구분선 - 패딩에 영향받지 않도록 */}
        <div className="w-full h-[1px] bg-border mb-4 md:mb-6"></div>

        {/* 구독 정보 */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 md:gap-0 px-6 md:px-7">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#252525] flex items-center justify-center">
              <span className="text-white text-[16px] font-bold">X</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-[16px] md:text-[18px] font-bold text-foreground truncate">
                  {projectName}
                </h2>
                {subscription?.plan && (
                  <span className="px-2 py-0.5 bg-neutral-20 text-neutral-70 text-[11px] md:text-[12px] font-medium rounded-full flex-shrink-0">
                    {subscription.plan.name}
                  </span>
                )}
              </div>
              {isLoading ? (
                <div className="h-5 w-60 bg-neutral-20 rounded animate-pulse mt-1" />
              ) : subscription ? (
                <p className="text-[12px] md:text-[14px] text-neutral-60 mt-1">
                  {formatDateCompact(subscription.startDate)} ~{" "}
                  {formatDateCompact(subscription.endDate)} (
                  {subscription.billingCycle === "monthly"
                    ? "월마다"
                    : subscription.billingCycle === "quarterly"
                    ? "분기마다"
                    : "연마다"}{" "}
                  결제)
                </p>
              ) : (
                <p className="text-[12px] md:text-[14px] text-neutral-60 mt-1">
                  구독 정보가 없습니다
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0 w-full md:w-auto">
            {subscription?.isActive && (
              <button
                onClick={onPlanChange}
                className="cursor-pointer px-3 md:px-4 py-1.5 md:py-2 bg-neutral-90 text-white dark:text-black text-[12px] md:text-[14px] font-medium rounded-[8px] hover:bg-neutral-80 transition-colors flex-1 md:flex-initial"
              >
                플랜변경
              </button>
            )}
            {subscription?.isActive && (
              <>
                {subscription?.autoRenewal ? (
                  <button
                    onClick={onCancelSubscription}
                    className="cursor-pointer px-3 md:px-4 py-1.5 md:py-2 border border-neutral-30 text-[12px] md:text-[14px] font-medium text-neutral-70 rounded-[8px] hover:bg-neutral-10 transition-colors flex-1 md:flex-initial"
                  >
                    구독취소
                  </button>
                ) : (
                  <button
                    onClick={onReactivateSubscription}
                    className="cursor-pointer px-3 md:px-4 py-1.5 md:py-2 border border-neutral-30 text-[12px] md:text-[14px] font-medium text-neutral-70 rounded-[8px] hover:bg-neutral-10 transition-colors flex-1 md:flex-initial"
                  >
                    구독 활성화
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
