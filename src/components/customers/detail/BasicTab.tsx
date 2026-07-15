import React, { useMemo, useState } from "react";
import { SelectField } from "./SelectField";
import MessengerBadge from "@/components/common/MessengerBadge";
import ConfirmModal from "@/components/common/ConfirmModal";
import DatePicker from "@/components/common/DatePicker";
import CustomerLinkedAnalysisSection from "./CustomerLinkedAnalysisSection";
import { formatDetailDate } from "./utils";
import { CustomerFormState, CustomerValidation } from "./useCustomerDetail";
import { ContactType, CustomerLinkedAnalysis } from "@/types/customers";
import { formatPhoneNumber, getPhoneFormatCursorPosition } from "@/utils/format";
import { format, isValid, parse } from "date-fns";
import { PillSelect } from "@/components/debt-relief/form/PillSelect";
import type { PillOption } from "@/types/debtRelief";

const GENDER_OPTIONS: PillOption<"male" | "female">[] = [
  { value: "male", label: "남" },
  { value: "female", label: "여" },
];

type Props = {
  customerId: number;
  form: CustomerFormState;
  setForm: React.Dispatch<React.SetStateAction<CustomerFormState>>;
  messengers: { id?: number; messenger: string; account: string; createdAt?: string }[];
  onAddMessenger: (type: string, account: string) => void;
  onRemoveMessenger: (index: number) => void;
  validation: CustomerValidation;
  showValidation: boolean;
  linkedAnalysis?: CustomerLinkedAnalysis | null;
};

export default function BasicTab({
  customerId,
  form,
  setForm,
  messengers,
  onAddMessenger,
  onRemoveMessenger,
  validation,
  showValidation,
  linkedAnalysis,
}: Props) {
  const [newMessengerType, setNewMessengerType] = useState("kakaotalk");
  const [newMessengerAccount, setNewMessengerAccount] = useState("");
  const [messengerToRemoveIndex, setMessengerToRemoveIndex] = useState<number | null>(null);

  const getMessengerLabel = (type: string) => {
    switch (type) {
      case "kakaotalk":
        return "카카오톡";
      case "telegram":
        return "텔레그램";
      case "instagram":
        return "인스타그램";
      case "line":
        return "라인";
      default:
        return type;
    }
  };

  const handleAddMessenger = () => {
    if (!newMessengerAccount.trim()) return;
    onAddMessenger(newMessengerType, newMessengerAccount.trim());
    setNewMessengerAccount("");
  };

  const handleContactChange =
    (field: "contact1" | "contact2") =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const input = e.target;
      const cursorPos = input.selectionStart ?? 0;
      const digitsBeforeCursor = input.value.slice(0, cursorPos).replace(/\D/g, "").length;

      const digits = input.value.replace(/\D/g, "").slice(0, 11);
      const formatted = formatPhoneNumber(digits);

      setForm((prev) => ({ ...prev, [field]: formatted }));

      requestAnimationFrame(() => {
        const newPos = getPhoneFormatCursorPosition(formatted, digitsBeforeCursor);
        input.setSelectionRange(newPos, newPos);
      });
    };

  const birthDate = useMemo(() => {
    if (!form.birth) {
      return null;
    }

    const parseBirthDate = (rawBirth: string) => {
      if (/^\d{8}$/.test(rawBirth)) {
        const compactParsed = parse(rawBirth, "yyyyMMdd", new Date());
        if (isValid(compactParsed) && format(compactParsed, "yyyyMMdd") === rawBirth) {
          return compactParsed;
        }
      }

      if (/^\d{4}-\d{2}-\d{2}$/.test(rawBirth)) {
        const dashedParsed = parse(rawBirth, "yyyy-MM-dd", new Date());
        if (isValid(dashedParsed) && format(dashedParsed, "yyyy-MM-dd") === rawBirth) {
          return dashedParsed;
        }
      }

      return null;
    };

    const parsedDate = parseBirthDate(form.birth);
    if (!parsedDate) {
      return null;
    }

    return parsedDate;
  }, [form.birth]);

  return (
    <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
      {/* Name */}
      <div>
        <div className="flex items-center gap-1 mb-1">
          <span className="text-[14px] text-[#6B7280] dark:text-neutral-60 font-medium">이름</span>
          <span className="text-[14px] text-danger-40 font-medium">*</span>
        </div>
        <div>
          <input
            value={form.name}
            onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
            className="w-full h-[34px] rounded-[5px] border border-[#E5E7EB] dark:border-[#444444] px-3 font-medium text-[14px]"
            placeholder="이름을 입력하세요."
          />
          {showValidation && validation.nameError && (
            <p className="mt-1 text-[12px] text-danger-40">{validation.nameError}</p>
          )}
        </div>
      </div>

      {/* Contact 1 */}
      <div>
        <div className="flex items-center gap-1 mb-1">
          <span className="text-[14px] text-[#6B7280] dark:text-neutral-60 font-medium">연락처1</span>
          <span className="text-[14px] text-danger-40 font-medium">*</span>
        </div>
        <div className="grid grid-cols-[120px_minmax(0,1fr)] gap-2">
          <div>
            <SelectField
              value={form.contact1Type ?? ""}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  contact1Type: e.target.value ? (e.target.value as ContactType) : null,
                }))
              }
              className="h-[34px] font-medium text-[14px]"
            >
              <option value="">선택</option>
              <option value={ContactType.Phone}>휴대폰</option>
              <option value={ContactType.Home}>집</option>
              <option value={ContactType.Office}>회사</option>
              <option value={ContactType.Other}>기타</option>
            </SelectField>
          </div>
          <div>
            <input
              value={form.contact1}
              onChange={handleContactChange("contact1")}
              inputMode="numeric"
              className="w-full h-[34px] rounded-[5px] border border-[#E5E7EB] dark:border-[#444444] px-3 font-medium text-[14px]"
              placeholder="연락처를 입력하세요."
            />
            {showValidation && validation.contact1Error && (
              <p className="mt-1 text-[12px] text-danger-40">{validation.contact1Error}</p>
            )}
          </div>
        </div>
      </div>

      {/* Contact 2 */}
      <div>
        <div className="flex items-center gap-1 mb-1">
          <span className="text-[14px] text-[#6B7280] dark:text-neutral-60 font-medium">연락처2</span>
        </div>
        <div className="grid grid-cols-[120px_minmax(0,1fr)] gap-2">
          <div>
            <SelectField
              value={form.contact2Type ?? ""}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  contact2Type: e.target.value ? (e.target.value as ContactType) : null,
                }))
              }
              className="h-[34px] font-medium text-[14px]"
            >
              <option value="">선택</option>
              <option value={ContactType.Phone}>휴대폰</option>
              <option value={ContactType.Home}>집</option>
              <option value={ContactType.Office}>회사</option>
              <option value={ContactType.Other}>기타</option>
            </SelectField>
          </div>
          <div>
            <input
              value={form.contact2}
              onChange={handleContactChange("contact2")}
              inputMode="numeric"
              className="w-full h-[34px] rounded-[5px] border border-[#E5E7EB] dark:border-[#444444] px-3 font-medium text-[14px]"
              placeholder="연락처를 입력하세요."
            />
          </div>
        </div>
      </div>

      {/* Birth */}
      <div>
        <div className="flex items-center gap-1 mb-1">
          <span className="text-[14px] text-[#6B7280] dark:text-neutral-60 font-medium">생년월일</span>
        </div>
        <div>
          <DatePicker
            value={birthDate}
            onChange={(date) =>
              setForm((prev) => ({
                ...prev,
                birth: date ? format(date, "yyyyMMdd") : "",
              }))
            }
            placeholder="생년월일을 입력하세요"
            dateFormat="yyyy-MM-dd"
            maxDate={new Date()}
            className="!h-[34px] !rounded-[5px] border-[#E5E7EB] dark:border-[#444444] bg-card text-ink dark:bg-neutral-10 dark:text-ink"
          />
        </div>
      </div>

      {/* Gender */}
      <div>
        <div className="mb-1">
          <span className="text-[14px] text-[#808080] dark:text-neutral-60 font-medium tracking-[0.2px]">
            성별
          </span>
        </div>
        <PillSelect
          options={GENDER_OPTIONS}
          value={form.gender === "male" || form.gender === "female" ? form.gender : null}
          onChange={(value) =>
            setForm((prev) => ({
              ...prev,
              gender: prev.gender === value ? "" : value,
            }))
          }
        />
      </div>

      {/* Age Range */}
      <div>
        <div className="mb-1">
          <span className="text-[14px] text-[#6B7280] dark:text-neutral-60 font-medium">연령대</span>
        </div>
        <div>
          <input
            value={form.ageRange}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, ageRange: e.target.value }))
            }
            className="w-full h-[34px] rounded-[5px] border border-[#E5E7EB] dark:border-[#444444] px-3 font-medium text-[14px]"
            placeholder="연령대를 입력하세요."
          />
        </div>
      </div>

      {/* Job */}
      <div>
        <div className="mb-1">
          <span className="text-[14px] text-[#6B7280] dark:text-neutral-60 font-medium">직업</span>
        </div>
        <div>
          <input
            value={form.job}
            onChange={(e) => setForm((prev) => ({ ...prev, job: e.target.value }))}
            className="w-full h-[34px] rounded-[5px] border border-[#E5E7EB] dark:border-[#444444] px-3 font-medium text-[14px]"
            placeholder="직업을 입력하세요."
          />
        </div>
      </div>

      {/* Messenger Accounts */}
      <div className="md:col-span-2">
        <div className="text-[16px] font-semibold text-neutral-90 mb-3">메신저 계정</div>
        <div className="border-b border-[#E2E2E2] dark:border-[#e2e2e266] mb-3" />
        <div className="flex flex-col gap-2 min-w-0">
          <div className="flex gap-2 min-w-0">
            <div className="min-w-[106px] flex-shrink-0 md:min-w-0 md:w-[120px]">
              <SelectField
                value={newMessengerType}
                onChange={(e) => setNewMessengerType(e.target.value)}
                className="h-[34px] rounded-[5px] font-medium text-[14px]"
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
              placeholder="계정 ID를 입력하세요."
              className="flex-1 min-w-0 h-[34px] rounded-[5px] border border-[#E5E7EB] dark:border-[#444444] px-3 font-medium text-[14px]"
            />
            <button
              type="button"
              className="cursor-pointer min-w-[48px] flex-shrink-0 h-[34px] md:px-3 rounded-[5px] bg-neutral-90 text-neutral-20 text-[14px] font-semibold"
              onClick={handleAddMessenger}
            >
              추가
            </button>
          </div>
          {messengers.length > 0 && (
            <div className="mt-4 space-y-2">
              {messengers.map((m, idx) => (
                <div
                  key={`${m.messenger}-${m.account}-${idx}`}
                  className="flex items-center justify-between bg-neutral-10 dark:bg-neutral-25 rounded-[12px] px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <MessengerBadge messenger={m.messenger} />
                    <span className="text-[14px] text-ink">{m.account}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    {m?.createdAt && (
                      <span className="text-[14px] text-neutral-60">
                        {formatDetailDate(m.createdAt)}
                      </span>
                    )}
                    <button
                      className="cursor-pointer w-5 h-5 grid place-items-center rounded-full bg-black text-white"
                      onClick={() => setMessengerToRemoveIndex(idx)}
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
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 회생·파산 진단 정보 */}
      <CustomerLinkedAnalysisSection
        customerId={customerId}
        customerName={form.name}
        linkedAnalysis={linkedAnalysis}
      />

      {/* 메신저 삭제 확인 모달 */}
      <ConfirmModal
        open={messengerToRemoveIndex !== null}
        title="메신저 삭제"
        headline="메신저를 삭제하시겠습니까?"
        description={
          messengerToRemoveIndex !== null && messengers[messengerToRemoveIndex]
            ? `선택한 메신저 계정 (${getMessengerLabel(
                messengers[messengerToRemoveIndex].messenger
              )}, ${messengers[messengerToRemoveIndex].account})을(를) 삭제하면 복구할 수 없습니다.`
            : "선택한 메신저를 삭제하면 복구할 수 없습니다."
        }
        confirmText="삭제"
        cancelText="취소"
        onCancel={() => setMessengerToRemoveIndex(null)}
        onConfirm={() => {
          if (messengerToRemoveIndex === null) return;
          onRemoveMessenger(messengerToRemoveIndex);
          setMessengerToRemoveIndex(null);
        }}
      />
    </div>
  );
}
