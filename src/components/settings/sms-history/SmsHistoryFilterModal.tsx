"use client";

import type { SmsStatus, SmsMessageType } from "@/types/sms";
import {
  MESSAGE_TYPE_OPTIONS,
  STATUS_OPTIONS,
  STATUS_VALUE_MAP,
  MESSAGE_TYPE_VALUE_MAP,
} from "./constants";

interface SmsHistoryFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  // 부모 상태를 직접 사용
  statusFilter: SmsStatus | "";
  messageTypeFilter: SmsMessageType | "";
  // 부모 상태 setter를 직접 받음
  onStatusChange: (status: SmsStatus | "") => void;
  onMessageTypeChange: (messageType: SmsMessageType | "") => void;
}

export default function SmsHistoryFilterModal({
  isOpen,
  onClose,
  statusFilter,
  messageTypeFilter,
  onStatusChange,
  onMessageTypeChange,
}: SmsHistoryFilterModalProps) {
  // 임시 상태 없이 부모 상태를 직접 사용

  const handleReset = () => {
    // 필터를 "전체"로 초기화
    onStatusChange("");
    onMessageTypeChange("");
  };

  if (!isOpen) return null;

  return (
    <>
      {/* 모달 배경 오버레이 */}
      <div
        className="fixed inset-0 bg-black/30 dark:bg-[#000000CC] z-40"
        onClick={onClose}
      />
      
      {/* 모달 */}
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[380px] h-[306px] bg-card dark:bg-neutral-10 rounded-[14px] z-50 flex flex-col">
        {/* 모달 헤더 */}
        <div className="flex items-center justify-between px-6 pt-6 pb-[30px]">
          <h3 className="text-[18px] font-semibold text-ink dark:text-neutral-80">필터설정</h3>
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer w-6 h-6 flex items-center justify-center hover:bg-neutral-10 dark:hover:bg-neutral-20 rounded transition-colors"
            aria-label="닫기"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M18 6L6 18M6 6L18 18"
                stroke="currentColor"
                className="text-neutral-60 dark:text-neutral-60"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>

        {/* 모달 내용 */}
        <div className="flex-1 px-7 flex flex-col gap-6">
          {/* 메시지 유형 필터 */}
          <div className="flex flex-col gap-2">
            <label className="text-[14px] font-medium text-neutral-60 dark:text-neutral-60 leading-[17px] tracking-[0.2px]">
              메시지 유형
            </label>
            <div className="flex flex-row items-center gap-3 flex-wrap">
              {MESSAGE_TYPE_OPTIONS.map((type) => {
                const value = MESSAGE_TYPE_VALUE_MAP[type];
                const isSelected = messageTypeFilter === value;
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => onMessageTypeChange(value)}
                    className={`cursor-pointer flex flex-row justify-center items-center px-3 py-[6px] gap-[10px] h-[34px] rounded-[5px] transition-colors ${
                      isSelected
                        ? "bg-primary-10 dark:bg-neutral-20 border-2 border-primary-60 dark:border-primary-60/50"
                        : "border border-neutral-30 dark:border-neutral-30 hover:bg-neutral-10 dark:hover:bg-neutral-20"
                    }`}
                  >
                    <span
                      className={`text-[14px] leading-[17px] text-center tracking-[-0.02em] ${
                        isSelected
                          ? "text-ink dark:text-neutral-80 font-semibold"
                          : "text-ink dark:text-neutral-80 opacity-80 font-medium"
                      }`}
                    >
                      {type}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 상태 필터 */}
          <div className="flex flex-col gap-2">
            <label className="text-[14px] font-medium text-neutral-60 dark:text-neutral-60 leading-[17px] tracking-[0.2px]">
              상태
            </label>
            <div className="flex flex-row items-center gap-3 flex-wrap">
              {STATUS_OPTIONS.map((status) => {
                const value = STATUS_VALUE_MAP[status];
                const isSelected = statusFilter === value;
                return (
                  <button
                    key={status}
                    type="button"
                    onClick={() => onStatusChange(value)}
                    className={`cursor-pointer flex flex-row justify-center items-center px-3 py-[6px] gap-[10px] h-[34px] rounded-[5px] transition-colors ${
                      isSelected
                        ? "bg-primary-10 dark:bg-neutral-20 border-2 border-primary-60 dark:border-primary-60/50"
                        : "border border-neutral-30 dark:border-neutral-30 hover:bg-neutral-10 dark:hover:bg-neutral-20"
                    }`}
                  >
                    <span
                      className={`text-[14px] leading-[17px] text-center tracking-[-0.02em] ${
                        isSelected
                          ? "text-ink dark:text-neutral-80 font-semibold"
                          : "text-ink dark:text-neutral-80 opacity-80 font-medium"
                      }`}
                    >
                      {status}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* 모달 푸터 */}
        <div className="px-6 py-3 flex items-center justify-end gap-3 border-t border-neutral-30 dark:border-neutral-30">
          <button
            type="button"
            onClick={handleReset}
            className="cursor-pointer w-[60px] h-[34px] flex justify-center items-center py-[6px] border border-neutral-30 dark:border-neutral-30 rounded-[5px] text-[14px] font-semibold text-ink dark:text-neutral-80 tracking-[-0.02em] hover:bg-neutral-10 dark:hover:bg-neutral-20 transition-colors"
          >
            초기화
          </button>
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer w-[72px] h-[34px] flex justify-center items-center py-[6px] bg-neutral-90 dark:bg-neutral-80 rounded-[5px] text-[14px] font-semibold text-neutral-0 dark:text-neutral-0 tracking-[-0.02em] hover:bg-neutral-80 dark:hover:bg-neutral-70 transition-colors"
          >
            적용완료
          </button>
        </div>
      </div>
    </>
  );
}
