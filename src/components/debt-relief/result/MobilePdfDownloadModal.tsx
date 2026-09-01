"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import BaseModal from "@/components/common/BaseModal";
import type { DiagnosisDetail, RecommendedProcedure } from "@/types/debtRelief";
import type { DebtReliefChatUiMessage } from "./useDebtReliefAiChat";

type Props = {
  open: boolean;
  onClose: () => void;
  detail: DiagnosisDetail;
  selectedProcedure: RecommendedProcedure;
  chatMessages: DebtReliefChatUiMessage[];
};

function isIosDevice(): boolean {
  const userAgent = window.navigator.userAgent || "";
  return (
    /iP(ad|hone|od)/i.test(window.navigator.platform) ||
    /iPhone|iPad|iPod/i.test(userAgent) ||
    (window.navigator.platform === "MacIntel" && window.navigator.maxTouchPoints > 1)
  );
}

function saveFile(file: File) {
  const url = URL.createObjectURL(file);

  if (isIosDevice()) {
    window.open(url, "_blank", "noopener,noreferrer");
  } else {
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = file.name;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  }

  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

function LoadingIndicator() {
  return (
    <span
      aria-hidden
      className="inline-block h-8 w-8 animate-spin rounded-full border-[3px] border-neutral-30 border-t-primary-50"
    />
  );
}

export default function MobilePdfDownloadModal({
  open,
  onClose,
  detail,
  selectedProcedure,
  chatMessages,
}: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [generating, setGenerating] = useState(false);
  const [generationFailed, setGenerationFailed] = useState(false);
  const [shareFailed, setShareFailed] = useState(false);
  const [generationAttempt, setGenerationAttempt] = useState(0);
  const generationPromiseRef = useRef<Promise<File> | null>(null);

  const canShareFile = useMemo(() => {
    if (!file || typeof window === "undefined") return false;
    if (typeof window.navigator.share !== "function") return false;
    if (typeof window.navigator.canShare !== "function") return false;

    try {
      return window.navigator.canShare({ files: [file] });
    } catch {
      return false;
    }
  }, [file]);

  useEffect(() => {
    if (open) return;
    generationPromiseRef.current = null;
    setFile(null);
    setGenerating(false);
    setGenerationFailed(false);
    setShareFailed(false);
  }, [open]);

  useEffect(() => {
    if (!open || generationPromiseRef.current) return;

    let cancelled = false;
    setGenerating(true);
    setGenerationFailed(false);
    setShareFailed(false);

    const promise = import("./createAnalysisPdfFile").then(({ createAnalysisPdfFile }) =>
      createAnalysisPdfFile({ detail, selectedProcedure, chatMessages })
    );
    generationPromiseRef.current = promise;

    promise
      .then((createdFile) => {
        if (cancelled) return;
        setFile(createdFile);
      })
      .catch((error) => {
        console.error("Failed to create debt relief PDF:", error);
        if (cancelled) return;
        generationPromiseRef.current = null;
        setGenerationFailed(true);
      })
      .finally(() => {
        if (!cancelled) setGenerating(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, detail, selectedProcedure, chatMessages, generationAttempt]);

  if (!open) return null;

  const retryGeneration = () => {
    generationPromiseRef.current = null;
    setGenerationFailed(false);
    setFile(null);
    setGenerationAttempt((previous) => previous + 1);
  };

  const handleShare = async () => {
    if (!file || !canShareFile) return;
    setShareFailed(false);

    try {
      await window.navigator.share({
        files: [file],
        title: `${detail.customerName} 고객 채무조정 진단 결과`,
        text: "톡게이트 채무조정 진단 결과 PDF입니다.",
      });
    } catch (error) {
      const errorName =
        error && typeof error === "object" && "name" in error
          ? String((error as { name?: unknown }).name)
          : "";
      if (errorName === "AbortError") return;

      console.error("Failed to share debt relief PDF:", error);
      setShareFailed(true);
    }
  };

  return (
    <BaseModal
      onClose={onClose}
      ariaLabel="진단서 PDF 다운로드"
      overlayClassName="bg-black/30 dark:bg-[#000000CC]"
      disableAutoContainerSizing
      positionerClassName="absolute inset-0 flex items-end justify-center md:items-center md:p-4"
      containerClassName="w-full rounded-t-[16px] bg-card px-6 pb-[calc(24px+env(safe-area-inset-bottom))] pt-5 dark:bg-neutral-10 md:max-w-[420px] md:rounded-[16px] md:pb-6"
    >
      <div className="mx-auto mb-5 h-1 w-10 rounded-full bg-neutral-30 md:hidden" />
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-[18px] font-semibold leading-[24px] text-foreground">
            진단서 PDF
          </h2>
          <p className="mt-1 text-[14px] leading-[20px] text-muted-foreground">
            PDF 파일을 공유하거나 기기에 저장할 수 있어요.
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="닫기"
          className="grid h-8 w-8 shrink-0 cursor-pointer place-items-center rounded-full text-neutral-70 hover:bg-neutral-10"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
            <path d="m5 5 10 10M15 5 5 15" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      <div className="mt-6 rounded-[12px] bg-neutral-10 px-4 py-5 dark:bg-neutral-20">
        {generating ? (
          <div className="flex flex-col items-center py-3 text-center" role="status">
            <LoadingIndicator />
            <p className="mt-3 text-[15px] font-semibold text-foreground">PDF를 만들고 있어요</p>
            <p className="mt-1 text-[13px] text-muted-foreground">잠시만 기다려주세요.</p>
          </div>
        ) : generationFailed ? (
          <div className="text-center">
            <p className="text-[15px] font-semibold text-foreground">PDF를 만들지 못했어요.</p>
            <p className="mt-1 text-[13px] text-muted-foreground">잠시 후 다시 시도해주세요.</p>
            <button
              type="button"
              onClick={retryGeneration}
              className="mt-4 h-10 cursor-pointer rounded-[8px] border border-border bg-card px-4 text-[14px] font-semibold text-foreground"
            >
              다시 시도
            </button>
          </div>
        ) : file ? (
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[8px] bg-card text-primary-50 dark:bg-neutral-10">
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden>
                <path d="M6 2.75h6.5L17 7.25v12H6v-16.5Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
                <path d="M12.5 2.75v4.5H17M8.5 12h5M8.5 15h5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
              </svg>
            </span>
            <div className="min-w-0">
              <p className="truncate text-[14px] font-semibold text-foreground">{file.name}</p>
              <p className="mt-0.5 text-[12px] text-muted-foreground">
                {(file.size / 1024 / 1024).toFixed(1)} MB · PDF
              </p>
            </div>
          </div>
        ) : null}
      </div>

      {shareFailed ? (
        <p className="mt-3 text-center text-[13px] text-danger-50">
          공유하지 못했습니다. 잠시 후 다시 시도하거나 기기에 저장해주세요.
        </p>
      ) : null}

      {file ? (
        <div className="mt-5 flex flex-col gap-2">
          {canShareFile ? (
            <button
              type="button"
              onClick={handleShare}
              className="h-12 w-full cursor-pointer rounded-[10px] bg-primary-50 text-[15px] font-semibold text-white hover:bg-primary-60"
            >
              공유하기
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => saveFile(file)}
            className={`h-12 w-full cursor-pointer rounded-[10px] text-[15px] font-semibold ${
              canShareFile
                ? "border border-border bg-card text-foreground hover:bg-neutral-10"
                : "bg-primary-50 text-white hover:bg-primary-60"
            }`}
          >
            {isIosDevice() ? "PDF 열기 및 저장" : "기기에 저장"}
          </button>
        </div>
      ) : null}
    </BaseModal>
  );
}
