export type ErrorModalCallbacks = {
  title?: string;
  headline?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string | null;
  hideCancel?: boolean;
  onConfirm?: () => void | Promise<void>;
  onCancel?: () => void | Promise<void>;
};

type ErrorModalEvent =
  | { type: "show"; payload?: ErrorModalCallbacks }
  | { type: "hide" };

type Listener = (event: ErrorModalEvent) => void;

const listeners = new Set<Listener>();

export function subscribeErrorModal(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function showErrorModal(payload?: ErrorModalCallbacks) {
  const event: ErrorModalEvent = { type: "show", payload };
  listeners.forEach((listener) => listener(event));
}

export function hideErrorModal() {
  const event: ErrorModalEvent = { type: "hide" };
  listeners.forEach((listener) => listener(event));
}


