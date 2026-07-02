/**
 * 브라우저 푸시 알림 유틸리티
 */

import { showErrorModal, hideErrorModal } from "@/lib/errorModalEvents";

/**
 * 알림 아이콘 경로
 * 브라우저 Notification API는 .ico 파일을 지원하지 않을 수 있으므로 래스터 이미지(WebP 등) 사용
 * favicon.ico를 기반으로 한 WebP(또는 PNG) 파일을 public/notification-icon.webp에 배치합니다.
 */
const NOTIFICATION_ICON_PATH = "/notification-icon.webp";

/**
 * quiet UI 안내 모달 관련 상수/헬퍼
 * 배경: docs/NOTIFICATION_PERMISSION_GUIDE_MODAL.md
 */
const GUIDE_MODAL_SHOWN_AT_KEY = "tg_notification_guide_modal_shown_at";
const GUIDE_MODAL_DISMISSED_FOREVER_KEY = "tg_notification_guide_modal_dismissed_forever";
const GUIDE_MODAL_COOLDOWN_MS = 24 * 60 * 60 * 1000;
// quiet UI에서는 requestPermission()의 Promise가 사용자가 아이콘을 직접 클릭하기 전까지 pending 상태로 멈추므로,
// await로 결과를 기다리지 않고 이 시간 뒤에 Notification.permission을 다시 동기적으로 확인해서 판단한다.
const GUIDE_MODAL_CHECK_DELAY_MS = 2500;

function isMobileUserAgent(): boolean {
  if (typeof navigator === "undefined") return false;
  return /Android|iP(ad|hone|od)/i.test(navigator.userAgent);
}

function isGuideModalInCooldown(): boolean {
  if (typeof window === "undefined") return false;
  const shownAt = window.localStorage.getItem(GUIDE_MODAL_SHOWN_AT_KEY);
  if (!shownAt) return false;
  return Date.now() - Number(shownAt) < GUIDE_MODAL_COOLDOWN_MS;
}

function isGuideModalDismissedForever(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(GUIDE_MODAL_DISMISSED_FOREVER_KEY) === "true";
}

function showNotificationGuideModal(): void {
  window.localStorage.setItem(GUIDE_MODAL_SHOWN_AT_KEY, String(Date.now()));

  showErrorModal({
    type: "info",
    title: "",
    headline: "실시간 알림을 받아보세요",
    description:
      '중요한 알림을 놓치지 않도록 브라우저 알림을 사용할 수 있어요.\n주소창의 알림 아이콘을 클릭하거나, 브라우저 설정에서 알림을 허용해주세요.',
    confirmText: "확인",
    cancelText: "다시 보지 않기",
    onCancel: () => {
      window.localStorage.setItem(GUIDE_MODAL_DISMISSED_FOREVER_KEY, "true");
    },
  });

  if (!("permissions" in navigator)) return;

  navigator.permissions
    .query({ name: "notifications" as PermissionName })
    .then((status) => {
      status.onchange = () => {
        if (Notification.permission === "granted") {
          hideErrorModal();
          status.onchange = null;
        }
      };
    })
    .catch(() => {});
}

/**
 * 브라우저 알림 권한을 요청하고, quiet UI로 추정되면 안내 모달을 띄운다.
 * 기능 사용 시점(상담 진입, 알림벨 클릭 등)의 클릭 핸들러에서 호출한다.
 * 권한 요청 자체는 모바일에서도 그대로 수행하고(예: Android Chrome은 웹 푸시 지원),
 * 안내 모달만 데스크톱 한정으로 노출한다(docs/NOTIFICATION_PERMISSION_GUIDE_MODAL.md 1-2절).
 */
export function requestNotificationPermissionWithGuide(): void {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission !== "default") return;

  Notification.requestPermission().catch(() => {});

  if (isMobileUserAgent()) return;
  if (isGuideModalDismissedForever()) return;
  if (isGuideModalInCooldown()) return;

  setTimeout(() => {
    if (Notification.permission !== "default") return;
    showNotificationGuideModal();
  }, GUIDE_MODAL_CHECK_DELAY_MS);
}

/**
 * 브라우저 알림 표시
 * @param title 알림 제목
 * @param options 알림 옵션
 */
export function showBrowserNotification(
  title: string,
  options?: NotificationOptions
): void {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return;
  }

  if (Notification.permission !== "granted") {
    return;
  }

  // 기본 옵션 설정 (favicon 기반 아이콘 사용)
  const defaultOptions: NotificationOptions = {
    icon: NOTIFICATION_ICON_PATH,
    badge: NOTIFICATION_ICON_PATH,
    tag: "talkgate-chat-notification",
    requireInteraction: false,
    ...options,
  };

  const notification = new Notification(title, defaultOptions);

  // 알림 클릭 시 상담 페이지로 이동
  notification.onclick = () => {
    window.focus();
    window.location.href = "/consult";
    notification.close();
  };

  // 알림 자동 닫기 (5초 후)
  setTimeout(() => {
    notification.close();
  }, 5000);
}

/**
 * 상담 채팅 메시지 알림 표시
 * @param conversationName 대화방 이름
 * @param messageContent 메시지 내용
 */
export function showChatNotification(
  conversationName: string,
  messageContent?: string
): void {
  const title = conversationName || "새로운 메시지";
  const body = messageContent || "새로운 상담 메시지가 도착했습니다.";

  showBrowserNotification(title, {
    body,
    icon: NOTIFICATION_ICON_PATH,
    badge: NOTIFICATION_ICON_PATH,
    tag: `chat-${Date.now()}`, // 각 알림을 고유하게 식별
  });
}

/**
 * 직원 채팅 메시지 알림 표시
 * @param roomName 방 이름
 * @param messageContent 메시지 내용
 */
export function showOrganizationChatNotification(
  roomName: string,
  messageContent?: string
): void {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return;
  }

  if (Notification.permission !== "granted") {
    return;
  }

  const title = roomName || "직원 채팅";
  const body = messageContent || "새로운 직원 채팅 메시지가 도착했습니다.";

  const notification = new Notification(title, {
    body,
    icon: NOTIFICATION_ICON_PATH,
    badge: NOTIFICATION_ICON_PATH,
    tag: `organization-chat-${Date.now()}`,
    requireInteraction: false,
  });

  notification.onclick = () => {
    window.focus();
    window.dispatchEvent(new CustomEvent("tg:open-staff-chat"));
    notification.close();
  };

  setTimeout(() => {
    notification.close();
  }, 5000);
}

