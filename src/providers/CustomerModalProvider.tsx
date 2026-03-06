"use client";

import { createContext, useContext, useState, useCallback, useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import CustomerDetailModal from "@/components/customers/CustomerDetailModal";

type CustomerModalContextValue = {
  openCustomerModal: (customerId: number) => void;
  closeCustomerModal: () => void;
};

const CustomerModalContext = createContext<CustomerModalContextValue | undefined>(undefined);

export function useCustomerModal() {
  const ctx = useContext(CustomerModalContext);
  if (!ctx) {
    throw new Error("useCustomerModal must be used within CustomerModalProvider");
  }
  return ctx;
}

export default function CustomerModalProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isOpen, setIsOpen] = useState(false);
  const [customerId, setCustomerId] = useState<number | null>(null);

  const openCustomerModal = useCallback((id: number) => {
    setCustomerId(id);
    setIsOpen(true);
  }, []);

  const closeCustomerModal = useCallback(() => {
    setIsOpen(false);
    setCustomerId(null);
  }, []);

  // 커스텀 이벤트 리스닝 (브라우저 알림 클릭 등에서 사용)
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleOpenCustomerModal = (event: Event) => {
      const customEvent = event as CustomEvent<{ customerId: number }>;
      if (customEvent.detail?.customerId) {
        openCustomerModal(customEvent.detail.customerId);
      }
    };

    window.addEventListener("tg:open-customer-modal", handleOpenCustomerModal as EventListener);
    return () => {
      window.removeEventListener("tg:open-customer-modal", handleOpenCustomerModal as EventListener);
    };
  }, [openCustomerModal]);

  // /customers?openCustomerId=123 형태로 진입하면 고객 상세 모달 자동 오픈
  useEffect(() => {
    if (!pathname?.startsWith("/customers")) return;
    const openCustomerId = searchParams.get("openCustomerId");
    if (!openCustomerId) return;

    const parsed = Number.parseInt(openCustomerId, 10);
    if (Number.isNaN(parsed) || parsed <= 0) return;

    openCustomerModal(parsed);

    const next = new URLSearchParams(searchParams.toString());
    next.delete("openCustomerId");
    const queryString = next.toString();
    const nextUrl = queryString ? `${pathname}?${queryString}` : pathname;
    router.replace(nextUrl);
  }, [pathname, searchParams, openCustomerModal, router]);

  return (
    <CustomerModalContext.Provider value={{ openCustomerModal, closeCustomerModal }}>
      {children}
      <CustomerDetailModal open={isOpen} onClose={closeCustomerModal} customerId={customerId} />
    </CustomerModalContext.Provider>
  );
}
