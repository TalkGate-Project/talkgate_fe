export type StaffChatWindowPosition = {
  left: number;
  top: number;
};

export type StaffChatWindowSize = {
  width: number;
  height: number;
};

export type StaffChatWindowBounds = StaffChatWindowPosition & StaffChatWindowSize;

export const STAFF_CHAT_WINDOW_WIDTH = 388;
export const STAFF_CHAT_WINDOW_HEIGHT = 644;
export const STAFF_CHAT_WINDOW_MIN_WIDTH = 320;
export const STAFF_CHAT_WINDOW_MIN_HEIGHT = 480;
export const STAFF_CHAT_DEFAULT_TOP = 54;
export const STAFF_CHAT_DEFAULT_RIGHT = 40;
export const STAFF_CHAT_MIN_VISIBLE_X = 56;
export const STAFF_CHAT_MIN_VISIBLE_Y = 56;
export const STAFF_CHAT_POSITION_STORAGE_KEY = "talkgate.staffChatModal.position";

export function getDefaultStaffChatWindowSize(): StaffChatWindowSize {
  return {
    width: STAFF_CHAT_WINDOW_WIDTH,
    height: STAFF_CHAT_WINDOW_HEIGHT,
  };
}

export function getDefaultStaffChatWindowPosition(
  viewportWidth: number,
  size: StaffChatWindowSize = getDefaultStaffChatWindowSize()
): StaffChatWindowPosition {
  return {
    left: viewportWidth - STAFF_CHAT_DEFAULT_RIGHT - size.width,
    top: STAFF_CHAT_DEFAULT_TOP,
  };
}

export function getDefaultStaffChatWindowBounds(viewportWidth: number): StaffChatWindowBounds {
  const size = getDefaultStaffChatWindowSize();
  return {
    ...getDefaultStaffChatWindowPosition(viewportWidth, size),
    ...size,
  };
}

export function clampStaffChatWindowSize(
  size: StaffChatWindowSize,
  position: StaffChatWindowPosition,
  viewportWidth: number,
  viewportHeight: number
): StaffChatWindowSize {
  const minWidth = Math.min(STAFF_CHAT_WINDOW_MIN_WIDTH, viewportWidth);
  const minHeight = Math.min(STAFF_CHAT_WINDOW_MIN_HEIGHT, viewportHeight);
  const maxWidth = Math.max(minWidth, viewportWidth - STAFF_CHAT_MIN_VISIBLE_X);
  const maxHeight = Math.max(minHeight, viewportHeight - STAFF_CHAT_MIN_VISIBLE_Y);

  return {
    width: Math.min(Math.max(size.width, minWidth), maxWidth),
    height: Math.min(Math.max(size.height, minHeight), maxHeight),
  };
}

export function clampStaffChatWindowPosition(
  position: StaffChatWindowPosition,
  size: StaffChatWindowSize,
  viewportWidth: number,
  viewportHeight: number
): StaffChatWindowPosition {
  const minLeft = -size.width + STAFF_CHAT_MIN_VISIBLE_X;
  const maxLeft = viewportWidth - STAFF_CHAT_MIN_VISIBLE_X;
  const minTop = -size.height + STAFF_CHAT_MIN_VISIBLE_Y;
  const maxTop = viewportHeight - STAFF_CHAT_MIN_VISIBLE_Y;

  return {
    left: Math.min(Math.max(position.left, minLeft), maxLeft),
    top: Math.min(Math.max(position.top, minTop), maxTop),
  };
}

export function clampStaffChatWindowBounds(
  bounds: StaffChatWindowBounds,
  viewportWidth: number,
  viewportHeight: number
): StaffChatWindowBounds {
  const size = clampStaffChatWindowSize(bounds, bounds, viewportWidth, viewportHeight);
  const position = clampStaffChatWindowPosition(bounds, size, viewportWidth, viewportHeight);
  const adjustedSize = clampStaffChatWindowSize(size, position, viewportWidth, viewportHeight);
  return {
    ...position,
    ...adjustedSize,
  };
}

