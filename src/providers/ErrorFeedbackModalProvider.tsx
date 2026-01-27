"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  subscribeErrorModal,
  type ErrorModalCallbacks,
  type FeedbackModalType,
} from "@/lib/errorModalEvents";

type ErrorModalState = {
  open: boolean;
  type: FeedbackModalType;
  title: string;
  headline: string;
  description: string;
  confirmText: string;
  cancelText: string | null;
  hideCancel: boolean;
  persistent?: boolean;
  hideCloseButton?: boolean;
  onConfirm?: () => void | Promise<void>;
  onCancel?: () => void | Promise<void>;
};

type ErrorModalContextValue = {
  show: (options?: ErrorModalCallbacks) => void;
  hide: () => void;
};

const defaultTexts: Record<FeedbackModalType, {
  title: string;
  headline: string;
  description: string;
  confirmText: string;
  cancelText: string;
}> = {
  error: {
    title: "오류 발생",
    headline: "일시적인 오류가 발생했습니다.",
    description: "",
    confirmText: "확인",
    cancelText: "취소",
  },
  success: {
    title: "완료",
    headline: "처리가 완료되었습니다.",
    description: "",
    confirmText: "확인",
    cancelText: "취소",
  },
  info: {
    title: "알림",
    headline: "",
    description: "",
    confirmText: "확인",
    cancelText: "취소",
  },
};

const ErrorModalContext = createContext<ErrorModalContextValue | undefined>(
  undefined
);

const createInitialState = (): ErrorModalState => ({
  open: false,
  type: "error",
  title: defaultTexts.error.title,
  headline: defaultTexts.error.headline,
  description: defaultTexts.error.description,
  confirmText: defaultTexts.error.confirmText,
  cancelText: defaultTexts.error.cancelText,
  hideCancel: false,
  persistent: false,
  hideCloseButton: false,
  onConfirm: undefined,
  onCancel: undefined,
});

export function useErrorModal() {
  const ctx = useContext(ErrorModalContext);
  if (!ctx) {
    throw new Error(
      "useErrorModal must be used within ErrorFeedbackModalProvider"
    );
  }
  return ctx;
}

export default function ErrorFeedbackModalProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [state, setState] = useState<ErrorModalState>(() =>
    createInitialState()
  );
  const [confirming, setConfirming] = useState(false);

  const hide = useCallback(() => {
    setConfirming(false);
    setState(createInitialState());
  }, []);

  const show = useCallback((options?: ErrorModalCallbacks) => {
    setConfirming(false);
    const type = options?.type ?? "error";
    const texts = defaultTexts[type];
    setState({
      ...createInitialState(),
      open: true,
      type,
      ...options,
      title: options?.title ?? texts.title,
      headline: options?.headline ?? texts.headline,
      description: options?.description ?? texts.description,
      confirmText: options?.confirmText ?? texts.confirmText,
      cancelText:
        options?.cancelText === undefined
          ? texts.cancelText
          : options.cancelText,
      hideCancel: options?.hideCancel ?? false,
      persistent: options?.persistent ?? false,
      hideCloseButton: options?.hideCloseButton ?? false,
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
  }, [confirming, state, hide]);

  const handleCancel = useCallback(async () => {
    if (state.onCancel) {
      try {
        await state.onCancel();
      } catch (err) {
        console.error("ErrorModal onCancel failed", err);
      }
    }
    hide();
  }, [state, hide]);

  const handleOverlayClick = useCallback(() => {
    if (state.persistent) {
      // persistent 모달의 경우 overlay 클릭 시 아무 동작도 하지 않음 (shake 액션만)
      // shake 액션은 CSS의 animate-shake 클래스로 적용됨
      return;
    } else {
      // persistent가 아닌 경우에만 닫기
      hide();
    }
  }, [state, hide]);

  const handleCloseButtonClick = useCallback(() => {
    // 닫기 버튼 클릭 시 기본적으로 모달 닫기
    // persistent 모달이어도 닫기 버튼을 누르면 닫을 수 있음 (hideCloseButton으로 버튼 자체를 숨길 수 있음)
    hide();
  }, [hide]);

  const contextValue = useMemo<ErrorModalContextValue>(
    () => ({ show, hide }),
    [show, hide]
  );

  return (
    <ErrorModalContext.Provider value={contextValue}>
      {children}
      {state.open ? (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-5 md:p-0">
          <div
            className="absolute inset-0 bg-black/35 dark:bg-[#000000CC]"
            onClick={handleOverlayClick}
          />
          <div className={`relative w-full max-w-[440px] rounded-[14px] bg-white dark:bg-neutral-10 ${state.persistent ? "animate-shake" : ""}`} onClick={(e) => e.stopPropagation()}>
            <div className="px-4 md:px-8 pt-7 pb-6">
              <div className="flex items-start justify-between">
                <h2 className="text-[18px] font-semibold text-neutral-90 dark:text-neutral-80">
                  {state.title}
                </h2>
                {!state.hideCloseButton && (
                  <button
                    type="button"
                    className="cursor-pointer h-8 w-8"
                    onClick={handleCloseButtonClick}
                    aria-label="close error modal"
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
                        stroke="#959595"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                )}
              </div>
              <div className="mt-6 flex justify-center">
                <div className="flex items-center justify-center rounded-full">
                  {state.type === "error" && (
                    <svg
                      width="40"
                      height="40"
                      viewBox="0 0 40 40"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M19.9986 15V18.3333M19.9986 25H20.0153M8.45159 31.6667H31.5456C34.1116 31.6667 35.7153 28.8889 34.4323 26.6667L22.8853 6.66667C21.6023 4.44444 18.3948 4.44444 17.1118 6.66667L5.56484 26.6667C4.28184 28.8889 5.88559 31.6667 8.45159 31.6667Z"
                        stroke="#D83232"
                        strokeWidth="4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                  {state.type === "success" && (
                    <svg
                      width="40"
                      height="40"
                      viewBox="0 0 40 40"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
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
                  )}
                  {state.type === "info" && (
                    <svg
                      width="40"
                      height="40"
                      viewBox="0 0 40 40"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      className="text-secondary-80 dark:text-secondary-20"
                    >
                      <circle
                        cx="20"
                        cy="20"
                        r="18"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        d="M20 12V20M20 28H20.01"
                        stroke="currentColor"
                        strokeWidth="4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </div>
              </div>
              {state.headline && (
                <p
                  className={`mt-6 text-center text-[18px] font-semibold leading-[21px] ${
                    state.type === "error"
                      ? "text-danger-40"
                      : state.type === "info"
                      ? "text-secondary-80 dark:text-secondary-20"
                      : "text-neutral-90 dark:text-neutral-80"
                  }`}
                >
                  {state.headline}
                </p>
              )}
              {state.description && (
                <p className="mt-4 whitespace-pre-line text-center text-[14px] font-medium leading-[17px] text-neutral-90 dark:text-neutral-80">
                  {state.description}
                </p>
              )}
            </div>
            <div className="h-px w-full bg-neutral-30 dark:bg-neutral-30" />
            <div className="flex justify-end gap-3 px-4 md:px-8 py-4">
              {!state.hideCancel && state.cancelText ? (
                <button
                  type="button"
                  className="cursor-pointer flex h-[34px] min-w-[72px] items-center justify-center rounded-[5px] border border-neutral-30 dark:border-neutral-30 px-3 text-[14px] font-semibold tracking-[-0.02em] text-neutral-90 dark:text-neutral-80"
                  onClick={handleCancel}
                >
                  {state.cancelText}
                </button>
              ) : null}
              <button
                type="button"
                className={`cursor-pointer flex h-[34px] min-w-[72px] items-center justify-center rounded-[5px] px-3 text-[14px] font-semibold tracking-[-0.02em] disabled:opacity-60 ${
                  state.type === "error"
                    ? "bg-neutral-90 dark:bg-neutral-90 text-neutral-40 dark:text-neutral-20"
                    : state.type === "success"
                    ? "bg-neutral-90 dark:bg-neutral-90 text-neutral-40 dark:text-neutral-20"
                    : "bg-secondary-80 dark:bg-secondary-20 text-white"
                }`}
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
