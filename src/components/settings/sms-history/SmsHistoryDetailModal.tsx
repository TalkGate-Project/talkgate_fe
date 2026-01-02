"use client";

import { useEffect, useState } from "react";
import BaseModal from "@/components/common/BaseModal";
import type { SmsHistory } from "@/types/sms";
import { formatDateTime } from "./utils";
import StatusBadge from "./StatusBadge";
import MessageTypeBadge from "./MessageTypeBadge";
import PhonePreviewForDetail from "./PhonePreviewForDetail";
import { MembersService } from "@/services/members";

type SmsHistoryDetailModalProps = {
  isOpen: boolean;
  onClose: () => void;
  history: SmsHistory | null;
};

export default function SmsHistoryDetailModal({
  isOpen,
  onClose,
  history,
}: SmsHistoryDetailModalProps) {
  const [senderName, setSenderName] = useState<string | null>(null);
  const [loadingSender, setLoadingSender] = useState(false);

  // 발송자 이름 로드
  useEffect(() => {
    if (!isOpen || !history?.memberId) {
      setSenderName(null);
      return;
    }

    setLoadingSender(true);
    MembersService.detail(history.memberId)
      .then((res) => {
        const member = (res.data as any)?.data ?? res.data;
        setSenderName(member?.name || null);
      })
      .catch((err) => {
        console.error("발송자 정보 로드 실패:", err);
        setSenderName(null);
      })
      .finally(() => {
        setLoadingSender(false);
      });
  }, [isOpen, history?.memberId]);

  if (!isOpen || !history) return null;

  // 이미지 URL 배열 생성
  const imageUrls = [
    history.imageUrl1,
    history.imageUrl2,
    history.imageUrl3,
  ].filter((url): url is string => !!url);

  return (
    <BaseModal
      onClose={onClose}
      overlayClassName="bg-black/30 dark:bg-[#000000CC]"
      containerClassName="relative w-full h-full md:!w-[848px] md:h-auto md:max-h-[90vh] overflow-y-auto rounded-none md:rounded-[14px] bg-card dark:bg-neutral-10"
      ariaLabel="발송 상세 정보"
      fullScreenOnMobile={true}
    >
      <div className="relative w-full flex flex-col h-full md:h-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-4 md:px-7 pt-4 md:pt-6 pb-3 md:pb-4 flex-shrink-0">
          <h2 className="text-[18px] md:text-[18px] font-semibold leading-[21px] text-neutral-90 dark:text-neutral-90">
            발송 상세 정보
          </h2>
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
        <div className="flex-1 overflow-y-auto min-h-0">
          {/* 모바일: 세로 레이아웃 */}
          <div className="md:hidden flex flex-col">
            {/* 메타데이터 섹션 */}
            <div className="px-4 py-4 space-y-3 border-b border-neutral-30 dark:border-neutral-30">
              <div className="flex items-center justify-between">
                <span className="text-[14px] text-neutral-60 dark:text-neutral-60">발송일시</span>
                <span className="text-[14px] font-medium text-ink dark:text-neutral-80">
                  {formatDateTime(history.scheduledAt || history.createdAt)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[14px] text-neutral-60 dark:text-neutral-60">발신번호</span>
                <span className="text-[14px] font-medium text-ink dark:text-neutral-80">
                  {history.senderPhoneNumber}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[14px] text-neutral-60 dark:text-neutral-60">메시지 유형</span>
                <MessageTypeBadge type={history.messageType} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[14px] text-neutral-60 dark:text-neutral-60">광고/정보</span>
                <span className="text-[14px] font-medium text-ink dark:text-neutral-80">
                  {history.advertisementType === "informational" ? "정보성" : "광고성"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[14px] text-neutral-60 dark:text-neutral-60">전체 고객 수</span>
                <span className="text-[14px] font-medium text-ink dark:text-neutral-80">
                  {history.totalRecipients}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[14px] text-neutral-60 dark:text-neutral-60">성공 수</span>
                <span className="text-[14px] font-medium text-ink dark:text-neutral-80">
                  {history.successCount}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[14px] text-neutral-60 dark:text-neutral-60">실패 수</span>
                <span className="text-[14px] font-medium text-ink dark:text-neutral-80">
                  {history.failCount}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[14px] text-neutral-60 dark:text-neutral-60">상태</span>
                <StatusBadge status={history.status} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[14px] text-neutral-60 dark:text-neutral-60">발송자</span>
                <span className="text-[14px] font-medium text-ink dark:text-neutral-80">
                  {loadingSender ? "로딩 중..." : senderName || "-"}
                </span>
              </div>
            </div>

            {/* 메시지 내용 섹션 */}
            <div className="px-4 py-4 space-y-3">
              <div>
                <label className="block text-[14px] text-neutral-60 dark:text-neutral-60 mb-2">
                  제목
                </label>
                <div className="w-full px-3 py-2 border border-neutral-30 dark:border-neutral-30 rounded-[5px] text-[14px] text-ink dark:text-neutral-90 bg-card dark:bg-neutral-10">
                  {history.title || "제목없음"}
                </div>
              </div>
              <div>
                <label className="block text-[14px] text-neutral-60 dark:text-neutral-60 mb-2">
                  본문
                </label>
                <div className="w-full px-3 py-2 border border-neutral-30 dark:border-neutral-30 rounded-[5px] text-[14px] text-ink dark:text-neutral-90 bg-card dark:bg-neutral-10 min-h-[120px] whitespace-pre-wrap">
                  {history.content}
                </div>
              </div>
            </div>

            {/* 핸드폰 미리보기 섹션 */}
            <div className="px-4 py-4">
              <PhonePreviewForDetail
                senderNumber={history.senderPhoneNumber}
                title={history.title}
                body={history.content}
                imageUrls={imageUrls}
                contentType={history.advertisementType}
              />
            </div>
          </div>

          {/* 데스크탑: 좌우 레이아웃 */}
          <div className="hidden md:grid md:grid-cols-2 px-7 pb-6 gap-8">
            {/* 좌측: 핸드폰 미리보기 */}
            <div className="min-w-0">
              <PhonePreviewForDetail
                senderNumber={history.senderPhoneNumber}
                title={history.title}
                body={history.content}
                imageUrls={imageUrls}
                contentType={history.advertisementType}
              />
            </div>

            {/* 우측: 메타데이터 */}
            <div className="min-w-0">
              <div className="grid grid-cols-2 gap-x-6 gap-y-5 pt-6">
                <div>
                  <label className="block text-[14px] leading-[17px] text-neutral-60 dark:text-neutral-60 mb-2">
                    발송일시
                  </label>
                  <div className="text-[14px] text-ink dark:text-neutral-90">
                    {formatDateTime(history.scheduledAt || history.createdAt)}
                  </div>
                </div>

                <div>
                  <label className="block text-[14px] leading-[17px] text-neutral-60 dark:text-neutral-60 mb-2">
                    발신번호
                  </label>
                  <div className="text-[14px] text-ink dark:text-neutral-90">
                    {history.senderPhoneNumber}
                  </div>
                </div>

                <div>
                  <label className="block text-[14px] leading-[17px] text-neutral-60 dark:text-neutral-60 mb-2">
                    메시지 유형
                  </label>
                  <MessageTypeBadge type={history.messageType} />
                </div>

                <div>
                  <label className="block text-[14px] leading-[17px] text-neutral-60 dark:text-neutral-60 mb-2">
                    광고/정보
                  </label>
                  <div className="text-[14px] text-ink dark:text-neutral-90">
                    {history.advertisementType === "informational" ? "정보성" : "광고성"}
                  </div>
                </div>

                <div>
                  <label className="block text-[14px] leading-[17px] text-neutral-60 dark:text-neutral-60 mb-2">
                    전체 고객 수
                  </label>
                  <div className="text-[14px] text-ink dark:text-neutral-90">
                    {history.totalRecipients}
                  </div>
                </div>

                <div>
                  <label className="block text-[14px] leading-[17px] text-neutral-60 dark:text-neutral-60 mb-2">
                    성공 수
                  </label>
                  <div className="text-[14px] text-ink dark:text-neutral-90">
                    {history.successCount}
                  </div>
                </div>

                <div>
                  <label className="block text-[14px] leading-[17px] text-neutral-60 dark:text-neutral-60 mb-2">
                    실패 수
                  </label>
                  <div className="text-[14px] text-ink dark:text-neutral-90">
                    {history.failCount}
                  </div>
                </div>

                <div>
                  <label className="block text-[14px] leading-[17px] text-neutral-60 dark:text-neutral-60 mb-2">
                    상태
                  </label>
                  <StatusBadge status={history.status} />
                </div>

                <div>
                  <label className="block text-[14px] leading-[17px] text-neutral-60 dark:text-neutral-60 mb-2">
                    발송자
                  </label>
                  <div className="text-[14px] text-ink dark:text-neutral-90">
                    {loadingSender ? "로딩 중..." : senderName || "-"}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </BaseModal>
  );
}

