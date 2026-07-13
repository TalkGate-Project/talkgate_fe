"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { DiagnosisDetail } from "@/types/debtRelief";
import { formatDateTimeDisplay } from "@/components/debt-relief/format";
import { AnalysisService } from "@/services/analysis";
import { showErrorModal } from "@/providers/ErrorFeedbackModalProvider";
import { showConfirmModal } from "@/providers/ConfirmModalProvider";
import AnalysisShareModal from "@/components/debt-relief/hub/AnalysisShareModal";
import CustomerMatchModal from "./CustomerMatchModal";

function LinkIcon({ className }: { className?: string }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden className={className}>
      <path
        d="M10 13a5 5 0 007.07 0l3-3a5 5 0 00-7.07-7.07l-1.72 1.71M14 11a5 5 0 00-7.07 0l-3 3a5 5 0 007.07 7.07l1.71-1.71"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function LinkIconLg() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M10 13a5 5 0 007.07 0l3-3a5 5 0 00-7.07-7.07l-1.72 1.71M14 11a5 5 0 00-7.07 0l-3 3a5 5 0 007.07 7.07l1.71-1.71"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
      <path
        d="M10 3.5v9M10 12.5l-3.5-3.5M10 12.5l3.5-3.5M3.5 15.5h13"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
      <path
        d="M14.375 3.125a1.768 1.768 0 012.5 2.5L6.25 16.25l-3.125.625.625-3.125 10.625-10.625z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ShareNodesIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M8.68387 13.3419C8.88616 12.9381 9 12.4824 9 12C9 11.5176 8.88616 11.0619 8.68387 10.6581M8.68387 13.3419C8.19134 14.3251 7.17449 15 6 15C4.34315 15 3 13.6569 3 12C3 10.3431 4.34315 9 6 9C7.17449 9 8.19134 9.67492 8.68387 10.6581M8.68387 13.3419L15.3161 16.6581M8.68387 10.6581L15.3161 7.34193M15.3161 7.34193C15.8087 8.32508 16.8255 9 18 9C19.6569 9 21 7.65685 21 6C21 4.34315 19.6569 3 18 3C16.3431 3 15 4.34315 15 6C15 6.48237 15.1138 6.93815 15.3161 7.34193ZM15.3161 16.6581C15.1138 17.0619 15 17.5176 15 18C15 19.6569 16.3431 21 18 21C19.6569 21 21 19.6569 21 18C21 16.3431 19.6569 15 18 15C16.8255 15 15.8087 15.6749 15.3161 16.6581Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const ACTION_BTN =
  "cursor-pointer inline-flex items-center justify-center gap-2.5 h-[34px] px-3 rounded-[5px] border border-neutral-30 text-[14px] font-semibold leading-[17px] tracking-[-0.02em] text-black hover:bg-neutral-10 whitespace-nowrap";

type Props = {
  detail: DiagnosisDetail;
  projectId: string | null;
  onCustomerMatchChange: () => void;
};

export default function ResultHeader({ detail, projectId, onCustomerMatchChange }: Props) {
  const router = useRouter();
  const [matchModalOpen, setMatchModalOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const isMatched = detail.customerId != null;

  const handleEdit = () => {
    router.push(`/debt-relief/${detail.id}/edit`);
  };
  const handleGoToList = () => {
    router.push("/debt-relief");
  };
  const handleSave = () => {
    // TODO: 저장하기 — 다음 작업
  };

  const handleCustomerLinkClick = () => {
    if (isMatched) {
      showConfirmModal({
        headline: "고객 연결을 해제할까요?",
        message: "연결을 해제하면 문자 발송에 필요한 연락처 정보가 사라집니다.",
        type: "warning",
        confirmText: "해제",
        onConfirm: async () => {
          if (!projectId) return;
          try {
            await AnalysisService.unmatchCustomer(Number(detail.id), projectId);
            onCustomerMatchChange();
          } catch (error) {
            console.error("Failed to unmatch customer:", error);
            showErrorModal({
              headline: "연결 해제에 실패했습니다.",
              description: "잠시 후 다시 시도해주세요.",
            });
          }
        },
      });
      return;
    }
    setMatchModalOpen(true);
  };

  return (
    <>
      {/* 모바일: Figma — 뒤로+제목/메타 | 수정·공유·저장 아이콘 3개 */}
      <div className="flex md:hidden items-start justify-between gap-3">
        <div className="flex items-start gap-2 min-w-0 flex-1">
          <button
            type="button"
            onClick={handleGoToList}
            aria-label="목록으로"
            className="cursor-pointer w-9 h-9 -ml-1.5 grid place-items-center text-foreground hover:opacity-70 shrink-0"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path
                d="M15 18L9 12L15 6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <div className="min-w-0 pt-1.5">
            <h1 className="text-[18px] font-bold leading-5 text-neutral-90 truncate">
              {detail.recommendation.title}
            </h1>
            <p className="mt-1 text-[13px] font-medium leading-4 text-neutral-60 truncate">
              {detail.customerName} · {detail.ageGroupLabel} · {detail.occupation}
            </p>
            {isMatched ? (
              <button
                type="button"
                onClick={handleCustomerLinkClick}
                className="cursor-pointer mt-2 inline-flex items-center gap-1 h-[26px] px-2.5 rounded-full bg-primary-10 text-primary-80 text-[12px] font-medium shrink-0 hover:opacity-80"
              >
                <LinkIcon />
                고객 연결됨
              </button>
            ) : (
              <button
                type="button"
                onClick={handleCustomerLinkClick}
                className="cursor-pointer mt-2 inline-flex items-center gap-1 h-[26px] px-2.5 rounded-full border border-neutral-30 text-neutral-60 text-[12px] font-medium shrink-0 hover:bg-neutral-10"
              >
                <LinkIcon />
                고객 연결
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0 pt-0.5">
          <button
            type="button"
            onClick={handleEdit}
            aria-label="정보수정"
            className="cursor-pointer w-9 h-9 grid place-items-center rounded-[8px] border border-neutral-30 text-foreground hover:bg-neutral-10"
          >
            <EditIcon />
          </button>
          <button
            type="button"
            onClick={() => setShareOpen(true)}
            aria-label="공유하기"
            className="cursor-pointer w-9 h-9 grid place-items-center rounded-[8px] border border-primary-60 text-primary-60 hover:bg-primary-10"
          >
            <ShareNodesIcon />
          </button>
          <button
            type="button"
            onClick={handleSave}
            aria-label="저장하기"
            className="cursor-pointer w-9 h-9 grid place-items-center rounded-[8px] bg-neutral-90 text-neutral-0 hover:opacity-90"
          >
            <DownloadIcon />
          </button>
        </div>
      </div>

      {/* 데스크톱: 피그마 gap 16px — 뒤로 | 제목 | 구분 | 메타  ……  날짜 | 고객연결 | 정보수정 | 공유하기 | 저장하기 */}
      <div className="hidden md:flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 min-w-0">
          <button
            type="button"
            onClick={handleGoToList}
            aria-label="목록으로"
            className="cursor-pointer w-6 h-6 flex items-center justify-center text-black hover:opacity-70 shrink-0"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path
                d="M15 18L9 12L15 6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <h1 className="text-[24px] font-bold leading-5 text-neutral-90 shrink-0">
            {detail.recommendation.title}
          </h1>
          <span className="w-px h-4 bg-neutral-60 shrink-0" aria-hidden />
          <span className="text-[18px] font-medium leading-5 text-neutral-60 truncate min-w-0">
            {detail.customerName} · {detail.ageGroupLabel} · {detail.occupation}
          </span>
        </div>

        <div className="flex items-center justify-end gap-4 shrink-0">
          <span className="text-[14px] font-medium leading-5 text-neutral-50">
            {formatDateTimeDisplay(detail.consultedAt)}
          </span>
          <button
            type="button"
            onClick={handleCustomerLinkClick}
            aria-label={isMatched ? "고객 연결 해제" : "고객 연결"}
            className={`cursor-pointer w-[34px] h-[34px] flex items-center justify-center rounded-[5px] hover:opacity-90 ${
              isMatched
                ? "bg-primary-10 border border-primary-80 text-primary-80"
                : "border border-neutral-30 text-black hover:bg-neutral-10"
            }`}
          >
            <LinkIconLg />
          </button>
          <button type="button" className={ACTION_BTN} onClick={handleEdit}>
            <EditIcon />
            정보수정
          </button>
          <button type="button" className={ACTION_BTN} onClick={() => setShareOpen(true)}>
            <ShareNodesIcon />
            공유하기
          </button>
          <button
            type="button"
            className="cursor-pointer inline-flex items-center justify-center gap-1.5 h-[34px] px-3 rounded-[5px] bg-neutral-90 text-neutral-20 text-[14px] font-semibold leading-[17px] tracking-[-0.02em] hover:opacity-90 whitespace-nowrap"
            onClick={handleSave}
          >
            <DownloadIcon />
            저장하기
          </button>
        </div>
      </div>

      {projectId && (
        <CustomerMatchModal
          open={matchModalOpen}
          onClose={() => setMatchModalOpen(false)}
          analysisId={detail.id}
          projectId={projectId}
          onMatched={onCustomerMatchChange}
        />
      )}
      {projectId && (
        <AnalysisShareModal
          open={shareOpen}
          onClose={() => setShareOpen(false)}
          projectId={projectId}
          analysisIds={[detail.id]}
        />
      )}
    </>
  );
}
