import { useState } from "react";
import { CustomerListItem } from "@/types/customers";

export type SelectionMode = "page" | "all";

export function useCustomersSelection() {
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [selectionMode, setSelectionMode] = useState<SelectionMode | null>(null);

  const allSelectedOnPage = (customers: CustomerListItem[]) => {
    return customers.length > 0 && customers.every((c) => selectedIds.includes(c.id));
  };

  const toggleSelectAll = (customers: CustomerListItem[], mode: SelectionMode) => {
    if (mode === "page") {
      // 현재 페이지 선택/해제
      if (allSelectedOnPage(customers)) {
        setSelectedIds((prev) => prev.filter((id) => !customers.some((c) => c.id === id)));
        setSelectionMode(null);
      } else {
        const add = customers.map((c) => c.id).filter((id) => !selectedIds.includes(id));
        setSelectedIds((prev) => [...prev, ...add]);
        setSelectionMode("page");
      }
    } else {
      // 전체 목록 선택 (필터 기준)
      if (selectionMode === "all") {
        // 전체 목록 재선택 시 해제
        setSelectionMode(null);
        setSelectedIds([]);
      } else {
        // 전체 목록 선택
        setSelectionMode("all");
        // 현재 페이지의 ID는 유지하되, 모드만 설정
        // 실제 선택은 API 호출 시 필터로 처리
      }
    }
  };

  const toggleSelect = (customerId: number, checked: boolean) => {
    setSelectedIds((prev) => (checked ? [...prev, customerId] : prev.filter((id) => id !== customerId)));
    // 개별 선택 시 모드 초기화
    if (!checked) {
      setSelectionMode(null);
    }
  };

  const clearSelection = () => {
    setSelectedIds([]);
    setSelectionMode(null);
  };

  return {
    selectedIds,
    setSelectedIds,
    selectionMode,
    allSelectedOnPage,
    toggleSelectAll,
    toggleSelect,
    clearSelection,
  };
}

