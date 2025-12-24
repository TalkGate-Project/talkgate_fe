/**
 * 브라우저 푸시 알림 유틸리티
 */

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

  // 기본 옵션 설정
  const defaultOptions: NotificationOptions = {
    icon: "/main_logo.png",
    badge: "/main_logo.png",
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
    icon: "/main_logo.png",
    badge: "/main_logo.png",
    tag: `chat-${Date.now()}`, // 각 알림을 고유하게 식별
  });
}

