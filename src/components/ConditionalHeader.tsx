"use client";

import { usePathname } from "next/navigation";
import Header from "./Header";

export default function ConditionalHeader() {
  const pathname = usePathname();
  if (!pathname) return null;
  if (
    pathname.startsWith("/login") ||
    pathname.startsWith("/signup") ||
    pathname.startsWith("/forgot-password") ||
    pathname === "/projects"
  )
    return null;
  return (
    <>
      <Header />
      <div style={{ height: 54 }} />
    </>
  );
}


