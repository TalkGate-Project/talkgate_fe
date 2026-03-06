"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  clampStaffChatWindowBounds,
  STAFF_CHAT_POSITION_STORAGE_KEY,
  getDefaultStaffChatWindowBounds,
  type StaffChatWindowPosition,
  type StaffChatWindowSize,
  type StaffChatWindowBounds,
} from "@/lib/staffChatWindowPosition";

type TeamChatWindowContextValue = {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
  windowPosition: StaffChatWindowPosition;
  windowSize: StaffChatWindowSize;
  setWindowPosition: (
    position:
      | StaffChatWindowPosition
      | ((prev: StaffChatWindowPosition) => StaffChatWindowPosition)
  ) => void;
  setWindowSize: (
    size:
      | StaffChatWindowSize
      | ((prev: StaffChatWindowSize) => StaffChatWindowSize)
  ) => void;
  resetWindowPosition: () => void;
};

const TeamChatWindowContext = createContext<TeamChatWindowContextValue | null>(null);

export function useTeamChatWindow() {
  const ctx = useContext(TeamChatWindowContext);
  if (!ctx) {
    throw new Error("useTeamChatWindow must be used within TeamChatWindowProvider");
  }
  return ctx;
}

export function useTeamChatWindowSafe() {
  return useContext(TeamChatWindowContext);
}

function getViewport() {
  if (typeof window === "undefined") {
    return null;
  }
  return { width: window.innerWidth, height: window.innerHeight };
}

function clampBoundsWithViewport(bounds: StaffChatWindowBounds): StaffChatWindowBounds {
  const viewport = getViewport();
  if (!viewport) return bounds;
  return clampStaffChatWindowBounds(bounds, viewport.width, viewport.height);
}

export default function TeamChatWindowProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [windowBounds, setWindowBoundsState] = useState<StaffChatWindowBounds>(
    getDefaultStaffChatWindowBounds(1200)
  );

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((prev) => !prev), []);
  const setWindowPosition = useCallback(
    (
      position:
        | StaffChatWindowPosition
        | ((prev: StaffChatWindowPosition) => StaffChatWindowPosition)
    ) => {
      setWindowBoundsState((prev) => {
        const nextPosition =
          typeof position === "function"
            ? position({ left: prev.left, top: prev.top })
            : position;
        return clampBoundsWithViewport({ ...prev, ...nextPosition });
      });
    },
    []
  );
  const setWindowSize = useCallback(
    (
      size:
        | StaffChatWindowSize
        | ((prev: StaffChatWindowSize) => StaffChatWindowSize)
    ) => {
      setWindowBoundsState((prev) => {
        const nextSize =
          typeof size === "function"
            ? size({ width: prev.width, height: prev.height })
            : size;
        return clampBoundsWithViewport({ ...prev, ...nextSize });
      });
    },
    []
  );
  const resetWindowPosition = useCallback(() => {
    const viewport = getViewport();
    if (!viewport) return;
    setWindowBoundsState(
      clampStaffChatWindowBounds(
        getDefaultStaffChatWindowBounds(viewport.width),
        viewport.width,
        viewport.height
      )
    );
  }, []);

  useEffect(() => {
    const viewport = getViewport();
    if (!viewport) return;

    const fallback = getDefaultStaffChatWindowBounds(viewport.width);
    const stored = window.localStorage.getItem(STAFF_CHAT_POSITION_STORAGE_KEY);

    if (!stored) {
      setWindowBoundsState(clampStaffChatWindowBounds(fallback, viewport.width, viewport.height));
      return;
    }

    try {
      const parsed = JSON.parse(stored) as Partial<StaffChatWindowBounds>;
      const left = Number(parsed.left);
      const top = Number(parsed.top);
      const width = Number(parsed.width);
      const height = Number(parsed.height);
      if (!Number.isFinite(left) || !Number.isFinite(top)) throw new Error("invalid staff chat position");
      setWindowBoundsState(
        clampStaffChatWindowBounds(
          {
            left,
            top,
            width: Number.isFinite(width) ? width : fallback.width,
            height: Number.isFinite(height) ? height : fallback.height,
          },
          viewport.width,
          viewport.height
        )
      );
    } catch {
      setWindowBoundsState(clampStaffChatWindowBounds(fallback, viewport.width, viewport.height));
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(STAFF_CHAT_POSITION_STORAGE_KEY, JSON.stringify(windowBounds));
  }, [windowBounds]);

  useEffect(() => {
    const handleResize = () => {
      setWindowBoundsState((prev) => clampBoundsWithViewport(prev));
    };

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    window.dispatchEvent(
      new CustomEvent("tg:staff-chat-visibility-changed", {
        detail: { isOpen },
      })
    );
  }, [isOpen]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleOpenStaffChat = () => {
      open();
    };

    window.addEventListener("tg:open-staff-chat", handleOpenStaffChat);
    return () => {
      window.removeEventListener("tg:open-staff-chat", handleOpenStaffChat);
    };
  }, [open]);

  const windowPosition = useMemo<StaffChatWindowPosition>(
    () => ({ left: windowBounds.left, top: windowBounds.top }),
    [windowBounds.left, windowBounds.top]
  );
  const windowSize = useMemo<StaffChatWindowSize>(
    () => ({ width: windowBounds.width, height: windowBounds.height }),
    [windowBounds.width, windowBounds.height]
  );

  const value = useMemo<TeamChatWindowContextValue>(
    () => ({
      isOpen,
      open,
      close,
      toggle,
      windowPosition,
      windowSize,
      setWindowPosition,
      setWindowSize,
      resetWindowPosition,
    }),
    [isOpen, open, close, toggle, windowPosition, windowSize, setWindowPosition, setWindowSize, resetWindowPosition]
  );

  return <TeamChatWindowContext.Provider value={value}>{children}</TeamChatWindowContext.Provider>;
}
