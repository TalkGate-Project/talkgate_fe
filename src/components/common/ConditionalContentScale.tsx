"use client";

import { PropsWithChildren } from "react";
import { usePathname } from "next/navigation";

/**
 * Conditionally applies the `.app-scale` wrapper to page content only
 * for authenticated/protected routes where the header is shown.
 * This avoids scaling public pages like login/signup and keeps the
 * fixed header at its original size.
 */
export default function ConditionalContentScale({ children }: PropsWithChildren) {
  const pathname = usePathname();
  if (!pathname) return <>{children}</>;

  const shouldScale =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/consult") ||
    pathname.startsWith("/customers") ||
    pathname.startsWith("/stats") ||
    pathname.startsWith("/projects/") ||
    pathname.startsWith("/notice") ||
    pathname.startsWith("/attendance") ||
    pathname.startsWith("/settings") ||
    pathname.startsWith("/my-settings") ||
    pathname.startsWith("/notifications");

  if (!shouldScale) return <>{children}</>;
  return <div className="app-scale">{children}</div>;
}


