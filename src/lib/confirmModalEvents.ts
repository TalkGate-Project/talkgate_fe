export type ConfirmModalCallbacks = {
  title?: string;
  message?: string;
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

