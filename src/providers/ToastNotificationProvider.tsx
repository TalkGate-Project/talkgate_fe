"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  subscribeToastNotification,
  type ToastNotificationPayload,
} from "@/lib/toastNotificationEvents";

const TOAST_DURATION_MS = 6000;

export default function ToastNotificationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [current, setCurrent] = useState<ToastNotificationPayload | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dismiss = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setCurrent(null);
  }, []);

  useEffect(() => {
    return subscribeToastNotification((payload) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      setCurrent(payload);
      timerRef.current = setTimeout(() => {
        timerRef.current = null;
        setCurrent(null);
      }, TOAST_DURATION_MS);
    });
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const handleClick = () => {
    current?.onClick?.();
    dismiss();
  };

  return (
    <>
      {children}
      {current && (
        <div
          key={current.id}
          className="fixed bottom-5 right-5 z-[300] w-[340px] max-w-[calc(100vw-40px)] animate-toast-slide-up"
        >
          <div className="relative rounded-[10px] bg-card dark:bg-neutral-10 border border-border dark:border-neutral-30 shadow-lg">
            <button
              type="button"
              onClick={handleClick}
              className="cursor-pointer w-full text-left pl-4 pr-9 py-3"
            >
              <p className="text-[13px] font-semibold text-foreground truncate">
                {current.title}
              </p>
              {current.description && (
                <p className="mt-0.5 text-[12px] text-muted-foreground line-clamp-2">
                  {current.description}
                </p>
              )}
            </button>
            <button
              type="button"
              onClick={dismiss}
              aria-label="알림 닫기"
              className="cursor-pointer absolute top-2.5 right-2.5 h-5 w-5 flex items-center justify-center text-neutral-60 hover:text-neutral-90 dark:hover:text-neutral-20"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M6 18L18 6M6 6L18 18"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
        </div>
      )}
    </>
  );
}
