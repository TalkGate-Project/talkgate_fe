import React, { useState } from "react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { SelectField } from "./SelectField";
import { formatDetailDate } from "./utils";
import { CustomerFormState } from "./useCustomerDetail";
import { CustomerDetail, CustomerTendency } from "@/types/customers";
import DatePicker from "@/components/common/DatePicker";
import TimePicker from "@/components/common/TimePicker";
import { showConfirmModal } from "@/lib/confirmModalEvents";
import { showErrorModal } from "@/lib/errorModalEvents";

const PAYMENT_METHOD_OPTIONS = [
  { value: "creditCard", label: "신용카드" },
  { value: "debitCard", label: "체크카드" },
  { value: "bankTransfer", label: "계좌이체" },
  { value: "virtualAccount", label: "가상계좌" },
  { value: "mobilePayment", label: "모바일 결제" },
  { value: "kakaoPay", label: "카카오페이" },
  { value: "naverPay", label: "네이버페이" },
  { value: "payco", label: "페이코" },
  { value: "samsungPay", label: "삼성페이" },
  { value: "applePay", label: "애플페이" },
  { value: "googlePay", label: "구글페이" },
  { value: "toss", label: "토스" },
  { value: "phoneBill", label: "휴대폰 결제" },
  { value: "giftCard", label: "상품권" },
  { value: "point", label: "포인트" },
  { value: "coupon", label: "쿠폰" },
  { value: "cash", label: "현금" },
  { value: "cryptocurrency", label: "가상자산" },
] as const;

const SCHEDULE_TIME_PRESETS = [
  { label: "10분 후", minutes: 10 },
  { label: "30분 후", minutes: 30 },
  { label: "1시간 후", minutes: 60 },
  { label: "2시간 후", minutes: 120 },
  { label: "3시간 후", minutes: 180 },
  { label: "6시간 후", minutes: 360 },
  { label: "24시간 후", minutes: 24 * 60 },
] as const;

const CUSTOMER_TENDENCY_OPTIONS: { value: CustomerTendency; label: string }[] = [
  { value: CustomerTendency.ImmediateDecision, label: "즉시 결정형" },
  { value: CustomerTendency.ComparativeReview, label: "비교 검토형" },
  { value: CustomerTendency.InformationCollection, label: "정보 수집형" },
  { value: CustomerTendency.PriceSensitive, label: "가격 민감형" },
  { value: CustomerTendency.Aggressive, label: "공격적" },
  { value: CustomerTendency.Friendly, label: "친화적" },
  { value: CustomerTendency.RejectionDefensive, label: "거절 방어적" },
];

type Props = {
  form: CustomerFormState;
  setForm: React.Dispatch<React.SetStateAction<CustomerFormState>>;
  paymentHistories: CustomerDetail["paymentHistories"];
  schedules: CustomerDetail["schedules"];
  onAddPayment: (
    date: string,
    amount: string,
    method: string,
    desc: string
  ) => void;
  onRemovePayment: (id: number) => void;
  onAddSchedule: (
    dateIso: string,
    desc: string,
    colorCode: string
  ) => Promise<void>;
  onRemoveSchedule: (id: number) => void;
};

export default function SalesTab({
  form,
  setForm,
  paymentHistories,
  schedules,
  onAddPayment,
  onRemovePayment,
  onAddSchedule,
  onRemoveSchedule,
}: Props) {
  // Payment Inputs
  const [paymentDate, setPaymentDate] = useState<Date | null>(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  // API 값 기준 (creditCard, cash, bankTransfer ...)
  const [paymentMethod, setPaymentMethod] = useState<string>(
    PAYMENT_METHOD_OPTIONS[0]?.value ?? "creditCard"
  );
  const [paymentDesc, setPaymentDesc] = useState("");
  const [paymentSubmitAttempted, setPaymentSubmitAttempted] = useState(false);

  // Schedule Inputs
  const [scheduleDate, setScheduleDate] = useState<Date | null>(null);
  /** "HH:mm" 24시간제 */
  const [scheduleTime, setScheduleTime] = useState<string | null>(null);
  const [scheduleDesc, setScheduleDesc] = useState("");
  const [scheduleColor, setScheduleColor] = useState<string>("#00E272");
  const [scheduleSubmitAttempted, setScheduleSubmitAttempted] = useState(false);
  const [isAddingSchedule, setIsAddingSchedule] = useState(false);

  const paymentDateError =
    paymentSubmitAttempted && !paymentDate ? "날짜를 선택해 주세요." : "";
  const paymentAmountError =
    paymentSubmitAttempted && !paymentAmount ? "금액을 입력해 주세요." : "";

  const scheduleDateError =
    scheduleSubmitAttempted && !scheduleDate ? "날짜를 선택해 주세요." : "";
  const scheduleTimeError =
    scheduleSubmitAttempted && !scheduleTime ? "시간을 선택해 주세요." : "";
  const scheduleDescError =
    scheduleSubmitAttempted && !scheduleDesc.trim()
      ? "일정내용을 입력해 주세요."
      : "";

  const handleAddPayment = () => {
    if (!paymentDate || !paymentAmount) {
      setPaymentSubmitAttempted(true);
      return;
    }
    onAddPayment(paymentDate.toISOString(), paymentAmount, paymentMethod, paymentDesc);
    setPaymentDate(null);
    setPaymentAmount("");
    setPaymentDesc("");
    setPaymentSubmitAttempted(false);
  };

  const getPaymentMethodLabel = (method: string) => {
    const found = PAYMENT_METHOD_OPTIONS.find((opt) => opt.value === method);
    return found ? found.label : method;
  };

  const applyScheduleTimePreset = (minutesToAdd: number) => {
    const target = new Date();
    target.setMinutes(target.getMinutes() + minutesToAdd);

    setScheduleDate(
      new Date(target.getFullYear(), target.getMonth(), target.getDate())
    );
    setScheduleTime(
      `${String(target.getHours()).padStart(2, "0")}:${String(target.getMinutes()).padStart(2, "0")}`
    );
    setScheduleSubmitAttempted(false);
  };

  const handleAddSchedule = async () => {
    if (!scheduleDate || !scheduleTime || !scheduleDesc.trim() || !scheduleColor) {
      setScheduleSubmitAttempted(true);
      return;
    }

    if (isAddingSchedule) return;

    const [hhStr, mmStr] = scheduleTime.split(":");
    const hh = Number(hhStr || "0");
    const mm = Number(mmStr || "0");

    const dateIso = new Date(
      scheduleDate.getFullYear(),
      scheduleDate.getMonth(),
      scheduleDate.getDate(),
      hh,
      mm,
      0,
      0
    ).toISOString();

    setIsAddingSchedule(true);
    try {
      await onAddSchedule(dateIso, scheduleDesc, scheduleColor);
      setScheduleDate(null);
      setScheduleTime(null);
      setScheduleDesc("");
      setScheduleSubmitAttempted(false);
    } catch (error) {
      console.error("Failed to add schedule:", error);
      showErrorModal({
        headline: "일정 등록에 실패했습니다.",
        description: "잠시 후 다시 시도해주세요.",
        hideCancel: true,
        confirmText: "확인",
      });
    } finally {
      setIsAddingSchedule(false);
    }
  };

  const formatScheduleTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      if (isNaN(date.getTime())) return "";
      return format(date, "yyyy. MM. dd a hh : mm", { locale: ko });
    } catch (_e) {
      return "";
    }
  };

  const formatCreatedAt = (isoString: string) => {
    try {
      const date = new Date(isoString);
      if (isNaN(date.getTime())) return "";
      return format(date, "yyyy. MM. dd HH:mm", { locale: ko });
    } catch (_e) {
      return "";
    }
  };

  return (
    <div className="mt-3 space-y-[30px]">
      {/* Investment Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
        <label className="block">
          <span className="block text-[14px] text-[#6B7280] dark:text-neutral-60 mb-1 font-medium">
            요약정보
          </span>
          <input
            value={form.summary}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, summary: e.target.value }))
            }
            className="w-full h-[34px] rounded-[5px] border border-[#E5E7EB] dark:border-[#444444] px-3 font-medium text-[14px] text-ink dark:text-neutral-80 bg-card dark:bg-neutral-10"
            placeholder="요약정보를 입력하세요."
          />
        </label>
        <label className="block">
          <span className="block text-[14px] text-[#6B7280] dark:text-neutral-60 mb-1 font-medium">
            자산현황
          </span>
          <input
            value={form.assetStatus}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                assetStatus: e.target.value,
              }))
            }
            className="w-full h-[34px] rounded-[5px] border border-[#E5E7EB] dark:border-[#444444] px-3 font-medium text-[14px] text-ink dark:text-neutral-80 bg-card dark:bg-neutral-10"
            placeholder="자산현황을 입력하세요."
          />
        </label>
        <label className="block">
          <span className="block text-[14px] text-[#6B7280] dark:text-neutral-60 mb-1 font-medium">
            고객성향
          </span>
          <SelectField
            value={form.tendency}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                tendency: e.target.value,
              }))
            }
            className="h-[34px] w-full font-medium text-[14px]"
          >
            <option value="">선택</option>
            {CUSTOMER_TENDENCY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </SelectField>
        </label>
        <label className="block">
          <span className="block text-[14px] text-[#6B7280] dark:text-neutral-60 mb-1 font-medium">
            거절사유
          </span>
          <input
            value={form.rejectionReason}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                rejectionReason: e.target.value,
              }))
            }
            className="w-full h-[34px] rounded-[5px] border border-[#E5E7EB] dark:border-[#444444] px-3 font-medium text-[14px] text-ink dark:text-neutral-80 bg-card dark:bg-neutral-10"
            placeholder="거절사유를 입력하세요."
          />
        </label>
      </div>

      <div className="w-full">
        <span className="block text-[14px] text-[#6B7280] dark:text-neutral-60 mb-1 font-medium">
          특이사항
        </span>
        <textarea
          value={form.specialNotes}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, specialNotes: e.target.value }))
          }
          rows={3}
          className="w-full rounded-[5px] border border-[#E5E7EB] dark:border-[#444444] px-3 py-2 font-medium text-[14px] text-ink dark:text-neutral-80 bg-card dark:bg-neutral-10"
          placeholder="특이사항을 입력하세요."
        />
      </div>

      {/* Payment History */}
      <div>
        <div className="mb-3 pb-2 border-b border-[#E2E2E2] dark:border-[#444444]">
          <div className="text-[16px] font-semibold text-neutral-90 dark:text-neutral-90">
            매출 내역
          </div>
        </div>
        <div className="md:hidden space-y-4 mb-4">
          <label className="block">
            <span className="flex items-center gap-1 text-[14px] text-[#6B7280] dark:text-neutral-60 mb-1 font-medium">
              날짜
              <span className="text-danger-40">*</span>
            </span>
            <div className="relative h-[34px]">
              <DatePicker
                value={paymentDate}
                onChange={setPaymentDate}
                className="h-[34px] w-full pr-9 font-medium"
                invalid={!!paymentDateError}
              />
              <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-neutral-60 dark:text-neutral-60">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 20 20"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M6.66667 5.83333V2.5M13.3333 5.83333V2.5M5.83333 9.16667H14.1667M4.16667 17.5H15.8333C16.7538 17.5 17.5 16.7538 17.5 15.8333V5.83333C17.5 4.91286 16.7538 4.16667 15.8333 4.16667H4.16667C3.24619 4.16667 2.5 4.91286 2.5 5.83333V15.8333C2.5 16.7538 3.24619 17.5 4.16667 17.5Z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </div>
            {paymentDateError && (
              <p className="mt-1 text-[12px] text-danger-40">{paymentDateError}</p>
            )}
          </label>
          <label className="block">
            <span className="block text-[14px] text-[#6B7280] dark:text-neutral-60 mb-1 font-medium">
              결제수단
            </span>
            <SelectField
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="h-[34px] rounded-[5px] text-[14px] font-medium"
            >
              {PAYMENT_METHOD_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </SelectField>
          </label>
          <label className="block">
            <span className="flex items-center gap-1 text-[14px] text-[#6B7280] dark:text-neutral-60 mb-1 font-medium">
              금액
              <span className="text-danger-40">*</span>
            </span>
            <input
              value={paymentAmount}
              onChange={(e) =>
                setPaymentAmount(e.target.value.replace(/[^0-9]/g, ""))
              }
              placeholder="금액을 입력하세요."
              className={`h-[34px] w-full rounded-[5px] border border-[#E5E7EB] dark:border-[#444444] px-3 text-[14px] font-medium text-ink dark:text-neutral-80 bg-card dark:bg-neutral-10 ${
                paymentAmountError ? "!border-danger-40 dark:!border-danger-40" : ""
              }`}
            />
            {paymentAmountError && (
              <p className="mt-1 text-[12px] text-danger-40">{paymentAmountError}</p>
            )}
          </label>
          <label className="block">
            <span className="block text-[14px] text-[#6B7280] dark:text-neutral-60 mb-1 font-medium">
              설명
            </span>
            <input
              value={paymentDesc}
              onChange={(e) => setPaymentDesc(e.target.value)}
              placeholder="설명을 입력하세요."
              className="h-[34px] w-full rounded-[5px] border border-[#E5E7EB] dark:border-[#444444] px-3 text-[14px] font-medium text-ink dark:text-neutral-80 bg-card dark:bg-neutral-10"
            />
          </label>
          <div className="flex justify-end">
            <button
              className="cursor-pointer w-[48px] h-[34px] rounded-[5px] bg-neutral-90 text-neutral-20 text-[14px] font-semibold"
              onClick={handleAddPayment}
            >
              추가
            </button>
          </div>
        </div>
        <div className="hidden md:grid md:grid-cols-[200px_120px_160px_minmax(0,1fr)_auto] md:gap-2 md:items-start">
          <label className="block">
            <span className="flex items-center gap-1 text-[14px] text-neutral-60 dark:text-neutral-60 mb-1 font-medium">
              날짜
              <span className="text-danger-40">*</span>
            </span>
            <div className="relative h-[34px]">
              <DatePicker
                value={paymentDate}
                onChange={setPaymentDate}
                className="h-[34px] pr-9 font-medium"
                invalid={!!paymentDateError}
              />
              <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-neutral-60 dark:text-neutral-60">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 20 20"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M6.66667 5.83333V2.5M13.3333 5.83333V2.5M5.83333 9.16667H14.1667M4.16667 17.5H15.8333C16.7538 17.5 17.5 16.7538 17.5 15.8333V5.83333C17.5 4.91286 16.7538 4.16667 15.8333 4.16667H4.16667C3.24619 4.16667 2.5 4.91286 2.5 5.83333V15.8333C2.5 16.7538 3.24619 17.5 4.16667 17.5Z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </div>
            {paymentDateError && (
              <p className="mt-1 text-[12px] text-danger-40">{paymentDateError}</p>
            )}
          </label>
          <label className="block">
            <span className="block text-[14px] text-neutral-60 dark:text-neutral-60 mb-1 font-medium">
              결제수단
            </span>
            <SelectField
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="h-[34px] rounded-[5px] text-[14px] font-medium"
            >
              {PAYMENT_METHOD_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </SelectField>
          </label>
          <label className="block">
            <span className="flex items-center gap-1 text-[14px] text-neutral-60 dark:text-neutral-60 mb-1 font-medium">
              금액
              <span className="text-danger-40">*</span>
            </span>
            <input
              value={paymentAmount}
              onChange={(e) =>
                setPaymentAmount(e.target.value.replace(/[^0-9]/g, ""))
              }
              placeholder="금액을 입력하세요."
              className={`h-[34px] w-full rounded-[5px] border border-[#E5E7EB] dark:border-[#444444] px-3 text-[14px] font-medium text-ink dark:text-neutral-80 bg-card dark:bg-neutral-10 ${
                paymentAmountError ? "!border-danger-40 dark:!border-danger-40" : ""
              }`}
            />
            {paymentAmountError && (
              <p className="mt-1 text-[12px] text-danger-40">{paymentAmountError}</p>
            )}
          </label>
          <label className="block">
            <span className="block text-[14px] text-neutral-60 dark:text-neutral-60 mb-1 font-medium">
              설명
            </span>
            <input
              value={paymentDesc}
              onChange={(e) => setPaymentDesc(e.target.value)}
              placeholder="설명을 입력하세요."
              className="h-[34px] w-full rounded-[5px] border border-[#E5E7EB] dark:border-[#444444] px-3 text-[14px] font-medium text-ink dark:text-neutral-80 bg-card dark:bg-neutral-10"
            />
          </label>
          <button
            className="cursor-pointer w-[48px] h-[34px] mt-[22px] rounded-[5px] bg-neutral-90 text-neutral-20 text-[14px] font-semibold"
            onClick={handleAddPayment}
          >
            추가
          </button>
        </div>

        <div className="mt-3 space-y-2 max-h-[200px] overflow-auto pr-1">
          {paymentHistories?.map((ph) => (
            <div
              key={ph.id}
              className="bg-neutral-10 dark:bg-neutral-20 rounded-[12px] px-4 py-3 text-[14px] flex items-center gap-3 md:grid md:grid-cols-[200px_120px_160px_minmax(0,1fr)_auto] md:gap-2 md:items-center"
            >
              <span className="w-[166px] md:w-auto text-neutral-60 dark:text-neutral-60 whitespace-nowrap">
                {formatDetailDate(ph.paymentDate)}
              </span>
              <div className="min-w-0 md:-ml-2">
                <span className="inline-flex max-w-full items-center justify-center px-3 py-1 rounded-[30px] bg-[#E2F5EB] dark:bg-[#D6FAE8] text-[#22C55E] dark:text-[#10B981] text-[12px] whitespace-nowrap">
                  {getPaymentMethodLabel(ph.paymentMethod)}
                </span>
              </div>
              <span className="flex-1 md:flex-none text-[#16A34A] dark:text-[#22C55E] font-semibold whitespace-nowrap">
                {ph.amount?.toLocaleString()}원
              </span>
              <span className="flex-1 md:flex-none min-w-0 truncate text-ink dark:text-neutral-80">
                {ph.description || "결제"}
              </span>

              <button
                className="cursor-pointer ml-2 md:ml-0 md:justify-self-end w-5 h-5 grid place-items-center rounded-full bg-neutral-100 dark:bg-neutral-80 text-white dark:text-neutral-20"
                onClick={() => {
                  showConfirmModal({
                    title: "확인",
                    message: "매출 내역을 삭제하시겠습니까?",
                    confirmText: "삭제",
                    cancelText: "취소",
                    onConfirm: () => onRemovePayment(ph.id),
                  });
                }}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Schedule Management */}
      <div>
        <div className="mb-3 pb-2 border-b border-[#E2E2E2] dark:border-[#444444]">
          <div className="text-[16px] font-semibold text-neutral-90 dark:text-neutral-90">
            일정관리
          </div>
        </div>

        {/* 날짜 & 컬러 영역 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
          {/* 날짜 */}
          <div>
          <div className="mb-2 flex items-center gap-1 text-[14px] font-medium leading-[1] tracking-[0.2px] text-neutral-60 dark:text-neutral-60">
            날짜
            <span className="text-danger-40">*</span>
          </div>
            <div className="grid grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] gap-2 h-[34px]">
              <div className="relative h-[34px]">
                <DatePicker
                  value={scheduleDate}
                  onChange={setScheduleDate}
                  className="h-[34px] pr-9"
                  invalid={!!scheduleDateError}
                />
                <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center">
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 20 20"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M6.66667 5.83333V2.5M13.3333 5.83333V2.5M5.83333 9.16667H14.1667M4.16667 17.5H15.8333C16.7538 17.5 17.5 16.7538 17.5 15.8333V5.83333C17.5 4.91286 16.7538 4.16667 15.8333 4.16667H4.16667C3.24619 4.16667 2.5 4.91286 2.5 5.83333V15.8333C2.5 16.7538 3.24619 17.5 4.16667 17.5Z"
                      stroke="#B0B0B0"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              </div>
              <TimePicker
                value={scheduleTime}
                onChange={setScheduleTime}
                minuteStep={10}
                className="rounded-[5px] border-[#E5E7EB] dark:border-[#444444] text-ink dark:text-neutral-80 bg-card dark:bg-neutral-10"
                invalid={!!scheduleTimeError}
              />
            </div>
            {(scheduleDateError || scheduleTimeError) && (
              <p className="mt-1 text-[12px] text-danger-40">
                {scheduleDateError || scheduleTimeError}
              </p>
            )}
          </div>

          {/* 컬러 */}
          <div>
          <div className="mb-2 text-[14px] font-medium leading-[1] tracking-[0.2px] text-neutral-60 dark:text-neutral-60">
            컬러
          </div>
            <div className="flex items-center gap-2 h-[34px]">
              {[
                { hex: "#00E272", cls: "bg-primary-60" },
                { hex: "#00B55B", cls: "bg-primary-80" },
                { hex: "#7EA5F8", cls: "bg-secondary-20" },
                { hex: "#2563EB", cls: "bg-secondary-60" },
                { hex: "#EFB008", cls: "bg-warning-40" },
                { hex: "#976400", cls: "bg-warning-60" },
                { hex: "#D83232", cls: "bg-danger-40" },
                { hex: "#FC9595", cls: "bg-danger-20" },
              ].map((c) => {
                const selected =
                  scheduleColor.toLowerCase() === c.hex.toLowerCase();
                return (
                  <button
                    key={c.hex}
                    type="button"
                    className={`cursor-pointer w-[22px] h-[22px] rounded-full flex items-center justify-center border transition-colors ${
                      selected ? "border-2 border-neutral-90 dark:border-neutral-80" : "border-transparent"
                    }`}
                    onClick={() => setScheduleColor(c.hex)}
                  >
                    <span
                      className={`w-[18px] h-[18px] rounded-full ${c.cls}`}
                    />
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="mb-4 flex items-center gap-3 overflow-x-auto">
          {SCHEDULE_TIME_PRESETS.map((preset) => (
            <button
              key={preset.label}
              type="button"
              className="cursor-pointer flex-shrink-0 h-[34px] px-3 rounded-[5px] border border-[#E2E2E2] dark:border-[#444444] text-[14px] font-medium leading-[17px] tracking-[-0.02em] text-ink dark:text-neutral-80 bg-card dark:bg-neutral-10 whitespace-nowrap"
              onClick={() => applyScheduleTimePreset(preset.minutes)}
            >
              {preset.label}
            </button>
          ))}
        </div>

        {/* 일정내용 */}
        <div>
          <div className="mb-2 flex items-center gap-1 text-[14px] font-medium leading-[1] tracking-[0.2px] text-neutral-60 dark:text-neutral-60">
            일정내용
            <span className="text-danger-40">*</span>
          </div>
          <div className="flex gap-2">
            <input
              value={scheduleDesc}
              onChange={(e) => setScheduleDesc(e.target.value)}
              placeholder="일정내용을 입력하세요."
              className={`w-full h-[34px] rounded-[5px] border border-neutral-30 dark:border-neutral-30 px-3 text-[14px] leading-[1] tracking-[0.2px] text-ink dark:text-neutral-80 bg-card dark:bg-neutral-10 ${
                scheduleDescError ? "!border-danger-40 dark:!border-danger-40" : ""
              }`}
            />
            <button
              className={`cursor-pointer w-[48px] h-[34px] rounded-[5px] bg-neutral-90 text-neutral-20 text-[14px] font-semibold ${
                isAddingSchedule ? "cursor-not-allowed opacity-50" : ""
              }`}
              onClick={() => void handleAddSchedule()}
              disabled={isAddingSchedule}
            >
              추가
            </button>
          </div>
          {scheduleDescError && (
            <p className="mt-1 text-[12px] text-danger-40">{scheduleDescError}</p>
          )}
        </div>

        <div className="mt-3 space-y-2 max-h-[220px] overflow-auto pr-1">
          {schedules?.map((sc) => {
            // colorCode에 # 접두사 보장
            const normalizedColor = sc.colorCode 
              ? (sc.colorCode.startsWith("#") ? sc.colorCode : `#${sc.colorCode}`)
              : "#00E272";

            const deleteButton = (
              <button
                className="cursor-pointer w-5 h-5 shrink-0 grid place-items-center rounded-full bg-[#000] dark:bg-neutral-80 text-white dark:text-neutral-20 text-[16px] leading-[1]"
                onClick={() => {
                  showConfirmModal({
                    title: "확인",
                    message: "일정을 삭제하시겠습니까?",
                    confirmText: "삭제",
                    cancelText: "취소",
                    onConfirm: () => onRemoveSchedule(sc.id),
                  });
                }}
              >
                ×
              </button>
            );
            
            return (
              <div
                key={sc.id}
                className="bg-neutral-10 dark:bg-neutral-25 rounded-[12px] px-4 py-3 text-[14px]"
              >
                {/* 모바일: 날짜/일정내용 2줄 + 삭제버튼 안쪽 */}
                <div className="md:hidden flex flex-col gap-1">
                  <div className="flex items-start gap-3">
                    <div className="flex flex-col gap-2 shrink-0">
                      <span className="inline-flex items-center justify-center px-3 py-1 rounded-[30px] bg-[#D6FAE8] dark:bg-[#D6FAE8] text-[#10B981] dark:text-[#10B981] text-[12px] whitespace-nowrap">
                        {formatScheduleTime(sc.scheduleTime)}
                      </span>
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span
                          className="w-3 h-3 rounded-full shrink-0"
                          style={{ backgroundColor: normalizedColor }}
                        />
                        <span className="text-ink dark:text-neutral-80 text-[12px] truncate max-w-[120px]">{sc.description}</span>
                      </div>
                    </div>
                    <span className="mt-0.75 text-neutral-60 dark:text-neutral-60 text-[12px] flex-1 min-w-0 truncate">{formatCreatedAt(sc.createdAt)}</span>
                    <div className="h-full flex items-center justify-center min-h-[52px]">
                    {deleteButton}
                    </div>
                  </div>
                </div>
                {/* 웹: 기존 가로 배치 유지 */}
                <div className="hidden md:flex items-center gap-3">
                  <span className="inline-flex items-center justify-center px-3 py-1 rounded-[30px] bg-[#D6FAE8] dark:bg-[#D6FAE8] text-[#10B981] dark:text-[#10B981] text-[12px] whitespace-nowrap">
                    {formatScheduleTime(sc.scheduleTime)}
                  </span>
                  <span
                    className="w-4 h-4 rounded-full shrink-0"
                    style={{ backgroundColor: normalizedColor }}
                  />
                  <span className="text-ink dark:text-neutral-80 flex-1 truncate">{sc.description}</span>
                  <span className="ml-auto text-neutral-60 dark:text-neutral-60 whitespace-nowrap">
                    {formatCreatedAt(sc.createdAt)}
                  </span>
                  {deleteButton}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
