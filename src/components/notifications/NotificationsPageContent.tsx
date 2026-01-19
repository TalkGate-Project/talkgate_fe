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

function NotificationsPageContentInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [notifications, setNotifications] = useState<UINotification[]>([]);
  const [counts, setCounts] = useState({ all: 0, notice: 0, customer: 0, system: 0, security: 0, unread: 0 });
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<NotificationCategory>("all");
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const [nextCursor, setNextCursor] = useState<number | null>(null);
  const [hasMore, setHasMore] = useState(false);

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

  const handleNotificationClick = async (notification: UINotification) => {
    // 읽음 처리
    if (!notification.read) {
      await handleMarkAsRead(notification.id);
    }

    // 알림 타입에 따라 적절한 페이지로 이동
    if (notification.type === "notice" && notification.referenceId) {
      // 공지사항 알림: 해당 공지사항 상세 페이지로 이동
      router.push(`/notice/${notification.referenceId}`);
    } else if (notification.type === "customer_assignment") {
      // 고객 관련 알림: 고객 목록 페이지로 이동
      router.push("/customers");
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
    <main className="min-h-screen bg-card md:bg-background">
      <div className="mx-auto max-w-[1324px] px-0 md:px-6 pt-0 md:pt-9 md:pb-24">
        {/* 모바일: 하나의 배경으로 통합, 데스크탑: 두 개의 section으로 분리 */}
        <div className="bg-card md:rounded-[14px] min-h-screen md:min-h-0">
          {/* 상단 컨테이너: 제목/설명 + 전체/미읽음 스위치 */}
          <section className="md:rounded-[14px]">
            <div className="px-4 md:px-7 py-4 md:py-7">
              <div className="flex items-center justify-between gap-2 md:gap-4">
                <div className="flex items-center gap-2 md:gap-4">
                  <h1 className="text-[18px] md:text-[24px] leading-[20px] font-bold tracking-[-0.02em] text-foreground">새로운 소식</h1>
                  <div className="hidden md:block w-px h-4 bg-neutral-60" />
                  <p className="hidden md:block text-[18px] leading-[20px] font-medium tracking-[-0.02em] text-neutral-60">새로운 소식을 확인하세요</p>
                </div>
                <button
                  onClick={handleMarkAllAsRead}
                  className="md:hidden h-[34px] px-3 rounded-[5px] bg-card border border-neutral-30 text-foreground text-[14px] font-semibold flex-shrink-0 whitespace-nowrap cursor-pointer"
                >
                  모두 읽음
                </button>
              </div>
            </div>
            <div className="h-px bg-border" />
            <div className="px-4 md:px-7 py-4 md:py-[30px]">
              {/* 세그먼트 컨트롤 */}
              <div className="flex md:inline-flex items-center px-3 h-[48px] gap-2 bg-neutral-20 rounded-[12px] w-full md:w-auto">
                <button
                  onClick={() => setShowUnreadOnly(false)}
                  className={`cursor-pointer h-[31px] flex-1 md:flex-none px-6 md:px-8 rounded-[5px] text-[14px] md:text-[16px] tracking-[-0.02em] ${
                    !showUnreadOnly ? "bg-card font-bold text-foreground" : "font-medium text-neutral-60"
                  }`}
                >
                  전체 ({counts.all})
                </button>
                <button
                  onClick={() => setShowUnreadOnly(true)}
                  className={`cursor-pointer h-[31px] flex-1 md:flex-none px-6 md:px-8 rounded-[5px] text-[14px] md:text-[16px] tracking-[-0.02em] ${
                    showUnreadOnly ? "bg-card font-bold text-foreground" : "font-medium text-foreground opacity-80"
                  }`}
                >
                  미읽음 ({counts.unread})
                </button>
              </div>
            </div>
            <div className="h-px bg-border" />
          </section>

          {/* 하단 컨테이너: 탭 + 목록 */}
          <section className="md:rounded-[14px]">
            {/* 탭 */}
            <div className="px-4 md:px-7 py-3 md:py-4 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 md:gap-3 overflow-x-auto flex-1 min-w-0">
                {(["all", "notice", "customer"] as NotificationCategory[]).map((category) => {
                  const isActive = activeCategory === category;
                  return (
                    <button
                      key={category}
                      onClick={() => handleCategoryChange(category)}
                      className={`h-[34px] px-3 rounded-[5px] text-[14px] tracking-[-0.02em] border flex-shrink-0 cursor-pointer ${
                        isActive
                          ? "bg-notification-unread border-2 border-notification-unread font-semibold text-foreground"
                          : "border-neutral-30 font-medium text-foreground opacity-80"
                      }`}
                    >
                      {categoryLabels[category]} {category !== "all" && counts[category]}
                    </button>
                  );
                })}
              </div>
              <button
                onClick={handleMarkAllAsRead}
                className="hidden md:block h-[34px] px-3 rounded-[5px] bg-card border border-neutral-30 text-foreground text-[14px] font-semibold flex-shrink-0 whitespace-nowrap cursor-pointer"
              >
                모두 읽음 처리
              </button>
            </div>

            {/* 리스트 */}
            <div className="px-4 md:px-7 pt-1 pb-6">
              {loading ? (
                <div className="text-center py-12 text-neutral-60">불러오는 중...</div>
              ) : filteredNotifications.length === 0 ? (
                <div className="text-center py-12 text-neutral-60">알림이 없습니다.</div>
              ) : (
                <div className="space-y-3">
                  {filteredNotifications.map((notification) => (
                    <div
                      key={notification.id}
                      onClick={() => handleNotificationClick(notification)}
                      className={`box-border flex items-center gap-3 md:gap-4 px-4 md:px-6 py-4 md:py-5 rounded-[12px] border cursor-pointer transition-colors ${
                        !notification.read
                          ? "bg-notification-unread border-notification-unread hover:opacity-90"
                          : "bg-card border-neutral-30 hover:bg-neutral-10"
                      }`}
                    >
                      <div className="w-6 h-6 flex items-center justify-center flex-shrink-0">
                        {getIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[14px] md:text-[16px] leading-[24px] font-semibold tracking-[-0.02em] text-foreground truncate">
                            {notification.title}
                          </span>
                          {!notification.read && <span className="w-2 h-2 rounded-full bg-primary-60 flex-shrink-0" />}
                        </div>
                        <p className="mt-1 text-[13px] md:text-[14px] leading-[20px] md:leading-[24px] font-medium tracking-[-0.02em] text-neutral-60 line-clamp-2">
                          {notification.content}
                        </p>
                      </div>
                      <div className="text-[12px] md:text-[14px] leading-[24px] font-medium tracking-[-0.02em] text-neutral-60 text-right flex-shrink-0 whitespace-nowrap">
                        {formatTime(notification.createdAt)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

export default function NotificationsPageContent() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-background">
        <div className="mx-auto max-w-[1324px] px-6 pt-9 pb-24 text-neutral-60">불러오는 중...</div>
      </main>
    }>
      <NotificationsPageContentInner />
    </Suspense>
  );
}


