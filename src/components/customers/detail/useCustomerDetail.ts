import { useState, useEffect, useCallback } from "react";
import { CustomersService } from "@/services/customers";
import { CustomerNoteCategoriesService } from "@/services/customerNoteCategories";
import type { CustomerDetail } from "@/types/customers";
import { useCustomerForm } from "./useCustomerForm";
import { useCustomerActions } from "./useCustomerActions";
import type { NoteCategory } from "./types";

// Re-export types for backward compatibility
export type { CustomerFormState } from "./types";
export { INITIAL_FORM_STATE } from "./types";

export function useCustomerDetail(customerId: number | null, open: boolean) {
  const [loading, setLoading] = useState(false);
  const [detail, setDetail] = useState<CustomerDetail | null>(null);
  const [categories, setCategories] = useState<NoteCategory[]>([]);

  // Form 상태 관리
  const {
    form,
    setForm,
    originalForm,
    hasChanges,
    messengersLocal,
    setMessengersLocal,
    initializeForm,
    resetForm: resetFormState,
    getChangedFields,
    commitForm,
  } = useCustomerForm();

  // CRUD 액션들
  const actions = useCustomerActions({
    detail,
    setDetail,
    messengersLocal,
    setMessengersLocal,
    getChangedFields,
    commitForm,
  });

  // =========================================================================
  // Data Fetching
  // =========================================================================

  const fetchDetail = useCallback(async () => {
    if (!customerId) return;
    setLoading(true);
    try {
      const res = await CustomersService.detail(String(customerId)).withProject(
        (window as any)?.tgSelectedProjectId || ""
      );
      const d = (res as any).data?.data || null;
      setDetail(d);

      if (d) {
        initializeForm(d);
      }
    } catch (err) {
      setDetail(null);
    } finally {
      setLoading(false);
    }
  }, [customerId, initializeForm]);

  const fetchCategories = useCallback(async () => {
    try {
      const res = await CustomerNoteCategoriesService.list();
      setCategories(((res as any).data?.data || []) as NoteCategory[]);
    } catch {
      setCategories([]);
    }
  }, []);

  useEffect(() => {
    if (open && customerId) {
      fetchDetail();
      fetchCategories();
    }
  }, [open, customerId, fetchDetail, fetchCategories]);

  // =========================================================================
  // Reset Form (wrapper)
  // =========================================================================

  const resetForm = useCallback(() => {
    resetFormState(detail);
  }, [resetFormState, detail]);

  // =========================================================================
  // Return
  // =========================================================================

  return {
    loading,
    detail,
    categories,
    messengersLocal,
    form,
    setForm,
    originalForm,
    hasChanges,
    actions: {
      resetForm,
      ...actions,
    },
  };
}
