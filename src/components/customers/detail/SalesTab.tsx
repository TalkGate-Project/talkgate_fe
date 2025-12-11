import React, { useState } from "react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { SelectField } from "./SelectField";
import { formatDetailDate } from "./utils";
import { CustomerFormState } from "./useCustomerDetail";
import { CustomerDetail } from "@/types/customers";
import DatePicker from "@/components/common/DatePicker";
import TimePicker from "@/components/common/TimePicker";

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
  onAddSchedule: (dateIso: string, desc: string, colorCode: string) => void;
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

  // Schedule Inputs
  const [scheduleDate, setScheduleDate] = useState<Date | null>(null);
  /** "HH:mm" 24시간제 */
  const [scheduleTime, setScheduleTime] = useState<string | null>(null);
  const [scheduleDesc, setScheduleDesc] = useState("");
  const [scheduleColor, setScheduleColor] = useState<string>("#00E272");

  const handleAddPayment = () => {
    if (!paymentDate || !paymentAmount) return;
    onAddPayment(paymentDate.toISOString(), paymentAmount, paymentMethod, paymentDesc);
    setPaymentDate(null);
    setPaymentAmount("");
    setPaymentDesc("");
  };

  const getPaymentMethodLabel = (method: string) => {
    const found = PAYMENT_METHOD_OPTIONS.find((opt) => opt.value === method);
    return found ? found.label : method;
  };

  const handleAddSchedule = () => {
    if (!scheduleDate || !scheduleTime || !scheduleDesc.trim() || !scheduleColor) return;

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

    onAddSchedule(
      dateIso,
      scheduleDesc,
      scheduleColor
    );
    setScheduleDate(null);
    setScheduleTime(null);
    setScheduleDesc("");
  };

  const formatScheduleTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      if (isNaN(date.getTime())) return "";
      return format(date, "yyyy. MM. dd a hh : mm", { locale: ko });
    } catch (e) {
      return "";
    }
  };

  const formatCreatedAt = (isoString: string) => {
    try {
      const date = new Date(isoString);
      if (isNaN(date.getTime())) return "";
      return format(date, "yyyy. MM. dd HH:mm", { locale: ko });
    } catch (e) {
      return "";
    }
  };

  return (
    <div className="mt-3 space-y-[30px]">
      {/* Investment Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
        <label className="block">
          <span className="block text-[14px] text-[#6B7280] mb-1 font-medium">
            투자정보
          </span>
          <input
            value={form.investmentInfo}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, investmentInfo: e.target.value }))
            }
            className="w-full h-[34px] rounded-[5px] border border-[#E5E7EB] px-3 font-medium text-[14px]"
            placeholder="투자정보를 입력하세요"
          />
        </label>
        <label className="block">
          <span className="block text-[14px] text-[#6B7280] mb-1 font-medium">
            투자손익
          </span>
          <input
            value={form.investmentProfitLoss}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                investmentProfitLoss: e.target.value,
              }))
            }
            className="w-full h-[34px] rounded-[5px] border border-[#E5E7EB] px-3 font-medium text-[14px]"
            placeholder="0"
          />
        </label>
        <label className="block">
          <span className="block text-[14px] text-[#6B7280] mb-1 font-medium">
            투자성향
          </span>
          <SelectField
            value={form.investmentRiskLevel}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                investmentRiskLevel: e.target.value,
              }))
            }
            className="h-[34px] w-full font-medium text-[14px]"
          >
            <option value="">선택</option>
            <option>안정형</option>
            <option>중립형</option>
            <option>공격형</option>
          </SelectField>
        </label>
      </div>

      {/* Payment History */}
      <div>
        <div className="mb-3 pb-2 border-b border-[#E2E2E2]">
          <div className="text-[16px] font-semibold text-neutral-90">
            결제 내역
          </div>
        </div>
        <div className="subdescription text-[14px] text-neutral-60 font-medium leading-[1] mb-2 grid grid-cols-1 md:grid-cols-2 gap-6">
          <span>날짜</span>
          <span>금액</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="grid grid-cols-[180px_minmax(0,1fr)] gap-2">
            <div className="relative h-[34px]">
              <DatePicker
                value={paymentDate}
                onChange={setPaymentDate}
                className="h-[34px] pr-9 font-medium"
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
            <input
              value={paymentAmount}
              onChange={(e) =>
                setPaymentAmount(e.target.value.replace(/[^0-9]/g, ""))
              }
              placeholder="금액"
              className="h-[34px] rounded-[5px] border border-[#E5E7EB] px-3 text-[14px] font-medium"
            />
          </div>
          <div className="grid grid-cols-[140px_minmax(0,1fr)_auto] gap-2">
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
            <input
              value={paymentDesc}
              onChange={(e) => setPaymentDesc(e.target.value)}
              placeholder="설명을 추가하세요"
              className="h-[34px] rounded-[5px] border border-[#E5E7EB] px-3 text-[14px] font-medium"
            />
            <button
              className="cursor-pointer w-[48px] h-[34px] rounded-[5px] bg-neutral-90 text-neutral-20 text-[14px] font-semibold"
              onClick={handleAddPayment}
            >
              추가
            </button>
          </div>
        </div>

        <div className="mt-3 space-y-2 max-h-[200px] overflow-auto pr-1">
          {paymentHistories?.map((ph) => (
            <div
              key={ph.id}
              className="bg-neutral-10 rounded-[12px] px-4 py-3 flex items-center gap-3 text-[14px]"
            >
              <span className="flex-1 text-neutral-60">
                {formatDetailDate(ph.paymentDate)}
              </span>
              <span className="flex-1 text-[#16A34A] font-semibold">
                {ph.amount?.toLocaleString()}원
              </span>
              <span className="flex-shrink-0 inline-flex items-center justify-center px-3 py-1 rounded-[30px] bg-[#E2F5EB] text-[#22C55E] text-[12px]">
                {getPaymentMethodLabel(ph.paymentMethod)}
              </span>
              <span className="flex-1 text-[#111827]">{ph.description || "결제"}</span>

              <button
                className="ml-2 w-5 h-5 grid place-items-center rounded-full bg-neutral-100 text-white"
                onClick={() => onRemovePayment(ph.id)}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Schedule Management */}
      <div>
        <div className="mb-3 pb-2 border-b border-[#E2E2E2]">
          <div className="text-[16px] font-semibold text-neutral-90">
            일정관리
          </div>
        </div>

        {/* 날짜 & 컬러 영역 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
          {/* 날짜 */}
          <div>
            <div className="mb-2 text-[14px] font-medium leading-[1] tracking-[0.2px] text-neutral-60">
              날짜
            </div>
            <div className="grid grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] gap-2 h-[34px]">
              <div className="relative h-[34px]">
                <DatePicker
                  value={scheduleDate}
                  onChange={setScheduleDate}
                  className="h-[34px] pr-9"
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
              />
            </div>
          </div>

          {/* 컬러 */}
          <div>
            <div className="mb-2 text-[14px] font-medium leading-[1] tracking-[0.2px] text-neutral-60">
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
                      selected ? "border-2 border-neutral-90" : "border-transparent"
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

        {/* 일정내용 */}
        <div>
          <div className="mb-2 text-[14px] font-medium leading-[1] tracking-[0.2px] text-neutral-60">
            일정내용
          </div>
          <div className="flex flex-col md:flex-row gap-2">
            <input
              value={scheduleDesc}
              onChange={(e) => setScheduleDesc(e.target.value)}
              placeholder="일정내용을 추가하세요"
              className="flex-1 h-[34px] rounded-[5px] border border-neutral-30 px-3 text-[14px] leading-[1] tracking-[0.2px]"
            />
            <button
              className="cursor-pointer w-[48px] h-[34px] rounded-[5px] bg-neutral-90 text-neutral-20 text-[14px] font-semibold"
              onClick={handleAddSchedule}
            >
              추가
            </button>
          </div>
        </div>

        <div className="mt-3 space-y-2 max-h-[220px] overflow-auto pr-1">
          {schedules?.map((sc) => {
            // colorCode에 # 접두사 보장
            const normalizedColor = sc.colorCode 
              ? (sc.colorCode.startsWith("#") ? sc.colorCode : `#${sc.colorCode}`)
              : "#00E272";
            
            return (
              <div
                key={sc.id}
                className="bg-neutral-10 rounded-[12px] px-4 py-3 flex items-center gap-3 text-[14px]"
              >
                
                <span className="inline-flex items-center justify-center px-3 py-1 rounded-[30px] bg-[#D6FAE8] text-[#10B981] text-[12px] whitespace-nowrap">
                  {formatScheduleTime(sc.scheduleTime)}
                </span>
                <span
                  className="w-4 h-4 rounded-full shrink-0"
                  style={{ backgroundColor: normalizedColor }}
                />
                <span className="text-[#111827] flex-1 truncate">{sc.description}</span>
                <span className="ml-auto text-neutral-60 whitespace-nowrap">
                  {formatCreatedAt(sc.createdAt)}
                </span>
                <button
                  className="cursor-pointer ml-2 w-5 h-5 grid place-items-center rounded-full bg-[#000] text-white text-[16px] leading-[1]"
                  onClick={() => onRemoveSchedule(sc.id)}
                >
                  ×
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
