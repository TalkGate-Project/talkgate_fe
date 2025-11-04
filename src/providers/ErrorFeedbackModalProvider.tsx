"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { subscribeErrorModal, type ErrorModalCallbacks } from "@/lib/errorModalEvents";

type ErrorModalState = {
  open: boolean;
  title: string;
  headline: string;
  description: string;
  confirmText: string;
  cancelText: string | null;
  hideCancel: boolean;
  onConfirm?: () => void | Promise<void>;
  onCancel?: () => void | Promise<void>;
};

type ErrorModalContextValue = {
  show: (options?: ErrorModalCallbacks) => void;
  hide: () => void;
};

const defaultTexts = {
  title: "오류 발생",
  headline: "일시적인 오류가 발생했습니다.",
  description: "데이터를 불러오거나 이동하는 과정에서 예상치 못한 문제가 발생했습니다. 불편하시겠지만 잠시 기다린 후 새로고침(Refresh) 버튼을 눌러 다시 시도해 주시기 바랍니다.",
  confirmText: "확인",
  cancelText: "취소",
};

const ErrorModalContext = createContext<ErrorModalContextValue | undefined>(undefined);

const createInitialState = (): ErrorModalState => ({
  open: false,
  title: defaultTexts.title,
  headline: defaultTexts.headline,
  description: defaultTexts.description,
  confirmText: defaultTexts.confirmText,
  cancelText: defaultTexts.cancelText,
  hideCancel: false,
  onConfirm: undefined,
  onCancel: undefined,
});

export function useErrorModal() {
  const ctx = useContext(ErrorModalContext);
  if (!ctx) {
    throw new Error("useErrorModal must be used within ErrorFeedbackModalProvider");
  }
  return ctx;
}

export default function ErrorFeedbackModalProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<ErrorModalState>(() => createInitialState());
  const [confirming, setConfirming] = useState(false);

  const hide = useCallback(() => {
    setConfirming(false);
    setState(createInitialState());
  }, []);

  const show = useCallback((options?: ErrorModalCallbacks) => {
    setConfirming(false);
    setState({
      ...createInitialState(),
      open: true,
      ...options,
      title: options?.title ?? defaultTexts.title,
      headline: options?.headline ?? defaultTexts.headline,
      description: options?.description ?? defaultTexts.description,
      confirmText: options?.confirmText ?? defaultTexts.confirmText,
      cancelText: options?.cancelText === undefined ? defaultTexts.cancelText : options.cancelText,
      hideCancel: options?.hideCancel ?? false,
      onConfirm: options?.onConfirm,
      onCancel: options?.onCancel,
    });
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeErrorModal((event) => {
      if (event.type === "show") {
        show(event.payload);
      } else {
        hide();
      }
    });
    return unsubscribe;
  }, [show, hide]);

  const handleConfirm = useCallback(async () => {
    if (confirming) return;
    if (!state.onConfirm) {
      hide();
      return;
    }
    try {
      const result = state.onConfirm();
      if (result instanceof Promise) {
        setConfirming(true);
        await result;
      }
      hide();
    } catch (err) {
      console.error("ErrorModal onConfirm failed", err);
      setConfirming(false);
    }
  }, [confirming, state.onConfirm, hide]);

  const handleCancel = useCallback(async () => {
    if (state.onCancel) {
      try {
        await state.onCancel();
      } catch (err) {
        console.error("ErrorModal onCancel failed", err);
      }
    }
    hide();
  }, [state.onCancel, hide]);

  const contextValue = useMemo<ErrorModalContextValue>(() => ({ show, hide }), [show, hide]);

  return (
    <ErrorModalContext.Provider value={contextValue}>
      {children}
      {state.open ? (
        <div className="fixed inset-0 z-[150] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/35" onClick={hide} />
          <div className="relative w-[440px] rounded-[14px] bg-white shadow-[0px_13px_61px_rgba(169,169,169,0.37)]">
            <div className="px-8 pt-7 pb-6">
              <div className="flex items-start justify-between">
                <h2 className="text-[18px] font-semibold text-[#000000]">{state.title}</h2>
                <button
                  type="button"
                  className="h-8 w-8 rounded-full border border-[#E2E2E2] text-[#808080]"
                  onClick={hide}
                  aria-label="close error modal"
                >
                  ×
                </button>
              </div>
              <div className="mt-6 flex justify-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full border-[4px] border-[#D83232]">
                  <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                      d="M12.2044 4.2473C13.0326 2.7018 14.9674 2.70179 15.7956 4.2473L24.5703 20.7865C25.3761 22.2913 24.2901 24 22.7748 24H5.2252C3.70993 24 2.62392 22.2913 3.42973 20.7865L12.2044 4.2473Z"
                      stroke="#D83232"
                      strokeWidth="2"
                      fill="#FFF5F5"
                    />
                    <rect x="12.25" y="9" width="3.5" height="8" rx="1" fill="#D83232" />
                    <rect x="12.25" y="19" width="3.5" height="3.5" rx="1.75" fill="#D83232" />
                  </svg>
                </div>
              </div>
              <p className="mt-6 text-center text-[18px] font-semibold leading-[21px] text-[#D83232]">{state.headline}</p>
              <p className="mt-4 whitespace-pre-line text-center text-[14px] font-medium leading-[17px] text-[#000000]">{state.description}</p>
            </div>
            <div className="h-px w-full bg-[#E2E2E2]" />
            <div className="flex justify-end gap-3 px-8 py-4">
              {!state.hideCancel && state.cancelText ? (
                <button
                  type="button"
                  className="flex h-[34px] min-w-[72px] items-center justify-center rounded-[5px] border border-[#E2E2E2] px-3 text-[14px] font-semibold tracking-[-0.02em] text-[#000000]"
                  onClick={handleCancel}
                >
                  {state.cancelText}
                </button>
              ) : null}
              <button
                type="button"
                className="flex h-[34px] min-w-[72px] items-center justify-center rounded-[5px] bg-[#252525] px-3 text-[14px] font-semibold tracking-[-0.02em] text-[#D0D0D0] disabled:opacity-60"
                onClick={handleConfirm}
                disabled={confirming}
              >
                {confirming ? "확인 중..." : state.confirmText}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </ErrorModalContext.Provider>
  );
}

export { showErrorModal, hideErrorModal } from "@/lib/errorModalEvents";


