export type FeedbackModalType = "error" | "success" | "info";

export type ErrorModalCallbacks = {
  type?: FeedbackModalType;
  title?: string;
  headline?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string | null;
  hideCancel?: boolean;
  persistent?: boolean; // true일 경우 overlay 클릭 시에도 onConfirm 실행 (닫기 불가능)
  hideCloseButton?: boolean; // true일 경우 우상단 닫기 버튼 숨김
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

// 문자열을 받으면 자동으로 headline으로 변환
export function showErrorModal(message: string): void;
// 객체를 받으면 그대로 사용
export function showErrorModal(payload?: ErrorModalCallbacks): void;
// 구현
export function showErrorModal(
  payloadOrMessage?: ErrorModalCallbacks | string
): void {
  let payload: ErrorModalCallbacks | undefined;
  
  if (typeof payloadOrMessage === "string") {
    // 문자열인 경우 headline으로 변환
    payload = {
      type: "error",
      headline: payloadOrMessage,
      hideCancel: true,
    };
  } else {
    // 객체인 경우 그대로 사용
    payload = payloadOrMessage;
  }
  
  const event: ErrorModalEvent = { type: "show", payload };
  listeners.forEach((listener) => listener(event));
}

export function hideErrorModal() {
  const event: ErrorModalEvent = { type: "hide" };
  listeners.forEach((listener) => listener(event));
}


