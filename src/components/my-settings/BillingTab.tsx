"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  SubscriptionService,
  type SubscriptionAdminProject,
  type SubscriptionState,
  type BillingCycle,
} from "@/services/subscription";
import ProjectBillingDetail from "./ProjectBillingDetail";
import { useBilling } from "@/hooks/useBilling";
import { BillingService } from "@/services/billing";
import { showErrorModal, hideErrorModal } from "@/providers/ErrorFeedbackModalProvider";
import ChangePaymentMethodModal, {
  type PaymentMethodData,
} from "./ChangePaymentMethodModal";
import ProjectPrivacyConsentModal from "@/components/projects/ProjectPrivacyConsentModal";
import { ProjectPrivacyConsentService } from "@/services/projectPrivacyConsent";
import { formatDateCompact } from "@/utils/datetime";
import { LANDING_URLS } from "@/lib/constants";

function formatCount(value: number): string {
  return new Intl.NumberFormat("ko-KR").format(value);
}

type ViewMode = "list" | "detail";

interface ProjectWithSubscription {
  id: number;
  name: string;
  logoUrl?: string | null;
  state: SubscriptionState;
  subscription?: {
    plan: {
      name: string;
    };
    startDate: string;
    endDate: string;
    billingCycle: BillingCycle;
    isActive: boolean;
  };
  usage: {
    memberCount: number;
    aiUsage: number;
    smsUsage: number;
    memberLimit: number;
    aiLimit: number;
    smsLimit: number;
  };
}

function mapAdminProjectToViewModel(
  project: SubscriptionAdminProject
): ProjectWithSubscription {
  if (project.subscriptionState === "active") {
    return {
      id: project.projectId,
      name: project.projectName,
      logoUrl: project.projectLogoUrl ?? null,
      state: project.subscriptionState,
      subscription: {
        plan: { name: project.subscriptionName },
        startDate: project.subscriptionStartDate,
        endDate: project.subscriptionEndDate,
        billingCycle: project.billingCycle,
        isActive: true,
      },
      usage: {
        memberCount: project.currentMemberCount,
        aiUsage: project.currentAiUsage,
        smsUsage: project.currentSmsUsage,
        memberLimit: project.maxMembers,
        aiLimit: project.maxAiUsage,
        smsLimit: project.maxSmsUsage,
      },
    };
  }

  return {
    id: project.projectId,
    name: project.projectName,
    logoUrl: project.projectLogoUrl ?? null,
    state: project.subscriptionState,
    subscription: undefined,
    usage: {
      memberCount: project.currentMemberCount,
      aiUsage: project.currentAiUsage,
      smsUsage: project.currentSmsUsage,
      memberLimit: 0,
      aiLimit: 0,
      smsLimit: 0,
    },
  };
}

const STATE_ORDER: Record<SubscriptionState, number> = {
  active: 0,
  expired: 1,
  none: 2,
};

export default function BillingTab() {
  const queryClient = useQueryClient();
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [selectedProject, setSelectedProject] =
    useState<ProjectWithSubscription | null>(null);
  const [showPaymentMethodModal, setShowPaymentMethodModal] = useState(false);
  const [isUpdatingPayment, setIsUpdatingPayment] = useState(false);
  // 개인정보 처리 위탁 계약 동의 모달 상태 (구독하기 클릭 시 동의 여부 확인용)
  const [consentTarget, setConsentTarget] = useState<{
    id: number;
    name: string;
  } | null>(null);

  const openSubscribeCheckout = (project: { id: number; name: string }) => {
    const encodedProjectName = encodeURIComponent(project.name);
    const url = `${LANDING_URLS.PRICING}?step=checkout&projectId=${project.id}&projectName=${encodedProjectName}`;
    window.open(url, "_blank");
  };

  // "구독하기" 클릭 시 개인정보 처리 위탁 동의 여부를 확인하고 모달 또는 체크아웃을 진행한다.
  const handleSubscribe = async (project: { id: number; name: string }) => {
    try {
      const res = await ProjectPrivacyConsentService.get(project.id);
      const isConsented = Boolean(res.data?.data?.isConsented);
      if (!isConsented) {
        setConsentTarget({ id: project.id, name: project.name });
        return;
      }
    } catch (error) {
      // 동의 상태 확인 실패 시 UI 차단을 피하기 위해 기존 흐름으로 진행
      console.error("Failed to check project privacy consent:", error);
    }
    openSubscribeCheckout(project);
  };

  // 어드민 프로젝트 구독 정보 목록 가져오기
  const {
    data: adminProjects,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["subscription", "admin-projects"],
    queryFn: async () => {
      const res = await SubscriptionService.getAdminProjects();
      return res.data.data.projects;
    },
  });

  // 결제 수단 정보 가져오기
  const { activeBillingInfo, billingInfos, loading: billingLoading } = useBilling();

  // 등록 모드인지 확인 (billingInfos가 비어있거나 null인 경우)
  const isRegisterMode = !billingInfos || billingInfos.length === 0;

  // 결제 수단 제거 핸들러
  const handleRemoveBillingKey = () => {
    if (!activeBillingInfo?.id) {
      showErrorModal({
        title: "오류",
        headline: "등록된 결제 수단이 없습니다.",
        confirmText: "확인",
        hideCancel: true,
      });
      return;
    }

    // 확인 모달 표시
    showErrorModal({
      type: "info",
      title: "확인",
      headline: "결제 수단을 제거하시겠습니까?",
      description: "",
      confirmText: "제거",
      cancelText: "취소",
      hideCancel: false,
      onConfirm: async () => {
        try {
          await BillingService.remove(activeBillingInfo.id);
          
          // 캐시 무효화하여 결제 정보 새로고침
          queryClient.invalidateQueries({ queryKey: ["billing"] });
        } catch (error: any) {
          console.error("결제 수단 제거 실패:", error);
          
          // 첫 번째 모달을 먼저 닫기
          hideErrorModal();
          
          // 다음 틱에서 에러 모달 표시 (모달 상태 업데이트가 완료된 후)
          setTimeout(() => {
            // BILLING_KEY_IN_USE 에러 처리
            const errorCode = error?.data?.code;
            if (errorCode === "BILLING_KEY_IN_USE") {
              showErrorModal({
                title: "오류",
                headline: "현재 활성화된 구독이 있어서 삭제할 수 없습니다.",
                description: "구독을 먼저 취소해주세요.",
                confirmText: "확인",
                hideCancel: true,
              });
            } else {
              showErrorModal({
                title: "오류",
                headline: "결제 수단 제거에 실패했습니다.",
                description: "잠시 후 다시 시도해주세요.",
                confirmText: "확인",
                hideCancel: true,
              });
            }
          }, 0);
        }
      },
    });
  };

  const projectsWithSubscription: ProjectWithSubscription[] = [
    ...(adminProjects ?? []),
  ]
    .sort(
      (a, b) => STATE_ORDER[a.subscriptionState] - STATE_ORDER[b.subscriptionState]
    )
    .map(mapAdminProjectToViewModel);

  if (viewMode === "detail" && selectedProject) {
    return (
      <ProjectBillingDetail
        projectId={selectedProject.id}
        projectName={selectedProject.name}
        onBack={() => {
          setViewMode("list");
          setSelectedProject(null);
        }}
      />
    );
  }

  return (
    <div className="bg-card rounded-none md:rounded-[12px] min-h-screen md:min-h-0 pb-[140px] md:pb-0">
      <div className="space-y-5 md:space-y-6">
        {/* 페이지 제목 */}
        <div className="px-6 md:px-7 pt-5 md:pt-7">
          <h1 className="text-[20px] md:text-[24px] font-bold text-foreground">구독 관리</h1>
        </div>

        {/* 구분선 */}
        <div className="w-full border-b border-[#e9e9e9] dark:!border-[#44444455]"></div>

        <div className="px-6 md:px-7 pb-5 md:pb-7 space-y-4 md:space-y-9">
          {/* 프로젝트 관리 및 결제 수단 섹션 */}
          <div className="bg-card rounded-[12px] mb-6 md:mb-[30px] md:pl-[54px] p-4 md:p-6 border border-neutral-20">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-9">
              {/* 프로젝트 관리 */}
              <div className="flex items-center gap-4">
                <div className="w-[60px] h-[60px] flex items-center justify-center flex-shrink-0">
                  <svg
                    width="60"
                    height="60"
                    viewBox="0 0 60 60"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      opacity="0.1"
                      d="M48 0C54.6273 0.000125631 60 5.37266 60 12V48C59.9999 54.6272 54.6272 59.9999 48 60H12C5.37268 60 0.000147504 54.6273 0 48V12C0 5.37258 5.37258 4.83108e-07 12 0H48Z"
                      fill="#00E272"
                    />
                    <path
                      opacity="0.587821"
                      d="M38.0002 24.6663C40.2092 24.6665 42.0002 26.4573 42.0002 28.6663C42.0002 30.8753 40.2092 32.666 38.0002 32.6663C35.7911 32.6663 34.0002 30.8754 34.0002 28.6663C34.0003 26.4572 35.7911 24.6663 38.0002 24.6663ZM26.0002 17.9993C28.9456 17.9995 31.3333 20.3879 31.3333 23.3333C31.3331 26.2786 28.9455 28.6661 26.0002 28.6663C23.0548 28.6663 20.6664 26.2787 20.6663 23.3333C20.6663 20.3877 23.0547 17.9993 26.0002 17.9993Z"
                      fill="#00E272"
                    />
                    <path
                      d="M25.9772 31.3328C32.361 31.3328 37.606 34.3909 37.9967 40.9333C38.0122 41.1942 37.9968 41.9996 36.9957 41.9998H14.9703C14.6361 41.9998 13.9729 41.2791 14.0006 40.9324C14.5174 34.569 19.6822 31.3329 25.9772 31.3328ZM37.4694 34.0017C42.0105 34.0518 45.7183 36.3468 45.9977 41.199C46.0089 41.3944 45.9978 41.9994 45.275 41.9998H40.1334C40.1333 38.9993 39.1421 36.2297 37.4694 34.0017Z"
                      fill="#00E272"
                    />
                  </svg>
                </div>
                <div>
                  <h2 className="text-[16px] md:text-[18px] font-bold text-foreground mb-1">
                    프로젝트 관리
                  </h2>
                  <p className="text-[12px] md:text-[14px] text-neutral-90">
                    총 {projectsWithSubscription.length}개 프로젝트 진행중
                  </p>
                </div>
              </div>

              {/* 결제 수단 */}
              <div className="flex items-center gap-3">
                {/* 결제 수단 아이콘 */}
                <div className="w-[60px] h-[60px] flex items-center justify-center flex-shrink-0">
                  <svg
                    width="60"
                    height="60"
                    viewBox="0 0 60 60"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      opacity="0.1"
                      d="M48 0C54.6273 0.000125631 60 5.37266 60 12V48C59.9999 54.6272 54.6272 59.9999 48 60H12C5.37268 60 0.000147504 54.6273 0 48V12C0 5.37258 5.37258 4.83108e-07 12 0H48Z"
                      fill="#00E272"
                    />
                    <path
                      d="M19.4 20C17.5222 20 16 21.5222 16 23.4V30.2C16 32.0778 17.5222 33.6 19.4 33.6L19.4 23.4H36.4C36.4 21.5222 34.8778 20 33 20H19.4Z"
                      fill="#00E272"
                    />
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M22.8 30.2C22.8 28.3222 24.3222 26.8 26.2 26.8H39.8C41.6778 26.8 43.2 28.3222 43.2 30.2V37C43.2 38.8778 41.6778 40.4 39.8 40.4H26.2C24.3222 40.4 22.8 38.8778 22.8 37V30.2ZM33 37C34.8778 37 36.4 35.4778 36.4 33.6C36.4 31.7222 34.8778 30.2 33 30.2C31.1222 30.2 29.6 31.7222 29.6 33.6C29.6 35.4778 31.1222 37 33 37Z"
                      fill="#00E272"
                    />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center md:mb-1">
                    <h2 className="text-[14px] md:text-[16px] font-semibold text-foreground mr-3">
                      결제 수단
                    </h2>
                    <button
                      onClick={() => setShowPaymentMethodModal(true)}
                      className="cursor-pointer px-2 md:px-3 h-[28px] border border-neutral-30 text-[12px] md:text-[14px] font-semibold text-foreground rounded-[5px] hover:bg-neutral-10 transition-colors mr-2"
                    >
                      {isRegisterMode ? "등록" : "변경"}
                    </button>
                    {!isRegisterMode && (
                      <button
                        onClick={handleRemoveBillingKey}
                        className="cursor-pointer px-2 md:px-3 h-[28px] border border-neutral-30 text-[12px] md:text-[14px] font-semibold text-foreground rounded-[5px] hover:bg-neutral-10 transition-colors"
                      >
                        제거
                      </button>
                    )}
                  </div>
                  {billingLoading ? (
                    <div className="h-4 w-32 bg-neutral-20 rounded animate-pulse" />
                  ) : activeBillingInfo ? (
                    <div className="flex items-center gap-2">
                      <span className="text-[12px] md:text-[14px] text-neutral-60">
                        카드 결제 ({activeBillingInfo.cardCompany}{" "}
                        {activeBillingInfo.lastFourDigits
                          ? `**** **** **** ${activeBillingInfo.lastFourDigits}`
                          : "**** **** **** ****"})
                      </span>
                    </div>
                  ) : (
                    <p className="text-[12px] md:text-[14px] text-neutral-60">
                      등록된 결제 수단이 없습니다
                    </p>
                  )}
                </div>

              </div>
            </div>
          </div>

          {/* 프로젝트 카드 그리드 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-[30px]">
            {isLoading ? (
              // 로딩 스켈레톤
              Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="bg-card rounded-[12px] p-6 border border-neutral-20 animate-pulse"
                >
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-7 h-7 rounded-full bg-neutral-20" />
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
              ))
            ) : isError ? (
              <div className="col-span-2 text-center py-12">
                <p className="text-[16px] text-neutral-60">
                  프로젝트 정보를 불러오지 못했습니다
                </p>
              </div>
            ) : projectsWithSubscription.length === 0 ? (
              <div className="col-span-2 text-center py-12">
                <p className="text-[16px] text-neutral-60">
                  프로젝트가 없습니다
                </p>
              </div>
            ) : (
              projectsWithSubscription.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  onMoreClick={() => {
                    setSelectedProject(project);
                    setViewMode("detail");
                  }}
                  onSubscribe={() =>
                    void handleSubscribe({ id: project.id, name: project.name })
                  }
                />
              ))
            )}
          </div>

        </div>
      </div>

      {/* 결제 수단 등록/변경 모달 */}
      <ChangePaymentMethodModal
        isOpen={showPaymentMethodModal}
        onClose={() => setShowPaymentMethodModal(false)}
        isLoading={isUpdatingPayment}
        isRegisterMode={isRegisterMode}
        onConfirm={async (data: PaymentMethodData) => {
          setIsUpdatingPayment(true);
          try {
            if (isRegisterMode) {
              // 등록 모드: /v1/billing/register 호출
              await BillingService.register({
                cardNo: data.cardNo,
                expYear: data.expYear,
                expMonth: data.expMonth,
                idNo: data.idNo,
                cardPw: data.cardPw,
                buyerName: data.buyerName,
                buyerEmail: data.buyerEmail,
                buyerTel: data.buyerTel,
              });
            } else {
              // 변경 모드: /v1/billing/update 호출
              if (!activeBillingInfo?.id) {
                showErrorModal({
                  title: "오류",
                  headline: "등록된 결제 수단이 없습니다.",
                  confirmText: "확인",
                  hideCancel: true,
                });
                return;
              }

              await BillingService.update({
                billingInfoId: activeBillingInfo.id,
                cardNo: data.cardNo,
                expYear: data.expYear,
                expMonth: data.expMonth,
                idNo: data.idNo,
                cardPw: data.cardPw,
                buyerName: data.buyerName,
                buyerEmail: data.buyerEmail,
                buyerTel: data.buyerTel,
              });
            }

            // 캐시 무효화하여 결제 정보 새로고침
            queryClient.invalidateQueries({ queryKey: ["billing"] });
            setShowPaymentMethodModal(false);
          } catch (error) {
            console.error(`결제 수단 ${isRegisterMode ? "등록" : "변경"} 실패:`, error);
            showErrorModal({
              title: "오류",
              headline: `결제 수단 ${isRegisterMode ? "등록" : "변경"}에 실패했습니다.`,
              description: "잠시 후 다시 시도해주세요.",
              confirmText: "확인",
              hideCancel: true,
            });
          } finally {
            setIsUpdatingPayment(false);
          }
        }}
        currentBillingInfo={
          activeBillingInfo
            ? {
              id: activeBillingInfo.id,
            }
            : undefined
        }
      />

      {/* 개인정보 처리 위탁 계약 동의 모달 (구독하기 클릭 시 미동의 상태에서만 표시) */}
      {consentTarget && (
        <ProjectPrivacyConsentModal
          projectId={consentTarget.id}
          projectName={consentTarget.name}
          onConfirmed={() => {
            const target = consentTarget;
            setConsentTarget(null);
            openSubscribeCheckout(target);
          }}
        />
      )}
    </div>
  );
}

// 프로젝트 카드 컴포넌트
function ProjectCard({
  project,
  onMoreClick,
  onSubscribe,
}: {
  project: ProjectWithSubscription;
  onMoreClick: () => void;
  onSubscribe: () => void;
}) {
  const subscription = project.subscription;
  const usage = project.usage;

  // 플랜 태그 색상
  const planTagColor =
    subscription?.plan.name === "Premium"
      ? "bg-primary-10 text-primary-80"
      : "bg-neutral-20 text-neutral-70";

  // 사용량 비율 계산
  const memberUsage = usage?.memberCount || 0;
  const memberLimit = usage?.memberLimit || 0;
  const memberPercentage =
    memberLimit > 0 ? Math.min(100, (memberUsage / memberLimit) * 100) : 0;

  const aiUsage = usage?.aiUsage || 0;
  const aiLimit = usage?.aiLimit || 0;
  const aiPercentage = aiLimit > 0 ? Math.min(100, (aiUsage / aiLimit) * 100) : 0;

  const smsUsage = usage?.smsUsage || 0;
  const smsLimit = usage?.smsLimit || 0;
  const smsPercentage =
    smsLimit > 0 ? Math.min(100, (smsUsage / smsLimit) * 100) : 0;

  const isActive = project.state === "active";

  return (
    <div className="bg-card rounded-[12px] p-4 md:px-6 md:py-5 border border-neutral-20 flex flex-col min-h-[260px] md:min-h-[314px]">
      {/* 카드 헤더 */}
      <div className="flex items-center gap-3 mb-4">
        {/* 프로젝트 썸네일 */}
        {project.logoUrl ? (
          <div
            className={`w-7 h-7 rounded-full overflow-hidden flex-shrink-0 ${isActive ? "" : "opacity-60"}`}
          >
            <img
              src={project.logoUrl}
              alt={project.name}
              width={28}
              height={28}
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <div
            className={`w-7 h-7 rounded-full bg-neutral-20 flex-shrink-0 ${isActive ? "" : "opacity-60"}`}
          />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 md:gap-3 min-w-0">
            <h3
              title={project.name}
              className={`text-[14px] md:text-[18px] font-bold truncate min-w-0 ${isActive ? "text-foreground" : "text-neutral-50"}`}
            >
              {project.name}
            </h3>
            {subscription?.plan && (
              <span
                className={`px-2 py-0.5 ${planTagColor} text-[11px] md:text-[12px] font-medium rounded-full flex-shrink-0`}
              >
                {subscription.plan.name}
              </span>
            )}
            {project.state === "expired" && (
              <span className="px-3 h-[22px] leading-[22px] bg-[#D83232] text-white/80 text-[11px] md:text-[12px] font-medium rounded-full flex-shrink-0">
                만료
              </span>
            )}
            {project.state === "none" && (
              <span className="px-3 h-[22px] leading-[22px] bg-neutral-60 text-white/80 text-[11px] md:text-[12px] font-medium rounded-full flex-shrink-0">
                구독 전
              </span>
            )}
          </div>
          
        </div>
        
      </div>
      {subscription && (
            <p className="text-[11px] md:text-[14px] text-neutral-60 mb-5">
              {formatDateCompact(subscription.startDate)} ~{" "}
              {formatDateCompact(subscription.endDate)} (
              {subscription.billingCycle === "monthly"
                ? "월마다"
                : subscription.billingCycle === "quarterly"
                  ? "분기마다"
                  : "연마다"}{" "}
              결제)
            </p>
          )}

      {/* 비활성 상태 안내 문구 */}
      {!isActive && (
        <div className="flex-1 flex items-center justify-center px-4 py-6">
          <p className="text-[12px] md:text-[14px] text-center text-neutral-60">
            {project.state === "expired"
              ? "구독이 만료되었습니다. 다시 구독하시기 바랍니다."
              : "프로젝트 구독 전 입니다. 구독을 완료해주세요."}
          </p>
        </div>
      )}

      {/* 사용량 정보 */}
      {isActive && subscription && usage && (
        <div className="space-y-3 md:space-y-4 mb-4 md:mb-6 px-2">
          {/* 멤버 수 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[12px] md:text-[14px] text-neutral-100">멤버 수</span>
              <span className="text-[12px] md:text-[14px] text-foreground">
                <span className="font-bold">{formatCount(memberUsage)}</span>
                <span className="text-neutral-60">
                  {" "}
                  / {memberLimit > 0 ? `${formatCount(memberLimit)}` : "-"}
                </span>
              </span>
            </div>
            <div className="h-2 bg-neutral-20 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${memberPercentage}%`,
                  background:
                    "linear-gradient(90deg, #BDE3FF 1.3%, #9DF0C7 101.52%)",
                }}
              />
            </div>
          </div>

          {/* AI 상담 도우미 토큰 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[12px] md:text-[14px] text-neutral-100">
                AI 상담 도우미 토큰
              </span>
              <span className="text-[12px] md:text-[14px] text-foreground">
                <span className="font-bold">{formatCount(aiUsage)}</span>
                <span className="text-neutral-60">
                  {" "}
                  / {aiLimit > 0 ? `${formatCount(aiLimit)}` : "-"}
                </span>
              </span>
            </div>
            <div className="h-2 bg-neutral-20 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${aiPercentage}%`,
                  background:
                    "linear-gradient(90deg, #BDE3FF 1.3%, #9DF0C7 101.52%)",
                }}
              />
            </div>
          </div>

          {/* 문자 전송 횟수 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[12px] md:text-[14px] text-neutral-100">
                문자 전송 횟수
              </span>
              <span className="text-[12px] md:text-[14px] text-foreground">
                <span className="font-bold">{formatCount(smsUsage)}</span>
                <span className="text-neutral-60">
                  {" "}
                  / {smsLimit > 0 ? `${formatCount(smsLimit)}` : "-"}
                </span>
              </span>
            </div>
            <div className="h-2 bg-neutral-20 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${smsPercentage}%`,
                  background:
                    "linear-gradient(90deg, #BDE3FF 1.3%, #9DF0C7 101.52%)",
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* 하단 버튼 */}
      <div className="flex items-center justify-end mt-auto">
        {isActive ? (
          <button
            onClick={onMoreClick}
            className="cursor-pointer h-[34px] px-3 bg-neutral-0 text-neutral-100 border border-neutral-30 text-[12px] md:text-[14px] font-semibold tracking-[-0.02em] rounded-[5px] hover:bg-neutral-10 transition-colors"
          >
            더보기
          </button>
        ) : (
          <button
            onClick={onSubscribe}
            className="cursor-pointer h-[34px] px-3 bg-neutral-90 text-white dark:text-neutral-0 text-[12px] md:text-[14px] font-medium rounded-[5px] hover:bg-neutral-80 transition-colors"
          >
            구독하기
          </button>
        )}
      </div>
    </div>
  );
}
