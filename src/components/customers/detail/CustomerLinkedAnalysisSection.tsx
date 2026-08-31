"use client";

import { useRouter } from "next/navigation";
import LinkIcon from "@/components/icons/LinkIcon";
import {
  ProcedureBadge,
  ProcedureNameText,
  StatusBadge,
  DebtAmountText,
  FeePlanCell,
} from "@/components/debt-relief/DiagnosisBadges";
import { formatDebtManwonParts } from "@/components/debt-relief/format";
import { useDebtReliefMenu } from "@/hooks/useDebtReliefMenu";
import { showErrorModal } from "@/lib/errorModalEvents";
import { normalizeProcedureType } from "@/types/analysis";
import type { CustomerLinkedAnalysis } from "@/types/customers";

type Props = {
  customerId: number;
  customerName: string;
  /** "새 진단 추가" 진입 시 프리필용. male/female만 유효하고, 그 외(빈 값 등)는 프리필하지 않는다. */
  customerGender?: string | null;
  hasAssignedMember: boolean;
  linkedAnalysis?: CustomerLinkedAnalysis | null;
  layout?: "responsive" | "mobile";
};

function formatBasicInfoMeta(
  linkedAnalysis: Pick<CustomerLinkedAnalysis, "ageGroup" | "gender" | "employmentType">
): string {
  const { ageGroup, gender, employmentType } = linkedAnalysis;
  const genderLabel = gender === "male" ? "남" : gender === "female" ? "여" : gender;
  return [ageGroup, genderLabel, employmentType].filter(Boolean).join(" · ");
}

// procedureSteps는 실 API가 내려주는 절차 단계 원본이라 debtRelief.ts의 정적 단계명 추정 테이블보다
// 정확하다 — isCurrent 우선, 없으면 stepId로 currentProcedureStep을 찾아 위치를 역산한다.
function resolveProgress(linkedAnalysis: CustomerLinkedAnalysis): {
  current: number;
  total: number;
  title: string;
} {
  // API 응답에 procedureSteps가 누락될 수 있어(예: feePlan이 null 등) 안전하게 기본값 처리
  const steps = linkedAnalysis.procedureSteps ?? [];
  if (steps.length === 0) return { current: 1, total: 1, title: "확인 중" };

  let currentIndex = steps.findIndex((step) => step.isCurrent);
  if (currentIndex < 0) {
    currentIndex = steps.findIndex((step) => step.stepId === linkedAnalysis.currentProcedureStep);
  }
  const resolvedIndex = currentIndex >= 0 ? currentIndex : 0;
  return {
    current: resolvedIndex + 1,
    total: steps.length,
    title: steps[resolvedIndex]?.title ?? "확인 중",
  };
}

function LinkedAnalysisLinkIcon({ size }: { size: number }) {
  return (
    <div
      className={`shrink-0 rounded-[5px] bg-secondary-10 border border-secondary-60 flex items-center justify-center ${
        size === 24 ? "w-6 h-6" : "w-[34px] h-[34px]"
      }`}
    >
      <LinkIcon size={size === 24 ? 16 : 20} className="text-secondary-60" />
    </div>
  );
}

function EmptyLinkedAnalysis({
  customerId,
  customerName,
  customerGender,
  hasAssignedMember,
  variant,
}: {
  customerId: number;
  customerName: string;
  customerGender?: string | null;
  hasAssignedMember: boolean;
  variant: "mobile" | "desktop";
}) {
  const router = useRouter();
  const isMobile = variant === "mobile";

  const handleAdd = () => {
    if (!hasAssignedMember) {
      showErrorModal({
        type: "info",
        title: "알림",
        headline: "담당자가 배정되지 않은 고객입니다.",
        description: "진단을 추가하려면 먼저 담당자를 배정한 뒤 다시 시도해주세요.",
        hideCancel: true,
      });
      return;
    }

    const params = new URLSearchParams({ customerId: String(customerId), customerName });
    // ageGroup/job은 고객 쪽 데이터가 자유 텍스트/추정이라 잘못 매핑되면 분석 결과를 조용히
    // 틀리게 만들 수 있어 프리필 대상에서 제외 — gender만 enum-to-enum으로 무손실 매핑 가능.
    if (customerGender === "male" || customerGender === "female") {
      params.set("gender", customerGender);
    }
    router.push(`/debt-relief/new?${params.toString()}`);
  };

  return (
    <div
      className={
        isMobile
          ? "flex items-center gap-4 px-3 h-[58px] rounded-[12px] border border-neutral-30 dark:border-[#444444] bg-card dark:bg-neutral-10"
          : "flex items-center gap-4 h-[58px] px-4 py-3 rounded-[12px] border border-[#E2E2E2] dark:border-[#444444] bg-card dark:bg-neutral-10"
      }
    >
      <div
        className={`shrink-0 rounded-[5px] bg-neutral-10 dark:bg-neutral-20 border border-[#E2E2E2] dark:border-[#444444] flex items-center justify-center ${
          isMobile ? "w-6 h-6" : "w-[34px] h-[34px]"
        }`}
      >
        <LinkIcon size={isMobile ? 16 : 20} className="text-neutral-50" />
      </div>
      <span className="inline-flex items-center h-6 px-3 rounded-full bg-neutral-10 dark:bg-neutral-20 text-[12px] font-medium text-neutral-60 opacity-80">
        진단 데이터가 없습니다.
      </span>
      <button
        type="button"
        onClick={handleAdd}
        className="cursor-pointer ml-auto shrink-0 h-[34px] px-3 rounded-[5px] border border-[#E2E2E2] dark:border-[#444444] text-[14px] font-semibold text-ink hover:bg-neutral-10 dark:hover:bg-neutral-20"
      >
        추가하기
      </button>
    </div>
  );
}

/** 모바일 피그마 consultation list: 327×86, pad 16×12, gap 16, 링크아이콘 + 콘텐츠 */
function MobileLinkedAnalysisCard({
  customerName,
  linkedAnalysis,
  onOpenResult,
}: {
  customerName: string;
  linkedAnalysis: CustomerLinkedAnalysis;
  onOpenResult: () => void;
}) {
  const procedure = linkedAnalysis.procedure
    ? normalizeProcedureType(linkedAnalysis.procedure)
    : undefined;
  const { current, total, title } = resolveProgress(linkedAnalysis);
  const isProgressKnown = total > 1;
  const progressPercent = isProgressKnown ? Math.round((current / total) * 100) : 0;
  const hasScore = linkedAnalysis.currentProcedureScore != null;
  const score = Math.min(100, Math.max(0, Math.round(linkedAnalysis.currentProcedureScore ?? 0)));
  const { amount: debtAmount, unit: debtUnit } = formatDebtManwonParts(linkedAnalysis.totalDebt);
  const meta = formatBasicInfoMeta(linkedAnalysis);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpenResult}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpenResult();
        }
      }}
      aria-label={`${customerName} 진단 결과 보기`}
      className="cursor-pointer flex items-center gap-4 px-3 py-4 h-[86px] rounded-[12px] border border-neutral-30 dark:border-[#444444] bg-card dark:bg-neutral-10"
    >
      <LinkedAnalysisLinkIcon size={24} />

      <div className="flex-1 min-w-0 h-[54px] flex flex-col justify-between">
        {/* 상단: 이름 + 나이·성별·직업 | 절차 칩 */}
        <div className="flex items-center justify-between gap-2 min-h-[25px]">
          <div className="flex items-center gap-1 min-w-0 flex-1">
            <p className="text-[16px] font-semibold leading-[19px] text-neutral-90 whitespace-nowrap shrink-0">
              {customerName}
            </p>
            {meta && (
              <span className="text-[12px] font-medium leading-[14px] text-neutral-60 opacity-80 truncate min-w-0">
                {meta}
              </span>
            )}
          </div>
          <span className="shrink-0 opacity-80">
            <ProcedureBadge procedure={procedure} />
          </span>
        </div>

        {/* 하단: [진행라벨+바] [점수] … [채무] — 점수는 바 근처, 채무는 우측 */}
        <div className="flex items-end gap-2 w-full min-w-0">
          <div className="flex flex-col gap-1 w-[148px] shrink-0 min-w-0">
            <p className="text-[12px] font-medium leading-[14px] tracking-[-0.02em] text-neutral-90 whitespace-nowrap truncate">
              {isProgressKnown ? `${current}/${total} · ${title}` : title}
            </p>
            <div className="h-1.5 w-full rounded-[30px] bg-neutral-30 overflow-hidden">
              <div
                className="h-full rounded-l-[30px] bg-secondary-20"
                style={{ width: `${isProgressKnown ? Math.max(progressPercent, 4) : 0}%` }}
              />
            </div>
          </div>

          {hasScore && (
            <span className="inline-flex items-end whitespace-nowrap shrink-0">
              <span className="text-[16px] font-semibold leading-none text-neutral-90">{score}</span>
              <span className="text-[10px] font-medium leading-none tracking-[-0.02em] text-neutral-60">
                /100
              </span>
            </span>
          )}

          <span className="ml-auto inline-flex items-end whitespace-nowrap shrink-0 opacity-80">
            <span className="text-[14px] font-bold leading-none text-black dark:text-foreground">
              {debtAmount}
            </span>
            {debtUnit && (
              <span className="text-[12px] font-medium leading-none tracking-normal text-black dark:text-foreground">
                {debtUnit}
              </span>
            )}
          </span>
        </div>
      </div>
    </div>
  );
}

function DesktopLinkedAnalysisCard({
  customerName,
  linkedAnalysis,
  onOpenResult,
}: {
  customerName: string;
  linkedAnalysis: CustomerLinkedAnalysis;
  onOpenResult: () => void;
}) {
  const procedure = linkedAnalysis.procedure
    ? normalizeProcedureType(linkedAnalysis.procedure)
    : undefined;
  const { current, total } = resolveProgress(linkedAnalysis);
  const isProgressKnown = total > 1;
  // status는 백엔드 반영 전이라 응답에 없을 수 있음 — 이 카드는 procedure가 있을 때만
  // 노출되므로(추적 중인 절차가 있다는 뜻) 값이 없으면 in_progress로 간주해 칩을 채운다.
  const status = linkedAnalysis.status ?? (linkedAnalysis.procedure ? "in_progress" : undefined);

  return (
    <div className="flex items-center gap-4 h-[58px] px-4 py-3 rounded-[12px] border border-[#E2E2E2] dark:border-[#444444] bg-card dark:bg-neutral-10">
      <LinkedAnalysisLinkIcon size={34} />
      <div className="flex flex-col gap-0.5 min-w-0 w-[120px] shrink-0">
        <p className="text-[14px] font-bold text-neutral-90 opacity-80 truncate">{customerName}</p>
        <p className="text-[12px] font-medium text-neutral-60 opacity-80 truncate">
          {formatBasicInfoMeta(linkedAnalysis)}
        </p>
      </div>
      <DebtAmountText manwon={linkedAnalysis.totalDebt} />
      <div className="flex-1 flex items-center gap-2 min-w-0">
        <ProcedureNameText procedure={procedure} />
        {status && (
          <StatusBadge status={status} stepLabel={isProgressKnown ? `${current}/${total}` : undefined} />
        )}
      </div>
      {/* feePlan은 백엔드 반영 전이라 undefined일 수 있음 — FeePlanCell이 null이면 "결제 미설정"으로 안전 처리 */}
      <FeePlanCell summary={linkedAnalysis.feePlan ?? null} />
      <button
        type="button"
        onClick={onOpenResult}
        className="cursor-pointer shrink-0 h-[34px] px-3 rounded-[5px] border border-[#E2E2E2] dark:border-[#444444] text-[14px] font-semibold text-ink hover:bg-neutral-10 dark:hover:bg-neutral-20"
      >
        결과보기
      </button>
    </div>
  );
}

export default function CustomerLinkedAnalysisSection({
  customerId,
  customerName,
  customerGender,
  hasAssignedMember,
  linkedAnalysis,
  layout = "responsive",
}: Props) {
  const router = useRouter();
  const [showDebtReliefMenu, debtReliefReady] = useDebtReliefMenu();

  // 헤더에 회생·파산 메뉴가 노출되는 프로젝트(analysis/lawyer)에서만 표시 (useDebtReliefMenu와 동일 기준)
  if (!debtReliefReady || !showDebtReliefMenu) return null;

  const openResult = () => {
    if (!linkedAnalysis) return;
    router.push(`/debt-relief/${linkedAnalysis.id}?openCustomer=true`);
  };

  return (
    <div className={layout === "mobile" ? "" : "lg:col-span-2"}>
      <div className="text-[16px] font-semibold text-neutral-90 mb-3">채무조정 진단 정보</div>
      <div className="border-b border-[#E2E2E2] dark:border-[#e2e2e266] mb-3" />

      {/*
        이 섹션은 데스크톱 모달 안에서도 오른쪽 사이드 패널(330~384px)과 나란히 배치되어
        실제 가용 폭이 뷰포트보다 훨씬 좁다. md(780px)~lg(1080px) 구간에서는 그 폭이
        DesktopLinkedAnalysisCard가 요구하는 최소 폭보다 작아 요소가 깨지므로,
        이 섹션만 lg 기준으로 모바일형 카드를 더 오래 사용한다.
      */}
      {!linkedAnalysis ? (
        <>
          <div className={layout === "mobile" ? "" : "lg:hidden"}>
            <EmptyLinkedAnalysis
              customerId={customerId}
              customerName={customerName}
              customerGender={customerGender}
              hasAssignedMember={hasAssignedMember}
              variant="mobile"
            />
          </div>
          <div className={layout === "mobile" ? "hidden" : "hidden lg:block"}>
            <EmptyLinkedAnalysis
              customerId={customerId}
              customerName={customerName}
              customerGender={customerGender}
              hasAssignedMember={hasAssignedMember}
              variant="desktop"
            />
          </div>
        </>
      ) : (
        <>
          <div className={layout === "mobile" ? "" : "lg:hidden"}>
            <MobileLinkedAnalysisCard
              customerName={customerName}
              linkedAnalysis={linkedAnalysis}
              onOpenResult={openResult}
            />
          </div>
          <div className={layout === "mobile" ? "hidden" : "hidden lg:block"}>
            <DesktopLinkedAnalysisCard
              customerName={customerName}
              linkedAnalysis={linkedAnalysis}
              onOpenResult={openResult}
            />
          </div>
        </>
      )}
    </div>
  );
}
