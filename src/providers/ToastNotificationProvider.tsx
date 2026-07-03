"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  subscribeToastNotification,
  type ToastNotificationIcon,
  type ToastNotificationPayload,
} from "@/lib/toastNotificationEvents";
import {
  NoticeMegaphoneIcon,
  NoticeUsersIcon,
  NoticeCogIcon,
} from "@/components/notice/icons/NoticeIcons";

const TOAST_DURATION_MS = 6000;

function TeamChatMessengerIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12 0C5.23944 0 0 4.95218 0 11.6404C0 15.139 1.43421 18.162 3.76901 20.2506C3.96459 20.4268 4.0829 20.6707 4.09256 20.9339L4.15775 23.0683C4.17948 23.7492 4.88209 24.191 5.50503 23.9182L7.88571 22.8679C8.08853 22.7786 8.31308 22.7617 8.52555 22.8196C9.61932 23.1214 10.7855 23.2808 12 23.2808C18.7606 23.2808 24 18.3286 24 11.6404C24 4.95218 18.7606 0 12 0Z"
        fill="url(#toast_team_chat_gradient)"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M4.76007 15.1041L8.30214 9.40167C8.86499 8.49559 10.0732 8.26907 10.9174 8.91169L13.7341 11.0562C13.9937 11.2532 14.3479 11.2508 14.6051 11.0538L18.4092 8.1238C18.9162 7.73231 19.5809 8.35032 19.2389 8.89692L15.6992 14.5968C15.1364 15.5029 13.9282 15.7294 13.0839 15.0868L10.2673 12.9423C10.0077 12.7453 9.65346 12.7478 9.3963 12.9447L5.58979 15.8772C5.08274 16.2687 4.418 15.6507 4.76007 15.1041Z"
        fill="white"
      />
      <defs>
        <linearGradient
          id="toast_team_chat_gradient"
          x1="12"
          y1="0"
          x2="12"
          y2="36.2308"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#ADF6D2" />
          <stop offset="1" stopColor="#00E272" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function ToastIcon({ icon }: { icon: ToastNotificationIcon }) {
  switch (icon) {
    case "teamChat":
      return <TeamChatMessengerIcon />;
    case "notice":
      return <NoticeMegaphoneIcon />;
    case "customer":
      return <NoticeUsersIcon />;
    case "system":
      return <NoticeCogIcon />;
    default:
      return null;
  }
}

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
          className="fixed bottom-5 right-5 z-[300] w-[354px] max-w-[calc(100vw-40px)] animate-toast-slide-up"
        >
          <div className="relative rounded-[12px] bg-card dark:bg-neutral-10 border border-neutral-30 shadow-[0px_8px_12px_rgba(9,30,66,0.1)]">
            <button
              type="button"
              onClick={handleClick}
              className="cursor-pointer w-full text-left pl-5 pr-11 py-4"
            >
              <div className="flex items-start gap-5">
                {current.icon && (
                  <div className="w-6 h-6 flex-shrink-0 flex items-center justify-center self-center">
                    <ToastIcon icon={current.icon} />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-1.5">
                    <p className="text-[18px] font-semibold tracking-[-0.02em] text-foreground truncate">
                      {current.projectName}
                    </p>
                    <span className="flex-shrink-0 text-[16px] font-medium tracking-[-0.02em] text-muted-foreground">
                      {current.category}
                    </span>
                  </div>
                  <p className="mt-1 text-[16px] font-normal tracking-[-0.02em] text-neutral-60 truncate">
                    {current.content}
                  </p>
                </div>
              </div>
            </button>
            <button
              type="button"
              onClick={dismiss}
              aria-label="알림 닫기"
              className="cursor-pointer absolute top-3 right-3 h-6 w-6 flex items-center justify-center text-neutral-50 hover:text-neutral-90 dark:hover:text-neutral-20"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
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
