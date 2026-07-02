"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { NotificationsService, type Notification as TGNotification } from "@/services/notifications";
import type { NewNotificationEvent } from "@/types/notifications";
import { setSelectedProjectId } from "@/lib/project";
import { requestNotificationPermission } from "@/utils/notification";
import { getCurrentSubdomain, getMainDomain, getProjectSubdomainUrl } from "@/lib/subdomain";

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

// 알림 목록을 ID 기준으로 병합하고 최신순 정렬 (중복 제거)
function mergeNotifications(
  existing: TGNotification[],
  incoming: TGNotification[],
  limit: number = 5
): TGNotification[] {
  const map = new Map<number, TGNotification>();

  // 기존 알림 먼저 추가
  existing.forEach((n) => map.set(n.id, n));

  // 새 알림으로 덮어쓰기 (최신 상태 반영)
  incoming.forEach((n) => map.set(n.id, n));

  // 최신순 정렬 후 limit 적용
  return Array.from(map.values())
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, limit);
}

export default function NotificationBell() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<TGNotification[]>([]);
  // 초기 로딩 상태 (데이터가 한 번도 로드되지 않은 상태)
  const [isInitialLoading, setIsInitialLoading] = useState(false);
  // 백그라운드 리프레시 상태 (기존 데이터를 유지하면서 새 데이터 로드 중)
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isMarkingAllAsRead, setIsMarkingAllAsRead] = useState(false);
  // 데이터가 한 번이라도 로드되었는지 여부
  const hasFetchedRef = useRef(false);
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
    // 이미 데이터가 있으면 백그라운드 리프레시, 없으면 초기 로딩
    const isFirstLoad = !hasFetchedRef.current;

    if (isFirstLoad) {
      setIsInitialLoading(true);
    } else {
      setIsRefreshing(true);
    }

    try {
      const response = await NotificationsService.list({ limit: 5 });

      setNotifications((prev) => {
        // 초기 로딩이면 그대로 설정, 아니면 병합
        if (isFirstLoad) {
          return response.notifications;
        }
        return mergeNotifications(prev, response.notifications, 5);
      });

      hasFetchedRef.current = true;
    } catch (error) {
      console.error("Failed to load latest notifications:", error);
    } finally {
      setIsInitialLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // 초기 미읽음 개수 로딩
  useEffect(() => {
    loadUnreadCount();
  }, [loadUnreadCount]);

  // 드롭다운 열릴 때마다 최신 알림 로딩 (기존 데이터 유지하면서)
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
    setIsOpen((prev) => {
      const next = !prev;
      // 종 아이콘을 눌러 알림을 확인하려는 시점(실제 사용자 제스처)에 권한을 요청해야
      // 브라우저(특히 Edge)가 제스처 없는 요청을 조용히 무시/차단하는 문제를 피할 수 있음
      if (next) {
        void requestNotificationPermission();
      }
      return next;
    });
  };

  const handleClickViewAll = () => {
    setIsOpen(false);
    if (typeof window === "undefined") {
      router.push("/notifications");
      return;
    }

    const notificationsUrl = `${window.location.protocol}//${getMainDomain()}/notifications`;
    window.location.href = notificationsUrl;
  };

  const handleMarkAllAsRead = async () => {
    if (isMarkingAllAsRead || unreadCount === 0) return;

    setIsMarkingAllAsRead(true);
    try {
      await NotificationsService.markAllAsRead();
      setUnreadCount(0);
      setNotifications((prev) =>
        prev.map((notification) => ({
          ...notification,
          isRead: true,
          readAt: notification.readAt ?? new Date().toISOString(),
        }))
      );
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error);
    } finally {
      setIsMarkingAllAsRead(false);
    }
  };

  const navigateByNotificationProject = useCallback((notification: TGNotification, path: string) => {
    const targetSubdomain = notification.project?.subDomain?.trim();
    if (!targetSubdomain) {
      router.push(path);
      return;
    }

    const currentSubdomain = getCurrentSubdomain();
    if (currentSubdomain === targetSubdomain) {
      router.push(path);
      return;
    }

    const subdomainUrl = getProjectSubdomainUrl(targetSubdomain, path);
    if (!subdomainUrl) {
      router.push(path);
      return;
    }

    window.location.href = subdomainUrl;
  }, [router]);

  const handleNotificationClick = async (notification: TGNotification) => {
    // 알림을 클릭하면 읽음 처리 후 해당 페이지로 이동
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

    const notificationProjectId = notification.projectId;
    if (notificationProjectId) {
      setSelectedProjectId(String(notificationProjectId));
    }

    // 알림 타입에 따라 적절한 페이지로 이동 또는 모달 띄우기
    setIsOpen(false);
    if (notification.type === "notice" && notification.referenceId) {
      // 공지사항 알림: 해당 공지사항 상세 페이지로 이동
      navigateByNotificationProject(notification, `/notice/${notification.referenceId}`);
    } else if (notification.type === "customer_registration" && notification.referenceId) {
      // 고객 등록 알림: 고객 목록으로 이동 후 상세 모달 오픈
      navigateByNotificationProject(
        notification,
        `/customers?openCustomerId=${notification.referenceId}`
      );
    } else if (notification.type === "customer_schedule" && notification.referenceId) {
      // 고객 스케쥴 알림: 고객 목록으로 이동 후 상세 모달 오픈
      navigateByNotificationProject(
        notification,
        `/customers?openCustomerId=${notification.referenceId}`
      );
    } else if (notification.type === "customer_assignment") {
      // 고객 할당 알림: 고객 목록 페이지로 이동
      navigateByNotificationProject(notification, "/customers");
    } else if (notification.type === "system") {
      // 시스템 알림: 결제관리 메뉴로 이동
      router.push("/my-settings?tab=billing");
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

      {/* 모바일 오버레이 배경 */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* 드롭다운 플로팅 */}
      {isOpen && (
        <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100vw-32px)] max-w-[360px] h-[416px] bg-card rounded-[10px] shadow-[0px_18px_28px_rgba(9,30,66,0.1)] z-50 lg:absolute lg:left-auto lg:right-[-16px] lg:top-[50px] lg:translate-x-0 lg:translate-y-0 lg:w-[360px]">
          <div className="h-full flex flex-col">
            {/* 헤더 */}
            <div className="px-5 pt-[20px] pb-[20px] border-b border-border flex items-center justify-between gap-2">
              <span className="text-[16px] font-semibold leading-[19px] tracking-[-0.02em] text-foreground">
                새로운 소식
              </span>
              <div className="flex items-center gap-2 shrink-0">
                {isRefreshing && (
                  <span className="text-[12px] text-neutral-60 animate-pulse whitespace-nowrap">
                    업데이트 중...
                  </span>
                )}
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={() => void handleMarkAllAsRead()}
                    disabled={isMarkingAllAsRead}
                    className={`h-[28px] px-2.5 rounded-[5px] bg-card border border-neutral-30 text-foreground text-[12px] font-semibold whitespace-nowrap ${
                      isMarkingAllAsRead
                        ? "cursor-not-allowed opacity-50"
                        : "cursor-pointer hover:bg-muted"
                    }`}
                  >
                    {isMarkingAllAsRead ? "처리 중..." : "모두 읽음 처리"}
                  </button>
                )}
              </div>
            </div>

            {/* 목록 */}
            <div className="flex-1 overflow-y-auto">
              {isInitialLoading ? (
                <div className="px-5 py-6 text-[13px] text-neutral-60">불러오는 중...</div>
              ) : notifications.length === 0 ? (
                <div className="px-5 py-6 text-[13px] text-neutral-60">알림이 없습니다.</div>
              ) : (
                notifications.map((notification) => {
                  const isUnread = !notification.isRead;
                  const projectName = notification.project?.name?.trim() ?? "";
                  const projectLogoUrl = notification.project?.logoUrl ?? null;
                  const hasProjectInfo = projectName.length > 0 || Boolean(projectLogoUrl);
                  const projectInitial = projectName.length > 0 ? projectName.charAt(0) : "•";

                  return (
                    <button
                      key={notification.id}
                      type="button"
                      onClick={() => handleNotificationClick(notification)}
                      className={`w-full text-left px-5 transition-colors cursor-pointer flex items-center ${
                        hasProjectInfo ? "h-[100px]" : "h-[64px]"
                      } ${
                        isUnread
                          ? "bg-[#D6FAE84D] dark:bg-[#D6FAE81A] hover:bg-[#D6FAE866] dark:hover:bg-[#D6FAE84D]"
                          : "bg-card hover:bg-muted"
                      }`}
                    >
                      <div className="w-full flex flex-col gap-1">
                        {hasProjectInfo && (
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="w-4 h-4 rounded-full overflow-hidden bg-[#252525] flex items-center justify-center flex-shrink-0">
                                {projectLogoUrl ? (
                                  <img
                                    src={projectLogoUrl}
                                    alt={projectName || "프로젝트"}
                                    className="w-full h-full object-cover"
                                    referrerPolicy="no-referrer"
                                  />
                                ) : (
                                  <span className="text-[10px] leading-none font-semibold text-white">
                                    {projectInitial}
                                  </span>
                                )}
                              </span>
                              <span className="text-[14px] font-medium leading-[16px] tracking-[-0.02em] text-foreground truncate">
                                {projectName || "프로젝트"}
                              </span>
                            </div>
                            <span className="text-[14px] font-medium leading-[17px] text-neutral-60 whitespace-nowrap">
                              {formatNotificationTime(notification.createdAt)}
                            </span>
                          </div>
                        )}

                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-[16px] font-semibold leading-[19px] tracking-[-0.02em] text-foreground truncate">
                              {notification.title}
                            </span>
                            {isUnread && <span className="w-2 h-2 rounded-full bg-[#00E272] flex-shrink-0" />}
                          </div>
                          {!hasProjectInfo && (
                            <span className="text-[14px] font-medium leading-[17px] text-neutral-60 whitespace-nowrap">
                              {formatNotificationTime(notification.createdAt)}
                            </span>
                          )}
                        </div>

                        <p className="text-[14px] font-medium leading-[17px] tracking-[-0.02em] text-neutral-60 line-clamp-1">
                          {notification.content}
                        </p>
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            {/* 모두 보기 버튼 */}
            <button
              type="button"
              onClick={handleClickViewAll}
              className="cursor-pointer h-[52px] w-full text-center text-[16px] font-medium leading-[19px] tracking-[-0.02em] text-[#4D82F3] hover:bg-muted"
            >
              모든 알림 보기
            </button>
          </div>
        </div>
      )}
    </div>
  );
}


