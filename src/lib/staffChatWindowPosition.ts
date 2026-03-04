export type StaffChatWindowPosition = {
  left: number;
  top: number;
};

export const STAFF_CHAT_WINDOW_WIDTH = 388;
export const STAFF_CHAT_WINDOW_HEIGHT = 644;
export const STAFF_CHAT_DEFAULT_TOP = 54;
export const STAFF_CHAT_DEFAULT_RIGHT = 40;
export const STAFF_CHAT_MIN_VISIBLE_X = 56;
export const STAFF_CHAT_MIN_VISIBLE_Y = 56;
export const STAFF_CHAT_POSITION_STORAGE_KEY = "talkgate.staffChatModal.position";

export function getDefaultStaffChatWindowPosition(viewportWidth: number): StaffChatWindowPosition {
  return {
    left: viewportWidth - STAFF_CHAT_DEFAULT_RIGHT - STAFF_CHAT_WINDOW_WIDTH,
    top: STAFF_CHAT_DEFAULT_TOP,
  };
}

export function clampStaffChatWindowPosition(
  position: StaffChatWindowPosition,
  viewportWidth: number,
  viewportHeight: number
): StaffChatWindowPosition {
  const minLeft = -STAFF_CHAT_WINDOW_WIDTH + STAFF_CHAT_MIN_VISIBLE_X;
  const maxLeft = viewportWidth - STAFF_CHAT_MIN_VISIBLE_X;
  const minTop = 0;
  const maxTop = viewportHeight - STAFF_CHAT_MIN_VISIBLE_Y;

  return {
    left: Math.min(Math.max(position.left, minLeft), maxLeft),
    top: Math.min(Math.max(position.top, minTop), maxTop),
  };
}

