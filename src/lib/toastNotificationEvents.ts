export type ToastNotificationPayload = {
  id: string;
  title: string;
  description?: string;
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
