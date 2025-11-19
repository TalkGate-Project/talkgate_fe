import React, { useState } from "react";
import { SelectField } from "./SelectField";
import { formatDetailDate } from "./utils";
import { CustomerFormState } from "./useCustomerDetail";
import { CustomerDetail } from "@/types/customers";

type Props = {
  form: CustomerFormState;
  setForm: React.Dispatch<React.SetStateAction<CustomerFormState>>;
  paymentHistories: CustomerDetail["paymentHistories"];
  schedules: CustomerDetail["schedules"];
  onAddPayment: (date: string, amount: string, method: string, desc: string) => void;
  onRemovePayment: (id: number) => void;
  onAddSchedule: (dateIso: string, desc: string) => void;
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
  const [paymentDate, setPaymentDate] = useState("");
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("카드");
  const [paymentDesc, setPaymentDesc] = useState("");

  // Schedule Inputs
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleHour, setScheduleHour] = useState("");
  const [scheduleMinute, setScheduleMinute] = useState("");
  const [scheduleDesc, setScheduleDesc] = useState("");

  const handleAddPayment = () => {
    if (!paymentDate || !paymentAmount) return;
    onAddPayment(paymentDate, paymentAmount, paymentMethod, paymentDesc);
    setPaymentDate("");
    setPaymentAmount("");
    setPaymentDesc("");
  };

  const handleAddSchedule = () => {
    if (!scheduleDate || !scheduleDesc) return;
    const dateIso = new Date(
      `${scheduleDate} ${scheduleHour || "00"}:${scheduleMinute || "00"}:00`
    ).toISOString();
    onAddSchedule(dateIso, scheduleDesc);
    setScheduleDate("");
    setScheduleHour("");
    setScheduleMinute("");
    setScheduleDesc("");
  };

  return (
    <div className="mt-3 space-y-6">
      {/* Investment Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
        <label className="block">
          <span className="block text-[12px] text-[#6B7280] mb-1">투자정보</span>
          <input
            value={form.investmentInfo}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, investmentInfo: e.target.value }))
            }
            className="w-full h-[34px] rounded-[5px] border border-[#E5E7EB] px-3"
            placeholder="투자정보를 입력하세요"
          />
        </label>
        <label className="block">
          <span className="block text-[12px] text-[#6B7280] mb-1">투자손익</span>
          <input
            value={form.investmentProfitLoss}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, investmentProfitLoss: e.target.value }))
            }
            className="w-full h-[34px] rounded-[5px] border border-[#E5E7EB] px-3"
            placeholder="0"
          />
        </label>
        <label className="block md:col-span-2">
          <span className="block text-[12px] text-[#6B7280] mb-1">투자성향</span>
          <SelectField
            value={form.investmentRiskLevel}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, investmentRiskLevel: e.target.value }))
            }
            className="h-[34px] w-full"
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
          <div className="text-[16px] font-semibold text-neutral-90">결제 내역</div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="grid grid-cols-[180px_minmax(0,1fr)] gap-2">
            <input
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              placeholder="연도. 월 . 일"
              className="h-[36px] rounded-[6px] border border-[#E5E7EB] px-3"
            />
            <input
              value={paymentAmount}
              onChange={(e) =>
                setPaymentAmount(e.target.value.replace(/[^0-9]/g, ""))
              }
              placeholder="금액"
              className="h-[36px] rounded-[6px] border border-[#E5E7EB] px-3"
            />
          </div>
          <div className="grid grid-cols-[140px_minmax(0,1fr)_auto] gap-2">
            <SelectField
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="h-[36px] rounded-[6px]"
            >
              <option>카드</option>
              <option>현금</option>
              <option>계좌이체</option>
            </SelectField>
            <input
              value={paymentDesc}
              onChange={(e) => setPaymentDesc(e.target.value)}
              placeholder="설명을 추가하세요"
              className="h-[36px] rounded-[6px] border border-[#E5E7EB] px-3"
            />
            <button
              className="h-[36px] px-3 rounded-[6px] bg-neutral-90 text-neutral-40"
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
              <span className="inline-flex items-center justify-center px-3 py-1 rounded-[30px] bg-[#E2F5EB] text-[#22C55E] text-[12px]">
                {ph.paymentMethod === "creditCard" ? "카드" : ph.paymentMethod}
              </span>
              <span className="text-[#111827]">{ph.description || "결제"}</span>
              <span className="ml-auto text-[#16A34A] font-semibold">
                {ph.amount?.toLocaleString()}원
              </span>
              <span className="ml-3 text-neutral-60">
                {formatDetailDate(ph.paymentDate)}
              </span>
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
          <div className="text-[16px] font-semibold text-neutral-90">일정관리</div>
        </div>
        <div className="mb-2 flex items-center gap-3">
          <span className="text-[14px] text-neutral-60">컬러</span>
          <div className="flex items-center gap-2">
            <div className="w-[18px] h-[18px] rounded-full bg-primary-60" />
            <div className="w-[18px] h-[18px] rounded-full bg-primary-80" />
            <div className="w-[18px] h-[18px] rounded-full bg-secondary-20" />
            <div className="w-[18px] h-[18px] rounded-full bg-secondary-60" />
            <div className="w-[18px] h-[18px] rounded-full bg-warning-40" />
            <div className="w-[18px] h-[18px] rounded-full bg-warning-60" />
            <div className="w-[18px] h-[18px] rounded-full bg-danger-40" />
            <div className="w-[18px] h-[18px] rounded-full bg-danger-20" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-[180px_60px_60px_1fr_auto] gap-2">
          <input
            value={scheduleDate}
            onChange={(e) => setScheduleDate(e.target.value)}
            placeholder="연도. 월 . 일"
            className="h-[36px] rounded-[6px] border border-[#E5E7EB] px-3"
          />
          <input
            value={scheduleHour}
            onChange={(e) =>
              setScheduleHour(e.target.value.replace(/[^0-9]/g, ""))
            }
            placeholder="시"
            className="h-[36px] rounded-[6px] border border-[#E5E7EB] px-3"
          />
          <input
            value={scheduleMinute}
            onChange={(e) =>
              setScheduleMinute(e.target.value.replace(/[^0-9]/g, ""))
            }
            placeholder="분"
            className="h-[36px] rounded-[6px] border border-[#E5E7EB] px-3"
          />
          <input
            value={scheduleDesc}
            onChange={(e) => setScheduleDesc(e.target.value)}
            placeholder="일정내용을 추가하세요"
            className="h-[36px] rounded-[6px] border border-[#E5E7EB] px-3"
          />
          <button
            className="h-[36px] px-3 rounded-[6px] bg-neutral-90 text-neutral-40"
            onClick={handleAddSchedule}
          >
            추가
          </button>
        </div>

        <div className="mt-3 space-y-2 max-h-[220px] overflow-auto pr-1">
          {schedules?.map((sc) => (
            <div
              key={sc.id}
              className="bg-neutral-10 rounded-[12px] px-4 py-3 flex items-center gap-3 text-[14px]"
            >
              <span className="inline-flex items-center justify-center px-3 py-1 rounded-[30px] bg-[#E2F5EB] text-[#10B981] text-[12px]">
                {formatDetailDate(sc.scheduleTime)}
              </span>
              <span className="text-[#111827]">{sc.description}</span>
              <span className="ml-auto text-neutral-60">
                {formatDetailDate(sc.createdAt)}
              </span>
              <button
                className="ml-2 w-5 h-5 grid place-items-center rounded-full bg-neutral-100 text-white"
                onClick={() => onRemoveSchedule(sc.id)}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

