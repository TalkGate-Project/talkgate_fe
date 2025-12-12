import React, { useState } from "react";
import { SelectField } from "./SelectField";
import MessengerBadge from "@/components/common/MessengerBadge";
import ConfirmModal from "@/components/common/ConfirmModal";
import { formatDetailDate } from "./utils";
import { CustomerFormState } from "./useCustomerDetail";

type Props = {
  form: CustomerFormState;
  setForm: React.Dispatch<React.SetStateAction<CustomerFormState>>;
  messengers: { id?: number; messenger: string; account: string; createdAt?: string }[];
  onAddMessenger: (type: string, account: string) => void;
  onRemoveMessenger: (index: number) => void;
};

export default function BasicTab({
  form,
  setForm,
  messengers,
  onAddMessenger,
  onRemoveMessenger,
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

  return (
    <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
      {/* Name */}
      <div>
        <div className="flex items-center gap-1 mb-1">
          <span className="text-[14px] text-[#6B7280] font-medium">이름</span>
          <span className="text-[14px] text-danger-40 font-medium">*</span>
        </div>
        <div>
          <input
            value={form.name}
            onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
            className="w-full h-[34px] rounded-[5px] border border-[#E5E7EB] dark:border-[#444444] px-3 font-medium text-[14px]"
            placeholder="고객 이름을 입력하세요"
          />
        </div>
      </div>

      {/* Contact 1 */}
      <div>
        <div className="flex items-center gap-1 mb-1">
          <span className="text-[14px] text-[#6B7280] font-medium">연락처1</span>
          <span className="text-[14px] text-danger-40 font-medium">*</span>
        </div>
        <div className="grid grid-cols-[120px_minmax(0,1fr)] gap-2">
          <div>
            <SelectField className="h-[34px] font-medium text-[14px]">
              <option>휴대폰</option>
              <option>집</option>
              <option>회사</option>
            </SelectField>
          </div>
          <div>
            <input
              value={form.contact1}
              onChange={(e) => setForm((prev) => ({ ...prev, contact1: e.target.value }))}
              className="w-full h-[34px] rounded-[5px] border border-[#E5E7EB] dark:border-[#444444] px-3 font-medium text-[14px]"
              placeholder="010-1234-5678"
            />
          </div>
        </div>
      </div>

      {/* Contact 2 */}
      <div>
        <div className="flex items-center gap-1 mb-1">
          <span className="text-[14px] text-[#6B7280] font-medium">연락처2</span>
        </div>
        <div className="grid grid-cols-[120px_minmax(0,1fr)] gap-2">
          <div>
            <SelectField className="h-[34px] font-medium text-[14px]">
              <option>선택사항</option>
              <option>집</option>
              <option>회사</option>
            </SelectField>
          </div>
          <div>
            <input
              value={form.contact2}
              onChange={(e) => setForm((prev) => ({ ...prev, contact2: e.target.value }))}
              className="w-full h-[34px] rounded-[5px] border border-[#E5E7EB] dark:border-[#444444] px-3 font-medium text-[14px]"
              placeholder="선택 입력"
            />
          </div>
        </div>
      </div>

      {/* Resident ID */}
      <div>
        <div className="flex items-center gap-1 mb-1">
          <span className="text-[14px] text-[#6B7280] font-medium">주민등록번호</span>
        </div>
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
          <div>
            <input
              value={form.residentFront}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, residentFront: e.target.value }))
              }
              className="w-full h-[34px] rounded-[5px] border border-[#E5E7EB] dark:border-[#444444] px-3 font-medium text-[14px]"
              placeholder="123456"
            />
          </div>
          <div className="text-center text-neutral-60">-</div>
          <div>
            <input
              value={form.residentBack}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, residentBack: e.target.value }))
              }
              className="w-full h-[34px] rounded-[5px] border border-[#E5E7EB] dark:border-[#444444] px-3 font-medium text-[14px]"
              placeholder="*******"
            />
          </div>
        </div>
      </div>

      {/* Job */}
      <div>
        <div className="mb-1">
          <span className="text-[14px] text-[#6B7280] font-medium">직업</span>
        </div>
        <div>
          <input
            value={form.job}
            onChange={(e) => setForm((prev) => ({ ...prev, job: e.target.value }))}
            className="w-full h-[34px] rounded-[5px] border border-[#E5E7EB] dark:border-[#444444] px-3 font-medium text-[14px]"
            placeholder="직업"
          />
        </div>
      </div>

      {/* Age Range */}
      <div>
        <div className="mb-1">
          <span className="text-[14px] text-[#6B7280] font-medium">연령</span>
        </div>
        <div>
          <input
            value={form.ageRange}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, ageRange: e.target.value }))
            }
            className="w-full h-[34px] rounded-[5px] border border-[#E5E7EB] dark:border-[#444444] px-3 font-medium text-[14px]"
            placeholder="연령"
          />
        </div>
      </div>

      {/* Messenger Accounts */}
      <div className="md:col-span-2">
        <div className="text-[16px] font-semibold text-neutral-90 mb-3">메신저 계정</div>
        <div className="border-b border-[#E2E2E2] dark:border-[#e2e2e266] mb-3" />
        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            <div className="w-[120px]">
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
              placeholder="계정 ID를 입력하세요"
              className="flex-1 h-[34px] rounded-[5px] border border-[#E5E7EB] dark:border-[#444444] px-3 font-medium text-[14px]"
            />
            <button
              type="button"
              className="cursor-pointer h-[34px] px-3 rounded-[5px] bg-neutral-90 text-neutral-20 text-[14px] font-semibold"
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
                  className="flex items-center justify-between bg-neutral-10 rounded-[12px] px-4 py-3"
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
