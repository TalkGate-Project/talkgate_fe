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
  subscribeConfirmModal,
  type ConfirmModalCallbacks,
  type ConfirmModalType,
} from "@/lib/confirmModalEvents";

type ConfirmModalState = {
  open: boolean;
  title: string;
  headline: string | undefined;
  message: string;
  type: ConfirmModalType | undefined;
  confirmText: string;
  cancelText: string | null;
  onConfirm?: () => void | Promise<void>;
  onCancel?: () => void | Promise<void>;
};

type ConfirmModalContextValue = {
  show: (options?: ConfirmModalCallbacks) => void;
  hide: () => void;
};

const defaultTexts = {
  title: "확인",
  message: "이 작업을 진행하시겠습니까?",
  confirmText: "확인",
  cancelText: "취소",
};

const ConfirmModalContext = createContext<ConfirmModalContextValue | undefined>(
  undefined
);

const createInitialState = (): ConfirmModalState => ({
  open: false,
  title: defaultTexts.title,
  headline: undefined,
  message: defaultTexts.message,
  type: undefined,
  confirmText: defaultTexts.confirmText,
  cancelText: defaultTexts.cancelText,
  onConfirm: undefined,
  onCancel: undefined,
});

export function useConfirmModal() {
  const ctx = useContext(ConfirmModalContext);
  if (!ctx) {
    throw new Error(
      "useConfirmModal must be used within ConfirmModalProvider"
    );
  }
  return ctx;
}

export default function ConfirmModalProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [state, setState] = useState<ConfirmModalState>(() =>
    createInitialState()
  );
  const [confirming, setConfirming] = useState(false);

  const hide = useCallback(() => {
    setConfirming(false);
    setState(createInitialState());
  }, []);

  const show = useCallback((options?: ConfirmModalCallbacks) => {
    setConfirming(false);
    setState({
      ...createInitialState(),
      open: true,
      ...options,
      title: options?.title !== undefined ? options.title : defaultTexts.title,
      headline: options?.headline,
      message: options?.message ?? defaultTexts.message,
      type: options?.type,
      confirmText: options?.confirmText ?? defaultTexts.confirmText,
      cancelText:
        options?.cancelText === undefined
          ? defaultTexts.cancelText
          : options.cancelText,
      onConfirm: options?.onConfirm,
      onCancel: options?.onCancel,
    });
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeConfirmModal((event) => {
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
      console.error("ConfirmModal onConfirm failed", err);
      setConfirming(false);
    }
  }, [confirming, state, hide]);

  const handleCancel = useCallback(async () => {
    if (state.onCancel) {
      try {
        await state.onCancel();
      } catch (err) {
        console.error("ConfirmModal onCancel failed", err);
      }
    }
    hide();
  }, [state, hide]);

  const contextValue = useMemo<ConfirmModalContextValue>(
    () => ({ show, hide }),
    [show, hide]
  );

  return (
    <ConfirmModalContext.Provider value={contextValue}>
      {children}
      {state.open ? (
        <div className="fixed inset-0 z-[150] flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/35 dark:bg-[#000000CC]"
            onClick={handleCancel}
          />
          <div className="relative w-[calc(100%-2rem)] max-w-[440px] rounded-[14px] bg-white dark:bg-neutral-10">
            <div className="px-7 pt-6 pb-[30px]">
              <div
                className={`flex items-start ${
                  state.title ? "justify-between" : "justify-end"
                }`}
              >
                {state.title ? (
                  <h2 className="text-[18px] font-semibold text-neutral-90 dark:text-neutral-80">
                    {state.title}
                  </h2>
                ) : null}
                <button
                  type="button"
                  className="cursor-pointer h-6 w-6"
                  onClick={handleCancel}
                  aria-label="close confirm modal"
                >
                  <svg
                    className="translate-[3px_1px]"
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
              <div className="mt-6 flex justify-center">
                <div className="flex items-center justify-center rounded-full">
                  {state.type === "info" ? (
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
                  ) : state.type === "caution" ? (
                    <svg
                      width="40"
                      height="40"
                      viewBox="0 0 40 40"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      className="text-warning-40 dark:text-warning-20"
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
                  ) : state.type === "success" ? (
                    <svg
                      width="40"
                      height="40"
                      viewBox="0 0 40 40"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      className="text-primary-80 dark:text-primary-40"
                    >
                      <circle cx="20" cy="20" r="18" stroke="currentColor" strokeWidth="4" />
                      <path
                        d="M13 20.5L17.5 25L27 15"
                        stroke="currentColor"
                        strokeWidth="4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  ) : (
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
                </div>
              </div>
              <div className="mt-4 space-y-3 text-center">
                {state.headline ? (
                  <>
                    <p
                      className={
                        state.type === "warning"
                          ? "whitespace-pre-line text-[18px] font-semibold leading-[20px] text-[#D83232] dark:text-red-400"
                          : state.type === "caution"
                          ? "whitespace-pre-line text-[18px] font-semibold leading-[20px] text-warning-40 dark:text-warning-20"
                          : state.type === "info"
                          ? "whitespace-pre-line text-[18px] font-semibold leading-[20px] text-secondary-80 dark:text-secondary-20"
                          : "whitespace-pre-line text-[18px] font-semibold leading-[20px] text-neutral-90 dark:text-neutral-80"
                      }
                    >
                      {state.headline}
                    </p>
                    {state.message ? (
                      <p className="whitespace-pre-line text-[14px] font-medium leading-[17px] text-neutral-70 dark:text-neutral-50">
                        {state.message}
                      </p>
                    ) : null}
                  </>
                ) : (
                  <p className="whitespace-pre-line text-[14px] font-medium leading-[17px] text-neutral-90 dark:text-neutral-80">
                    {state.message}
                  </p>
                )}
              </div>
            </div>
            <div className="h-px w-full bg-neutral-30 dark:bg-neutral-30" />
            <div className="flex justify-end gap-3 px-7 py-4">
              {state.cancelText ? (
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
                  state.type === "info"
                    ? "bg-secondary-80 dark:bg-secondary-20 text-white"
                    : "bg-neutral-90 dark:bg-neutral-90 text-neutral-40 dark:text-neutral-20"
                }`}
                onClick={handleConfirm}
                disabled={confirming}
              >
                {confirming ? "처리 중..." : state.confirmText}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </ConfirmModalContext.Provider>
  );
}

export { showConfirmModal, hideConfirmModal } from "@/lib/confirmModalEvents";

