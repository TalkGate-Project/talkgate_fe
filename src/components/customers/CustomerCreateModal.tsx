"use client";

import { useMemo, useState } from "react";
import BaseModal from "@/components/common/BaseModal";
import { useSelectedProjectId } from "@/hooks/useSelectedProjectId";
import { CustomersService } from "@/services/customers";
import type { CreateCustomerMessengerInfo } from "@/types/customers";

type Props = {
  open: boolean;
  onClose: () => void;
  onCreated?: () => void;
};

type MessengerAccount = {
  messenger: string;
  account: string;
};

export default function CustomerCreateModal({ open, onClose, onCreated }: Props) {
  const [projectId] = useSelectedProjectId();
  const [submitting, setSubmitting] = useState(false);

  // 기본 정보
  const [name, setName] = useState("");
  const [contact1Type, setContact1Type] = useState("휴대폰");
  const [contact1, setContact1] = useState("");
  const [contact2Type, setContact2Type] = useState("집");
  const [contact2, setContact2] = useState("");
  const [residentId1, setResidentId1] = useState("");
  const [residentId2, setResidentId2] = useState("");
  const [ageRange, setAgeRange] = useState("");
  const [job, setJob] = useState("");

  // 메신저 계정
  const [messengerAccounts, setMessengerAccounts] = useState<MessengerAccount[]>([]);
  const [currentMessengerType, setCurrentMessengerType] = useState("기타");
  const [currentMessengerAccount, setCurrentMessengerAccount] = useState("");

  // 데이터 정보
  const [applicationRoute, setApplicationRoute] = useState("");
  const [site, setSite] = useState("");
  const [mediaCompany, setMediaCompany] = useState("");
  const [specialNotes, setSpecialNotes] = useState("");

  if (!open) return null;

  const contactTypes = ["휴대폰", "집", "회사", "기타"];
  const messengerTypes = ["라인", "카카오톡", "텔레그램", "인스타그램", "기타"];

  const handleAddMessenger = () => {
    if (!currentMessengerAccount.trim()) return;
    setMessengerAccounts((prev) => [...prev, { messenger: currentMessengerType, account: currentMessengerAccount.trim() }]);
    setCurrentMessengerAccount("");
  };

  const handleRemoveMessenger = (index: number) => {
    setMessengerAccounts((prev) => prev.filter((_, i) => i !== index));
  };

  const handleReset = () => {
    setName("");
    setContact1Type("휴대폰");
    setContact1("");
    setContact2Type("집");
    setContact2("");
    setResidentId1("");
    setResidentId2("");
    setAgeRange("");
    setJob("");
    setMessengerAccounts([]);
    setCurrentMessengerType("기타");
    setCurrentMessengerAccount("");
    setApplicationRoute("");
    setSite("");
    setMediaCompany("");
    setSpecialNotes("");
  };

  const handleSubmit = async () => {
    if (!projectId) return alert("프로젝트를 선택해주세요.");
    if (!name.trim() || !contact1.trim()) {
      alert("이름과 연락처1은 필수입니다.");
      return;
    }
    setSubmitting(true);
    try {
      const messengerInfo: CreateCustomerMessengerInfo[] = messengerAccounts.map((acc) => ({
        messenger: acc.messenger.toLowerCase().replace(/톡/g, "").replace(/그램/g, "").replace(/스타그램/g, "instagram") || "other",
        account: acc.account,
      }));

      await CustomersService.create({
        projectId,
        name: name.trim(),
        contact1: contact1.trim(),
        contact2: contact2.trim() || undefined,
        residentId: residentId1 && residentId2 ? `${residentId1}-${residentId2}` : undefined,
        ageRange: ageRange || undefined,
        job: job || undefined,
        messengerInfo: messengerInfo.length > 0 ? messengerInfo : undefined,
        applicationRoute: applicationRoute || undefined,
        site: site || undefined,
        mediaCompany: mediaCompany || undefined,
        specialNotes: specialNotes || undefined,
      });
      onCreated?.();
      handleReset();
      onClose();
    } catch (e: any) {
      alert(e?.data?.message || e?.message || "고객 등록에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <BaseModal
      onClose={() => (!submitting ? onClose() : undefined)}
      overlayClassName="bg-black/30"
      containerClassName="relative w-[848px] h-[856px] rounded-[14px] bg-white shadow-[0px_13px_61px_rgba(169,169,169,0.37)]"
      ariaLabel="고객 등록"
    >
      <div className="relative w-full h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4">
          <h2 className="text-[18px] font-semibold leading-[21px] text-ink">고객등록</h2>
          <button
            aria-label="close"
            onClick={() => !submitting && onClose()}
            className="w-6 h-6 grid place-items-center text-neutral-50 hover:text-ink transition-colors"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 pb-6">
          {/* 기본 정보 */}
          <div className="mb-6">
            <h3 className="text-[16px] font-semibold leading-[19px] text-ink mb-4">기본 정보</h3>
            <div className="border-t border-neutral-30 pt-4">
              <div className="grid grid-cols-2 gap-4 mb-4">
                {/* 이름 */}
                <div>
                  <label className="block text-[14px] leading-[17px] text-neutral-60 mb-2">
                    이름<span className="text-[#FF0000]">*</span>
                  </label>
                  <div className="flex flex-col justify-center items-center px-3 py-2 gap-[10px] border border-neutral-30 rounded-[5px] h-[33px]">
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full h-[17px] outline-none border-none bg-transparent text-[14px] leading-[17px] tracking-[-0.02em] placeholder:text-neutral-60 text-ink"
                      placeholder="고객 이름을 입력하세요"
                    />
                  </div>
                </div>

                {/* 연락처1 */}
                <div>
                  <label className="block text-[14px] leading-[17px] text-neutral-60 mb-2">
                    연락처1<span className="text-[#FF0000]">*</span>
                  </label>
                  <div className="flex gap-2">
                    <div className="w-[120px]">
                      <div className="flex flex-col justify-center items-center px-3 py-2 gap-[10px] border border-neutral-30 rounded-[5px] h-[33px] relative">
                        <select
                          value={contact1Type}
                          onChange={(e) => setContact1Type(e.target.value)}
                          className="w-full h-[17px] outline-none border-none bg-transparent text-[14px] leading-[17px] tracking-[-0.02em] text-neutral-60 appearance-none pr-6"
                        >
                          {contactTypes.map((type) => (
                            <option key={type} value={type}>
                              {type}
                            </option>
                          ))}
                        </select>
                        <svg
                          className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
                          width="10"
                          height="8"
                          viewBox="0 0 10 8"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                                          <path d="M5.40544 7.4382C5.20587 7.71473 4.79413 7.71473 4.59456 7.4382L0.241885 2.7926C0.00323535 2.46192 0.239523 2 0.647327 2L9.35267 2C9.76048 2 9.99676 2.46192 9.75812 2.7926L5.40544 7.4382Z" fill="currentColor" className="fill-ink" />
                        </svg>
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex flex-col justify-center items-center px-3 py-2 gap-[10px] border border-neutral-30 rounded-[5px] h-[33px]">
                        <input
                          type="text"
                          value={contact1}
                          onChange={(e) => setContact1(e.target.value)}
                          className="w-full h-[17px] outline-none border-none bg-transparent text-[14px] leading-[17px] tracking-[-0.02em] placeholder:text-neutral-60 text-ink"
                          placeholder="010-1234-5678"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* 연락처2 */}
                <div>
                  <label className="block text-[14px] leading-[17px] text-neutral-60 mb-2">연락처2</label>
                  <div className="flex gap-2">
                    <div className="w-[120px]">
                      <div className="flex flex-col justify-center items-center px-3 py-2 gap-[10px] border border-neutral-30 rounded-[5px] h-[33px] relative">
                        <select
                          value={contact2Type}
                          onChange={(e) => setContact2Type(e.target.value)}
                          className="w-full h-[17px] outline-none border-none bg-transparent text-[14px] leading-[17px] tracking-[-0.02em] text-neutral-60 appearance-none pr-6"
                        >
                          {contactTypes.map((type) => (
                            <option key={type} value={type}>
                              {type}
                            </option>
                          ))}
                        </select>
                        <svg
                          className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
                          width="10"
                          height="8"
                          viewBox="0 0 10 8"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                                          <path d="M5.40544 7.4382C5.20587 7.71473 4.79413 7.71473 4.59456 7.4382L0.241885 2.7926C0.00323535 2.46192 0.239523 2 0.647327 2L9.35267 2C9.76048 2 9.99676 2.46192 9.75812 2.7926L5.40544 7.4382Z" fill="currentColor" className="fill-ink" />
                        </svg>
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex flex-col justify-center items-center px-3 py-2 gap-[10px] border border-neutral-30 rounded-[5px] h-[33px]">
                        <input
                          type="text"
                          value={contact2}
                          onChange={(e) => setContact2(e.target.value)}
                          className="w-full h-[17px] outline-none border-none bg-transparent text-[14px] leading-[17px] tracking-[-0.02em] placeholder:text-neutral-60 text-ink"
                          placeholder="선택사항"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* 주민등록번호 */}
                <div>
                  <label className="block text-[14px] leading-[17px] text-neutral-60 mb-2">주민등록번호</label>
                  <div className="flex gap-2 items-center">
                    <div className="flex-1">
                      <div className="flex flex-col justify-center items-start px-3 py-2 gap-[10px] border border-neutral-30 rounded-[5px] h-[33px]">
                        <input
                          type="text"
                          value={residentId1}
                          onChange={(e) => setResidentId1(e.target.value.replace(/\D/g, "").slice(0, 6))}
                          className="w-full h-[17px] outline-none border-none bg-transparent text-[14px] leading-[17px] tracking-[-0.02em] placeholder:text-neutral-60 text-ink text-left"
                          placeholder="123456"
                          maxLength={6}
                        />
                      </div>
                    </div>
                    <span className="text-[14px] leading-[17px] text-neutral-60">-</span>
                    <div className="flex-1">
                      <div className="flex flex-col justify-center items-start px-3 py-2 gap-[10px] border border-neutral-30 rounded-[5px] h-[33px]">
                        <input
                          type="text"
                          value={residentId2}
                          onChange={(e) => setResidentId2(e.target.value.replace(/\D/g, "").slice(0, 7))}
                          className="w-full h-[17px] outline-none border-none bg-transparent text-[14px] leading-[17px] tracking-[-0.02em] placeholder:text-neutral-60 text-ink text-left"
                          placeholder="567890"
                          maxLength={7}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* 연령 */}
                <div>
                  <label className="block text-[14px] leading-[17px] text-neutral-60 mb-2">연령</label>
                  <div className="flex flex-col justify-center items-center px-3 py-2 gap-[10px] border border-neutral-30 rounded-[5px] h-[33px]">
                    <input
                      type="text"
                      value={ageRange}
                      onChange={(e) => setAgeRange(e.target.value)}
                      className="w-full h-[17px] outline-none border-none bg-transparent text-[14px] leading-[17px] tracking-[-0.02em] placeholder:text-neutral-60 text-ink"
                      placeholder="연령"
                    />
                  </div>
                </div>

                {/* 직업 */}
                <div>
                  <label className="block text-[14px] leading-[17px] text-neutral-60 mb-2">직업</label>
                  <div className="flex flex-col justify-center items-center px-3 py-2 gap-[10px] border border-neutral-30 rounded-[5px] h-[33px]">
                    <input
                      type="text"
                      value={job}
                      onChange={(e) => setJob(e.target.value)}
                      className="w-full h-[17px] outline-none border-none bg-transparent text-[14px] leading-[17px] tracking-[-0.02em] placeholder:text-neutral-60 text-ink"
                      placeholder="직업"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 메신저 계정 */}
          <div className="mb-6">
            <h3 className="text-[16px] font-semibold leading-[19px] text-ink mb-4">메신저 계정</h3>
            <div className="border-t border-neutral-30 pt-4">
              <div className="flex gap-2 mb-3">
                <div className="w-[120px]">
                  <div className="flex flex-col justify-center items-center px-3 py-2 gap-[10px] border border-neutral-30 rounded-[5px] h-[34px] relative">
                    <select
                      value={currentMessengerType}
                      onChange={(e) => setCurrentMessengerType(e.target.value)}
                      className="w-full h-[17px] outline-none border-none bg-transparent text-[14px] leading-[17px] tracking-[-0.02em] text-neutral-60 appearance-none pr-6"
                    >
                      {messengerTypes.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                    <svg
                      className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
                      width="10"
                      height="8"
                      viewBox="0 0 10 8"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                                      <path d="M5.40544 7.4382C5.20587 7.71473 4.79413 7.71473 4.59456 7.4382L0.241885 2.7926C0.00323535 2.46192 0.239523 2 0.647327 2L9.35267 2C9.76048 2 9.99676 2.46192 9.75812 2.7926L5.40544 7.4382Z" fill="currentColor" className="fill-ink" />
                    </svg>
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex flex-col justify-center items-center px-3 py-2 gap-[10px] border border-neutral-30 rounded-[5px] h-[34px]">
                    <input
                      type="text"
                      value={currentMessengerAccount}
                      onChange={(e) => setCurrentMessengerAccount(e.target.value)}
                      className="w-full h-[17px] outline-none border-none bg-transparent text-[14px] leading-[17px] tracking-[-0.02em] placeholder:text-neutral-60 text-ink"
                      placeholder="계정 ID를 입력하세요"
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleAddMessenger}
                  className="h-[34px] px-3 rounded-[5px] bg-neutral-90 text-[14px] font-semibold tracking-[-0.02em] text-neutral-40 whitespace-nowrap"
                >
                  추가
                </button>
              </div>
              {messengerAccounts.length > 0 && (
                <div className="space-y-2">
                  {messengerAccounts.map((acc, index) => (
                    <div key={index} className="flex items-center gap-2 px-3 py-2 bg-neutral-10 rounded-[5px]">
                      <span className="text-[14px] text-ink flex-1">
                        {acc.messenger}: {acc.account}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveMessenger(index)}
                        className="text-neutral-60 hover:text-ink"
                      >
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M3 9L9 3M3 3L9 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 데이터 정보 */}
          <div>
            <h3 className="text-[16px] font-semibold leading-[19px] text-ink mb-4">데이터 정보</h3>
            <div className="border-t border-neutral-30 pt-4">
              <div className="grid grid-cols-2 gap-4 mb-4">
                {/* 신청 경로 */}
                <div>
                  <label className="block text-[14px] leading-[17px] text-neutral-60 mb-2">신청 경로</label>
                  <div className="flex flex-col justify-center items-center px-3 py-2 gap-[10px] border border-neutral-30 rounded-[5px] h-[33px]">
                    <input
                      type="text"
                      value={applicationRoute}
                      onChange={(e) => setApplicationRoute(e.target.value)}
                      className="w-full h-[17px] outline-none border-none bg-transparent text-[14px] leading-[17px] tracking-[-0.02em] placeholder:text-neutral-60 text-ink"
                      placeholder="신청 경로를 입력하세요"
                    />
                  </div>
                </div>

                {/* 사이트 */}
                <div>
                  <label className="block text-[14px] leading-[17px] text-neutral-60 mb-2">사이트</label>
                  <div className="flex flex-col justify-center items-center px-3 py-2 gap-[10px] border border-neutral-30 rounded-[5px] h-[33px]">
                    <input
                      type="text"
                      value={site}
                      onChange={(e) => setSite(e.target.value)}
                      className="w-full h-[17px] outline-none border-none bg-transparent text-[14px] leading-[17px] tracking-[-0.02em] placeholder:text-neutral-60 text-ink"
                      placeholder="사이트"
                    />
                  </div>
                </div>

                {/* 매체사 */}
                <div>
                  <label className="block text-[14px] leading-[17px] text-neutral-60 mb-2">매체사</label>
                  <div className="flex flex-col justify-center items-center px-3 py-2 gap-[10px] border border-neutral-30 rounded-[5px] h-[33px]">
                    <input
                      type="text"
                      value={mediaCompany}
                      onChange={(e) => setMediaCompany(e.target.value)}
                      className="w-full h-[17px] outline-none border-none bg-transparent text-[14px] leading-[17px] tracking-[-0.02em] placeholder:text-neutral-60 text-ink"
                      placeholder="매체사"
                    />
                  </div>
                </div>
              </div>

              {/* 특이사항 */}
              <div>
                <label className="block text-[14px] leading-[17px] text-neutral-60 mb-2">특이사항</label>
                <div className="flex flex-col justify-start items-start px-3 py-2 gap-[10px] border border-neutral-30 rounded-[5px] min-h-[66px]">
                  <textarea
                    value={specialNotes}
                    onChange={(e) => setSpecialNotes(e.target.value)}
                    className="w-full min-h-[51px] outline-none border-none bg-transparent text-[14px] leading-[17px] tracking-[-0.02em] placeholder:text-neutral-60 text-ink resize-none"
                    placeholder="특이사항을 입력하세요"
                    rows={3}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-neutral-30 px-6 py-4 flex justify-end gap-3">
          <button
            type="button"
            onClick={handleReset}
            disabled={submitting}
            className="h-[34px] px-3 rounded-[5px] border border-neutral-30 text-[14px] font-semibold tracking-[-0.02em] text-ink bg-white disabled:opacity-60"
          >
            초기화
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting || !projectId}
            className="h-[34px] px-3 rounded-[5px] bg-neutral-90 text-[14px] font-semibold tracking-[-0.02em] text-neutral-40 disabled:opacity-60"
          >
            적용완료
          </button>
        </div>
      </div>
    </BaseModal>
  );
}
