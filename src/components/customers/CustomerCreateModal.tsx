"use client";

import { useEffect, useRef, useState } from "react";
import BaseModal from "@/components/common/BaseModal";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import MessengerBadge from "@/components/common/MessengerBadge";
import { useSelectedProjectId } from "@/hooks/useSelectedProjectId";
import { CustomersService } from "@/services/customers";
import { ContactType, type CreateCustomerMessengerInfo } from "@/types/customers";
import { showConfirmModal } from "@/lib/confirmModalEvents";
import { showErrorModal } from "@/providers/ErrorFeedbackModalProvider";
import { formatPhoneNumber, getPhoneFormatCursorPosition } from "@/utils/format";
import { SALES_MEMO_MAX_LENGTH, resizeSalesMemoTextarea } from "@/lib/salesMemo";

type Props = {
  open: boolean;
  onClose: () => void;
  /** 등록 성공 시 호출. Promise를 반환하면 완료될 때까지 모달이 닫히지 않는다(후속 연동 등). */
  onCreated?: (createdCustomerId: number | null) => void | Promise<void>;
  /** 모달을 열 때 이름 필드를 채워둘 값 */
  initialName?: string;
  /** 선택된 프로젝트 대신 사용할 프로젝트 ID */
  projectId?: string;
  /** 지정하면 헤더에 뒤로가기 버튼을 노출한다(다단계 플로우용) */
  onBack?: () => void;
};

type MessengerAccount = {
  messenger: string;
  account: string;
};

type CustomerCreateSection = "basic" | "sales" | "messenger" | "data";

const contactLabelToType = (label: string): ContactType => {
  switch (label) {
    case "휴대폰":
      return ContactType.Phone;
    case "집":
      return ContactType.Home;
    case "회사":
      return ContactType.Office;
    default:
      return ContactType.Other;
  }
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
  initialName,
  projectId: projectIdOverride,
  onBack,
}: Props) {
  const [selectedProjectId] = useSelectedProjectId();
  const projectId = projectIdOverride ?? selectedProjectId;
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
  const [residentId, setResidentId] = useState("");
  const [ageRange, setAgeRange] = useState("");
  const [job, setJob] = useState("");
  const [salesMemo, setSalesMemo] = useState("");
  const [openSections, setOpenSections] = useState<Set<CustomerCreateSection>>(
    () => new Set(["basic", "sales"])
  );

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

  // 닫힌 상태에서 열릴 때만 초기 이름을 주입한다(입력 중인 값을 덮어쓰지 않도록).
  const wasOpenRef = useRef(false);
  useEffect(() => {
    if (!open) {
      wasOpenRef.current = false;
      return;
    }
    if (wasOpenRef.current) return;
    wasOpenRef.current = true;
    if (initialName !== undefined) {
      setName(initialName);
      setTouchedName(false);
      setAttemptedSubmit(false);
    }
  }, [open, initialName]);

  if (!open) return null;

  const contactTypes = ["휴대폰", "집", "회사", "기타"];
  const messengerTypes = ["라인", "카카오톡", "텔레그램", "인스타그램", "기타"];

  const handleContactChange =
    (field: "contact1" | "contact2") =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const input = e.target;
      const cursorPos = input.selectionStart ?? 0;
      const digitsBeforeCursor = input.value.slice(0, cursorPos).replace(/\D/g, "").length;

      const digits = input.value.replace(/\D/g, "").slice(0, 11);
      const formatted = formatPhoneNumber(digits);

      if (field === "contact1") {
        setContact1(formatted);
        if (!touchedContact1) setTouchedContact1(true);
      } else {
        setContact2(formatted);
      }

      requestAnimationFrame(() => {
        const newPos = getPhoneFormatCursorPosition(formatted, digitsBeforeCursor);
        input.setSelectionRange(newPos, newPos);
      });
    };

  const contact1Digits = contact1.replace(/\D/g, "");
  const nameError = name.trim() ? "" : "이름을 입력해주세요.";
  const contact1Error = !contact1Digits
    ? "연락처를 입력해주세요."
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
    setResidentId("");
    setAgeRange("");
    setJob("");
    setSalesMemo("");
    setOpenSections(new Set(["basic", "sales"]));
    setMessengerAccounts([]);
    setCurrentMessengerType("기타");
    setCurrentMessengerAccount("");
    setApplicationRoute("");
    setSite("");
    setMediaCompany("");
    setKeyword("");
    setIpAddress("");
    setAttemptedSubmit(false);
    setTouchedName(false);
    setTouchedContact1(false);
  };

  const submitCreate = async (resolvedProjectId: string) => {
    setSubmitting(true);
    let createdCustomerId: number | null = null;
    try {
      const messengerInfo: CreateCustomerMessengerInfo[] =
        messengerAccounts.map((acc) => ({
          messenger: messengerLabelToApiCode(acc.messenger),
          account: acc.account,
        }));

      // 서버는 contact1/2를 숫자 문자열로만 허용(하이픈 불가) — 화면 표시용 하이픈은 여기서 제거 후 전송
      const contact1Digits = contact1.replace(/\D/g, "");
      const contact2Digits = contact2.replace(/\D/g, "");

      const response = await CustomersService.create({
        projectId: resolvedProjectId,
        name: name.trim(),
        contact1: contact1Digits,
        contact1Type: contactLabelToType(contact1Type),
        contact2: contact2Digits || undefined,
        contact2Type: contact2Digits ? contactLabelToType(contact2Type) : undefined,
        residentId: residentId || undefined,
        ageRange: ageRange || undefined,
        job: job || undefined,
        messengerInfo: messengerInfo.length > 0 ? messengerInfo : undefined,
        applicationRoute: applicationRoute || undefined,
        site: site || undefined,
        mediaCompany: mediaCompany || undefined,
        keyword: keyword || undefined,
        ipAddress: ipAddress || undefined,
        salesMemo: salesMemo || undefined,
      });
      createdCustomerId = response.data?.data?.id ?? null;
    } catch (error) {
      console.error("Failed to create customer:", error);
      setSubmitting(false);
      showErrorModal({
        title: "오류 발생",
        headline: "고객 등록에 실패했습니다. 잠시 후 다시 시도해주세요.",
        confirmText: "확인",
        cancelText: null,
        hideCancel: true,
      });
      return;
    }

    // 등록 이후 이어지는 처리(예: 진단-고객 연동)가 끝날 때까지 모달을 닫지 않는다.
    try {
      await onCreated?.(createdCustomerId);
    } catch (error) {
      console.error("Post-create handler failed:", error);
    } finally {
      setSubmitting(false);
      handleReset();
      onClose();
    }
  };

  const hasDuplicateContact = async (targetContact: string) => {
    if (!projectId || !targetContact) return false;
    try {
      const response = await CustomersService.list({
        projectId,
        contact1: targetContact,
        page: 1,
        limit: 1,
      });
      return (response.data.data.customers?.length ?? 0) > 0;
    } catch {
      // 중복 조회 실패 시 등록 자체는 막지 않는다.
      return false;
    }
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

    const targetContact = contact1.trim();
    const isDuplicate = await hasDuplicateContact(targetContact);
    if (isDuplicate) {
      showConfirmModal({
        title: "중복 안내",
        headline: "연락처가 동일한 고객 데이터가 존재해요.",
        message: "그래도 등록할까요?",
        type: "warning",
        confirmText: "등록",
        cancelText: "취소",
        onConfirm: async () => {
          await submitCreate(projectId);
        },
      });
      return;
    }

    await submitCreate(projectId);
  };

  const toggleSection = (section: CustomerCreateSection) => {
    setOpenSections((previousSections) => {
      const nextSections = new Set(previousSections);
      if (nextSections.has(section)) {
        nextSections.delete(section);
      } else {
        nextSections.add(section);
      }
      return nextSections;
    });
  };

  const renderSectionHeader = (label: string, section: CustomerCreateSection) => {
    const isOpen = openSections.has(section);
    return (
      <button
        type="button"
        onClick={() => toggleSection(section)}
        className="flex h-[33px] w-full cursor-pointer items-start justify-between border-b border-neutral-30 text-left dark:border-neutral-30"
        aria-expanded={isOpen}
      >
        <span className="text-[16px] font-semibold leading-[19px] text-ink">{label}</span>
        <svg
          className={`transition-transform ${isOpen ? "rotate-180" : ""}`}
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          aria-hidden="true"
        >
          <path d="M4.166 7.5L10 13.333L15.833 7.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    );
  };

  const shouldIgnoreEnterSubmit = (target: EventTarget | null) => {
    if (!target || !(target instanceof HTMLElement)) return false;

    // IME 조합 중 Enter(확정) 입력은 제출로 취급하지 않는다.
    // (React KeyboardEvent에서 isComposing은 별도 체크하지만, 안전하게 타겟 기반 예외만 여기서는 둔다)

    // Enter 입력이 정상 동작해야 하는 필드/컨트롤은 제외
    if (target.isContentEditable) return true;
    const tag = target.tagName.toLowerCase();
    if (tag === "textarea") return true;
    if (tag === "select" || tag === "option") return true;

    // 기본 Enter 동작(클릭/선택)이 있는 요소에서는 중복 제출 방지
    if (tag === "button" || tag === "a") return true;
    if (target.closest("button, a, [role='button'], [role='link']")) return true;

    return false;
  };

  return (
    <BaseModal
      onClose={() => (!submitting ? onClose() : undefined)}
      overlayClassName="bg-black/30 dark:bg-[#000000CC]"
      positionerClassName="h-full p-0 md:h-auto md:min-h-full md:flex md:items-center md:justify-center md:p-4"
      containerClassName="relative flex h-full w-full flex-col overflow-hidden rounded-t-[14px] bg-card dark:bg-neutral-10 md:h-[min(781px,calc(100vh-32px))] md:w-[848px] md:max-w-[calc(100vw-32px)] md:rounded-[14px] md:shadow-[0px_13px_61px_rgba(169,169,169,0.366013)] md:drop-shadow-[0px_8px_12px_rgba(9,30,66,0.1)] dark:md:shadow-none dark:md:drop-shadow-none"
      ariaLabel="고객 등록"
      fullScreenOnMobile={true}
    >
      <div
        className="relative w-full h-full flex flex-col overflow-hidden"
        onKeyDown={(e) => {
          if (submitting) return;
          if (e.key !== "Enter") return;
          if ((e.nativeEvent as KeyboardEvent).isComposing) return;
          if (e.shiftKey || e.altKey || e.ctrlKey || e.metaKey) return;
          if (shouldIgnoreEnterSubmit(e.target)) return;

          e.preventDefault();
          void handleSubmit();
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 md:px-7 pt-4 md:pt-6 pb-4 shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={() => !submitting && (onBack ?? onClose)()}
              className={`${onBack ? "" : "md:hidden "}cursor-pointer p-1 -ml-1`}
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
            className="hidden md:grid w-6 h-6 place-items-center"
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
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-4 pb-6 pt-[14px] md:px-7 md:pt-4">
          {/* 기본 정보 */}
          <div className="order-1 mb-[30px]">
            {renderSectionHeader("기본 정보", "basic")}
            <div className={`${openSections.has("basic") ? "" : "hidden"} pt-3`}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5 mb-4">
                {/* 이름 */}
                <div>
                  <label className="block text-[14px] leading-[17px] text-neutral-60 mb-2">
                    이름<span className="text-[#FF0000]">*</span>
                  </label>
                  <div className={`flex h-[33px] flex-col items-center justify-center gap-[10px] rounded-[5px] border bg-card px-3 py-2 dark:bg-neutral-10 ${showNameValidation && nameError ? "border-danger-40 dark:border-danger-40" : "border-neutral-30 dark:border-neutral-30"}`}>
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
                    <p className="mt-2 text-[14px] leading-[17px] text-danger-40">{nameError}</p>
                  )}
                </div>

                {/* 연락처1 */}
                <div>
                  <label className="block text-[14px] leading-[17px] text-neutral-60 mb-2">
                    연락처1<span className="text-[#FF0000]">*</span>
                  </label>
                  <div className="flex gap-3">
                    <div className="w-[106px]">
                      <div className={`relative flex h-[33px] flex-col items-center justify-center gap-[10px] rounded-[5px] border bg-card px-3 py-2 dark:bg-neutral-10 ${showContact1Validation && contact1Error ? "border-danger-40 dark:border-danger-40" : "border-neutral-30 dark:border-neutral-30"}`}>
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
                      <div className={`flex h-[33px] flex-col items-center justify-center gap-[10px] rounded-[5px] border bg-card px-3 py-2 dark:bg-neutral-10 ${showContact1Validation && contact1Error ? "border-danger-40 dark:border-danger-40" : "border-neutral-30 dark:border-neutral-30"}`}>
                        <input
                          type="text"
                          value={contact1}
                          onChange={handleContactChange("contact1")}
                          inputMode="numeric"
                          className="w-full h-[17px] outline-none border-none bg-transparent text-[14px] leading-[17px] tracking-[-0.02em] placeholder:text-neutral-60 text-ink"
                          placeholder="연락처를 입력하세요"
                        />
                      </div>
                    </div>
                  </div>
                  {showContact1Validation && contact1Error && (
                    <p className="mt-2 text-[14px] leading-[17px] text-danger-40">{contact1Error}</p>
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
                          onChange={handleContactChange("contact2")}
                          inputMode="numeric"
                          className="w-full h-[17px] outline-none border-none bg-transparent text-[14px] leading-[17px] tracking-[-0.02em] placeholder:text-neutral-60 text-ink"
                          placeholder="연락처를 입력하세요"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* 주민등록번호 */}
                <div>
                  <label className="mb-2 block text-[14px] leading-[17px] text-neutral-60">
                    주민등록번호
                  </label>
                  <div className="grid grid-cols-[minmax(0,1fr)_10px_minmax(0,1fr)] items-center gap-3">
                    <input
                      value={residentId.slice(0, 6)}
                      onChange={(event) => {
                        const firstPart = event.target.value.replace(/\D/g, "").slice(0, 6);
                        setResidentId(firstPart + residentId.slice(6));
                      }}
                      inputMode="numeric"
                      maxLength={6}
                      className="h-[33px] min-w-0 rounded-[5px] border border-neutral-30 bg-card px-3 text-[14px] text-ink outline-none placeholder:text-neutral-60 dark:border-neutral-30 dark:bg-neutral-10"
                      placeholder="123456"
                    />
                    <span className="text-center text-[14px] text-neutral-60">-</span>
                    <input
                      value={residentId.slice(6)}
                      onChange={(event) => {
                        const secondPart = event.target.value.replace(/\D/g, "").slice(0, 7);
                        setResidentId(residentId.slice(0, 6) + secondPart);
                      }}
                      inputMode="numeric"
                      maxLength={7}
                      className="h-[33px] min-w-0 rounded-[5px] border border-neutral-30 bg-card px-3 text-[14px] text-ink outline-none placeholder:text-neutral-60 dark:border-neutral-30 dark:bg-neutral-10"
                      placeholder="567890"
                    />
                  </div>
                </div>

                {/* 연령대 */}
                <div>
                  <label className="block text-[14px] leading-[17px] text-neutral-60 mb-2">
                    연령대
                  </label>
                  <div className="flex flex-col justify-center items-center px-3 py-2 gap-[10px] border border-neutral-30 dark:border-neutral-30 rounded-[5px] h-[33px] bg-card dark:bg-neutral-10">
                    <input
                      type="text"
                      value={ageRange}
                      onChange={(e) => setAgeRange(e.target.value)}
                      className="w-full h-[17px] outline-none border-none bg-transparent text-[14px] leading-[17px] tracking-[-0.02em] placeholder:text-neutral-60 text-ink"
                      placeholder="연령대를 입력하세요"
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
                      placeholder="직업을 입력하세요"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 메신저 계정 */}
          <div className="order-3 mb-[30px]">
            {renderSectionHeader("메신저 계정", "messenger")}
            <div className={`${openSections.has("messenger") ? "" : "hidden"} pt-3`}>
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

          {/* 영업 정보 */}
          <div className="order-2 mb-[30px]">
            {renderSectionHeader("영업정보", "sales")}
            <div className={`${openSections.has("sales") ? "" : "hidden"} pt-3`}>
              <label className="block text-[14px] leading-[17px] text-neutral-60 mb-2">
                영업메모
              </label>
              <div className="flex min-h-[101px] flex-col items-start justify-start rounded-[5px] border border-neutral-30 bg-card px-3 py-2 dark:border-neutral-30 dark:bg-neutral-10">
                <textarea
                  value={salesMemo}
                  onChange={(event) => {
                    setSalesMemo(event.target.value);
                    resizeSalesMemoTextarea(event.currentTarget, 85);
                  }}
                  onFocus={(event) => resizeSalesMemoTextarea(event.currentTarget, 85)}
                  maxLength={SALES_MEMO_MAX_LENGTH}
                  rows={5}
                  className="min-h-[85px] w-full resize-none overflow-hidden border-none bg-transparent text-[14px] leading-[17px] tracking-[-0.02em] text-ink outline-none placeholder:text-neutral-60"
                  placeholder="특이사항을 입력하세요"
                />
              </div>
            </div>
          </div>

          {/* 데이터 정보 */}
          <div className="order-4">
            {renderSectionHeader("데이터 정보", "data")}
            <div className={`${openSections.has("data") ? "" : "hidden"} pt-3`}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
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
                      placeholder="신청 경로를 입력하세요"
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
                      placeholder="사이트를 입력하세요"
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
                      placeholder="매체사를 입력하세요"
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
                      placeholder="키워드를 입력하세요"
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
                      placeholder="IP 주소를 입력하세요"
                    />
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-neutral-30 dark:border-neutral-30 px-4 md:px-7 py-3 flex justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={handleReset}
            disabled={submitting}
            className="cursor-pointer h-[40px] md:h-[34px] px-4 md:px-3 rounded-[8px] md:rounded-[5px] border border-neutral-30 dark:border-neutral-30 text-[14px] font-semibold tracking-[-0.02em] text-ink dark:text-neutral-80 bg-card dark:bg-neutral-10 disabled:opacity-60"
          >
            초기화
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting || !projectId}
            className="cursor-pointer h-[40px] md:h-[34px] px-4 md:px-3 rounded-[8px] md:rounded-[5px] bg-neutral-90 dark:bg-neutral-80 text-[14px] font-semibold tracking-[-0.02em] text-neutral-0 dark:text-neutral-0 disabled:opacity-60 inline-flex items-center justify-center"
          >
            {submitting ? (
              <LoadingSpinner size="sm" variant="white" aria-label="등록 중" />
            ) : (
              "등록하기"
            )}
          </button>
        </div>
      </div>
    </BaseModal>
  );
}
