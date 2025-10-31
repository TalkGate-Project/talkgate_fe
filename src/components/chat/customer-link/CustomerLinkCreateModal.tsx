"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CustomersService } from "@/services/customers";
import type { CreateCustomerMessengerInfo } from "@/types/customers";

type Props = {
  open: boolean;
  onClose: () => void;
  onBack: () => void;
  projectId: number;
  conversationName?: string;
  onLink: (customerId: number) => Promise<void>;
};

type MessengerCandidate = {
  messenger: string;
  account: string;
};

const messengerOptions: Array<{ value: string; label: string }> = [
  { value: "line", label: "라인" },
  { value: "telegram", label: "텔레그램" },
  { value: "instagram", label: "인스타그램" },
  { value: "kakao", label: "카카오톡" },
  { value: "facebook", label: "페이스북" },
  { value: "etc", label: "기타" },
];

export default function CustomerLinkCreateModal({
  open,
  onClose,
  onBack,
  projectId,
  conversationName,
  onLink,
}: Props) {
  const [name, setName] = useState("");
  const [contact1, setContact1] = useState("");
  const [contact1Type, setContact1Type] = useState("휴대폰");
  const [contact2Type, setContact2Type] = useState("집");
  const [contact2, setContact2] = useState("");
  const [residentFront, setResidentFront] = useState("");
  const [residentBack, setResidentBack] = useState("");
  const [ageRange, setAgeRange] = useState("");
  const [job, setJob] = useState("");
  const [messengerType, setMessengerType] = useState(messengerOptions[0].value);
  const [messengerAccount, setMessengerAccount] = useState("");
  const [messengers, setMessengers] = useState<MessengerCandidate[]>([]);
  const [applicationRoute, setApplicationRoute] = useState("");
  const [site, setSite] = useState("");
  const [mediaCompany, setMediaCompany] = useState("");
  const [specialNotes, setSpecialNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetForm = useCallback(() => {
    setName("");
    setContact1("");
    setContact1Type("휴대폰");
    setContact2Type("집");
    setContact2("");
    setResidentFront("");
    setResidentBack("");
    setAgeRange("");
    setJob("");
    setMessengerType(messengerOptions[0].value);
    setMessengerAccount("");
    setMessengers([]);
    setApplicationRoute("");
    setSite("");
    setMediaCompany("");
    setSpecialNotes("");
    setError(null);
  }, []);

  useEffect(() => {
    if (open) {
      resetForm();
    }
  }, [open, resetForm]);

  const formattedMessengers = useMemo<CreateCustomerMessengerInfo[] | undefined>(() => {
    if (!messengers.length) return undefined;
    return messengers.map((m) => ({ messenger: m.messenger, account: m.account }));
  }, [messengers]);

  const handleAddMessenger = () => {
    const trimmed = messengerAccount.trim();
    if (!trimmed) return;
    const exists = messengers.some((m) => m.messenger === messengerType && m.account === trimmed);
    if (exists) {
      setError("이미 동일한 메신저 계정이 추가되어 있습니다.");
      return;
    }
    setMessengers((prev) => [...prev, { messenger: messengerType, account: trimmed }]);
    setMessengerAccount("");
    setError(null);
  };

  const handleSubmit = async () => {
    if (!name.trim() || !contact1.trim()) {
      setError("이름과 연락처1은 필수 항목입니다.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const residentId = residentFront && residentBack ? `${residentFront}-${residentBack}` : undefined;
      const response = await CustomersService.create({
        name: name.trim(),
        contact1: contact1.trim(),
        contact2: contact2.trim() || undefined,
        residentId,
        ageRange: ageRange.trim() || undefined,
        job: job.trim() || undefined,
        messengerInfo: formattedMessengers,
        applicationRoute: applicationRoute.trim() || undefined,
        site: site.trim() || undefined,
        mediaCompany: mediaCompany.trim() || undefined,
        specialNotes: specialNotes.trim() || undefined,
        projectId: String(projectId),
      });
      const newCustomerId = response.data?.data?.id;
      if (!newCustomerId) throw new Error("고객 생성에 실패했습니다.");
      await onLink(newCustomerId);
      resetForm();
    } catch (err: any) {
      const message = err?.data?.message || err?.message || "고객 등록에 실패했습니다.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[140]">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="absolute left-1/2 top-1/2 w-[760px] -translate-x-1/2 -translate-y-1/2">
        <div className="relative max-h-[90vh] overflow-auto rounded-[16px] bg-white px-8 py-9 shadow-[0px_32px_90px_rgba(15,23,42,0.24)]">
          <button
            aria-label="close"
            onClick={onClose}
            className="absolute right-6 top-6 h-8 w-8 rounded-full border border-[#E2E2E2] text-[#808080]"
          >
            ×
          </button>
          <button
            type="button"
            onClick={onBack}
            className="inline-flex h-9 items-center gap-2 text-[13px] text-[#4B5563] hover:text-[#111827]"
          >
            <span className="text-[16px]">←</span>
            이전 단계로 돌아가기
          </button>
          <h2 className="mt-4 text-[22px] font-semibold text-[#111827]">고객등록</h2>
          {conversationName ? (
            <p className="mt-1 text-[13px] text-[#6B7280]">대화방: {conversationName}</p>
          ) : null}

          <section className="mt-6">
            <h3 className="text-[16px] font-semibold text-[#111827]">기본 정보</h3>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <label className="flex flex-col gap-2">
                <span className="text-[13px] text-[#6B7280]">이름*</span>
                <input value={name} onChange={(e) => setName(e.target.value)} className="h-[40px] rounded-[8px] border border-[#D1D5DB] px-3 text-[14px]" placeholder="고객 이름을 입력하세요" />
              </label>
              <div className="grid grid-cols-[120px,1fr] gap-2">
                <div className="flex flex-col gap-2">
                  <span className="text-[13px] text-[#6B7280]">연락처1*</span>
                  <select value={contact1Type} onChange={(e) => setContact1Type(e.target.value)} className="h-[40px] rounded-[8px] border border-[#D1D5DB] px-3 text-[14px]">
                    <option value="휴대폰">휴대폰</option>
                    <option value="집">집</option>
                    <option value="회사">회사</option>
                  </select>
                </div>
                <label className="flex flex-col gap-2">
                  <span className="text-[13px] text-[#6B7280]">&nbsp;</span>
                  <input value={contact1} onChange={(e) => setContact1(e.target.value)} className="h-[40px] rounded-[8px] border border-[#D1D5DB] px-3 text-[14px]" placeholder="010-0000-0000" />
                </label>
              </div>
              <div className="grid grid-cols-[120px,1fr] gap-2">
                <div className="flex flex-col gap-2">
                  <span className="text-[13px] text-[#6B7280]">연락처2</span>
                  <select value={contact2Type} onChange={(e) => setContact2Type(e.target.value)} className="h-[40px] rounded-[8px] border border-[#D1D5DB] px-3 text-[14px]">
                    <option value="집">집</option>
                    <option value="회사">회사</option>
                    <option value="기타">기타</option>
                  </select>
                </div>
                <label className="flex flex-col gap-2">
                  <span className="text-[13px] text-[#6B7280]">&nbsp;</span>
                  <input value={contact2} onChange={(e) => setContact2(e.target.value)} className="h-[40px] rounded-[8px] border border-[#D1D5DB] px-3 text-[14px]" placeholder="추가 연락처를 입력하세요" />
                </label>
              </div>
              <div className="grid grid-cols-[160px,1fr] gap-2 md:col-span-2">
                <div className="flex flex-col gap-2">
                  <span className="text-[13px] text-[#6B7280]">주민등록번호</span>
                  <div className="grid grid-cols-[1fr,1fr] gap-2">
                    <input value={residentFront} onChange={(e) => setResidentFront(e.target.value)} maxLength={6} className="h-[40px] rounded-[8px] border border-[#D1D5DB] px-3 text-[14px]" placeholder="123456" />
                    <input value={residentBack} onChange={(e) => setResidentBack(e.target.value)} maxLength={7} className="h-[40px] rounded-[8px] border border-[#D1D5DB] px-3 text-[14px]" placeholder="1234567" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <label className="flex flex-col gap-2">
                    <span className="text-[13px] text-[#6B7280]">연령</span>
                    <input value={ageRange} onChange={(e) => setAgeRange(e.target.value)} className="h-[40px] rounded-[8px] border border-[#D1D5DB] px-3 text-[14px]" placeholder="예: 30대" />
                  </label>
                  <label className="flex flex-col gap-2">
                    <span className="text-[13px] text-[#6B7280]">직업</span>
                    <input value={job} onChange={(e) => setJob(e.target.value)} className="h-[40px] rounded-[8px] border border-[#D1D5DB] px-3 text-[14px]" placeholder="직업" />
                  </label>
                </div>
              </div>
            </div>
          </section>

          <section className="mt-8">
            <h3 className="text-[16px] font-semibold text-[#111827]">메신저 계정</h3>
            <div className="mt-4 grid grid-cols-[140px_1fr_auto] items-end gap-3">
              <label className="flex flex-col gap-2">
                <span className="text-[13px] text-[#6B7280]">메신저</span>
                <select value={messengerType} onChange={(e) => setMessengerType(e.target.value)} className="h-[40px] rounded-[8px] border border-[#D1D5DB] px-3 text-[14px]">
                  {messengerOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-2">
                <span className="text-[13px] text-[#6B7280]">계정 ID</span>
                <input value={messengerAccount} onChange={(e) => setMessengerAccount(e.target.value)} className="h-[40px] rounded-[8px] border border-[#D1D5DB] px-3 text-[14px]" placeholder="계정 ID를 입력하세요" />
              </label>
              <button type="button" className="h-[40px] rounded-[8px] border border-[#D1D5DB] px-4 text-[13px] text-[#111827]" onClick={handleAddMessenger}>
                추가
              </button>
            </div>
            {messengers.length ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {messengers.map((m, idx) => (
                  <span key={`${m.messenger}-${m.account}-${idx}`} className="inline-flex items-center gap-2 rounded-full bg-[#EEF2FF] px-3 py-1 text-[12px] text-[#4D82F3]">
                    {messengerOptions.find((opt) => opt.value === m.messenger)?.label || m.messenger} · {m.account}
                    <button aria-label="remove" className="text-[#4D82F3]" onClick={() => setMessengers((prev) => prev.filter((_, i) => i !== idx))}>
                      ×
                    </button>
                  </span>
                ))}
              </div>
            ) : null}
          </section>

          <section className="mt-8">
            <h3 className="text-[16px] font-semibold text-[#111827]">데이터 정보</h3>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <label className="flex flex-col gap-2">
                <span className="text-[13px] text-[#6B7280]">신청 경로</span>
                <input value={applicationRoute} onChange={(e) => setApplicationRoute(e.target.value)} className="h-[40px] rounded-[8px] border border-[#D1D5DB] px-3 text-[14px]" placeholder="신청 경로를 입력하세요" />
              </label>
              <label className="flex flex-col gap-2">
                <span className="text-[13px] text-[#6B7280]">사이트</span>
                <input value={site} onChange={(e) => setSite(e.target.value)} className="h-[40px] rounded-[8px] border border-[#D1D5DB] px-3 text-[14px]" placeholder="사이트명을 입력하세요" />
              </label>
              <label className="flex flex-col gap-2">
                <span className="text-[13px] text-[#6B7280]">매체사</span>
                <input value={mediaCompany} onChange={(e) => setMediaCompany(e.target.value)} className="h-[40px] rounded-[8px] border border-[#D1D5DB] px-3 text-[14px]" placeholder="매체사를 입력하세요" />
              </label>
              <label className="flex flex-col gap-2 md:col-span-2">
                <span className="text-[13px] text-[#6B7280]">특이사항</span>
                <textarea value={specialNotes} onChange={(e) => setSpecialNotes(e.target.value)} rows={3} className="rounded-[8px] border border-[#D1D5DB] px-3 py-2 text-[14px]" placeholder="특이사항을 입력하세요" />
              </label>
            </div>
          </section>

          {error ? (
            <div className="mt-5 rounded-[10px] border border-[#FECACA] bg-[#FEF2F2] px-3 py-2 text-[12px] text-[#B91C1C]">
              {error}
            </div>
          ) : null}

          <div className="mt-6 flex justify-end gap-3">
            <button
              className="h-[38px] rounded-[10px] border border-[#D1D5DB] px-5 text-[13px] text-[#4B5563]"
              onClick={resetForm}
              disabled={loading}
            >
              초기화
            </button>
            <button
              className="h-[38px] rounded-[10px] bg-[#00C97E] px-5 text-[13px] font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? "적용 중..." : "적용완료"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


