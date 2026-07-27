export type ConfirmModalType = "warning" | "caution" | "info" | "success";

export type ConfirmModalCallbacks = {
  title?: string;
  /** 제목 아래에 표시할 강조 문구. 없으면 message만 표시(기존 동작) */
  headline?: string;
  message?: string;
  /** warning=붉은 경고삼각형+붉은 headline, caution=주황 느낌표원+주황 headline, info=파란 정보원, success=초록 체크(headline은 기본 스타일) */
  type?: ConfirmModalType;
  confirmText?: string;
  cancelText?: string | null;
  /**
   * 지정하면 확인 버튼이 이 초만큼 숫자(3,2,1…)를 보여주며 비활성화된다. 카운트다운이
   * 끝나기 전까지는 확인 버튼뿐 아니라 취소/닫기(X)/바깥 클릭도 전부 막혀 모달을 닫을 수 없다
   * — 대량 작업(전체 선택 등) 경고를 사용자가 실수로 그냥 지나치지 못하게 하기 위함.
   */
  confirmDelaySeconds?: number;
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

