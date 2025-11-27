"use client";

import { useMemo } from "react";
import BaseModal from "@/components/common/BaseModal";
import DatePicker from "@/components/common/DatePicker";
import TimePicker from "@/components/common/TimePicker";
import type { CustomerListItem } from "@/types/customers";
import { useSmsForm } from "./useSmsForm";
import PhonePreview from "./PhonePreview";
import RadioButton from "./RadioButton";
import { MAX_IMAGES, SENDER_NUMBERS } from "./types";
import type { SmsModalProps } from "./types";

export default function SmsModal({ open, onClose, customers }: SmsModalProps) {
  const {
    senderNumber,
    contentType,
    title,
    body,
    imageFiles,
    sendMethod,
    messageType,
    scheduledDate,
    scheduledTime,
    setSenderNumber,
    setContentType,
    setTitle,
    setBody,
    setSendMethod,
    setScheduledDate,
    setScheduledTime,
    fileInputRef,
    handleFileSelect,
    handleFileChange,
    handleRemoveFile,
  } = useSmsForm();

  // 미리보기 표시용 수신자 번호 (첫 번째 고객)
  const previewRecipient = customers[0]?.contact1 || "010-0000-0000";

  // 수신자 표시 (최대 2개 + 나머지 수)
  const displayRecipients = useMemo(() => {
    const maxDisplay = 2;
    const displayed = customers.slice(0, maxDisplay);
    const remaining = customers.length - maxDisplay;
    return { displayed, remaining };
  }, [customers]);

  if (!open) return null;

  return (
    <BaseModal
      onClose={onClose}
      overlayClassName="bg-black/30"
      containerClassName="relative w-[848px] rounded-[14px] bg-[#FFFFFF] shadow-[0px_13px_61px_rgba(169,169,169,0.366013)]"
      ariaLabel="문자 전송"
    >
      <div className="relative w-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-7 pt-6 pb-4">
          <h2 className="text-[18px] font-semibold leading-[21px]">문자전송</h2>
          <button
            aria-label="close"
            onClick={onClose}
            className="cursor-pointer w-6 h-6 grid place-items-center"
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

        {/* Content - 좌측 폼 + 우측 미리보기 */}
        <div className="flex px-7 pb-6 gap-8">
          {/* 좌측 폼 영역 */}
          <div className="flex-1 min-w-0 max-w-[384px]">
            {/* 발신번호 */}
            <div className="mb-5">
              <label className="block text-[14px] leading-[17px] text-neutral-60 mb-2">
                발신번호
              </label>
              <div className="relative">
                <select
                  value={senderNumber}
                  onChange={(e) => setSenderNumber(e.target.value)}
                  className="w-full h-[34px] px-3 border border-neutral-30 rounded-[5px] text-[14px] leading-[17px] text-ink appearance-none bg-white pr-10 outline-none focus:border-neutral-60"
                >
                  {SENDER_NUMBERS.map((num) => (
                    <option key={num} value={num}>
                      {num}
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

            {/* 수신자 */}
            <div className="mb-5">
              <label className="block text-[14px] leading-[17px] text-neutral-60 mb-2">
                수신자 ({customers.length}명)
              </label>
              <div className="flex flex-wrap gap-2">
                {displayRecipients.displayed.map((customer) => (
                  <span
                    key={customer.id}
                    className="inline-flex items-center h-[28px] px-3 bg-neutral-20 rounded-[30px] text-[13px] text-neutral-70"
                  >
                    {customer.name} {customer.contact1}
                  </span>
                ))}
                {displayRecipients.remaining > 0 && (
                  <span className="inline-flex items-center h-[28px] px-3 bg-neutral-20 rounded-[30px] text-[13px] text-neutral-70">
                    +{displayRecipients.remaining}
                  </span>
                )}
              </div>
            </div>

            {/* 메시지 유형 */}
            <div className="mb-5">
              <label className="block text-[14px] leading-[17px] text-neutral-60 mb-2">
                메시지 유형 (90byte 초과 시 LMS)
              </label>
              <span
                className={`inline-flex items-center h-[24px] px-3 rounded-[4px] text-[12px] font-semibold ${
                  messageType === "SMS"
                    ? "bg-[#00E272]/20 text-[#00A854]"
                    : messageType === "LMS"
                    ? "bg-[#FFB800]/20 text-[#B88200]"
                    : "bg-[#FF6B6B]/20 text-[#D83232]"
                }`}
              >
                {messageType}
              </span>
            </div>

            {/* 광고 / 정보 유형 */}
            <div className="mb-5">
              <label className="block text-[14px] leading-[17px] text-neutral-60 mb-2">
                광고 / 정보 유형
              </label>
              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="contentType"
                    value="advertising"
                    checked={contentType === "advertising"}
                    onChange={() => setContentType("advertising")}
                    className="sr-only"
                  />
                  <RadioButton checked={contentType === "advertising"} />
                  <span className="text-[14px] text-ink">광고성</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="contentType"
                    value="informational"
                    checked={contentType === "informational"}
                    onChange={() => setContentType("informational")}
                    className="sr-only"
                  />
                  <RadioButton checked={contentType === "informational"} />
                  <span className="text-[14px] text-ink">정보성</span>
                </label>
              </div>
            </div>

            {/* 제목 (LMS/MMS) */}
            <div className="mb-5">
              <label className="block text-[14px] leading-[17px] text-neutral-60 mb-2">
                제목 (LMS/MMS)
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="제목을 입력하세요"
                className="w-full h-[34px] px-3 border border-neutral-30 rounded-[5px] text-[14px] leading-[17px] text-ink placeholder:text-neutral-60 outline-none focus:border-neutral-60"
              />
            </div>

            {/* 본문 */}
            <div className="mb-5">
              <label className="block text-[14px] leading-[17px] text-neutral-60 mb-2">
                본문
              </label>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="발송할 메시지를 입력하세요"
                rows={4}
                className="w-full px-3 py-2 border border-neutral-30 rounded-[5px] text-[14px] leading-[1] tracking-[-0.02em] text-ink placeholder:text-neutral-60 outline-none focus:border-neutral-60 resize-none"
              />
            </div>

            {/* 이미지 첨부 */}
            <div className="mb-5">
              <label className="block text-[14px] leading-[17px] text-neutral-60 mb-2">
                이미지 첨부 (선택)
              </label>
              <div className="flex items-center gap-3 flex-wrap">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".jpg,.jpeg"
                  onChange={handleFileChange}
                  className="hidden"
                  multiple
                />
                <button
                  type="button"
                  onClick={handleFileSelect}
                  disabled={imageFiles.length >= MAX_IMAGES}
                  className="h-[34px] px-3 border border-neutral-30 rounded-[5px] text-[14px] font-semibold text-ink bg-white hover:bg-neutral-10 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  파일선택
                </button>
                {imageFiles.length === 0 ? (
                  <span className="text-[14px] text-neutral-60">
                    선택된 파일 없음
                  </span>
                ) : (
                  <span className="text-[14px] text-neutral-60">
                    {imageFiles.length}/{MAX_IMAGES}개 선택됨
                  </span>
                )}
              </div>
              {/* 선택된 파일 목록 */}
              {imageFiles.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {imageFiles.map((img) => (
                    <div key={img.id} className="flex items-center gap-2">
                      <span className="text-[13px] text-ink truncate max-w-[250px]">
                        {img.file.name}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveFile(img.id)}
                        className="cursor-pointer text-neutral-60 hover:text-ink flex-shrink-0"
                      >
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                          <path
                            d="M4 12L12 4M4 4L12 12"
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

            {/* 발송방식 */}
            <div>
              <label className="block text-[14px] leading-[17px] text-neutral-60 mb-2">
                발송방식
              </label>
              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="sendMethod"
                    value="immediate"
                    checked={sendMethod === "immediate"}
                    onChange={() => setSendMethod("immediate")}
                    className="sr-only"
                  />
                  <RadioButton checked={sendMethod === "immediate"} />
                  <span className="text-[14px] text-ink">즉시발송</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="sendMethod"
                    value="scheduled"
                    checked={sendMethod === "scheduled"}
                    onChange={() => setSendMethod("scheduled")}
                    className="sr-only"
                  />
                  <RadioButton checked={sendMethod === "scheduled"} />
                  <span className="text-[14px] text-ink">예약발송</span>
                </label>
              </div>

              {/* 예약발송 선택 시 날짜/시간 선택 표시 */}
              {sendMethod === "scheduled" && (
                <div className="mt-4 flex gap-3">
                  {/* 날짜 선택 */}
                  <div className="flex-1 relative">
                    <DatePicker
                      value={scheduledDate}
                      onChange={setScheduledDate}
                      placeholder="날짜 선택"
                      minDate={new Date()}
                      className="pr-10"
                    />
                    {/* 달력 아이콘 */}
                    <svg
                      className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
                      width="18"
                      height="18"
                      viewBox="0 0 18 18"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M14.25 3H3.75C2.92157 3 2.25 3.67157 2.25 4.5V15C2.25 15.8284 2.92157 16.5 3.75 16.5H14.25C15.0784 16.5 15.75 15.8284 15.75 15V4.5C15.75 3.67157 15.0784 3 14.25 3Z"
                        stroke="#B0B0B0"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M12 1.5V4.5"
                        stroke="#B0B0B0"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M6 1.5V4.5"
                        stroke="#B0B0B0"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M2.25 7.5H15.75"
                        stroke="#B0B0B0"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>

                  {/* 시간 선택 */}
                  <div className="flex-1 relative">
                    <TimePicker
                      value={scheduledTime}
                      onChange={setScheduledTime}
                      placeholder="시간 선택"
                      minuteStep={10}
                      className="pr-10"
                    />
                    {/* 시계 아이콘 */}
                    <svg
                      className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
                      width="18"
                      height="18"
                      viewBox="0 0 18 18"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M9 16.5C13.1421 16.5 16.5 13.1421 16.5 9C16.5 4.85786 13.1421 1.5 9 1.5C4.85786 1.5 1.5 4.85786 1.5 9C1.5 13.1421 4.85786 16.5 9 16.5Z"
                        stroke="#B0B0B0"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M9 4.5V9L12 10.5"
                        stroke="#B0B0B0"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 우측 미리보기 영역 */}
          <div className="flex-1 min-w-0 max-w-[384px]">
            <PhonePreview
              recipientNumber={previewRecipient}
              title={title}
              body={body}
              imageFiles={imageFiles}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-neutral-30 px-7 py-4 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="h-[34px] px-3 rounded-[5px] border border-neutral-30 text-[14px] font-semibold text-ink bg-white hover:bg-neutral-10 transition-colors cursor-pointer"
          >
            취소
          </button>
          {/* 
            TODO: 문자 전송 API 연동 필요
            - API 엔드포인트가 준비되면 아래 버튼을 활성화하고 실제 발송 로직 구현
            - 필요한 데이터: senderNumber, customers (수신자 목록), contentType, title, body, imageFiles, sendMethod
            - 예약발송의 경우 scheduledTime 파라미터 추가 필요
          */}
          <button
            type="button"
            disabled
            className="h-[34px] px-3 rounded-[5px] bg-neutral-90 text-[14px] font-semibold text-neutral-40 cursor-not-allowed opacity-50"
            title="문자 전송 API 연동 후 활성화됩니다"
          >
            발송요청
          </button>
        </div>
      </div>
    </BaseModal>
  );
}

