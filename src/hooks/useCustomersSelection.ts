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
      const currentPageIds = customers.map((c) => c.id);
      const isCurrentPageFullySelected = allSelectedOnPage(customers);
      
      if (selectionMode === "all") {
        // "전체 목록 선택" 상태에서 "현재 페이지 선택" → 전체 해제 후 현재 페이지만 선택
        setSelectedIds(currentPageIds);
        setSelectionMode("page");
      } else if (isCurrentPageFullySelected) {
        // 현재 페이지가 이미 모두 선택된 상태면 현재 페이지만 해제 (다른 페이지 선택은 유지)
        setSelectedIds((prev) => prev.filter((id) => !currentPageIds.includes(id)));
        setSelectionMode((prev) => prev); // 모드 유지
      } else {
        // 현재 페이지를 기존 선택에 추가 (누적)
        const newIds = currentPageIds.filter((id) => !selectedIds.includes(id));
        setSelectedIds((prev) => [...prev, ...newIds]);
        setSelectionMode("page");
      }
    } else {
      // 전체 목록 선택 (필터 기준)
      if (selectionMode === "all") {
        // 전체 목록 재선택 시 해제
        setSelectionMode(null);
        setSelectedIds([]);
      } else {
        // 이전 선택 초기화 후 전체 목록 선택
        setSelectedIds([]);
        setSelectionMode("all");
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

