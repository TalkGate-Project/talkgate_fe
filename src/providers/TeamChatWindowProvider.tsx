"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  clampStaffChatWindowPosition,
  getDefaultStaffChatWindowPosition,
  STAFF_CHAT_POSITION_STORAGE_KEY,
  type StaffChatWindowPosition,
} from "@/lib/staffChatWindowPosition";

type TeamChatWindowContextValue = {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
  windowPosition: StaffChatWindowPosition;
  setWindowPosition: (
    position:
      | StaffChatWindowPosition
      | ((prev: StaffChatWindowPosition) => StaffChatWindowPosition)
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

function clampPositionWithViewport(position: StaffChatWindowPosition): StaffChatWindowPosition {
  const viewport = getViewport();
  if (!viewport) return position;
  return clampStaffChatWindowPosition(position, viewport.width, viewport.height);
}

export default function TeamChatWindowProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [windowPosition, setWindowPositionState] = useState<StaffChatWindowPosition>(
    getDefaultStaffChatWindowPosition(1200)
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
      setWindowPositionState((prev) => {
        const next = typeof position === "function" ? position(prev) : position;
        return clampPositionWithViewport(next);
      });
    },
    []
  );
  const resetWindowPosition = useCallback(() => {
    const viewport = getViewport();
    if (!viewport) return;
    setWindowPositionState(
      clampStaffChatWindowPosition(
        getDefaultStaffChatWindowPosition(viewport.width),
        viewport.width,
        viewport.height
      )
    );
  }, []);

  useEffect(() => {
    const viewport = getViewport();
    if (!viewport) return;

    const fallback = getDefaultStaffChatWindowPosition(viewport.width);
    const stored = window.localStorage.getItem(STAFF_CHAT_POSITION_STORAGE_KEY);

    if (!stored) {
      setWindowPositionState(clampStaffChatWindowPosition(fallback, viewport.width, viewport.height));
      return;
    }

    try {
      const parsed = JSON.parse(stored) as Partial<StaffChatWindowPosition>;
      const left = Number(parsed.left);
      const top = Number(parsed.top);
      if (!Number.isFinite(left) || !Number.isFinite(top)) throw new Error("invalid staff chat position");
      setWindowPositionState(
        clampStaffChatWindowPosition({ left, top }, viewport.width, viewport.height)
      );
    } catch {
      setWindowPositionState(clampStaffChatWindowPosition(fallback, viewport.width, viewport.height));
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(STAFF_CHAT_POSITION_STORAGE_KEY, JSON.stringify(windowPosition));
  }, [windowPosition]);

  useEffect(() => {
    const handleResize = () => {
      setWindowPositionState((prev) => clampPositionWithViewport(prev));
    };

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const value = useMemo<TeamChatWindowContextValue>(
    () => ({ isOpen, open, close, toggle, windowPosition, setWindowPosition, resetWindowPosition }),
    [isOpen, open, close, toggle, windowPosition, setWindowPosition, resetWindowPosition]
  );

  return <TeamChatWindowContext.Provider value={value}>{children}</TeamChatWindowContext.Provider>;
}
