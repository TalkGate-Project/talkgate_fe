"use client";

import { useEffect, useRef, useState } from "react";
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

// 생성 완료 후 자동으로 모달을 닫기 전, 사용자가 "저장됐다"는 걸 눈으로 확인할 시간.
const AUTO_CLOSE_DELAY_MS = 1200;

function isIosDevice(): boolean {
  const userAgent = window.navigator.userAgent || "";
  return (
    /iP(ad|hone|od)/i.test(window.navigator.platform) ||
    /iPhone|iPad|iPod/i.test(userAgent) ||
    (window.navigator.platform === "MacIntel" && window.navigator.maxTouchPoints > 1)
  );
}

// iOS Safari는 <a download>를 신뢰할 수 없어 새 탭에 열어 자체 PDF 뷰어(공유·저장 버튼 포함)를
// 쓰게 한다. window.open은 진짜 사용자 클릭 없이 호출되면(예: 비동기 생성 완료 뒤 자동 호출)
// 팝업 차단으로 막힐 수 있어, 반환값으로 성공 여부를 판단해 실패 시 수동 버튼으로 폴백한다.
// (noopener를 안 쓰는 이유: noopener를 쓰면 성공해도 항상 null이 반환돼 차단 여부를 구분 못 한다.
// 여는 대상이 우리가 방금 만든 blob이라 noopener가 막으려는 reverse-tabnabbing 위험이 없다.)
function trySaveFile(file: File): boolean {
  const url = URL.createObjectURL(file);
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);

  if (isIosDevice()) {
    return !!window.open(url, "_blank");
  }

  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = file.name;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  return true;
}

function LoadingIndicator() {
  return (
    <span
      aria-hidden
      className="inline-block h-8 w-8 animate-spin rounded-full border-[3px] border-neutral-30 border-t-primary-50"
    />
  );
}

type AutoSaveState = "idle" | "done" | "blocked";

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
  const [autoSaveState, setAutoSaveState] = useState<AutoSaveState>("idle");
  const generationPromiseRef = useRef<Promise<File> | null>(null);

  useEffect(() => {
    if (open) return;
    generationPromiseRef.current = null;
    setFile(null);
    setGenerating(false);
    setGenerationFailed(false);
    setAutoSaveState("idle");
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

  // 파일이 준비되면 사용자가 더 누를 것 없이 곧바로 저장(또는 iOS는 뷰어 열기)을 시도한다.
  useEffect(() => {
    if (!file) return;
    setAutoSaveState(trySaveFile(file) ? "done" : "blocked");
  }, [file]);

  useEffect(() => {
    if (autoSaveState !== "done") return;
    const timer = window.setTimeout(onClose, AUTO_CLOSE_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [autoSaveState, onClose]);

  if (!open) return null;

  const retryGeneration = () => {
    generationPromiseRef.current = null;
    setGenerationFailed(false);
    setFile(null);
    setGenerationAttempt((previous) => previous + 1);
  };

  const retrySave = () => {
    if (!file) return;
    setAutoSaveState(trySaveFile(file) ? "done" : "blocked");
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
            생성이 끝나면 자동으로 기기에 저장돼요.
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
            <div className="min-w-0 flex-1">
              <p className="truncate text-[14px] font-semibold text-foreground">{file.name}</p>
              <p className="mt-0.5 text-[12px] text-muted-foreground">
                {(file.size / 1024 / 1024).toFixed(1)} MB · PDF
              </p>
            </div>
            {autoSaveState === "done" ? (
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden className="shrink-0 text-primary-50">
                <path d="M4 10.5 8 14.5 16 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            ) : null}
          </div>
        ) : null}
      </div>

      {autoSaveState === "done" ? (
        <p className="mt-3 text-center text-[13px] text-muted-foreground">
          {isIosDevice() ? "PDF를 열었어요." : "기기에 저장했어요."}
        </p>
      ) : autoSaveState === "blocked" ? (
        <div className="mt-5 flex flex-col gap-2">
          <p className="text-center text-[13px] text-muted-foreground">
            자동으로 열리지 않았어요. 아래 버튼을 눌러주세요.
          </p>
          <button
            type="button"
            onClick={retrySave}
            className="h-12 w-full cursor-pointer rounded-[10px] bg-primary-50 text-[15px] font-semibold text-white hover:bg-primary-60"
          >
            PDF 열기
          </button>
        </div>
      ) : null}
    </BaseModal>
  );
}
