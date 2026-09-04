type PageScrollLockState = {
  count: number;
  documentOverflow: string;
  bodyOverflow: string;
};

declare global {
  interface Window {
    __tgPageScrollLock?: PageScrollLockState;
    __tgModalStack?: { ids: string[] };
  }
}

function getPageScrollLockState(): PageScrollLockState {
  window.__tgPageScrollLock ??= { count: 0, documentOverflow: "", bodyOverflow: "" };
  return window.__tgPageScrollLock;
}

export function lockPageScroll(): void {
  const state = getPageScrollLockState();
  if (state.count === 0) {
    state.documentOverflow = document.documentElement.style.overflow;
    state.bodyOverflow = document.body.style.overflow;
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
  }
  state.count += 1;
}

export function unlockPageScroll(): void {
  const state = getPageScrollLockState();
  if (state.count === 0) return;
  state.count -= 1;
  if (state.count === 0) {
    document.documentElement.style.overflow = state.documentOverflow;
    document.body.style.overflow = state.bodyOverflow;
  }
}

export function hasOpenModal(): boolean {
  return Boolean(window.__tgModalStack?.ids.length);
}
