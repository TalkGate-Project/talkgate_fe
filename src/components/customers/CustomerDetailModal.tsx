"use client";

import { useEffect, useMemo, useState } from "react";
import type { SelectHTMLAttributes } from "react";
import { useRouter } from "next/navigation";
import { CustomersService } from "@/services/customers";
import BaseModal from "@/components/common/BaseModal";
import { CustomerDetail } from "@/types/customers";
import { CustomerNoteCategoriesService } from "@/services/customerNoteCategories";

export type CustomerDetailModalProps = {
  open: boolean;
  onClose: () => void;
  customerId: number | null;
};

function SelectField({
  className,
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="relative">
      <select
        {...props}
        className={`w-full rounded-[5px] border border-[#E5E7EB] px-2 pr-6 appearance-none ${
          className ?? ""
        }`}
      >
        {children}
      </select>
      <svg
        className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2"
        width="8"
        height="6"
        viewBox="0 0 8 6"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M4.25896 5.4382C4.05939 5.71473 3.64764 5.71473 3.44807 5.4382L0.0954003 0.792604C-0.143249 0.461921 0.0930391 1.87809e-07 0.500843 2.2346e-07L7.20619 8.0966e-07C7.61399 8.45312e-07 7.85028 0.461922 7.61163 0.792604L4.25896 5.4382Z"
          fill="black"
        />
      </svg>
    </div>
  );
}

export default function CustomerDetailModal(props: CustomerDetailModalProps) {
  const { open, onClose, customerId } = props;
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [detail, setDetail] = useState<CustomerDetail | null>(null);
  const [tab, setTab] = useState<"basic" | "data" | "sales">("basic");

  // Form state (basic tab)
  const [name, setName] = useState("");
  const [contact1, setContact1] = useState("");
  const [contact2, setContact2] = useState("");
  const [residentFront, setResidentFront] = useState("");
  const [residentBack, setResidentBack] = useState("");
  const [ageRange, setAgeRange] = useState("");
  const [job, setJob] = useState("");

  // Data info tab state
  const [applicationRoute, setApplicationRoute] = useState("");
  const [site, setSite] = useState("");
  const [mediaCompany, setMediaCompany] = useState("");
  const [applicationDate, setApplicationDate] = useState("");
  const [assignedMemberName, setAssignedMemberName] = useState("");
  const [assignedTeamName, setAssignedTeamName] = useState("");
  const [specialNotes, setSpecialNotes] = useState("");

  // Sales info tab state
  const [investmentInfo, setInvestmentInfo] = useState("");
  const [investmentProfitLoss, setInvestmentProfitLoss] = useState("");
  const [investmentRiskLevel, setInvestmentRiskLevel] = useState("");

  // Payment history inputs
  const [paymentDate, setPaymentDate] = useState(""); // YYYY-MM-DD
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("카드");
  const [paymentDesc, setPaymentDesc] = useState("");

  // Schedule inputs
  const [scheduleDate, setScheduleDate] = useState(""); // YYYY-MM-DD
  const [scheduleHour, setScheduleHour] = useState("");
  const [scheduleMinute, setScheduleMinute] = useState("");
  const [scheduleDesc, setScheduleDesc] = useState("");

  // Messengers state (simple local add only)
  // newMessengerType는 API에서 요구하는 코드값(line, telegram, instagram, kakaotalk)을 사용
  const [newMessengerType, setNewMessengerType] = useState("kakaotalk");
  const [newMessengerAccount, setNewMessengerAccount] = useState("");
  const [messengersLocal, setMessengersLocal] = useState<
    { id?: number; messenger: string; account: string; createdAt?: string }[]
  >([]);

  // Notes right panel
  const [categories, setCategories] = useState<
    { id: number; name: string; color?: string }[]
  >([]);
  const [noteCategoryId, setNoteCategoryId] = useState<number | "">("");
  const [noteInput, setNoteInput] = useState("");

  function formatDate(dt: string) {
    try {
      const d = new Date(dt);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const da = String(d.getDate()).padStart(2, "0");
      const hh = String(d.getHours()).padStart(2, "0");
      const mm = String(d.getMinutes()).padStart(2, "0");
      return `${y}. ${m}. ${da} ${hh}:${mm}`;
    } catch {
      return dt;
    }
  }

  useEffect(() => {
    if (!open || !customerId) return;
    setLoading(true);
    CustomersService.detail(String(customerId))
      .withProject((window as any)?.tgSelectedProjectId || "")
      .then((res) => {
        const d = (res as any).data?.data || null;
        setDetail(d);
        if (d) {
          setName(d.name || "");
          setContact1(d.contact1 || "");
          setContact2(d.contact2 || "");
          if (d.residentId && d.residentId.includes("-")) {
            const [f, b] = d.residentId.split("-");
            setResidentFront(f || "");
            setResidentBack(b || "");
          }
          setAgeRange(d.ageRange || "");
          setJob(d.job || "");
          setMessengersLocal(d.messengers || []);
          setApplicationRoute(d.applicationRoute || "");
          setSite(d.site || "");
          setMediaCompany(d.mediaCompany || "");
          setApplicationDate(d.applicationDate || "");
          setAssignedMemberName(d.assignedMemberName || "");
          setAssignedTeamName(d.assignedTeamName || "");
          setSpecialNotes(d.specialNotes || "");
          setInvestmentInfo(d.investmentInfo || "");
          setInvestmentProfitLoss(d.investmentProfitLoss || "");
          setInvestmentRiskLevel(d.investmentRistLevel || "");
        }
      })
      .catch(() => setDetail(null))
      .finally(() => setLoading(false));
    CustomerNoteCategoriesService.list()
      .then((res) => setCategories(((res as any).data?.data || []) as any))
      .catch(() => setCategories([]));
  }, [open, customerId]);

  if (!open) return null;

  return (
    <BaseModal
      onClose={() => !loading && onClose()}
      overlayClassName="bg-black/50"
      containerClassName="relative w-[92vw] max-w-[1284px] rounded-[14px] bg-white px-7 py-6 shadow-[0_13px_61px_rgba(169,169,169,0.37)]"
      ariaLabel="고객정보"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-[18px] font-semibold text-[#111827]">고객정보</h2>
        <button
          aria-label="close"
          className="cursor-pointer w-6 h-6 grid place-items-center text-white"
          onClick={onClose}
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M6 18L18 6M6 6L18 18"
              stroke="#B0B0B0"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>

      {loading && (
        <div className="py-16 text-center text-neutral-60">불러오는 중...</div>
      )}
      {!loading && detail && (
        <div className="mt-[30px] grid grid-cols-12 gap-6">
          {/* Left: form and tabs */}
          <div className="col-span-12 lg:col-span-8 max-w-[792px]">
            {/* Tabs */}
            <div className="flex gap-6 border-b border-neutral-30">
              <button
                className={`cursor-pointer pb-3 text-[16px] ${
                  tab === "basic"
                    ? "font-semibold text-black border-b-2 border-black"
                    : "text-neutral-60"
                }`}
                onClick={() => setTab("basic")}
              >
                기본 정보
              </button>
              <button
                className={`cursor-pointer pb-3 text-[16px] ${
                  tab === "data"
                    ? "font-semibold text-black border-b-2 border-black"
                    : "text-neutral-60"
                }`}
                onClick={() => setTab("data")}
              >
                데이터 정보
              </button>
              <button
                className={`cursor-pointer pb-3 text-[16px] ${
                  tab === "sales"
                    ? "font-semibold text-black border-b-2 border-black"
                    : "text-neutral-60"
                }`}
                onClick={() => setTab("sales")}
              >
                영업정보
              </button>
            </div>

            {tab === "basic" && (
              <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                {/* 이름 */}
                <div>
                  <div className="flex items-center gap-1 mb-1">
                    <span className="text-[12px] text-[#6B7280]">이름</span>
                    <span className="text-[12px] text-danger-40">*</span>
                  </div>
                  <div>
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full h-[34px] rounded-[5px] border border-[#E5E7EB] px-3"
                      placeholder="고객 이름을 입력하세요"
                    />
                  </div>
                </div>

                {/* 연락처1 */}
                <div>
                  <div className="flex items-center gap-1 mb-1">
                    <span className="text-[12px] text-[#6B7280]">연락처1</span>
                    <span className="text-[12px] text-danger-40">*</span>
                  </div>
                  <div className="grid grid-cols-[120px_minmax(0,1fr)] gap-2">
                    <div>
                      <SelectField className="h-[34px]">
                        <option>휴대폰</option>
                        <option>집</option>
                        <option>회사</option>
                      </SelectField>
                    </div>
                    <div>
                      <input
                        value={contact1}
                        onChange={(e) => setContact1(e.target.value)}
                        className="w-full h-[34px] rounded-[5px] border border-[#E5E7EB] px-3"
                        placeholder="010-1234-5678"
                      />
                    </div>
                  </div>
                </div>

                {/* 연락처2 */}
                <div>
                  <div className="flex items-center gap-1 mb-1">
                    <span className="text-[12px] text-[#6B7280]">연락처2</span>
                  </div>
                  <div className="grid grid-cols-[120px_minmax(0,1fr)] gap-2">
                    <div>
                      <SelectField className="h-[34px]">
                        <option>선택사항</option>
                        <option>집</option>
                        <option>회사</option>
                      </SelectField>
                    </div>
                    <div>
                      <input
                        value={contact2}
                        onChange={(e) => setContact2(e.target.value)}
                        className="w-full h-[34px] rounded-[5px] border border-[#E5E7EB] px-3"
                        placeholder="선택 입력"
                      />
                    </div>
                  </div>
                </div>

                {/* 주민등록번호 */}
                <div>
                  <div className="flex items-center gap-1 mb-1">
                    <span className="text-[12px] text-[#6B7280]">
                      주민등록번호
                    </span>
                  </div>
                  <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                    <div>
                      <input
                        value={residentFront}
                        onChange={(e) => setResidentFront(e.target.value)}
                        className="w-full h-[34px] rounded-[5px] border border-[#E5E7EB] px-3"
                        placeholder="123456"
                      />
                    </div>
                    <div className="text-center text-neutral-60">-</div>
                    <div>
                      <input
                        value={residentBack}
                        onChange={(e) => setResidentBack(e.target.value)}
                        className="w-full h-[34px] rounded-[5px] border border-[#E5E7EB] px-3"
                        placeholder="*******"
                      />
                    </div>
                  </div>
                </div>

                {/* 직업 */}
                <div>
                  <div className="mb-1">
                    <span className="text-[12px] text-[#6B7280]">직업</span>
                  </div>
                  <div>
                    <input
                      value={job}
                      onChange={(e) => setJob(e.target.value)}
                      className="w-full h-[34px] rounded-[5px] border border-[#E5E7EB] px-3"
                      placeholder="직업"
                    />
                  </div>
                </div>

                {/* 연령 */}
                <div>
                  <div className="mb-1">
                    <span className="text-[12px] text-[#6B7280]">연령</span>
                  </div>
                  <div>
                    <input
                      value={ageRange}
                      onChange={(e) => setAgeRange(e.target.value)}
                      className="w-full h-[34px] rounded-[5px] border border-[#E5E7EB] px-3"
                      placeholder="연령"
                    />
                  </div>
                </div>

                {/* Messenger Accounts */}
                <div className="md:col-span-2">
                  <div className="text-[14px] font-semibold text-ink mb-3">
                    메신저 계정
                  </div>
                  <div className="border-b border-[#E2E2E2] mb-3" />
                  <div className="flex flex-col gap-2">
                    <div className="flex gap-2">
                      <div className="w-[120px]">
                        <SelectField
                          value={newMessengerType}
                          onChange={(e) => setNewMessengerType(e.target.value)}
                          className="h-[36px] rounded-[6px]"
                        >
                          <option value="kakaotalk">카카오톡</option>
                          <option value="telegram">텔레그램</option>
                          <option value="instagram">인스타그램</option>
                          <option value="line">라인</option>
                        </SelectField>
                      </div>
                      <input
                        value={newMessengerAccount}
                        onChange={(e) => setNewMessengerAccount(e.target.value)}
                        placeholder="계정 ID를 입력하세요"
                        className="flex-1 h-[36px] rounded-[6px] border border-[#E5E7EB] px-3"
                      />
                      <button
                        type="button"
                        className="h-[36px] px-3 rounded-[6px] bg-neutral-90 text-neutral-40"
                        onClick={() => {
                          if (!newMessengerAccount.trim()) return;
                          const toAdd = {
                            messenger: newMessengerType,
                            account: newMessengerAccount.trim(),
                            createdAt: new Date().toISOString(),
                          };
                          setMessengersLocal((prev) => [...prev, toAdd]);
                          CustomersService.addMessenger({
                            customerId: detail.id,
                            messenger: toAdd.messenger,
                            account: toAdd.account,
                            projectId:
                              (window as any)?.tgSelectedProjectId || "",
                          }).catch(() => {});
                          setNewMessengerAccount("");
                        }}
                      >
                        추가
                      </button>
                    </div>
                    {messengersLocal.length > 0 && (
                      <div className="mt-4 space-y-2">
                        {messengersLocal.map((m, idx) => (
                          <div
                            key={`${m.messenger}-${m.account}-${idx}`}
                            className="flex items-center justify-between bg-neutral-10 rounded-[12px] px-4 py-3"
                          >
                            <div className="flex items-center gap-3">
                              <span className="inline-flex items-center justify-center px-3 py-1 rounded-[30px] bg-warning-40 text-white text-[12px]">
                                메신저
                              </span>
                              <span className="text-[14px] text-ink">
                                {m.account}
                              </span>
                            </div>
                            <div className="flex items-center gap-3">
                              {m.createdAt && (
                                <span className="text-[14px] text-neutral-60">
                                  {formatDate(m.createdAt)}
                                </span>
                              )}
                              <button
                                className="w-5 h-5 grid place-items-center rounded-full bg-neutral-100 text-white"
                                onClick={() => {
                                  const copy = [...messengersLocal];
                                  copy.splice(idx, 1);
                                  setMessengersLocal(copy);
                                }}
                              >
                                ×
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {tab === "sales" && (
              <div className="mt-3 space-y-6">
                {/* 투자 정보 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                  <label className="block">
                    <span className="block text-[12px] text-[#6B7280] mb-1">
                      투자정보
                    </span>
                    <input
                      value={investmentInfo}
                      onChange={(e) => setInvestmentInfo(e.target.value)}
                      className="w-full h-[34px] rounded-[5px] border border-[#E5E7EB] px-3"
                      placeholder="투자정보를 입력하세요"
                    />
                  </label>
                  <label className="block">
                    <span className="block text-[12px] text-[#6B7280] mb-1">
                      투자손익
                    </span>
                    <input
                      value={investmentProfitLoss}
                      onChange={(e) => setInvestmentProfitLoss(e.target.value)}
                      className="w-full h-[34px] rounded-[5px] border border-[#E5E7EB] px-3"
                      placeholder="0"
                    />
                  </label>
                  <label className="block md:col-span-2">
                    <span className="block text-[12px] text-[#6B7280] mb-1">
                      투자성향
                    </span>
                    <SelectField
                      value={investmentRiskLevel}
                      onChange={(e) => setInvestmentRiskLevel(e.target.value)}
                      className="h-[34px] w-full"
                    >
                      <option value="">선택</option>
                      <option>안정형</option>
                      <option>중립형</option>
                      <option>공격형</option>
                    </SelectField>
                  </label>
                </div>

                {/* 결제 내역 */}
                <div>
                  <div className="mb-3 pb-2 border-b border-[#E2E2E2]">
                    <div className="text-[16px] font-semibold text-neutral-90">
                      결제 내역
                    </div>
                  </div>
                  {/* 날짜 + 금액 / 결제수단 + 설명 + 추가 버튼 */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* 날짜 + 금액 */}
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
                    {/* 결제수단 + 설명 + 추가 버튼 */}
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
                        onClick={() => {
                          if (!detail || !paymentDate || !paymentAmount) return;
                          CustomersService.addPaymentHistory({
                            customerId: detail.id,
                            description: paymentDesc || "",
                            paymentDate: new Date(paymentDate).toISOString(),
                            amount: Number(paymentAmount),
                            paymentMethod:
                              paymentMethod === "카드"
                                ? "creditCard"
                                : paymentMethod,
                            projectId: (window as any)?.tgSelectedProjectId || "",
                          })
                            .then(() => {
                              setPaymentDate("");
                              setPaymentAmount("");
                              setPaymentDesc("");
                            })
                            .catch(() => {});
                        }}
                      >
                        추가
                      </button>
                    </div>
                  </div>

                  {/* 실제 결제 내역 */}
                  <div className="mt-3 space-y-2 max-h-[200px] overflow-auto pr-1">
                    {detail.paymentHistories?.map((ph) => (
                      <div
                        key={ph.id}
                        className="bg-neutral-10 rounded-[12px] px-4 py-3 flex items-center gap-3 text-[14px]"
                      >
                        <span className="inline-flex items-center justify-center px-3 py-1 rounded-[30px] bg-[#E2F5EB] text-[#22C55E] text-[12px]">
                          {ph.paymentMethod === "creditCard"
                            ? "카드"
                            : ph.paymentMethod}
                        </span>
                        <span className="text-[#111827]">
                          {ph.description || "결제"}
                        </span>
                        <span className="ml-auto text-[#16A34A] font-semibold">
                          {ph.amount?.toLocaleString()}원
                        </span>
                        <span className="ml-3 text-neutral-60">
                          {formatDate(ph.paymentDate)}
                        </span>
                        <button
                          className="ml-2 w-5 h-5 grid place-items-center rounded-full bg-neutral-100 text-white"
                          onClick={() => {
                            CustomersService.removePaymentHistory({
                              paymentHistoryId: ph.id,
                              projectId:
                                (window as any)?.tgSelectedProjectId || "",
                            }).then(() =>
                              setDetail((prev) =>
                                prev
                                  ? {
                                      ...prev,
                                      paymentHistories:
                                        prev.paymentHistories.filter(
                                          (x) => x.id !== ph.id
                                        ),
                                    }
                                  : prev
                              )
                            );
                          }}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 일정 관리 */}
                <div>
                  <div className="mb-3 pb-2 border-b border-[#E2E2E2]">
                    <div className="text-[16px] font-semibold text-neutral-90">
                      일정관리
                    </div>
                  </div>
                  {/* 색상 팔레트 (디자인용 레전드) */}
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
                      onClick={() => {
                        if (!detail || !scheduleDate || !scheduleDesc) return;
                        const dateIso = new Date(
                          `${scheduleDate} ${scheduleHour || "00"}:${
                            scheduleMinute || "00"
                          }:00`
                        ).toISOString();
                        CustomersService.addSchedule({
                          customerId: detail.id,
                          scheduleTime: dateIso,
                          description: scheduleDesc,
                          projectId: (window as any)?.tgSelectedProjectId || "",
                        })
                          .then(() => {
                            setScheduleDate("");
                            setScheduleHour("");
                            setScheduleMinute("");
                            setScheduleDesc("");
                          })
                          .catch(() => {});
                      }}
                    >
                      추가
                    </button>
                  </div>

                  {/* 실제 일정 목록 */}
                  <div className="mt-3 space-y-2 max-h-[220px] overflow-auto pr-1">
                    {detail.schedules?.map((sc) => (
                      <div
                        key={sc.id}
                        className="bg-neutral-10 rounded-[12px] px-4 py-3 flex items-center gap-3 text-[14px]"
                      >
                        <span className="inline-flex items-center justify-center px-3 py-1 rounded-[30px] bg-[#E2F5EB] text-[#10B981] text-[12px]">
                          {formatDate(sc.scheduleTime)}
                        </span>
                        <span className="text-[#111827]">{sc.description}</span>
                        <span className="ml-auto text-neutral-60">
                          {formatDate(sc.createdAt)}
                        </span>
                        <button
                          className="ml-2 w-5 h-5 grid place-items-center rounded-full bg-neutral-100 text-white"
                          onClick={() => {
                            CustomersService.removeSchedule({
                              scheduleId: sc.id,
                              projectId:
                                (window as any)?.tgSelectedProjectId || "",
                            }).then(() =>
                              setDetail((prev) =>
                                prev
                                  ? {
                                      ...prev,
                                      schedules: prev.schedules.filter(
                                        (x) => x.id !== sc.id
                                      ),
                                    }
                                  : prev
                              )
                            );
                          }}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
            {tab === "data" && (
              <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                <label className="block">
                  <span className="block text-[12px] text-[#6B7280] mb-1">
                    신청경로
                  </span>
                  <input
                    value={applicationRoute}
                    onChange={(e) => setApplicationRoute(e.target.value)}
                    className="w-full h-[34px] rounded-[5px] border border-[#E5E7EB] px-3"
                    placeholder="예: 유튜브"
                  />
                </label>
                <label className="block">
                  <span className="block text-[12px] text-[#6B7280] mb-1">
                    사이트
                  </span>
                  <input
                    value={site}
                    onChange={(e) => setSite(e.target.value)}
                    className="w-full h-[34px] rounded-[5px] border border-[#E5E7EB] px-3"
                    placeholder="예: 모두의주식투자채널"
                  />
                </label>

                <label className="block">
                  <span className="block text-[12px] text-[#6B7280] mb-1">
                    매체사
                  </span>
                  <input
                    value={mediaCompany}
                    onChange={(e) => setMediaCompany(e.target.value)}
                    className="w-full h-[34px] rounded-[5px] border border-[#E5E7EB] px-3"
                    placeholder="예: 광고회사"
                  />
                </label>
                <label className="block">
                  <span className="block text-[12px] text-[#6B7280] mb-1">
                    신청시간
                  </span>
                  <input
                    value={applicationDate}
                    onChange={(e) => setApplicationDate(e.target.value)}
                    className="w-full h-[34px] rounded-[5px] border border-[#E5E7EB] px-3"
                    placeholder="YYYY-MM-DD HH:mm"
                  />
                </label>

                <label className="block">
                  <span className="block text-[12px] text-[#6B7280] mb-1">
                    담당자
                  </span>
                  <input
                    value={assignedMemberName}
                    onChange={(e) => setAssignedMemberName(e.target.value)}
                    className="w-full h-[34px] rounded-[5px] border border-[#E5E7EB] px-3"
                    placeholder="담당자명"
                  />
                </label>
                <label className="block">
                  <span className="block text-[12px] text-[#6B7280] mb-1">
                    담당팀
                  </span>
                  <input
                    value={assignedTeamName}
                    onChange={(e) => setAssignedTeamName(e.target.value)}
                    className="w-full h-[34px] rounded-[5px] border border-[#E5E7EB] px-3"
                    placeholder="예: 영업1팀"
                  />
                </label>

                <div className="md:col-span-2">
                  <span className="block text-[12px] text-[#6B7280] mb-1">
                    특이사항
                  </span>
                  <textarea
                    value={specialNotes}
                    onChange={(e) => setSpecialNotes(e.target.value)}
                    rows={3}
                    className="w-full rounded-[5px] border border-[#E5E7EB] px-3 py-2"
                    placeholder="특이사항을 입력하세요"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Right: 대화 요약 + 상담 내용 기록 */}
          <div className="col-span-12 lg:col-span-4">
            {/* 상단: 연결된 채팅방 정보 (없으면 플레이스홀더 카드) */}
            {(() => {
              const conv = detail.conversation;
              const hasConversation = Boolean(conv);

              const platformLabel = hasConversation
                ? conv!.platform === "instagram"
                  ? "인스타그램"
                  : conv!.platform === "telegram"
                  ? "텔레그램"
                  : conv!.platform === "line"
                  ? "라인"
                  : "카카오톡"
                : "연결된 채팅방이 없습니다";

              return (
                <div className="mb-[30px] border border-[#E2E2E2] rounded-[5px] bg-[#F8F8F8] px-6 py-3 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-12 h-12 rounded-full bg-neutral-30 overflow-hidden flex-shrink-0">
                      {hasConversation && conv!.profileUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={conv!.profileUrl as string}
                          alt={conv!.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[18px] font-semibold text-foreground">
                          {(detail.name || "홍길동").charAt(0)}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="text-[16px] font-semibold text-foreground truncate">
                        {hasConversation
                          ? conv!.name || `${detail.name}님과의 채팅`
                          : `${detail.name || "홍길동"}님과의 채팅`}
                      </div>
                      <div className="mt-1 flex items-center gap-2 text-[14px] text-neutral-60">
                        {hasConversation && conv!.platform === "instagram" && (
                          <span className="w-4 h-4 inline-block">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src="/icons/platform/instagram.png"
                              alt="Instagram"
                              className="w-full h-full object-contain"
                            />
                          </span>
                        )}
                        {hasConversation && conv!.platform === "telegram" && (
                          <span className="w-4 h-4 inline-block">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src="/icons/platform/telegram.png"
                              alt="Telegram"
                              className="w-full h-full object-contain"
                            />
                          </span>
                        )}
                        {hasConversation && conv!.platform === "line" && (
                          <span className="w-4 h-4 inline-block">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src="/icons/platform/line.png"
                              alt="Line"
                              className="w-full h-full object-contain"
                            />
                          </span>
                        )}
                        <span className="truncate">{platformLabel}</span>
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled={!hasConversation}
                    className={`flex items-center justify-center w-[34px] h-[34px] rounded-[5px] border ${
                      hasConversation
                        ? "bg-primary-10 border-primary-80 cursor-pointer"
                        : "bg-neutral-10 border-neutral-30 cursor-not-allowed"
                    }`}
                    onClick={() => {
                      if (!hasConversation) return;
                      const c = conv!;
                      const params = new URLSearchParams();
                      params.set("conversationId", String(c.id));
                      params.set("platform", c.platform);
                      params.set("customerId", String(detail.id));
                      router.push(`/consult?${params.toString()}`);
                    }}
                  >
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 20 20"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M11.5237 8.47631C10.2219 7.17456 8.11139 7.17456 6.80964 8.47631L3.47631 11.8096C2.17456 13.1114 2.17456 15.2219 3.47631 16.5237C4.77806 17.8254 6.88861 17.8254 8.19036 16.5237L9.10832 15.6057M8.47631 11.5237C9.77806 12.8254 11.8886 12.8254 13.1904 11.5237L16.5237 8.19036C17.8254 6.88861 17.8254 4.77806 16.5237 3.47631C15.2219 2.17456 13.1114 2.17456 11.8096 3.47631L10.8933 4.39265"
                        stroke={hasConversation ? "#00B55B" : "#B0B0B0"}
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                </div>
              );
            })()}

            <div className="text-[16px] font-semibold text-neutral-90 mb-3">
              상담 내용 기록
            </div>
            <div className="border-b border-[#E2E2E2] mb-2" />
            <div className="">
              <p className="text-body-3 text-neutral-60 mb-2">상담 카테고리</p>
              <div className="flex gap-2 mb-5">
                <SelectField
                  value={noteCategoryId as any}
                  onChange={(e) =>
                    setNoteCategoryId(
                      e.target.value ? Number(e.target.value) : ""
                    )
                  }
                  className="w-[106px] h-[34px] rounded-[5px] text-body-3"
                >
                  <option value="">일반</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </SelectField>
                <input
                  value={noteInput}
                  onChange={(e) => setNoteInput(e.target.value)}
                  placeholder="상담 내용을 입력하세요"
                  className="flex-1 h-[34px] rounded-[5px] border border-[#E5E7EB] px-3 text-body-3"
                />
                <button
                  className="cursor-pointer w-[48px] h-[34px] text-body-3 rounded-[5px] bg-neutral-90 text-neutral-40"
                  onClick={() => {
                    const catId =
                      typeof noteCategoryId === "number"
                        ? noteCategoryId
                        : undefined;
                    if (!noteInput.trim() || !detail) return;
                    CustomersService.addNote({
                      customerId: detail.id,
                      categoryId: catId || 0,
                      note: noteInput.trim(),
                      projectId: (window as any)?.tgSelectedProjectId || "",
                    })
                      .then(() => {
                        setNoteInput("");
                        // optimistically append
                        setDetail((prev) =>
                          prev
                            ? {
                                ...prev,
                                notes: [
                                  {
                                    id: Math.random(),
                                    categoryId: catId || 0,
                                    note: noteInput.trim(),
                                    createdAt: new Date().toISOString(),
                                  },
                                  ...prev.notes,
                                ],
                              }
                            : prev
                        );
                      })
                      .catch(() => {});
                  }}
                >
                  추가
                </button>
              </div>

              <div className="space-y-3 overflow-auto pr-1 border border-[#E2E2E2] rounded-[5px] max-h-[210px] p-5">
                {detail.notes?.map((n) => (
                  <div
                    key={n.id}
                    className="bg-neutral-10 rounded-[12px] px-4 py-3 relative"
                  >
                    <div className="flex items-center justify-between gap-2 text-[12px]">
                      <div className="flex items-center gap-x-2">
                        <div
                          className="inline-flex items-center justify-center px-3 py-1 rounded-[30px]"
                          style={{
                            background:
                              categories.find((c) => c.id === n.categoryId)
                                ?.color || "#D3E1FE",
                            color: "#4D82F3",
                          }}
                        >
                          {categories.find((c) => c.id === n.categoryId)
                            ?.name || "일반"}
                        </div>
                        <span>{"홍길동"}</span>
                      </div>
                      <div className="text-neutral-60 flex gap-x-3 items-center justify-end">
                        <span className="text-right">
                          {formatDate(n.createdAt)}
                        </span>
                        <button
                          className="cursor-pointer w-5 h-5 grid place-items-center rounded-full bg-black text-white"
                          onClick={() => {
                            CustomersService.removeNote({
                              noteId: n.id,
                              projectId:
                                (window as any)?.tgSelectedProjectId || "",
                            }).then(() =>
                              setDetail((prev) =>
                                prev
                                  ? {
                                      ...prev,
                                      notes: prev.notes.filter(
                                        (x) => x.id !== n.id
                                      ),
                                    }
                                  : prev
                              )
                            );
                          }}
                        >
                          <svg
                            width="12"
                            height="12"
                            viewBox="0 0 12 12"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              d="M3 9L9 3M3 3L9 9"
                              stroke="white"
                              stroke-width="1.5"
                              stroke-linecap="round"
                              stroke-linejoin="round"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>
                    <div className="mt-2 text-[14px] text-neutral-70">
                      {n.note}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="col-span-12 flex justify-end gap-2 pt-2 border-t border-neutral-30">
            <button
              className="cursor-pointer h-[34px] px-4 rounded-[5px] border border-neutral-30 text-body-3"
              onClick={() => {
                if (!detail) return;
                setName(detail.name || "");
                setContact1(detail.contact1 || "");
                setContact2(detail.contact2 || "");
                if (detail.residentId && detail.residentId.includes("-")) {
                  const [f, b] = detail.residentId.split("-");
                  setResidentFront(f || "");
                  setResidentBack(b || "");
                } else {
                  setResidentFront("");
                  setResidentBack("");
                }
                setAgeRange(detail.ageRange || "");
                setJob(detail.job || "");
                setMessengersLocal(detail.messengers || []);
                setApplicationRoute(detail.applicationRoute || "");
                setSite(detail.site || "");
                setMediaCompany(detail.mediaCompany || "");
                setApplicationDate(detail.applicationDate || "");
                setAssignedMemberName(detail.assignedMemberName || "");
                setAssignedTeamName(detail.assignedTeamName || "");
                setSpecialNotes(detail.specialNotes || "");
              }}
            >
              초기화
            </button>
            <button
              className="cursor-pointer h-[34px] px-4 rounded-[5px] bg-neutral-90 text-neutral-40 text-body-3"
              onClick={() => {
                if (!detail) return;
                const residentId =
                  residentFront || residentBack
                    ? `${residentFront}-${residentBack}`
                    : undefined;
                CustomersService.update(String(detail.id), {
                  name,
                  contact1,
                  contact2,
                  residentId,
                  ageRange,
                  job,
                  applicationRoute,
                  site,
                  mediaCompany,
                  specialNotes,
                  investmentInfo,
                  investmentProfitLoss,
                  investmentRistLevel: investmentRiskLevel || undefined,
                  projectId: (window as any)?.tgSelectedProjectId || "",
                })
                  .then(() => onClose())
                  .catch(() => alert("저장에 실패했습니다."));
              }}
            >
              적용완료
            </button>
          </div>
        </div>
      )}
    </BaseModal>
  );
}
