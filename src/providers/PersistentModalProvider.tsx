"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import Image from "next/image";

export type PersistentModalType = "default" | "system" | "talkgate";

type PersistentModalState = {
  open: boolean;
  type: PersistentModalType;
  title: string;
  headline: string;
  description: string;
  confirmText: string;
  cancelText: string | null;
  hideCancel: boolean;
  hideIcon?: boolean;
  onConfirm?: () => void | Promise<void>;
  onCancel?: () => void | Promise<void>;
};

type PersistentModalContextValue = {
  show: (options?: PersistentModalCallbacks) => void;
  hide: () => void;
};

export type PersistentModalCallbacks = {
  type?: PersistentModalType;
  title?: string;
  headline?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string | null;
  hideCancel?: boolean;
  hideIcon?: boolean;
  onConfirm?: () => void | Promise<void>;
  onCancel?: () => void | Promise<void>;
};

const PersistentModalContext = createContext<PersistentModalContextValue | undefined>(
  undefined
);

const createInitialState = (): PersistentModalState => ({
  open: false,
  type: "default",
  title: "알림",
  headline: "",
  description: "",
  confirmText: "확인",
  cancelText: null,
  hideCancel: true,
  hideIcon: false,
  onConfirm: undefined,
  onCancel: undefined,
});

export function usePersistentModal() {
  const ctx = useContext(PersistentModalContext);
  if (!ctx) {
    throw new Error(
      "usePersistentModal must be used within PersistentModalProvider"
    );
  }
  return ctx;
}

export default function PersistentModalProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [state, setState] = useState<PersistentModalState>(() =>
    createInitialState()
  );
  const [confirming, setConfirming] = useState(false);
  const [shake, setShake] = useState(false);

  const hide = useCallback(() => {
    setConfirming(false);
    setShake(false);
    setState(createInitialState());
  }, []);

  const show = useCallback((options?: PersistentModalCallbacks) => {
    setConfirming(false);
    setShake(false);
    setState({
      ...createInitialState(),
      open: true,
      ...options,
      type: options?.type ?? "default",
      title: options?.title ?? "알림",
      headline: options?.headline ?? "",
      description: options?.description ?? "",
      confirmText: options?.confirmText ?? "확인",
      cancelText: options?.cancelText ?? null,
      hideCancel: options?.hideCancel ?? true,
      hideIcon: options?.hideIcon ?? false,
      onConfirm: options?.onConfirm,
      onCancel: options?.onCancel,
    });
  }, []);

  const handleBackdropClick = useCallback(() => {
    // 외부 클릭 시 떨림 애니메이션 트리거
    setShake(true);
    setTimeout(() => setShake(false), 500);
  }, []);

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
      console.error("PersistentModal onConfirm failed", err);
      setConfirming(false);
    }
  }, [confirming, state, hide]);

  const handleCancel = useCallback(async () => {
    if (state.onCancel) {
      try {
        await state.onCancel();
      } catch (err) {
        console.error("PersistentModal onCancel failed", err);
      }
    }
    hide();
  }, [state, hide]);

  const contextValue = useMemo<PersistentModalContextValue>(
    () => ({ show, hide }),
    [show, hide]
  );

  return (
    <PersistentModalContext.Provider value={contextValue}>
      {children}
      {state.open ? (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-5 md:p-0">
          <div
            className="absolute inset-0 bg-black/35 dark:bg-[#000000CC]"
            onClick={handleBackdropClick}
          />
          <div
            className={`relative w-full max-w-[440px] rounded-[14px] bg-white dark:bg-neutral-10 transition-transform duration-500 ${
              shake ? "animate-shake" : ""
            }`}
          >
            <div className="px-4 md:px-8 pt-7 pb-6">
              <div className="flex items-start justify-between">
                <h2 className="text-[18px] font-semibold text-neutral-90 dark:text-neutral-80">
                  {state.title}
                </h2>
                <button
                  type="button"
                  className="cursor-pointer h-8 w-8 flex items-center justify-center"
                  onClick={hide}
                  aria-label="모달 닫기"
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
                      className="dark:stroke-neutral-50"
                    />
                  </svg>
                </button>
              </div>
              {!state.hideIcon && (
                <div className="mt-6 flex justify-center">
                  {state.type === "system" || state.type === "talkgate" ? (
                    // 프로젝트 아이콘 표시 (favicon 사용)
                    <div className="flex h-[60px] w-[60px] items-center justify-center rounded-full bg-neutral-10 dark:bg-neutral-20">
                      <Image
                        src="/favicon.ico"
                        alt="TalkGate"
                        width={40}
                        height={40}
                        className="object-contain"
                      />
                    </div>
                  ) : (
                    // 기본 아이콘
                    <div className="flex h-[60px] w-[60px] items-center justify-center rounded-full bg-neutral-10 dark:bg-neutral-20">
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
                          stroke="currentColor"
                          strokeWidth="4"
                          className="text-secondary-80 dark:text-secondary-20"
                        />
                        <path
                          d="M20 12V20M20 28H20.01"
                          stroke="currentColor"
                          strokeWidth="4"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="text-secondary-80 dark:text-secondary-20"
                        />
                      </svg>
                    </div>
                  )}
                </div>
              )}
              {state.headline && (
                <p
                  className={`${state.hideIcon ? "mt-0" : "mt-6"} text-center text-[18px] font-semibold leading-[21px] ${
                    state.type === "system" || state.type === "talkgate"
                      ? "text-neutral-100 dark:text-neutral-100"
                      : "text-secondary-80 dark:text-secondary-20"
                  }`}
                  dangerouslySetInnerHTML={{
                    __html: state.headline.replace(
                      /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g,
                      '<span style="color: #2563EB">$1</span>'
                    ),
                  }}
                />
              )}
              {state.description && (
                <p
                  className={`mt-4 whitespace-pre-line text-center text-[14px] font-medium leading-[17px] ${
                    state.type === "system" || state.type === "talkgate"
                      ? "text-neutral-100 dark:text-neutral-100"
                      : "text-neutral-90 dark:text-neutral-80"
                  }`}
                  dangerouslySetInnerHTML={{
                    __html: state.description.replace(
                      /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g,
                      '<span style="color: #2563EB">$1</span>'
                    ),
                  }}
                />
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
                  state.type === "system" || state.type === "talkgate"
                    ? "bg-neutral-100 text-white dark:bg-white dark:text-neutral-100"
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
    </PersistentModalContext.Provider>
  );
}

