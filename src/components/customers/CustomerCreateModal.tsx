"use client";

import { useMemo, useState } from "react";
import BaseModal from "@/components/common/BaseModal";
import MessengerBadge from "@/components/common/MessengerBadge";
import DatePicker from "@/components/common/DatePicker";
import { useSelectedProjectId } from "@/hooks/useSelectedProjectId";
import { CustomersService } from "@/services/customers";
import type { CreateCustomerMessengerInfo } from "@/types/customers";
import { showErrorModal } from "@/providers/ErrorFeedbackModalProvider";
import { format } from "date-fns";

type Props = {
  open: boolean;
  onClose: () => void;
  onCreated?: () => void;
};

type MessengerAccount = {
  messenger: string;
  account: string;
};

const messengerLabelToApiCode = (label: string): string => {
  switch (label) {
    case "라인":
      return "line";
    case "카카오톡":
    case "카카오":
      return "kakaotalk";
    case "텔레그램":
      return "telegram";
    case "인스타그램":
      return "instagram";
    default:
      return "other";
  }
};

export default function CustomerCreateModal({
  open,
  onClose,
  onCreated,
}: Props) {
  const [projectId] = useSelectedProjectId();
  const [submitting, setSubmitting] = useState(false);
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);
  const [touchedName, setTouchedName] = useState(false);
  const [touchedContact1, setTouchedContact1] = useState(false);

  // 기본 정보
  const [name, setName] = useState("");
  const [contact1Type, setContact1Type] = useState("휴대폰");
  const [contact1, setContact1] = useState("");
  const [contact2Type, setContact2Type] = useState("집");
  const [contact2, setContact2] = useState("");
  const [birthDate, setBirthDate] = useState<Date | null>(null);
  const [ageRange, setAgeRange] = useState("");
  const [job, setJob] = useState("");

  // 메신저 계정
  const [messengerAccounts, setMessengerAccounts] = useState<
    MessengerAccount[]
  >([]);
  const [currentMessengerType, setCurrentMessengerType] = useState("기타");
  const [currentMessengerAccount, setCurrentMessengerAccount] = useState("");

  // 데이터 정보
  const [applicationRoute, setApplicationRoute] = useState("");
  const [site, setSite] = useState("");
  const [mediaCompany, setMediaCompany] = useState("");
  const [keyword, setKeyword] = useState("");
  const [ipAddress, setIpAddress] = useState("");
  const [specialNotes, setSpecialNotes] = useState("");

  if (!open) return null;

  const contactTypes = ["휴대폰", "집", "회사", "기타"];
  const messengerTypes = ["라인", "카카오톡", "텔레그램", "인스타그램", "기타"];
  const sanitizeContactInput = (value: string) => value.replace(/\D/g, "").slice(0, 11);

  const contact1Digits = contact1.replace(/\D/g, "");
  const nameError = name.trim() ? "" : "이름은 필수 항목입니다.";
  const contact1Error = !contact1Digits
    ? "연락처는 필수 항목입니다."
    : contact1Digits.length < 9
      ? "연락처는 9자 이상 입력해 주세요."
      : "";
  const isValid = !nameError && !contact1Error;
  const showNameValidation = attemptedSubmit || touchedName;
  const showContact1Validation = attemptedSubmit || touchedContact1;

  const handleAddMessenger = () => {
    if (!currentMessengerAccount.trim()) return;
    setMessengerAccounts((prev) => [
      ...prev,
      {
        messenger: currentMessengerType,
        account: currentMessengerAccount.trim(),
      },
    ]);
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
    setBirthDate(null);
    setAgeRange("");
    setJob("");
    setMessengerAccounts([]);
    setCurrentMessengerType("기타");
    setCurrentMessengerAccount("");
    setApplicationRoute("");
    setSite("");
    setMediaCompany("");
    setKeyword("");
    setIpAddress("");
    setSpecialNotes("");
    setAttemptedSubmit(false);
    setTouchedName(false);
    setTouchedContact1(false);
  };

  const handleSubmit = async () => {
    setAttemptedSubmit(true);
    if (!projectId) {
      showErrorModal({
        title: "알림",
        headline: "프로젝트를 선택해주세요.",
        confirmText: "확인",
        cancelText: null,
        hideCancel: true,
      });
      return;
    }
    if (!isValid) {
      return;
    }
    setSubmitting(true);
    try {
      const messengerInfo: CreateCustomerMessengerInfo[] =
        messengerAccounts.map((acc) => ({
          messenger: messengerLabelToApiCode(acc.messenger),
          account: acc.account,
        }));

      await CustomersService.create({
        projectId,
        name: name.trim(),
        contact1: contact1.trim(),
        contact2: contact2.trim() || undefined,
        // 생년월일을 YYYY-MM-DD 형식으로 전송
        birth: birthDate ? format(birthDate, "yyyy-MM-dd") : undefined,
        ageRange: ageRange || undefined,
        job: job || undefined,
        messengerInfo: messengerInfo.length > 0 ? messengerInfo : undefined,
        applicationRoute: applicationRoute || undefined,
        site: site || undefined,
        mediaCompany: mediaCompany || undefined,
        keyword: keyword || undefined,
        ipAddress: ipAddress || undefined,
        specialNotes: specialNotes || undefined,
      });
      onCreated?.();
      handleReset();
      onClose();
    } catch (e: any) {
      showErrorModal({
        title: "오류 발생",
        headline: "고객 등록에 실패했습니다. 잠시 후 다시 시도해주세요.",
        confirmText: "확인",
        cancelText: null,
        hideCancel: true,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <BaseModal
      onClose={() => (!submitting ? onClose() : undefined)}
      overlayClassName="bg-black/30 dark:bg-[#000000CC]"
      containerClassName="relative w-full h-full lg:w-[848px] !lg:h-[523px] !lg:max-h-[523px] rounded-t-[14px] lg:rounded-[14px] bg-card dark:bg-neutral-10 flex flex-col overflow-hidden lg:shadow-[0px_13px_61px_rgba(169,169,169,0.366013)] lg:drop-shadow-[0px_8px_12px_rgba(9,30,66,0.1)] dark:lg:shadow-none dark:lg:drop-shadow-none"
      ariaLabel="고객 등록"
      fullScreenOnMobile={true}
    >
      <div className="relative w-full h-full flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 lg:px-7 pt-4 lg:pt-6 pb-4 shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={() => !submitting && onClose()}
              className="lg:hidden cursor-pointer p-1 -ml-1"
              aria-label="뒤로가기"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M15 19L8 12L15 5" stroke="currentColor" className="text-ink" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <h2 className="text-[18px] font-semibold leading-[21px]">고객등록</h2>
          </div>
          <button
            aria-label="close"
            onClick={() => !submitting && onClose()}
            className="hidden lg:grid w-6 h-6 place-items-center"
          >
            <svg
              className="cursor-pointer"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M6 18L18 6M6 6L18 18"
                stroke="currentColor"
                className="text-neutral-60 dark:text-neutral-50"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 min-h-0 overflow-y-auto px-4 lg:px-7 pb-6 pt-[14px]">
          {/* 기본 정보 */}
          <div className="mb-[30px]">
            <h3 className="text-[16px] font-semibold leading-[19px] text-ink mb-4">
              기본 정보
            </h3>
            <div className="border-t border-neutral-30 dark:border-neutral-30 pt-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-6 gap-y-5 mb-4">
                {/* 이름 */}
                <div>
                  <label className="block text-[14px] leading-[17px] text-neutral-60 mb-2">
                    이름<span className="text-[#FF0000]">*</span>
                  </label>
                  <div className="flex flex-col justify-center items-center px-3 py-2 gap-[10px] border border-neutral-30 dark:border-neutral-30 rounded-[5px] h-[33px] bg-card dark:bg-neutral-10">
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => {
                        setName(e.target.value);
                        if (!touchedName) setTouchedName(true);
                      }}
                      className="w-full h-[17px] outline-none border-none bg-transparent text-[14px] leading-[17px] tracking-[-0.02em] placeholder:text-neutral-60 text-ink"
                      placeholder="고객 이름을 입력하세요"
                    />
                  </div>
                  {showNameValidation && nameError && (
                    <p className="mt-1 text-[12px] text-danger-40">{nameError}</p>
                  )}
                </div>

                {/* 연락처1 */}
                <div>
                  <label className="block text-[14px] leading-[17px] text-neutral-60 mb-2">
                    연락처1<span className="text-[#FF0000]">*</span>
                  </label>
                  <div className="flex gap-3">
                    <div className="w-[106px]">
                      <div className="flex flex-col justify-center items-center px-3 py-2 gap-[10px] border border-neutral-30 dark:border-neutral-30 rounded-[5px] h-[33px] relative bg-card dark:bg-neutral-10">
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
                          <path
                            d="M5.40544 7.4382C5.20587 7.71473 4.79413 7.71473 4.59456 7.4382L0.241885 2.7926C0.00323535 2.46192 0.239523 2 0.647327 2L9.35267 2C9.76048 2 9.99676 2.46192 9.75812 2.7926L5.40544 7.4382Z"
                            fill="currentColor"
                            className="fill-ink"
                          />
                        </svg>
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex flex-col justify-center items-center px-3 py-2 gap-[10px] border border-neutral-30 dark:border-neutral-30 rounded-[5px] h-[33px] bg-card dark:bg-neutral-10">
                        <input
                          type="text"
                          value={contact1}
                          onChange={(e) => {
                            setContact1(sanitizeContactInput(e.target.value));
                            if (!touchedContact1) setTouchedContact1(true);
                          }}
                          inputMode="numeric"
                          className="w-full h-[17px] outline-none border-none bg-transparent text-[14px] leading-[17px] tracking-[-0.02em] placeholder:text-neutral-60 text-ink"
                          placeholder="'-'를 제외한 숫자만 입력해 주세요."
                        />
                      </div>
                    </div>
                  </div>
                  {showContact1Validation && contact1Error && (
                    <p className="mt-1 text-[12px] text-danger-40">{contact1Error}</p>
                  )}
                </div>

                {/* 연락처2 */}
                <div>
                  <label className="block text-[14px] leading-[17px] text-neutral-60 mb-2">
                    연락처2
                  </label>
                  <div className="flex gap-2">
                    <div className="w-[106px]">
                      <div className="flex flex-col justify-center items-center px-3 py-2 gap-[10px] border border-neutral-30 dark:border-neutral-30 rounded-[5px] h-[33px] relative bg-card dark:bg-neutral-10">
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
                          <path
                            d="M5.40544 7.4382C5.20587 7.71473 4.79413 7.71473 4.59456 7.4382L0.241885 2.7926C0.00323535 2.46192 0.239523 2 0.647327 2L9.35267 2C9.76048 2 9.99676 2.46192 9.75812 2.7926L5.40544 7.4382Z"
                            fill="currentColor"
                            className="fill-ink"
                          />
                        </svg>
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex flex-col justify-center items-center px-3 py-2 gap-[10px] border border-neutral-30 dark:border-neutral-30 rounded-[5px] h-[33px] bg-card dark:bg-neutral-10">
                        <input
                          type="text"
                          value={contact2}
                          onChange={(e) => setContact2(sanitizeContactInput(e.target.value))}
                          inputMode="numeric"
                          className="w-full h-[17px] outline-none border-none bg-transparent text-[14px] leading-[17px] tracking-[-0.02em] placeholder:text-neutral-60 text-ink"
                          placeholder="'-'를 제외한 숫자만 입력해 주세요."
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* 생년월일 */}
                <div>
                  <label className="block text-[14px] leading-[17px] text-neutral-60 mb-2">
                    생년월일
                  </label>
                  <DatePicker
                    value={birthDate}
                    onChange={setBirthDate}
                    placeholder="YYYY-MM-DD"
                    dateFormat="yyyy-MM-dd"
                    className="!h-[33px] !rounded-[5px] border-neutral-30 dark:border-neutral-30 bg-card dark:bg-neutral-10 text-ink dark:text-ink"
                  />
                </div>

                {/* 연령 */}
                <div>
                  <label className="block text-[14px] leading-[17px] text-neutral-60 mb-2">
                    연령
                  </label>
                  <div className="flex flex-col justify-center items-center px-3 py-2 gap-[10px] border border-neutral-30 dark:border-neutral-30 rounded-[5px] h-[33px] bg-card dark:bg-neutral-10">
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
                  <label className="block text-[14px] leading-[17px] text-neutral-60 mb-2">
                    직업
                  </label>
                  <div className="flex flex-col justify-center items-center px-3 py-2 gap-[10px] border border-neutral-30 dark:border-neutral-30 rounded-[5px] h-[33px] bg-card dark:bg-neutral-10">
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
          <div className="mb-[30px]">
            <h3 className="text-[16px] font-semibold leading-[19px] text-ink mb-4">
              메신저 계정
            </h3>
            <div className="border-t border-neutral-30 dark:border-neutral-30 pt-4">
              <div className="flex gap-2 mb-3">
                <div className="w-[106px]">
                  <div className="flex flex-col justify-center items-center px-3 py-2 gap-[10px] border border-neutral-30 dark:border-neutral-30 rounded-[5px] h-[34px] relative bg-card dark:bg-neutral-10">
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
                      <path
                        d="M5.40544 7.4382C5.20587 7.71473 4.79413 7.71473 4.59456 7.4382L0.241885 2.7926C0.00323535 2.46192 0.239523 2 0.647327 2L9.35267 2C9.76048 2 9.99676 2.46192 9.75812 2.7926L5.40544 7.4382Z"
                        fill="currentColor"
                        className="fill-ink"
                      />
                    </svg>
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex flex-col justify-center items-center px-3 py-2 gap-[10px] border border-neutral-30 rounded-[5px] h-[34px]">
                    <input
                      type="text"
                      value={currentMessengerAccount}
                      onChange={(e) =>
                        setCurrentMessengerAccount(e.target.value)
                      }
                      className="w-full h-[17px] outline-none border-none bg-transparent text-[14px] leading-[17px] tracking-[-0.02em] placeholder:text-neutral-60 text-ink"
                      placeholder="계정 ID를 입력하세요"
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleAddMessenger}
                  className="cursor-pointer h-[34px] px-3 rounded-[5px] bg-neutral-90 dark:bg-neutral-80 text-[14px] font-semibold tracking-[-0.02em] text-neutral-0 dark:text-neutral-0 whitespace-nowrap"
                >
                  추가
                </button>
              </div>
              {messengerAccounts.length > 0 && (
                <div className="space-y-2">
                  {messengerAccounts.map((acc, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 px-3 py-2 bg-neutral-10 dark:bg-neutral-20 rounded-[5px]"
                    >
                      <MessengerBadge messenger={acc.messenger} />
                      <span className="text-[14px] text-ink flex-1">{acc.account}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveMessenger(index)}
                        className="cursor-pointer text-neutral-60 dark:text-neutral-60 hover:text-ink dark:hover:text-neutral-90"
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
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
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
            <h3 className="text-[16px] font-semibold leading-[19px] text-ink mb-4">
              데이터 정보
            </h3>
            <div className="border-t border-neutral-30 dark:border-neutral-30 pt-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
                {/* 신청 경로 */}
                <div>
                  <label className="block text-[14px] leading-[17px] text-neutral-60 mb-2">
                    신청 경로
                  </label>
                  <div className="flex flex-col justify-center items-center px-3 py-2 gap-[10px] border border-neutral-30 dark:border-neutral-30 rounded-[5px] h-[33px] bg-card dark:bg-neutral-10">
                    <input
                      type="text"
                      value={applicationRoute}
                      onChange={(e) => setApplicationRoute(e.target.value)}
                      className="w-full h-[17px] outline-none border-none bg-transparent text-[14px] leading-[17px] tracking-[-0.02em] placeholder:text-neutral-60 text-ink"
                    />
                  </div>
                </div>

                {/* 사이트 */}
                <div>
                  <label className="block text-[14px] leading-[17px] text-neutral-60 mb-2">
                    사이트
                  </label>
                  <div className="flex flex-col justify-center items-center px-3 py-2 gap-[10px] border border-neutral-30 dark:border-neutral-30 rounded-[5px] h-[33px] bg-card dark:bg-neutral-10">
                    <input
                      type="text"
                      value={site}
                      onChange={(e) => setSite(e.target.value)}
                      className="w-full h-[17px] outline-none border-none bg-transparent text-[14px] leading-[17px] tracking-[-0.02em] placeholder:text-neutral-60 text-ink"
                    />
                  </div>
                </div>

                {/* 매체사 */}
                <div>
                  <label className="block text-[14px] leading-[17px] text-neutral-60 mb-2">
                    매체사
                  </label>
                  <div className="flex flex-col justify-center items-center px-3 py-2 gap-[10px] border border-neutral-30 dark:border-neutral-30 rounded-[5px] h-[33px] bg-card dark:bg-neutral-10">
                    <input
                      type="text"
                      value={mediaCompany}
                      onChange={(e) => setMediaCompany(e.target.value)}
                      className="w-full h-[17px] outline-none border-none bg-transparent text-[14px] leading-[17px] tracking-[-0.02em] placeholder:text-neutral-60 text-ink"
                    />
                  </div>
                </div>

                {/* 키워드 */}
                <div>
                  <label className="block text-[14px] leading-[17px] text-neutral-60 mb-2">
                    키워드
                  </label>
                  <div className="flex flex-col justify-center items-center px-3 py-2 gap-[10px] border border-neutral-30 dark:border-neutral-30 rounded-[5px] h-[33px] bg-card dark:bg-neutral-10">
                    <input
                      type="text"
                      value={keyword}
                      onChange={(e) => setKeyword(e.target.value)}
                      className="w-full h-[17px] outline-none border-none bg-transparent text-[14px] leading-[17px] tracking-[-0.02em] placeholder:text-neutral-60 text-ink"
                    />
                  </div>
                </div>

                {/* IP 주소 */}
                <div>
                  <label className="block text-[14px] leading-[17px] text-neutral-60 mb-2">
                    IP 주소
                  </label>
                  <div className="flex flex-col justify-center items-center px-3 py-2 gap-[10px] border border-neutral-30 dark:border-neutral-30 rounded-[5px] h-[33px] bg-card dark:bg-neutral-10">
                    <input
                      type="text"
                      value={ipAddress}
                      onChange={(e) => setIpAddress(e.target.value)}
                      className="w-full h-[17px] outline-none border-none bg-transparent text-[14px] leading-[17px] tracking-[-0.02em] placeholder:text-neutral-60 text-ink"
                    />
                  </div>
                </div>
              </div>

              {/* 특이사항 */}
              <div>
                <label className="block text-[14px] leading-[17px] text-neutral-60 mb-2">
                  특이사항
                </label>
                <div className="flex flex-col justify-start items-start px-3 py-2 gap-[10px] border border-neutral-30 dark:border-neutral-30 rounded-[5px] min-h-[66px] bg-card dark:bg-neutral-10">
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
        <div className="border-t border-neutral-30 dark:border-neutral-30 px-4 lg:px-7 py-3 flex justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={handleReset}
            disabled={submitting}
            className="cursor-pointer h-[40px] lg:h-[34px] px-4 lg:px-3 rounded-[8px] lg:rounded-[5px] border border-neutral-30 dark:border-neutral-30 text-[14px] font-semibold tracking-[-0.02em] text-ink dark:text-neutral-80 bg-card dark:bg-neutral-10 disabled:opacity-60"
          >
            초기화
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting || !projectId || !isValid}
            className="cursor-pointer h-[40px] lg:h-[34px] px-4 lg:px-3 rounded-[8px] lg:rounded-[5px] bg-neutral-90 dark:bg-neutral-80 text-[14px] font-semibold tracking-[-0.02em] text-neutral-0 dark:text-neutral-0 disabled:opacity-60"
          >
            등록
          </button>
        </div>
      </div>
    </BaseModal>
  );
}
