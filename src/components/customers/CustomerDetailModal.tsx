"use client";

import { useState, useEffect } from "react";
import CustomerDetailModalDesktop from "./CustomerDetailModalDesktop";
import CustomerDetailModalMobile from "./CustomerDetailModalMobile";

export type CustomerDetailModalProps = {
  open: boolean;
  onClose: () => void;
  customerId: number | null;
  /** 상세 모달에서 고객 데이터 변경 시(수정/노트/상태변경) */
  onCustomerUpdated?: () => void;
  /** 상세 모달에서 고객 삭제 성공 시 */
  onCustomerDeleted?: (deletedCustomerId: number) => void;
  /** @deprecated use onCustomerUpdated */
  onRefetch?: () => void;
  /** 상세 모달에서 직원배정 클릭 시 (고객 1명 배정용) */
  onAssignClick?: () => void;
};

export default function CustomerDetailModal(props: CustomerDetailModalProps) {
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(max-width: 779px)").matches;
  });

  useEffect(() => {
    // 이 프로젝트의 실제 md 브레이크포인트는 780px (globals.css --breakpoint-md, 기본 768px 아님)
    const mediaQuery = window.matchMedia("(max-width: 779px)");
    
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
    <CustomerDetailModalMobile
      {...props}
      onCustomerUpdated={props.onCustomerUpdated}
      onCustomerDeleted={props.onCustomerDeleted}
      onRefetch={props.onRefetch}
      onAssignClick={props.onAssignClick}
    />
  ) : (
    <CustomerDetailModalDesktop
      {...props}
      onCustomerUpdated={props.onCustomerUpdated}
      onCustomerDeleted={props.onCustomerDeleted}
      onRefetch={props.onRefetch}
      onAssignClick={props.onAssignClick}
    />
  );
}
