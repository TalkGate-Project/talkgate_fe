import { useState } from "react";
import { CustomerListItem } from "@/types/customers";

export function useCustomersSelection() {
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const allSelectedOnPage = (customers: CustomerListItem[]) => {
    return customers.length > 0 && customers.every((c) => selectedIds.includes(c.id));
  };

  const toggleSelectAll = (customers: CustomerListItem[]) => {
    if (allSelectedOnPage(customers)) {
      setSelectedIds((prev) => prev.filter((id) => !customers.some((c) => c.id === id)));
    } else {
      const add = customers.map((c) => c.id).filter((id) => !selectedIds.includes(id));
      setSelectedIds((prev) => [...prev, ...add]);
    }
  };

  const toggleSelect = (customerId: number, checked: boolean) => {
    setSelectedIds((prev) => (checked ? [...prev, customerId] : prev.filter((id) => id !== customerId)));
  };

  const clearSelection = () => {
    setSelectedIds([]);
  };

  return {
    selectedIds,
    setSelectedIds,
    allSelectedOnPage,
    toggleSelectAll,
    toggleSelect,
    clearSelection,
  };
}

