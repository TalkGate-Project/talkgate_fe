export type ConfirmModalType = "warning" | "info";

export type ConfirmModalCallbacks = {
  title?: string;
  /** 제목 아래에 표시할 강조 문구. 없으면 message만 표시(기존 동작) */
  headline?: string;
  message?: string;
  /** warning 시 headline을 붉은색으로 표시, info/미지정 시 기본 스타일 */
  type?: ConfirmModalType;
  confirmText?: string;
  cancelText?: string | null;
  onConfirm?: () => void | Promise<void>;
  onCancel?: () => void | Promise<void>;
};

type ConfirmModalEvent =
  | { type: "show"; payload?: ConfirmModalCallbacks }
  | { type: "hide" };

type Listener = (event: ConfirmModalEvent) => void;

const listeners = new Set<Listener>();

export function subscribeConfirmModal(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function showConfirmModal(payload?: ConfirmModalCallbacks) {
  const event: ConfirmModalEvent = { type: "show", payload };
  listeners.forEach((listener) => listener(event));
}

export function hideConfirmModal() {
  const event: ConfirmModalEvent = { type: "hide" };
  listeners.forEach((listener) => listener(event));
}

