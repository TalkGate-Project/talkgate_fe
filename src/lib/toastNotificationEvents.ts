/** 토스트 왼쪽에 표시할 아이콘 종류. 렌더링 매핑은 ToastNotificationProvider가 담당 */
export type ToastNotificationIcon = "teamChat" | "notice" | "customer" | "system";

export type ToastNotificationPayload = {
  id: string;
  /** 프로젝트 이름 (제목) */
  projectName: string;
  /** 알림 종류 (부제목, 예: 고객/채팅/시스템) */
  category: string;
  /** 한 줄로 표시되는 내용. 여러 항목을 이어붙일 때는 " | "로 구분 */
  content: string;
  icon?: ToastNotificationIcon;
  onClick?: () => void;
};

type Listener = (payload: ToastNotificationPayload) => void;

const listeners = new Set<Listener>();

export function subscribeToastNotification(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function showToastNotification(
  payload: Omit<ToastNotificationPayload, "id">
): void {
  const event: ToastNotificationPayload = {
    ...payload,
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
  };
  listeners.forEach((listener) => listener(event));
}
