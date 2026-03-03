"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import StaffChatModal from "@/components/layout/StaffChatModal";
import { useTeamChatWindow } from "@/providers/TeamChatWindowProvider";

function isHeaderHiddenRoute(pathname: string): boolean {
  return (
    pathname.startsWith("/login") ||
    pathname.startsWith("/auth/callback") ||
    pathname.startsWith("/social-signup") ||
    pathname.startsWith("/project-signup") ||
    pathname.startsWith("/signup") ||
    pathname.startsWith("/invite") ||
    pathname.startsWith("/forgot-password")
  );
}

export default function GlobalStaffChatModal() {
  const pathname = usePathname();
  const { isOpen, close } = useTeamChatWindow();

  useEffect(() => {
    if (!pathname) return;
    if (isHeaderHiddenRoute(pathname)) {
      close();
    }
  }, [pathname, close]);

  return <StaffChatModal isOpen={isOpen} onClose={close} />;
}
