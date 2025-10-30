"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { NotificationsService, Notification, NotificationCategory, NotificationType } from "@/services/notifications";
import { NoticeMegaphoneIcon, NoticeUsersIcon, NoticeCogIcon, NoticeShieldIcon } from "@/components/notice/icons/NoticeIcons";

export function NotificationsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [counts, setCounts] = useState({ all: 0, notice: 0, customer: 0, system: 0, security: 0, unread: 0 });
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<NotificationCategory>("all");
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);

  useEffect(() => {
    const category = (searchParams.get("category") || "all") as NotificationCategory;
    setActiveCategory(category);
    setShowUnreadOnly(searchParams.get("unreadOnly") === "true");

    loadNotifications(category);
  }, [searchParams]);

  const loadNotifications = async (category: NotificationCategory) => {
    setLoading(true);
    try {
      // Mock data
      const mockNotifications: Notification[] = [
        {
          id: 1,
          type: "notice",
          title: "새로운 공지사항",
          content: "새로운 공지사항이 등록되었습니다.",
          read: false,
          createdAt: new Date(Date.now() - 4 * 60000).toISOString(),
        },
        {
          id: 2,
          type: "notice",
          title: "새로운 공지사항",
          content: "새로운 공지사항이 등록되었습니다.",
          read: false,
          createdAt: new Date(Date.now() - 4 * 60000).toISOString(),
        },
        {
          id: 3,
          type: "customer",
          title: "새로운 고객 배정",
          content: "4명의 고객이 배정되었습니다.",
          read: true,
          createdAt: new Date(Date.now() - 4 * 60000).toISOString(),
        },
        {
          id: 4,
          type: "system",
          title: "시스템 점검 안내",
          content: "4명의 고객이 배정되었습니다.",
          read: true,
          createdAt: new Date(Date.now() - 4 * 60000).toISOString(),
        },
        {
          id: 5,
          type: "security",
          title: "보안 경고 알림",
          content: "비밀번호가 오래되었습니다. 7일 이내에 변경해주세요.",
          read: true,
          createdAt: "2025-10-11T00:00:00Z",
        },
      ];

      setNotifications(mockNotifications);

      const allCount = mockNotifications.length;
      const unreadCount = mockNotifications.filter((n) => !n.read).length;
      const noticeCount = mockNotifications.filter((n) => n.type === "notice").length;
      const customerCount = mockNotifications.filter((n) => n.type === "customer").length;
      const systemCount = mockNotifications.filter((n) => n.type === "system").length;
      const securityCount = mockNotifications.filter((n) => n.type === "security").length;

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
  };

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
      loadNotifications(activeCategory);
    } catch (error) {
      console.error("Failed to mark all as read:", error);
    }
  };

  const getIcon = (type: NotificationType) => {
    switch (type) {
      case "notice":
        return <NoticeMegaphoneIcon />;
      case "customer":
        return <NoticeUsersIcon />;
      case "system":
        return <NoticeCogIcon />;
      case "security":
        return <NoticeShieldIcon />;
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
    return n.type === activeCategory;
  });

  return (
    <main className="min-h-screen bg-[#F8F8F8] dark:bg-[#1E1E1E]">
      <div className="mx-auto max-w-[1324px] px-6 pt-24 pb-24">
        {/* 상단 컨테이너: 제목/설명 + 전체/미읽음 스위치 */}
        <section className="bg-white rounded-[14px]">
          <div className="px-7 pt-6 pb-5">
            <div className="flex items-center gap-4">
              <h1 className="text-[24px] leading-[20px] font-bold tracking-[-0.02em] text-[#252525]">알림</h1>
              <div className="w-px h-4 bg-[#808080]" />
              <p className="text-[18px] leading-[20px] font-medium tracking-[-0.02em] text-[#808080]">모든 알림을 확인하고 관리하세요</p>
            </div>

            {/* 세그먼트 컨트롤 */}
            <div className="mt-6 inline-flex items-center p-1.5 gap-2 bg-[#EDEDED] rounded-[12px]">
              <button
                onClick={() => setShowUnreadOnly(false)}
                className={`h-[31px] px-8 rounded-[5px] text-[14px] tracking-[-0.02em] ${
                  !showUnreadOnly ? "bg-white font-semibold text-[#252525]" : "font-medium text-[#808080]"
                }`}
              >
                전체 ({counts.all})
              </button>
              <button
                onClick={() => setShowUnreadOnly(true)}
                className={`h-[31px] px-8 rounded-[5px] text-[14px] tracking-[-0.02em] ${
                  showUnreadOnly ? "bg-white font-semibold text-[#252525]" : "font-medium text-[#252525] opacity-80"
                }`}
              >
                미읽음 ({counts.unread})
              </button>
            </div>
          </div>
          <div className="h-px bg-[#E2E2E2]" />
        </section>

        <div className="h-6" />

        {/* 하단 컨테이너: 탭 + 목록 */}
        <section className="bg-white rounded-[14px]">
          {/* 탭 */}
          <div className="px-7 py-4 flex items-center justify-between border-b border-[#E2E2E2]">
            <div className="flex items-center gap-3">
              {(["all", "notice", "customer", "system", "security"] as NotificationCategory[]).map((category) => {
                const isActive = activeCategory === category;
                return (
                  <button
                    key={category}
                    onClick={() => handleCategoryChange(category)}
                    className={`h-[34px] px-3 rounded-[5px] text-[14px] tracking-[-0.02em] border ${
                      isActive
                        ? "bg-[rgba(214,250,232,0.3)] border-[2px] border-[#51F8A5] font-semibold text-[#000000]"
                        : "border-[#E2E2E2] font-medium text-[#252525] opacity-80"
                    }`}
                  >
                    {categoryLabels[category]} {category !== "all" && counts[category as NotificationType]}
                  </button>
                );
              })}
            </div>
            <button
              onClick={handleMarkAllAsRead}
              className="h-[34px] px-3 rounded-[5px] bg-white border border-[#E2E2E2] text-[#000000] text-[14px] font-semibold"
            >
              모두 읽음 처리
            </button>
          </div>

          {/* 리스트 */}
          <div className="px-7 py-6">
            {loading ? (
              <div className="text-center py-12 text-[#808080]">불러오는 중...</div>
            ) : filteredNotifications.length === 0 ? (
              <div className="text-center py-12 text-[#808080]">알림이 없습니다.</div>
            ) : (
              <div className="space-y-3">
                {filteredNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`box-border flex items-center gap-4 px-6 py-5 rounded-[12px] border ${
                      !notification.read
                        ? "bg-[rgba(214,250,232,0.3)] border-[#51F8A5]"
                        : "bg-white border-[#E2E2E2]"
                    }`}
                  >
                    <div className="w-6 h-6 flex items-center justify-center">
                      {getIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[16px] leading-[24px] font-semibold tracking-[-0.02em] text-[#000000]">
                          {notification.title}
                        </span>
                        {!notification.read && <span className="w-2 h-2 rounded-full bg-[#00E272]" />}
                      </div>
                      <p className="mt-1 text-[14px] leading-[24px] font-medium tracking-[-0.02em] text-[#808080]">
                        {notification.content}
                      </p>
                    </div>
                    <div className="text-[14px] leading-[24px] font-medium tracking-[-0.02em] text-[#808080] text-right">
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
      <main className="min-h-screen bg-[#F8F8F8] dark:bg-[#1E1E1E]">
        <div className="mx-auto max-w-[1324px] px-6 pt-24 pb-24 text-[#808080]">불러오는 중...</div>
      </main>
    }>
      <NotificationsPage />
    </Suspense>
  );
}
