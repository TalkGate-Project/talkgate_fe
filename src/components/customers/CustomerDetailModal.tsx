"use client";

import { useState, useEffect } from "react";
import CustomerDetailModalDesktop from "./CustomerDetailModalDesktop";
import CustomerDetailModalMobile from "./CustomerDetailModalMobile";

export type CustomerDetailModalProps = {
  open: boolean;
  onClose: () => void;
  customerId: number | null;
};

export default function CustomerDetailModal(props: CustomerDetailModalProps) {
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(max-width: 767px)").matches;
  });

  useEffect(() => {
    // Tailwind md 브레이크포인트는 768px
    const mediaQuery = window.matchMedia("(max-width: 767px)");
    
    const handleChange = (e: MediaQueryListEvent | MediaQueryList) => {
      setIsMobile(e.matches);
    };

    // 리스너 등록
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", handleChange);
    } else {
      // 구형 브라우저 지원
      mediaQuery.addListener(handleChange);
    }

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener("change", handleChange);
      } else {
        mediaQuery.removeListener(handleChange);
      }
    };
  }, []);

  return isMobile ? (
    <CustomerDetailModalMobile {...props} />
  ) : (
    <CustomerDetailModalDesktop {...props} />
  );
}
