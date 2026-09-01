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

// 저장/공유 성공 후 모달을 닫기 전, 사용자가 결과를 눈으로 확인할 시간. 실제 사용자 클릭
// 안에서 호출되는 동작 뒤에만 쓰므로(자동 트리거 아님) 팝업 차단 등과는 무관하다.
const AUTO_CLOSE_DELAY_MS = 900;

function isIosDevice(): boolean {
  const userAgent = window.navigator.userAgent || "";
  return (
    /iP(ad|hone|od)/i.test(window.navigator.platform) ||
    /iPhone|iPad|iPod/i.test(userAgent) ||
    (window.navigator.platform === "MacIntel" && window.navigator.maxTouchPoints > 1)
  );
}

// iOS Safari/Chrome는 <a download>를 신뢰할 수 없어 새 탭에 열어 자체 PDF 뷰어(저장·공유
// 아이콘 포함)를 쓰게 한다. 반드시 버튼 클릭 핸들러 안에서 동기적으로 호출해야 한다 — 비동기
// 완료 뒤 자동으로 부르면 팝업 차단(iOS)이나 자동 다운로드 차단(Android 크롬 계열)에 막힌다
// (2026-09-01 실기기 확인: 삼성인터넷만 자동 저장 성공, iOS 사파리/크롬은 모두 실패).
function saveFile(file: File) {
  const url = URL.createObjectURL(file);
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);

  if (isIosDevice()) {
    window.open(url, "_blank");
    return;
  }

  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = file.name;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
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
  const [generationAttempt, setGenerationAttempt] = useState(0);
  const [sharing, setSharing] = useState(false);
  const [shareFailed, setShareFailed] = useState(false);
  const generationPromiseRef = useRef<Promise<File> | null>(null);

  const canShareFile = useMemo(() => {
    if (!file) return false;
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
    setSharing(false);
    setShareFailed(false);
  }, [open]);

  useEffect(() => {
    if (!open || generationPromiseRef.current) return;

    let cancelled = false;
    setGenerating(true);
    setGenerationFailed(false);

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

  const handleSave = () => {
    if (!file) return;
    saveFile(file);
    window.setTimeout(onClose, AUTO_CLOSE_DELAY_MS);
  };

  const handleShare = async () => {
    if (!file) return;
    setSharing(true);
    setShareFailed(false);

    try {
      await window.navigator.share({
        files: [file],
        title: `${detail.customerName} 고객 채무조정 진단 결과`,
        text: "톡게이트 채무조정 진단 결과 PDF입니다.",
      });
      window.setTimeout(onClose, AUTO_CLOSE_DELAY_MS);
    } catch (error) {
      const errorName =
        error && typeof error === "object" && "name" in error
          ? String((error as { name?: unknown }).name)
          : "";
      setSharing(false);
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
        {generationFailed ? (
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
        ) : (
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[8px] bg-card text-primary-50 dark:bg-neutral-10">
              {generating ? (
                <LoadingIndicator />
              ) : (
                <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden>
                  <path d="M6 2.75h6.5L17 7.25v12H6v-16.5Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
                  <path d="M12.5 2.75v4.5H17M8.5 12h5M8.5 15h5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                </svg>
              )}
            </span>
            <div className="min-w-0">
              <p className="truncate text-[14px] font-semibold text-foreground">
                {file ? file.name : "PDF를 만들고 있어요"}
              </p>
              <p className="mt-0.5 text-[12px] text-muted-foreground">
                {file ? `${(file.size / 1024 / 1024).toFixed(1)} MB · PDF` : "잠시만 기다려주세요."}
              </p>
            </div>
          </div>
        )}
      </div>

      {shareFailed ? (
        <p className="mt-3 text-center text-[13px] text-danger-50">
          공유하지 못했습니다. 잠시 후 다시 시도하거나 기기에 저장해주세요.
        </p>
      ) : null}

      <div className="mt-5 flex flex-col gap-2">
        <button
          type="button"
          onClick={handleShare}
          disabled={!file || !canShareFile || sharing}
          className="h-12 w-full cursor-pointer rounded-[10px] bg-primary-50 text-[15px] font-semibold text-white hover:bg-primary-60 disabled:cursor-not-allowed disabled:bg-neutral-30 disabled:text-neutral-60 disabled:hover:bg-neutral-30"
        >
          {sharing ? "공유 중..." : "공유하기"}
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={!file}
          className="h-12 w-full cursor-pointer rounded-[10px] border border-border bg-card text-[15px] font-semibold text-foreground hover:bg-neutral-10 disabled:cursor-not-allowed disabled:border-transparent disabled:bg-neutral-10 disabled:text-neutral-60 disabled:hover:bg-neutral-10"
        >
          저장하기
        </button>
      </div>
    </BaseModal>
  );
}
