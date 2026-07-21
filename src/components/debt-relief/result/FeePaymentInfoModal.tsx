"use client";

import { useEffect, useMemo, useState } from "react";
import BaseModal from "@/components/common/BaseModal";
import DatePicker from "@/components/common/DatePicker";
import { showConfirmModal } from "@/lib/confirmModalEvents";
import { showErrorModal } from "@/lib/errorModalEvents";
import { AnalysisService } from "@/services/analysis";
import { DebtReliefService } from "@/services/debtRelief";
import type { ProcedureScore, RecommendedProcedure } from "@/types/debtRelief";
import type {
  FeePaymentType,
  FeePlan,
  FeePlanInstallment,
} from "@/types/analysisFeePlan";
import { wonToManwon } from "@/components/stats/fee/feeFormat";
import ProcedureSelectModal from "./ProcedureSelectModal";
import FeePlanActionConfirmModal, { type FeePlanAction } from "./FeePlanActionConfirmModal";

// 총 수임료 입력값(만원)이 이 값을 넘으면 오타(0 개수 실수 등) 가능성을 사용자에게 한 번 확인시킨다.
const LARGE_TOTAL_AMOUNT_MANWON_THRESHOLD = 5_000;

function manwonToWon(manwon: number): number {
  return manwon * 10_000;
}

type Props = {
  open: boolean;
  onClose: () => void;
  analysisId: number;
  projectId: string;
  /** 계약대기중 상태일 때만, 수임료 계획 최초 생성 직후 진행 절차 선택 모달을 띄운다 */
  isContractPending: boolean;
  feePlan: FeePlan | null;
  procedureScores: ProcedureScore[];
  procedureProgress: {
    current: number;
    total: number;
  };
  onChanged: () => void;
};

type FormState = {
  totalAmount: string;
  paymentType: FeePaymentType;
  installmentCount: string;
  firstPaymentDate: Date | null;
  note: string;
};

const EMPTY_FORM: FormState = {
  totalAmount: "",
  paymentType: "installment",
  installmentCount: "12",
  firstPaymentDate: null,
  note: "",
};

function parseApiDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const [year, month, day] = value.slice(0, 10).split("-").map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
}

function toApiDate(value: Date): string {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDate(value: string | null | undefined): string {
  if (!value) return "-";
  return value.slice(0, 10).replaceAll("-", ".");
}

function formatAmount(value: number): string {
  return Number.isFinite(value) ? value.toLocaleString("ko-KR") : "0";
}

function CloseIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M6 18L18 6M6 6L18 18"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
      <path
        d="M13.333 3.333a2.357 2.357 0 0 1 3.334 3.334l-9.584 9.583-4.166.833.833-4.166 9.583-9.584Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="m11.667 5 3.333 3.333" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
      <path
        d="m4.167 10.417 3.333 3.333 8.333-8.333"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
      <path
        d="M6.667 2.5v2.5M13.333 2.5v2.5M3.333 7.5h13.334M5 4.167h10c.92 0 1.667.746 1.667 1.666V15c0 .92-.747 1.667-1.667 1.667H5A1.667 1.667 0 0 1 3.333 15V5.833c0-.92.747-1.666 1.667-1.666Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function WarningTriangleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path
        d="M8.866 2.5c-.385-.666-1.347-.666-1.732 0L1.34 12.25c-.385.666.096 1.5.866 1.5h11.588c.77 0 1.251-.834.866-1.5L8.866 2.5Z"
        fill="#EFB008"
      />
      <path
        d="M8 6.167V9M8 11.167h.007"
        stroke="white"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function InstallmentStatus({ installment }: { installment: FeePlanInstallment }) {
  const status = {
    scheduled: {
      label: "미납",
      className: "bg-neutral-20 text-neutral-60 dark:bg-neutral-30 dark:text-neutral-60",
    },
    paid: {
      label: "완납",
      className: "bg-primary-10 text-primary-80 dark:bg-[#0A3D26] dark:text-primary-40",
    },
    refunded: {
      label: "환불",
      className: "bg-danger-10 text-danger-60 dark:bg-red-950 dark:text-red-300",
    },
    waived: {
      label: "면제",
      className: "bg-neutral-20 text-neutral-60 dark:bg-neutral-30 dark:text-neutral-70",
    },
  }[installment.status];

  return (
    <span
      className={`inline-flex h-[18px] shrink-0 items-center whitespace-nowrap rounded-[5px] px-1 text-[12px] font-medium ${status.className}`}
    >
      {status.label}
    </span>
  );
}

export default function FeePaymentInfoModal({
  open,
  onClose,
  analysisId,
  projectId,
  isContractPending,
  feePlan,
  procedureScores,
  procedureProgress,
  onChanged,
}: Props) {
  const [currentPlan, setCurrentPlan] = useState<FeePlan | null>(feePlan);
  const [editingConditions, setEditingConditions] = useState(!feePlan);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [editingInstallmentId, setEditingInstallmentId] = useState<number | null>(null);
  const [paymentDate, setPaymentDate] = useState<Date | null>(null);
  const [procedureSelectOpen, setProcedureSelectOpen] = useState(false);
  const [procedureSubmitting, setProcedureSubmitting] = useState(false);
  const [planActionModal, setPlanActionModal] = useState<FeePlanAction | null>(null);

  useEffect(() => {
    if (!open) return;
    setCurrentPlan(feePlan);
    setEditingConditions(!feePlan);
    setEditingInstallmentId(null);
    setPaymentDate(null);
    setForm(
      feePlan
        ? {
            totalAmount: String(wonToManwon(feePlan.totalAmount)),
            paymentType: feePlan.paymentType,
            installmentCount: String(feePlan.installmentCount),
            firstPaymentDate: parseApiDate(feePlan.firstPaymentDate),
            note: feePlan.note ?? "",
          }
        : EMPTY_FORM
    );
  }, [open, feePlan]);

  const paidInstallments = useMemo(
    () => currentPlan?.installments.filter((item) => item.status === "paid") ?? [],
    [currentPlan]
  );
  const paidAmount = useMemo(
    () => paidInstallments.reduce((sum, item) => sum + item.amount, 0),
    [paidInstallments]
  );

  if (!open) return null;

  const handleClose = () => {
    if (submitting) return;
    onClose();
  };

  const updateCurrentPlan = (nextPlan: FeePlan) => {
    setCurrentPlan(nextPlan);
    setEditingConditions(false);
    setEditingInstallmentId(null);
    setPaymentDate(null);
    onChanged();
  };

  const openConditionEditor = () => {
    if (!currentPlan || submitting) return;
    setForm({
      totalAmount: String(wonToManwon(currentPlan.totalAmount)),
      paymentType: currentPlan.paymentType,
      installmentCount: String(currentPlan.installmentCount),
      firstPaymentDate: parseApiDate(currentPlan.firstPaymentDate),
      note: currentPlan.note ?? "",
    });
    setEditingConditions(true);
  };

  const handleApplyConditions = () => {
    const totalAmount = Number(form.totalAmount);
    const installmentCount =
      form.paymentType === "lump_sum" ? 1 : Number(form.installmentCount);

    if (!Number.isInteger(totalAmount) || totalAmount <= 0) {
      showErrorModal({
        headline: "총 수임료를 확인해주세요.",
        description: "총 수임료를 만원 단위의 숫자로 입력해주세요.",
        hideCancel: true,
      });
      return;
    }
    if (!Number.isInteger(installmentCount) || installmentCount <= 0) {
      showErrorModal({
        headline: "분할 횟수를 확인해주세요.",
        description: "분할 횟수를 1회 이상의 숫자로 입력해주세요.",
        hideCancel: true,
      });
      return;
    }
    if (!form.firstPaymentDate) {
      showErrorModal({
        headline: "첫 회차 납부일을 선택해주세요.",
        hideCancel: true,
      });
      return;
    }

    const saveFeePlan = async () => {
      setSubmitting(true);
      const wasCreate = !currentPlan;
      try {
        const firstPaymentDate = toApiDate(form.firstPaymentDate!);
        const note = form.note.trim() || null;
        const totalAmountWon = manwonToWon(totalAmount);
        const response = currentPlan
          ? await AnalysisService.updateFeePlan(analysisId, {
              projectId,
              totalAmount: totalAmountWon,
              paymentType: form.paymentType,
              installmentCount,
              firstPaymentDate,
              message: note,
            })
          : await AnalysisService.createFeePlan(analysisId, {
              projectId,
              totalAmount: totalAmountWon,
              paymentType: form.paymentType,
              installmentCount,
              firstPaymentDate,
              message: note,
            });
        // fee-plan 저장 응답에는 전달사항이 포함되지 않아(분석 상세의 액션 메시지 히스토리로만 누적) 방금 입력한 값을 로컬로 반영
        updateCurrentPlan({ ...response.data.data, note });
        // 계약대기중 이전 단계에서도 수임료 계획을 미리 저장할 수 있어(trackingProcedure 없이 생성),
        // 최초 생성 직후 진행 절차를 바로 고르게 하는 건 계약대기중 상태일 때만 — 그 이전 단계는
        // 아직 추적할 절차를 정할 시점이 아니므로 여기서 묻지 않는다. 이미 절차를 추적 중인 건
        // (조건수정)도 절차를 바꾸는 액션이 아니므로 다시 묻지 않는다.
        // defaultProcedure가 없으면(procedureScores 없음) 모달이 렌더링되지 않아 닫을 방법이
        // 없는 채로 멈추므로, 그 경우엔 절차 선택을 건너뛴다.
        if (wasCreate && isContractPending && defaultProcedure) {
          setProcedureSelectOpen(true);
        }
      } catch (error) {
        console.error("Failed to save analysis fee plan:", error);
        showErrorModal({
          headline: "수임료 결제 조건을 저장하지 못했습니다.",
          description: "잠시 후 다시 시도해주세요.",
        });
      } finally {
        setSubmitting(false);
      }
    };

    const proceedToConfirm = () => {
      // 최초 결제 정보 생성 시에는 초기화될 기존 회차 정보가 없으므로 변경 확인 모달을 건너뛴다.
      if (!currentPlan) {
        void saveFeePlan();
        return;
      }
      showConfirmModal({
        title: "수임료 결제 정보",
        headline: "결제 정보를 변경합니다.",
        message:
          "이미 납부/환불 처리된 회차를 포함해 전체 회차 정보가 초기화됩니다.\n계속하시겠습니까?",
        type: "caution",
        confirmText: "확인",
        cancelText: "취소",
        onConfirm: saveFeePlan,
      });
    };

    // 0을 잘못 더 입력하는 등의 실수를 걸러내기 위한 확인 단계 — 임계값을 넘으면 한 번 더 확인시킨다.
    if (totalAmount > LARGE_TOTAL_AMOUNT_MANWON_THRESHOLD) {
      showErrorModal({
        type: "error",
        headline: "입력하신 총 수임료를 확인해주세요.",
        description: `총 수임료가 ${formatAmount(totalAmount)}만원으로 입력되었습니다. 금액이 맞다면 계속 진행해주세요.`,
        confirmText: "계속 진행",
        cancelText: "다시 확인",
        onConfirm: proceedToConfirm,
      });
      return;
    }

    proceedToConfirm();
  };

  const startPayment = (installment: FeePlanInstallment) => {
    if (submitting || currentPlan?.status !== "active") return;
    setEditingInstallmentId(installment.id);
    setPaymentDate(new Date());
  };

  const confirmPayment = async (installment: FeePlanInstallment) => {
    if (!paymentDate || submitting) return;
    setSubmitting(true);
    try {
      const response = await AnalysisService.payFeeInstallment(analysisId, installment.id, {
        projectId,
        paidAt: toApiDate(paymentDate),
      });
      updateCurrentPlan(response.data.data);
    } catch (error) {
      console.error("Failed to mark fee installment as paid:", error);
      showErrorModal({
        headline: "납부 정보를 저장하지 못했습니다.",
        description: "잠시 후 다시 시도해주세요.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const requestUnpay = (installment: FeePlanInstallment) => {
    if (submitting || currentPlan?.status !== "active") return;
    showConfirmModal({
      title: "납부 처리 취소",
      headline: `${installment.installmentNumber}회차 납부 처리를 취소할까요?`,
      message: "취소하면 해당 회차가 미납 상태로 변경됩니다.",
      type: "warning",
      confirmText: "취소하기",
      cancelText: "닫기",
      onConfirm: async () => {
        setSubmitting(true);
        try {
          const response = await AnalysisService.unpayFeeInstallment(
            analysisId,
            installment.id,
            projectId
          );
          updateCurrentPlan(response.data.data);
        } catch (error) {
          console.error("Failed to cancel fee installment payment:", error);
          showErrorModal({
            headline: "납부 처리를 취소하지 못했습니다.",
            description: "잠시 후 다시 시도해주세요.",
          });
        } finally {
          setSubmitting(false);
        }
      },
    });
  };

  const requestPlanAction = (action: FeePlanAction) => {
    if (!currentPlan || submitting || currentPlan.status !== "active") return;
    setPlanActionModal(action);
  };

  const handlePlanActionConfirm = async (message: string) => {
    if (!planActionModal) return;
    const action = planActionModal;
    const isRefund = action === "refund";
    const note = message || null;
    setSubmitting(true);
    try {
      const response = isRefund
        ? await AnalysisService.refundFeePlan(analysisId, projectId, { message: note })
        : await AnalysisService.stopFeePlan(analysisId, projectId, { message: note });
      // fee-plan 응답에는 전달사항이 포함되지 않아(분석 상세의 액션 메시지 히스토리로만 누적) 방금 입력한 값을 로컬로 반영
      updateCurrentPlan({ ...response.data.data, note });
      setPlanActionModal(null);
    } catch (error) {
      console.error(`Failed to ${action} analysis fee plan:`, error);
      showErrorModal({
        headline: isRefund
          ? "환불 처리에 실패했습니다."
          : "납부 중단 처리에 실패했습니다.",
        description: "잠시 후 다시 시도해주세요.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmProcedure = async (procedure: RecommendedProcedure) => {
    setProcedureSubmitting(true);
    try {
      await DebtReliefService.updateProcedureProgress(projectId, String(analysisId), {
        trackingProcedure: procedure,
      });
      setProcedureSelectOpen(false);
      onChanged();
    } catch (error) {
      console.error("Failed to set tracking procedure:", error);
      showErrorModal({
        headline: "진행 절차를 설정하지 못했습니다.",
        description: "잠시 후 다시 시도해주세요.",
      });
    } finally {
      setProcedureSubmitting(false);
    }
  };

  const defaultProcedure =
    procedureScores.find((score) => score.recommended)?.procedure ??
    procedureScores[0]?.procedure;

  const isPlanActive = currentPlan?.status === "active";
  const progressPercent =
    currentPlan && currentPlan.totalAmount > 0
      ? Math.min(100, Math.max(0, (paidAmount / currentPlan.totalAmount) * 100))
      : 0;

  // 최초 결제 정보 생성 후 진행 절차 선택 모달이 열려 있는 동안에는 본 모달을
  // 겹쳐서 노출하지 않고, 절차 선택 → 결제 정보 상세 순으로 순차 노출한다.
  if (procedureSelectOpen) {
    return (
      <>
        {defaultProcedure ? (
          <ProcedureSelectModal
            open={procedureSelectOpen}
            onClose={() => setProcedureSelectOpen(false)}
            onConfirm={handleConfirmProcedure}
            procedureScores={procedureScores}
            defaultProcedure={defaultProcedure}
            submitting={procedureSubmitting}
          />
        ) : null}
      </>
    );
  }

  return (
    <BaseModal
      onClose={handleClose}
      closeOnOverlayClick={!submitting}
      overlayClassName="bg-black/50 dark:bg-[#000000CC]"
      ariaLabel="수임료 결제 정보"
      fullScreenOnMobile
      disableAutoContainerSizing
      positionerClassName="min-h-full flex items-center justify-center p-0 md:p-4"
      containerClassName={`w-full h-full md:h-auto bg-card dark:bg-[#1E1E1E] md:rounded-[14px] overflow-hidden shadow-[0_8px_24px_rgba(9,30,66,0.18)] dark:shadow-none flex flex-col ${
        editingConditions
          ? "md:w-[440px] md:max-h-[min(720px,90vh)]"
          : "md:w-[868px] md:max-h-[90vh]"
      }`}
    >
      {editingConditions ? (
        <>
          <div className="flex items-center justify-between px-6 md:px-7 pt-6 pb-5">
            <h2 className="text-[18px] font-semibold text-foreground">수임료 결제 정보</h2>
            <button
              type="button"
              onClick={handleClose}
              disabled={submitting}
              aria-label="닫기"
              className="cursor-pointer grid h-6 w-6 place-items-center text-neutral-50 dark:text-[#959595] disabled:opacity-50"
            >
              <CloseIcon />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-6 pb-4 md:px-7">
            {currentPlan ? (
              <div className="mb-4 flex items-start gap-2 rounded-[8px] bg-warning-10 px-3 py-2.5 dark:bg-[#3D3000]">
                <span className="mt-0.5 shrink-0">
                  <WarningTriangleIcon />
                </span>
                <p className="text-[13px] leading-[18px] text-warning-80 dark:text-warning-20">
                  결제 조건을 수정하면 이미 납부/환불 처리된 회차를 포함해 전체 회차 정보가 초기화
                  됩니다.
                </p>
              </div>
            ) : null}

            <div className="rounded-[12px] bg-neutral-10 dark:bg-[#111111] p-5 md:p-6">
              <label className="block text-[14px] font-medium text-neutral-60 dark:text-[#B9B9B9]">
                총 수임료
              </label>
              <div className="relative mt-2">
                <input
                  type="text"
                  inputMode="numeric"
                  value={form.totalAmount}
                  onChange={(event) =>
                    setForm((previous) => ({
                      ...previous,
                      totalAmount: event.target.value.replace(/\D/g, ""),
                    }))
                  }
                  disabled={submitting}
                  className="h-[34px] w-full rounded-[5px] border border-neutral-30 dark:border-[#4D4D4D] bg-card dark:bg-[#1E1E1E] px-3 pr-12 text-[14px] text-foreground dark:text-[#FDFDFD] outline-none focus:border-neutral-50 dark:focus:border-[#959595] disabled:opacity-60"
                />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[13px] text-neutral-60 dark:text-[#B9B9B9]">
                  만원
                </span>
              </div>

              <div className="mt-5 grid grid-cols-1 gap-4 md:mt-6 md:grid-cols-[186px_138px] md:gap-3">
                <div>
                  <span className="block text-[14px] font-medium text-neutral-60 dark:text-[#B9B9B9]">
                    납부방식
                  </span>
                  <div className="mt-2 flex gap-2">
                    {(
                      [
                        ["installment", "분할납부"],
                        ["lump_sum", "일괄납부"],
                      ] as const
                    ).map(([value, label]) => {
                      const selected = form.paymentType === value;
                      return (
                        <button
                          key={value}
                          type="button"
                          onClick={() =>
                            setForm((previous) => ({
                              ...previous,
                              paymentType: value,
                              installmentCount:
                                value === "lump_sum" ? "1" : previous.installmentCount,
                            }))
                          }
                          disabled={submitting}
                          className={`cursor-pointer h-[34px] flex-1 rounded-full border px-3 text-[14px] font-medium disabled:opacity-60 ${
                            selected
                              ? "border-neutral-100 bg-neutral-100 text-neutral-0 dark:border-[#FDFDFD] dark:bg-[#FDFDFD] dark:text-[#111111]"
                              : "border-neutral-30 bg-card text-neutral-70 dark:border-[#4D4D4D] dark:bg-[#1E1E1E] dark:text-[#FDFDFD]"
                          }`}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-[14px] font-medium text-neutral-60 dark:text-[#B9B9B9]">
                    분할 횟수
                  </label>
                  <div className="relative mt-2">
                    <input
                      type="text"
                      inputMode="numeric"
                      value={form.installmentCount}
                      onChange={(event) =>
                        setForm((previous) => ({
                          ...previous,
                          installmentCount: event.target.value.replace(/\D/g, ""),
                        }))
                      }
                      disabled={submitting || form.paymentType === "lump_sum"}
                      className="h-[34px] w-full rounded-[5px] border border-neutral-30 dark:border-[#4D4D4D] bg-card dark:bg-[#1E1E1E] px-3 pr-12 text-[14px] text-foreground dark:text-[#FDFDFD] outline-none focus:border-neutral-50 dark:focus:border-[#959595] disabled:opacity-50"
                    />
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[13px] text-neutral-60 dark:text-[#B9B9B9]">
                      개월
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-5 md:mt-6 md:w-[175px]">
                <label className="block text-[14px] font-medium text-neutral-60 dark:text-[#B9B9B9]">
                  첫 회차 납부일
                </label>
                <div className="relative mt-2">
                  <DatePicker
                    value={form.firstPaymentDate}
                    onChange={(date) =>
                      setForm((previous) => ({ ...previous, firstPaymentDate: date }))
                    }
                    disabled={submitting}
                    className="!h-[34px] !rounded-[5px] !pr-10 dark:!border-[#4D4D4D] dark:!bg-[#1E1E1E] dark:!text-[#FDFDFD]"
                    dateFormat="yyyy. MM. dd"
                  />
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-neutral-50 dark:text-[#959595]">
                    <CalendarIcon />
                  </span>
                </div>
              </div>

              <div className="mt-5 md:mt-6">
                <label className="block text-[14px] font-medium text-neutral-60 dark:text-[#B9B9B9]">
                  전달사항 (선택)
                </label>
                <textarea
                  value={form.note}
                  onChange={(event) =>
                    setForm((previous) => ({ ...previous, note: event.target.value }))
                  }
                  placeholder="전달사항을 입력해 주세요"
                  rows={3}
                  disabled={submitting}
                  className="mt-2 w-full min-h-[72px] resize-none rounded-[5px] border border-neutral-30 bg-card px-3 py-2.5 text-[14px] text-foreground outline-none placeholder:text-neutral-50 focus:border-neutral-50 disabled:opacity-60 dark:border-[#4D4D4D] dark:bg-[#1E1E1E] dark:text-[#FDFDFD] dark:placeholder:text-[#959595] dark:focus:border-[#959595]"
                />
              </div>
            </div>
          </div>

          <div className="mt-auto flex justify-end gap-3 border-t border-neutral-30 dark:border-[#4D4D4D] px-6 md:px-7 py-4">
            <button
              type="button"
              onClick={() => {
                if (currentPlan) {
                  setEditingConditions(false);
                  return;
                }
                handleClose();
              }}
              disabled={submitting}
              className="cursor-pointer h-[34px] rounded-[5px] border border-neutral-30 dark:border-[#4D4D4D] px-3 text-[14px] font-semibold text-foreground dark:text-[#FDFDFD] disabled:opacity-50"
            >
              취소
            </button>
            <button
              type="button"
              onClick={handleApplyConditions}
              disabled={submitting}
              className="cursor-pointer h-[34px] rounded-[5px] bg-neutral-90 dark:bg-[#F5F5F5] px-3 text-[14px] font-semibold text-neutral-20 dark:text-[#333333] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? "적용 중..." : "적용"}
            </button>
          </div>
        </>
      ) : currentPlan ? (
        <>
          <div className="flex items-center justify-between gap-4 px-6 md:px-9 pt-6 pb-5">
            <div className="flex min-w-0 items-center gap-3">
              <h2 className="shrink-0 text-[20px] font-semibold text-foreground">
                수임료 결제 정보
              </h2>
              <span className="truncate rounded-[5px] bg-secondary-10 px-2 py-1 text-[12px] font-semibold text-secondary-60 dark:bg-blue-950 dark:text-blue-300">
                절차진행중 {procedureProgress.current}/{procedureProgress.total}
              </span>
            </div>
            <div className="flex shrink-0 items-center gap-4">
              <button
                type="button"
                onClick={openConditionEditor}
                disabled={!isPlanActive || submitting}
                className="cursor-pointer inline-flex h-[40px] items-center gap-2 rounded-[6px] border border-neutral-30 px-4 text-[14px] font-semibold text-foreground disabled:cursor-not-allowed disabled:opacity-40"
              >
                <EditIcon />
                <span className="hidden sm:inline">조건수정</span>
              </button>
              <button
                type="button"
                onClick={handleClose}
                disabled={submitting}
                aria-label="닫기"
                className="cursor-pointer grid h-6 w-6 place-items-center text-neutral-50 disabled:opacity-50"
              >
                <CloseIcon />
              </button>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-6 md:px-9 pb-7">
            <div className="grid grid-cols-1 gap-5 rounded-[8px] bg-neutral-10 p-5 dark:bg-neutral-20 sm:grid-cols-3 md:px-8">
              <div>
                <p className="text-[14px] font-medium text-neutral-60">총 수임료</p>
                <p className="mt-2 text-[24px] font-bold text-foreground">
                  {formatAmount(wonToManwon(currentPlan.totalAmount))}
                  <span className="ml-1 text-[14px] font-medium text-neutral-60">만원</span>
                </p>
              </div>
              <div>
                <p className="text-[14px] font-medium text-neutral-60">납부방식</p>
                <p className="mt-3 text-[18px] font-semibold text-foreground">
                  {currentPlan.paymentType === "lump_sum" ? "일괄납부" : "분할납부"}
                </p>
              </div>
              <div>
                <p className="text-[14px] font-medium text-neutral-60">납부일</p>
                <p className="mt-3 text-[18px] font-semibold text-foreground">
                  {formatDate(currentPlan.firstPaymentDate)}
                </p>
              </div>
            </div>

            {currentPlan.note?.trim() ? (
              <div className="mt-4 rounded-[8px] bg-neutral-10 p-5 dark:bg-neutral-20 md:px-8">
                <p className="text-[14px] font-medium text-neutral-60">전달사항</p>
                <p className="mt-2 whitespace-pre-wrap break-words text-[14px] leading-[150%] text-foreground">
                  {currentPlan.note}
                </p>
              </div>
            ) : null}

            <div className="mt-6">
              <div className="flex items-end justify-between gap-3">
                <p className="text-[14px] font-medium text-neutral-60">납부현황</p>
                <p className="text-right text-[14px] text-neutral-60">
                  <strong className="text-[18px] text-foreground">
                    {paidInstallments.length}
                  </strong>
                  /{currentPlan.installments.length}회 ·{" "}
                  <strong className="text-foreground">{formatAmount(wonToManwon(paidAmount))}만원</strong> /{" "}
                  {formatAmount(wonToManwon(currentPlan.totalAmount))}만원
                </p>
              </div>
              <div className="mt-2 h-[10px] overflow-hidden rounded-full bg-neutral-20 dark:bg-neutral-30">
                <div
                  className="h-full rounded-full bg-secondary-40 transition-[width]"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            <div className="mt-8 flex flex-col gap-3">
              {currentPlan.installments.map((installment) => {
                const editing = editingInstallmentId === installment.id;
                const canChange =
                  isPlanActive &&
                  (installment.status === "scheduled" || installment.status === "paid");

                return (
                  <div
                    key={installment.id}
                    className="flex w-full flex-col gap-3 rounded-[14px] border border-neutral-30 px-4 py-3 md:px-6"
                  >
                    {/* 1줄: 회차 요약 — 항상 한 줄. 회차/날짜/금액은 모든 행에서 동일한 고정폭이라 편집 중이든 아니든 열이 어긋나지 않음.
                        간격은 화면이 넓어질수록(모바일→태블릿→PC) 커지고, 상태칩→액션 사이도 동일한 간격을 공유함 */}
                    <div className="flex flex-nowrap items-center gap-3 md:gap-6 lg:gap-10">
                      <p className="w-[50px] shrink-0 whitespace-nowrap text-[14px] font-semibold text-foreground">
                        {installment.installmentNumber}회차
                      </p>
                      <p className="w-[78px] shrink-0 whitespace-nowrap text-[12px] font-medium text-neutral-60">
                        {formatDate(installment.scheduledDate)}
                      </p>
                      <p className="w-[64px] shrink-0 whitespace-nowrap text-[14px] font-semibold text-neutral-80">
                        {formatAmount(wonToManwon(installment.amount))}만원
                      </p>
                      <InstallmentStatus installment={installment} />

                      {editing ? (
                        <div className="ml-auto flex shrink-0 items-center gap-2">
                          {/* PC 전용: 날짜 입력을 같은 줄에 인라인으로 (모바일은 아래 2줄에 따로 표시) */}
                          <div className="relative hidden w-[175px] shrink-0 md:block">
                            <DatePicker
                              value={paymentDate}
                              onChange={setPaymentDate}
                              disabled={submitting}
                              className="!h-[34px] !pr-10"
                              dateFormat="yyyy. MM. dd"
                            />
                            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-neutral-50">
                              <CalendarIcon />
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => void confirmPayment(installment)}
                            disabled={!paymentDate || submitting}
                            aria-label={`${installment.installmentNumber}회차 납부 저장`}
                            className="cursor-pointer grid h-6 w-6 shrink-0 place-items-center rounded-[5px] bg-primary-60 text-white disabled:opacity-50"
                          >
                            <CheckIcon />
                          </button>
                          {/* PC 전용: 취소 버튼도 같은 줄에 (모바일은 아래 2줄의 취소 버튼 사용) */}
                          <button
                            type="button"
                            onClick={() => {
                              setEditingInstallmentId(null);
                              setPaymentDate(null);
                            }}
                            disabled={submitting}
                            aria-label="납부 입력 취소"
                            className="hidden h-6 w-6 shrink-0 cursor-pointer place-items-center rounded-[5px] bg-neutral-30 text-white disabled:opacity-50 md:grid"
                          >
                            <CloseIcon />
                          </button>
                        </div>
                      ) : installment.status === "scheduled" ? (
                        <button
                          type="button"
                          onClick={() => startPayment(installment)}
                          disabled={!canChange || submitting}
                          aria-label={`${installment.installmentNumber}회차 납부 처리`}
                          className="ml-auto h-6 w-6 shrink-0 cursor-pointer rounded-[5px] border border-neutral-40 bg-card disabled:cursor-not-allowed disabled:opacity-40"
                        />
                      ) : installment.status === "paid" ? (
                        <button
                          type="button"
                          onClick={() => requestUnpay(installment)}
                          disabled={!canChange || submitting}
                          aria-label={`${installment.installmentNumber}회차 납부 처리 취소`}
                          className="ml-auto grid h-6 w-6 shrink-0 cursor-pointer place-items-center rounded-[5px] bg-primary-60 text-white disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <CheckIcon />
                        </button>
                      ) : null}
                    </div>

                    {/* 2줄: 모바일 전용 — 편집 중일 때만, 날짜 입력+취소를 한 그룹으로 오른쪽 정렬 (PC는 위 1줄에 이미 인라인으로 포함되어 이 줄이 숨겨짐) */}
                    {editing && (
                      <div className="flex items-center md:hidden">
                        <div className="ml-auto flex shrink-0 items-center gap-2">
                          <div className="relative w-[175px] shrink-0">
                            <DatePicker
                              value={paymentDate}
                              onChange={setPaymentDate}
                              disabled={submitting}
                              className="!h-[34px] !pr-10"
                              dateFormat="yyyy. MM. dd"
                            />
                            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-neutral-50">
                              <CalendarIcon />
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingInstallmentId(null);
                              setPaymentDate(null);
                            }}
                            disabled={submitting}
                            aria-label="납부 입력 취소"
                            className="cursor-pointer grid h-6 w-6 shrink-0 place-items-center rounded-[5px] bg-neutral-30 text-white disabled:opacity-50"
                          >
                            <CloseIcon />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {!isPlanActive ? (
              <p className="mt-5 text-center text-[14px] font-medium text-neutral-60">
                {currentPlan.status === "refunded"
                  ? "환불 처리된 결제 계획입니다."
                  : "납부가 중단된 결제 계획입니다."}
              </p>
            ) : null}
          </div>

          <div className="mt-auto flex justify-end gap-3 border-t border-neutral-30 px-6 md:px-9 py-4">
            <button
              type="button"
              onClick={() => requestPlanAction("stop")}
              disabled={!isPlanActive || submitting}
              className="cursor-pointer h-[42px] rounded-[6px] border border-neutral-30 px-4 text-[15px] font-semibold text-foreground disabled:cursor-not-allowed disabled:opacity-40"
            >
              중단
            </button>
            <button
              type="button"
              onClick={() => requestPlanAction("refund")}
              disabled={!isPlanActive || submitting}
              className="cursor-pointer h-[42px] rounded-[6px] bg-danger-40 px-4 text-[15px] font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              환불
            </button>
          </div>
        </>
      ) : null}

      <FeePlanActionConfirmModal
        open={planActionModal !== null}
        action={planActionModal ?? "stop"}
        submitting={submitting}
        onClose={() => setPlanActionModal(null)}
        onConfirm={handlePlanActionConfirm}
      />
    </BaseModal>
  );
}
