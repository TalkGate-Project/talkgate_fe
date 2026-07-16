"use client";

import { useEffect, useMemo, useState } from "react";
import BaseModal from "@/components/common/BaseModal";
import DatePicker from "@/components/common/DatePicker";
import { showConfirmModal } from "@/lib/confirmModalEvents";
import { showErrorModal } from "@/lib/errorModalEvents";
import { AnalysisService } from "@/services/analysis";
import type { AnalysisProcedureType } from "@/types/analysis";
import type {
  FeePaymentType,
  FeePlan,
  FeePlanInstallment,
} from "@/types/analysisFeePlan";

type Props = {
  open: boolean;
  onClose: () => void;
  analysisId: number;
  projectId: string;
  trackingProcedure: AnalysisProcedureType;
  feePlan: FeePlan | null;
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
};

const EMPTY_FORM: FormState = {
  totalAmount: "",
  paymentType: "installment",
  installmentCount: "12",
  firstPaymentDate: null,
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
      className={`inline-flex h-6 items-center rounded-[5px] px-2 text-[12px] font-semibold ${status.className}`}
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
  trackingProcedure,
  feePlan,
  procedureProgress,
  onChanged,
}: Props) {
  const [currentPlan, setCurrentPlan] = useState<FeePlan | null>(feePlan);
  const [editingConditions, setEditingConditions] = useState(!feePlan);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [editingInstallmentId, setEditingInstallmentId] = useState<number | null>(null);
  const [paymentDate, setPaymentDate] = useState<Date | null>(null);

  useEffect(() => {
    if (!open) return;
    setCurrentPlan(feePlan);
    setEditingConditions(!feePlan);
    setEditingInstallmentId(null);
    setPaymentDate(null);
    setForm(
      feePlan
        ? {
            totalAmount: String(feePlan.totalAmount),
            paymentType: feePlan.paymentType,
            installmentCount: String(feePlan.installmentCount),
            firstPaymentDate: parseApiDate(feePlan.firstPaymentDate),
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
      totalAmount: String(currentPlan.totalAmount),
      paymentType: currentPlan.paymentType,
      installmentCount: String(currentPlan.installmentCount),
      firstPaymentDate: parseApiDate(currentPlan.firstPaymentDate),
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

    showConfirmModal({
      title: "결제 조건 확인",
      headline: "결제 조건을 변경하시겠습니까?",
      message:
        "결제 조건을 변경하면 이미 납부(완납/환불) 처리된 회차를 포함해 전체 회차 정보가 새로 계산됩니다.\n계속하시겠습니까?",
      type: "warning",
      confirmText: "확인",
      cancelText: "취소",
      onConfirm: async () => {
        setSubmitting(true);
        try {
          const firstPaymentDate = toApiDate(form.firstPaymentDate!);
          const response = currentPlan
            ? await AnalysisService.updateFeePlan(analysisId, {
                projectId,
                totalAmount,
                paymentType: form.paymentType,
                installmentCount,
                firstPaymentDate,
              })
            : await AnalysisService.createFeePlan(analysisId, {
                projectId,
                totalAmount,
                paymentType: form.paymentType,
                installmentCount,
                firstPaymentDate,
                trackingProcedure,
              });
          updateCurrentPlan(response.data.data);
        } catch (error) {
          console.error("Failed to save analysis fee plan:", error);
          showErrorModal({
            headline: "수임료 결제 조건을 저장하지 못했습니다.",
            description: "잠시 후 다시 시도해주세요.",
          });
        } finally {
          setSubmitting(false);
        }
      },
    });
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

  const requestPlanAction = (action: "stop" | "refund") => {
    if (!currentPlan || submitting || currentPlan.status !== "active") return;
    const isRefund = action === "refund";
    showConfirmModal({
      title: isRefund ? "수임료 환불" : "수임료 납부 중단",
      headline: isRefund ? "수임료 결제를 환불 처리할까요?" : "수임료 납부를 중단할까요?",
      message: isRefund
        ? "환불 처리 후에는 납부 정보를 변경할 수 없습니다."
        : "중단 처리 후에는 남은 회차를 납부 처리할 수 없습니다.",
      type: "warning",
      confirmText: isRefund ? "환불" : "중단",
      cancelText: "취소",
      onConfirm: async () => {
        setSubmitting(true);
        try {
          const response = isRefund
            ? await AnalysisService.refundFeePlan(analysisId, projectId)
            : await AnalysisService.stopFeePlan(analysisId, projectId);
          updateCurrentPlan(response.data.data);
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
      },
    });
  };

  const isPlanActive = currentPlan?.status === "active";
  const progressPercent =
    currentPlan && currentPlan.totalAmount > 0
      ? Math.min(100, Math.max(0, (paidAmount / currentPlan.totalAmount) * 100))
      : 0;

  return (
    <BaseModal
      onClose={handleClose}
      closeOnOverlayClick={!submitting}
      overlayClassName="bg-black/50 dark:bg-[#000000CC]"
      ariaLabel="수임료 결제 정보"
      fullScreenOnMobile
      positionerClassName="min-h-full flex items-center justify-center p-0 md:p-4"
      containerClassName={`bg-card dark:bg-[#1E1E1E] md:rounded-[14px] overflow-hidden shadow-[0_8px_24px_rgba(9,30,66,0.18)] dark:shadow-none flex flex-col ${
        editingConditions
          ? "md:w-[440px] md:h-[430px] md:max-h-[430px]"
          : "md:w-[868px]"
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

          <div className="flex-1 overflow-y-auto px-6 pb-4 md:overflow-y-visible md:px-7">
            <div className="rounded-[12px] bg-neutral-10 dark:bg-[#111111] p-5 md:h-[272px] md:p-6">
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
                  {formatAmount(currentPlan.totalAmount)}
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

            <div className="mt-6">
              <div className="flex items-end justify-between gap-3">
                <p className="text-[14px] font-medium text-neutral-60">납부현황</p>
                <p className="text-right text-[14px] text-neutral-60">
                  <strong className="text-[18px] text-foreground">
                    {paidInstallments.length}
                  </strong>
                  /{currentPlan.installments.length}회 ·{" "}
                  <strong className="text-foreground">{formatAmount(paidAmount)}만원</strong> /{" "}
                  {formatAmount(currentPlan.totalAmount)}만원
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
                    className="flex min-h-[62px] flex-wrap items-center gap-x-4 gap-y-3 rounded-[14px] border border-neutral-30 px-4 md:px-6"
                  >
                    <p className="w-[54px] shrink-0 text-[15px] font-semibold text-foreground">
                      {installment.installmentNumber}회차
                    </p>
                    <p className="w-[110px] shrink-0 text-[14px] text-neutral-60">
                      {formatDate(installment.scheduledDate)}
                    </p>
                    <p className="w-[88px] shrink-0 text-[16px] font-semibold text-foreground">
                      {formatAmount(installment.amount)}만원
                    </p>
                    <InstallmentStatus installment={installment} />

                    <div className="ml-auto flex min-w-0 items-center gap-2">
                      {editing ? (
                        <>
                          <div className="w-[190px] max-w-[45vw]">
                            <div className="relative">
                              <DatePicker
                                value={paymentDate}
                                onChange={setPaymentDate}
                                disabled={submitting}
                                className="!h-[38px] !pr-10"
                                dateFormat="yyyy. MM. dd"
                              />
                              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-neutral-50">
                                <CalendarIcon />
                              </span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => void confirmPayment(installment)}
                            disabled={!paymentDate || submitting}
                            aria-label={`${installment.installmentNumber}회차 납부 저장`}
                            className="cursor-pointer grid h-9 w-9 place-items-center rounded-[5px] bg-primary-60 text-white disabled:opacity-50"
                          >
                            <CheckIcon />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingInstallmentId(null);
                              setPaymentDate(null);
                            }}
                            disabled={submitting}
                            aria-label="납부 입력 취소"
                            className="cursor-pointer grid h-9 w-9 place-items-center rounded-[5px] bg-neutral-30 text-white disabled:opacity-50"
                          >
                            <CloseIcon />
                          </button>
                        </>
                      ) : installment.status === "scheduled" ? (
                        <button
                          type="button"
                          onClick={() => startPayment(installment)}
                          disabled={!canChange || submitting}
                          aria-label={`${installment.installmentNumber}회차 납부 처리`}
                          className="cursor-pointer h-8 w-8 rounded-[6px] border border-neutral-40 bg-card disabled:cursor-not-allowed disabled:opacity-40"
                        />
                      ) : installment.status === "paid" ? (
                        <button
                          type="button"
                          onClick={() => requestUnpay(installment)}
                          disabled={!canChange || submitting}
                          aria-label={`${installment.installmentNumber}회차 납부 처리 취소`}
                          className="cursor-pointer grid h-8 w-8 place-items-center rounded-[6px] bg-primary-60 text-white disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <CheckIcon />
                        </button>
                      ) : null}
                    </div>
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
    </BaseModal>
  );
}
