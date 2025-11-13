"use client";

import { Suspense, useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { NotificationsService, Notification, NotificationCategory, NotificationType } from "@/services/notifications";
import { NoticeMegaphoneIcon, NoticeUsersIcon, NoticeCogIcon, NoticeShieldIcon } from "@/components/notice/icons/NoticeIcons";

// API 타입을 UI에서 사용하는 형태로 변환
type UINotification = Omit<Notification, "isRead"> & { read: boolean };

// API NotificationType을 UI NotificationCategory로 매핑
const mapNotificationTypeToCategory = (type: NotificationType): NotificationCategory => {
  switch (type) {
    case "notice":
      return "notice";
    case "customer_assignment":
      return "customer";
    default:
      return "all";
  }
};

export function NotificationsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [notifications, setNotifications] = useState<UINotification[]>([]);
  const [counts, setCounts] = useState({ all: 0, notice: 0, customer: 0, system: 0, security: 0, unread: 0 });
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<NotificationCategory>("all");
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const [nextCursor, setNextCursor] = useState<number | null>(null);
  const [hasMore, setHasMore] = useState(false);

  useEffect(() => {
    document.title = "TalkGate - 알림";
  }, []);

  const loadNotifications = useCallback(async (category: NotificationCategory, unreadOnly: boolean) => {
    setLoading(true);
    try {
      // TODO: API에 카테고리별 필터링 기능이 없어서 클라이언트 사이드에서 필터링합니다.
      // 향후 API에 type 필터 파라미터가 추가되면 서버 사이드 필터링으로 변경 필요
      const query: { limit?: number; cursor?: number; isRead?: boolean } = {
        limit: 100, // 충분히 큰 값으로 설정 (페이지네이션은 추후 구현)
      };

      if (unreadOnly) {
        query.isRead = false;
      }

      const response = await NotificationsService.list(query);
      
      // API 타입을 UI 타입으로 변환 (isRead -> read)
      const uiNotifications: UINotification[] = response.notifications.map((n) => ({
        ...n,
        read: n.isRead,
      }));

      setNotifications(uiNotifications);
      setNextCursor(response.nextCursor ?? null);
      setHasMore(response.hasMore);

      // 미읽음 개수 조회
      const unreadCount = await NotificationsService.getUnreadCount();

      // TODO: API에 카테고리별 카운트 기능이 없어서 클라이언트 사이드에서 계산합니다.
      // 향후 API에 카테고리별 카운트 엔드포인트가 추가되면 서버 사이드 카운트로 변경 필요
      const allCount = uiNotifications.length;
      const noticeCount = uiNotifications.filter((n) => n.type === "notice").length;
      const customerCount = uiNotifications.filter((n) => n.type === "customer_assignment").length;
      // TODO: system, security 타입은 현재 API에 없습니다. 향후 API에 추가되면 연동 필요
      const systemCount = 0;
      const securityCount = 0;

      setCounts({
        all: allCount,
        notice: noticeCount,
        customer: customerCount,
        system: systemCount,
        security: securityCount,
        unread: unreadCount,
      });
    } catch (error) {
      console.error("Failed to load notifications:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const category = (searchParams.get("category") || "all") as NotificationCategory;
    const unreadOnly = searchParams.get("unreadOnly") === "true";
    setActiveCategory(category);
    setShowUnreadOnly(unreadOnly);

    loadNotifications(category, unreadOnly);
  }, [searchParams, loadNotifications]);

  const handleCategoryChange = (category: NotificationCategory) => {
    setShowUnreadOnly(false);
    router.push(`/notifications?category=${category}`);
  };

  const handleToggleUnreadOnly = () => {
    setShowUnreadOnly(!showUnreadOnly);
  };

  const handleMarkAllAsRead = async () => {
    try {
      await NotificationsService.markAllAsRead();
      loadNotifications(activeCategory, showUnreadOnly);
    } catch (error) {
      console.error("Failed to mark all as read:", error);
    }
  };

  const handleMarkAsRead = async (notificationId: number) => {
    try {
      await NotificationsService.markAsRead(notificationId);
      // 읽음 처리 후 목록 새로고침
      loadNotifications(activeCategory, showUnreadOnly);
    } catch (error) {
      console.error("Failed to mark as read:", error);
    }
  };

  const getIcon = (type: NotificationType) => {
    switch (type) {
      case "notice":
        return <NoticeMegaphoneIcon />;
      case "customer_assignment":
        return <NoticeUsersIcon />;
      default:
        return null;
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return "방금 전";
    if (diffMins < 60) return `${diffMins}분 전`;
    
    const diffHours = Math.floor(diffMs / 3600000);
    if (diffHours < 24) return `${diffHours}시간 전`;
    
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffDays < 365) return `${date.getMonth() + 1}/${date.getDate()}`;
    
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  };

  const displayedNotifications = showUnreadOnly ? notifications.filter((n) => !n.read) : notifications;

  const categoryLabels: Record<NotificationCategory, string> = {
    all: "전체",
    notice: "공지",
    customer: "고객",
    system: "시스템",
    security: "보안",
  };

  const filteredNotifications = displayedNotifications.filter((n) => {
    if (activeCategory === "all") return true;
    // API 타입을 UI 카테고리로 매핑하여 필터링
    const category = mapNotificationTypeToCategory(n.type);
    return category === activeCategory;
  });

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-[1324px] px-6 pt-9 pb-24">
        {/* 상단 컨테이너: 제목/설명 + 전체/미읽음 스위치 */}
        <section className="bg-card rounded-[14px]">
          <div className="px-7 pt-6 pb-5">
            <div className="flex items-center gap-4">
              <h1 className="text-[24px] leading-[20px] font-bold tracking-[-0.02em] text-foreground">알림</h1>
              <div className="w-px h-4 bg-neutral-60" />
              <p className="text-[18px] leading-[20px] font-medium tracking-[-0.02em] text-neutral-60">모든 알림을 확인하고 관리하세요</p>
            </div>

            {/* 세그먼트 컨트롤 */}
            <div className="mt-6 inline-flex items-center p-1.5 gap-2 bg-neutral-20 rounded-[12px]">
              <button
                onClick={() => setShowUnreadOnly(false)}
                className={`h-[31px] px-8 rounded-[5px] text-[14px] tracking-[-0.02em] ${
                  !showUnreadOnly ? "bg-card font-semibold text-foreground" : "font-medium text-neutral-60"
                }`}
              >
                전체 ({counts.all})
              </button>
              <button
                onClick={() => setShowUnreadOnly(true)}
                className={`h-[31px] px-8 rounded-[5px] text-[14px] tracking-[-0.02em] ${
                  showUnreadOnly ? "bg-card font-semibold text-foreground" : "font-medium text-foreground opacity-80"
                }`}
              >
                미읽음 ({counts.unread})
              </button>
            </div>
          </div>
          <div className="h-px bg-border" />
        </section>

        <div className="h-6" />

        {/* 하단 컨테이너: 탭 + 목록 */}
        <section className="bg-card rounded-[14px]">
          {/* 탭 */}
          <div className="px-7 py-4 flex items-center justify-between border-b border-border">
            <div className="flex items-center gap-3">
              {(["all", "notice", "customer", "system", "security"] as NotificationCategory[]).map((category) => {
                const isActive = activeCategory === category;
                return (
                  <button
                    key={category}
                    onClick={() => handleCategoryChange(category)}
                    className={`h-[34px] px-3 rounded-[5px] text-[14px] tracking-[-0.02em] border ${
                      isActive
                        ? "bg-notification-unread border-2 border-notification-unread font-semibold text-foreground"
                        : "border-border font-medium text-foreground opacity-80"
                    }`}
                  >
                    {categoryLabels[category]} {category !== "all" && counts[category]}
                  </button>
                );
              })}
            </div>
            <button
              onClick={handleMarkAllAsRead}
              className="h-[34px] px-3 rounded-[5px] bg-card border border-border text-foreground text-[14px] font-semibold"
            >
              모두 읽음 처리
            </button>
          </div>

          {/* 리스트 */}
          <div className="px-7 py-6">
            {loading ? (
              <div className="text-center py-12 text-neutral-60">불러오는 중...</div>
            ) : filteredNotifications.length === 0 ? (
              <div className="text-center py-12 text-neutral-60">알림이 없습니다.</div>
            ) : (
              <div className="space-y-3">
                {filteredNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    onClick={() => !notification.read && handleMarkAsRead(notification.id)}
                    className={`box-border flex items-center gap-4 px-6 py-5 rounded-[12px] border cursor-pointer transition-colors ${
                      !notification.read
                        ? "bg-notification-unread border-notification-unread hover:opacity-90"
                        : "bg-card border-border hover:bg-neutral-10"
                    }`}
                  >
                    <div className="w-6 h-6 flex items-center justify-center">
                      {getIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[16px] leading-[24px] font-semibold tracking-[-0.02em] text-foreground">
                          {notification.title}
                        </span>
                        {!notification.read && <span className="w-2 h-2 rounded-full bg-primary-60" />}
                      </div>
                      <p className="mt-1 text-[14px] leading-[24px] font-medium tracking-[-0.02em] text-neutral-60">
                        {notification.content}
                      </p>
                    </div>
                    <div className="text-[14px] leading-[24px] font-medium tracking-[-0.02em] text-neutral-60 text-right">
                      {formatTime(notification.createdAt)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

export default function NotificationsPageWrapper() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-background">
        <div className="mx-auto max-w-[1324px] px-6 pt-9 pb-24 text-neutral-60">불러오는 중...</div>
      </main>
    }>
      <NotificationsPage />
    </Suspense>
  );
}
