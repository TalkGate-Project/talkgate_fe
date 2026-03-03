"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

type TeamChatWindowContextValue = {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
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

export default function TeamChatWindowProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((prev) => !prev), []);

  const value = useMemo<TeamChatWindowContextValue>(
    () => ({ isOpen, open, close, toggle }),
    [isOpen, open, close, toggle]
  );

  return <TeamChatWindowContext.Provider value={value}>{children}</TeamChatWindowContext.Provider>;
}
