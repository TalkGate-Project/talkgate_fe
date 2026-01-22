"use client";

import { createContext, useContext, useState, useCallback, useEffect } from "react";
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

  return (
    <CustomerModalContext.Provider value={{ openCustomerModal, closeCustomerModal }}>
      {children}
      <CustomerDetailModal open={isOpen} onClose={closeCustomerModal} customerId={customerId} />
    </CustomerModalContext.Provider>
  );
}
