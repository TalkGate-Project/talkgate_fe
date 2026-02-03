import { useState, useEffect, useCallback, useMemo } from "react";
import { CustomersService } from "@/services/customers";
import { CustomerNoteCategoriesService } from "@/services/customerNoteCategories";
import type { CustomerDetail } from "@/types/customers";
import { useCustomerForm } from "./useCustomerForm";
import type { CustomerValidation } from "./types";
import { useCustomerActions } from "./useCustomerActions";
import type { NoteCategory } from "./types";

// Re-export types for backward compatibility
export type { CustomerFormState, CustomerValidation } from "./types";
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

  const validation = useMemo<CustomerValidation>(() => {
    const nameValue = form.name.trim();
    const contact1Digits = form.contact1.replace(/\D/g, "");

    const nameError = nameValue ? "" : "이름은 필수 항목입니다.";
    const contact1Error = !contact1Digits
      ? "연락처는 필수 항목입니다."
      : contact1Digits.length < 9
        ? "연락처는 9자 이상 입력해 주세요."
        : "";

    return {
      nameError,
      contact1Error,
      isValid: !nameError && !contact1Error,
    };
  }, [form.name, form.contact1]);

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
    validation,
    actions: {
      resetForm,
      refetch: fetchDetail,
      ...actions,
    },
  };
}
