"use client";

import { useState } from "react";
import Image from "next/image";
import type { ProjectPartnerRequest } from "@/types/projectPartners";
import { ProjectPartnersService } from "@/services/projectPartners";
import { showErrorModal } from "@/providers/ErrorFeedbackModalProvider";

interface PartnerRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  requests: ProjectPartnerRequest[];
  projectId: string;
  onActionComplete: () => void;
}

export default function PartnerRequestModal({
  isOpen,
  onClose,
  requests,
  projectId,
  onActionComplete,
}: PartnerRequestModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!isOpen || requests.length === 0) return null;

  const currentRequest = requests[currentIndex];

  const handleAction = async (action: "approved" | "rejected") => {
    if (isSubmitting || !currentRequest) return;

    setIsSubmitting(true);

    try {
      const headers = { "x-project-id": projectId };
      await ProjectPartnersService.updateStatus(
        currentRequest.id,
        { status: action },
        headers
      );

      showErrorModal({
        type: "success",
        headline: action === "approved" 
          ? "파트너 요청을 수락했습니다." 
          : "파트너 요청을 거절했습니다.",
        hideCancel: true,
        confirmText: "확인",
      });

      // 다음 요청으로 이동하거나 모달 닫기
      if (currentIndex < requests.length - 1) {
        setCurrentIndex((prev) => prev + 1);
      } else {
        onClose();
        onActionComplete();
      }
    } catch (err) {
      console.error("Failed to update partner status", err);
      showErrorModal({
        type: "error",
        headline: "요청 처리에 실패했습니다.",
        hideCancel: true,
        confirmText: "확인",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (isSubmitting) return;
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 dark:bg-[#000000CC] z-40" 
        onClick={handleClose} 
      />

      {/* Modal */}
      <div
        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[440px] bg-white dark:bg-neutral-10 rounded-[14px] z-50 flex flex-col"
        style={{
          filter: "drop-shadow(0px 8px 12px rgba(9, 30, 66, 0.1))",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-7 pt-6 pb-4 flex-shrink-0">
          <h2 className="text-[18px] font-semibold text-ink dark:text-neutral-80 leading-[21px]">
            프로젝트 요청
          </h2>
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="cursor-pointer w-6 h-6 flex items-center justify-center flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="닫기"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M6 18L18 6M6 6L18 18"
                stroke="currentColor"
                className="text-neutral-60 dark:text-neutral-60"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="px-7 pb-6 flex flex-col items-center">
          {/* Success Icon */}
          <svg
            width="40"
            height="40"
            viewBox="0 0 40 40"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="mb-4"
          >
            <circle
              cx="20"
              cy="20"
              r="18"
              stroke="#00E272"
              strokeWidth="4"
            />
            <path
              d="M12 20L18 26L28 14"
              stroke="#00E272"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>

          {/* Message */}
          <p className="text-[18px] font-semibold text-foreground mb-6">
            파트너 요청이 있습니다.
          </p>

          {/* Partner Info */}
          <div className="w-full bg-neutral-10 dark:bg-neutral-20 rounded-[8px] px-4 py-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-neutral-30 flex-shrink-0 overflow-hidden flex items-center justify-center">
              {currentRequest.projectLogoUrl ? (
                <img
                  src={currentRequest.projectLogoUrl}
                  alt={currentRequest.projectName}
                  width={32}
                  height={32}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = "/images/default-project-logo.svg";
                  }}
                />
              ) : (
                <Image
                  src="/images/default-project-logo.svg"
                  alt={currentRequest.projectName}
                  width={32}
                  height={32}
                  className="w-full h-full object-cover"
                />
              )}
            </div>
            <span className="text-[14px] font-medium text-foreground">
              {currentRequest.projectName}
            </span>
          </div>
        </div>

        {/* Divider */}
        <div className="w-full h-px border-t border-neutral-30 dark:border-neutral-30 flex-shrink-0" />

        {/* Action Buttons */}
        <div className="flex justify-end items-center gap-[12px] px-7 py-3 flex-shrink-0">
          <button
            onClick={() => handleAction("rejected")}
            disabled={isSubmitting}
            className="cursor-pointer min-w-[48px] h-[34px] flex items-center justify-center px-4 py-[6px] rounded-[5px] bg-white dark:bg-neutral-10 border border-neutral-30 dark:border-neutral-30 text-[14px] font-semibold text-ink dark:text-neutral-80 tracking-[-0.02em] hover:bg-neutral-10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ lineHeight: "17px" }}
          >
            거절
          </button>
          <button
            onClick={() => handleAction("approved")}
            disabled={isSubmitting}
            className="cursor-pointer min-w-[48px] h-[34px] flex items-center justify-center px-4 py-[6px] rounded-[5px] bg-[#252525] dark:bg-neutral-90 text-[14px] font-semibold text-[#EDEDED] dark:text-neutral-20 tracking-[-0.02em] hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ lineHeight: "17px" }}
          >
            수락
          </button>
        </div>
      </div>
    </>
  );
}
