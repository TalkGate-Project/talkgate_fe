/**
 * 브라우저 푸시 알림 유틸리티
 */

/**
 * 알림 아이콘 경로
 * 브라우저 Notification API는 .ico 파일을 지원하지 않을 수 있으므로 PNG 형식 사용
 * favicon.ico를 기반으로 한 PNG 파일을 public/notification-icon.png에 배치해야 합니다.
 */
const NOTIFICATION_ICON_PATH = "/notification-icon.png";

/**
 * 브라우저 알림 권한 요청
 * @returns 권한 상태 ('granted' | 'denied' | 'default')
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return "denied";
  }

  if (Notification.permission === "granted") {
    return "granted";
  }

  if (Notification.permission === "denied") {
    return "denied";
  }

  // permission이 'default'인 경우 권한 요청
  const permission = await Notification.requestPermission();
  return permission;
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

