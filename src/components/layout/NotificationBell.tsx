"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { NotificationsService, type Notification as TGNotification } from "@/services/notifications";
import type { NewNotificationEvent } from "@/types/notifications";

// 공지 페이지와 동일한 규칙의 상대 시간 포맷터
function formatNotificationTime(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return "방금 전";
  if (diffMins < 60) return `${diffMins}분 전`;

  const diffHours = Math.floor(diffMs / 3600000);
  if (diffHours < 24) return `${diffHours}시간 전`;

  const diffDays = Math.floor(diffMs / 86400000);
  if (diffDays < 365) {
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${month}-${day}`;
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function NotificationBell() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<TGNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const loadUnreadCount = useCallback(async () => {
    try {
      const count = await NotificationsService.getUnreadCount();
      setUnreadCount(count);
    } catch (error) {
      console.error("Failed to load unread notification count:", error);
    }
  }, []);

  const loadLatestNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const response = await NotificationsService.list({ limit: 5 });
      setNotifications(response.notifications);
    } catch (error) {
      console.error("Failed to load latest notifications:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // 초기 미읽음 개수 로딩
  useEffect(() => {
    loadUnreadCount();
  }, [loadUnreadCount]);

  // 드롭다운 열릴 때마다 최신 알림 로딩
  useEffect(() => {
    if (!isOpen) return;
    loadLatestNotifications();
  }, [isOpen, loadLatestNotifications]);

  // 프로바이더에서 발행하는 소켓 이벤트 감지해서 카운트/목록 갱신
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleNewNotification = (event: Event) => {
      const customEvent = event as CustomEvent<NewNotificationEvent>;
      const newNotification = customEvent.detail?.notification;

      setUnreadCount((prev) => prev + 1);

      if (newNotification) {
        setNotifications((prev) => {
          const next = [newNotification, ...prev];
          return next.slice(0, 5);
        });
      }
    };

    window.addEventListener("tg:new-notification", handleNewNotification as EventListener);
    return () => {
      window.removeEventListener("tg:new-notification", handleNewNotification as EventListener);
    };
  }, []);

  // 바깥 클릭 시 닫기
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleToggle = () => {
    setIsOpen((prev) => !prev);
  };

  const handleClickViewAll = () => {
    setIsOpen(false);
    router.push("/notifications");
  };

  const handleNotificationClick = async (notification: TGNotification) => {
    // 알림을 클릭하면 읽음 처리 (향후 상세 페이지 이동이 필요하면 이 함수에서 처리)
    if (!notification.isRead) {
      try {
        await NotificationsService.markAsRead(notification.id);
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notification.id
              ? {
                  ...n,
                  isRead: true,
                  readAt: new Date().toISOString(),
                }
              : n
          )
        );
        setUnreadCount((prev) => (prev > 0 ? prev - 1 : 0));
      } catch (error) {
        console.error("Failed to mark notification as read:", error);
      }
    }
  };

  return (
    <div className="relative" ref={containerRef}>
      {/* 알림 아이콘 */}
      <button
        type="button"
        onClick={handleToggle}
        className="cursor-pointer relative w-7 h-7 text-white hover:opacity-80 transition-opacity translate-y-[3px]"
        aria-label="알림 보기"
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M15 17H20L18.5951 15.5951C18.2141 15.2141 18 14.6973 18 14.1585V11C18 8.38757 16.3304 6.16509 14 5.34142V5C14 3.89543 13.1046 3 12 3C10.8954 3 10 3.89543 10 5V5.34142C7.66962 6.16509 6 8.38757 6 11V14.1585C6 14.6973 5.78595 15.2141 5.40493 15.5951L4 17H9M15 17V18C15 19.6569 13.6569 21 12 21C10.3431 21 9 19.6569 9 18V17M15 17H9"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>

        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 block w-[6px] h-[6px] rounded-full bg-[#51F8A5]" />
        )}
      </button>

      {/* 드롭다운 플로팅 */}
      {isOpen && (
        <div className="absolute -right-4 top-[50px] w-[360px] bg-white rounded-[10px] shadow-[0px_18px_28px_rgba(9,30,66,0.1)] pt-5 pb-5 z-50">
          {/* 헤더 */}
          <div className="px-[30px] pb-5 border-b border-[#E2E2E266]">
            <span className="text-[16px] font-semibold leading-[17px] tracking-[-0.02em] text-[#111827]">
              새로운 소식
            </span>
          </div>

          {/* 목록 */}
          <div className="max-h-[260px] overflow-y-auto pt-3">
            {loading ? (
              <div className="px-5 py-6 text-[13px] text-[#6B7280]">불러오는 중...</div>
            ) : notifications.length === 0 ? (
              <div className="px-5 py-6 text-[13px] text-[#6B7280]">알림이 없습니다.</div>
            ) : (
              notifications.map((notification) => {
                const isUnread = !notification.isRead;

                return (
                  <button
                    key={notification.id}
                    type="button"
                    onClick={() => handleNotificationClick(notification)}
                    className={`w-full text-left px-5 py-3 transition-colors ${
                      isUnread
                        ? "bg-[rgba(214,250,232,0.3)] hover:bg-[rgba(214,250,232,0.5)] cursor-pointer"
                        : "bg-white hover:bg-[#F9FAFB] cursor-pointer"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1 gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-[16px] font-semibold leading-[1] tracking-[-0.02em] text-[#252525] truncate">
                          {notification.title}
                        </span>
                        {isUnread && <span className="w-2 h-2 rounded-full bg-primary-60 flex-shrink-0" />}
                      </div>
                      <span className="text-[14px] font-medium leading-[1] text-[#808080] whitespace-nowrap">
                        {formatNotificationTime(notification.createdAt)}
                      </span>
                    </div>
                    <p className="text-[16px] leading-[1] font-medium tracking-[-0.02em] text-[#808080] overflow-hidden text-ellipsis line-clamp-2">
                      {notification.content}
                    </p>
                  </button>
                );
              })
            )}
          </div>

          {/* 모두 보기 버튼 */}
          <button
            type="button"
            onClick={handleClickViewAll}
            className="mt-2 w-full text-center text-[13px] font-semibold leading-[18px] tracking-[-0.02em] text-[#2563EB] hover:bg-[#F3F4F6] py-2"
          >
            모든 알림 보기
          </button>
        </div>
      )}
    </div>
  );
}


