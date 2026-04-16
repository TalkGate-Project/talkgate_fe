import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  CustomersService,
  normalizeCustomerCategoryHistory,
} from "@/services/customers";
import { useCustomerNoteCategories } from "@/hooks/useCustomerNoteCategories";
import type { CustomerCategoryHistoryItem, CustomerDetail } from "@/types/customers";
import { useCustomerForm } from "./useCustomerForm";
import type { CustomerValidation } from "./types";
import { useCustomerActions } from "./useCustomerActions";
import { showErrorModal as showErrorModalEvent } from "@/lib/errorModalEvents";

// Re-export types for backward compatibility
export type { CustomerFormState, CustomerValidation } from "./types";
export { INITIAL_FORM_STATE } from "./types";

type UseCustomerDetailOptions = {
  onFetchErrorClose?: () => void;
};

export function useCustomerDetail(
  customerId: number | null,
  open: boolean,
  options?: UseCustomerDetailOptions
) {
  const onFetchErrorClose = options?.onFetchErrorClose;
  const [loading, setLoading] = useState(false);
  const [detail, setDetail] = useState<CustomerDetail | null>(null);
  const [categoryHistory, setCategoryHistory] = useState<CustomerCategoryHistoryItem[]>([]);
  const [categoryHistoryLoading, setCategoryHistoryLoading] = useState(false);
  const { categories } = useCustomerNoteCategories();
  const detailRef = useRef<CustomerDetail | null>(null);

  useEffect(() => {
    detailRef.current = detail;
  }, [detail]);

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

  const fetchCategoryHistory = useCallback(async () => {
    if (!customerId) {
      setCategoryHistory([]);
      return;
    }

    setCategoryHistoryLoading(true);
    try {
      const response = await CustomersService.categoryHistory(
        String(customerId),
        (window as any)?.tgSelectedProjectId || ""
      );
      setCategoryHistory(
        normalizeCustomerCategoryHistory(response.data?.data)
      );
    } catch {
      setCategoryHistory([]);
    } finally {
      setCategoryHistoryLoading(false);
    }
  }, [customerId]);

  const fetchDetail = useCallback(async () => {
    if (!customerId) return;
    const shouldBlockLoading =
      !detailRef.current || detailRef.current.id !== customerId;
    setLoading(shouldBlockLoading);
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
      const errorCode = String((err as any)?.data?.code || "");
      const errorStatus = (err as any)?.status;

      let headline = "고객 정보를 불러올 수 없습니다.";

      if (errorCode === "CUSTOMER_DELETED") {
        headline = "삭제된 고객 정보입니다.";
      } else if (errorCode === "CUSTOMER_NOT_FOUND" || errorStatus === 404) {
        headline = "존재하지 않는 고객 정보입니다.";
      } else if (errorCode === "FORBIDDEN" || errorStatus === 403) {
        headline = "고객 정보를 조회할 권한이 없습니다.";
      }

      onFetchErrorClose?.();
      showErrorModalEvent({
        headline,
        hideCancel: true,
        confirmText: "확인",
      });
    } finally {
      setLoading(false);
    }
  }, [customerId, initializeForm, onFetchErrorClose]);

  const fetchDetailRef = useRef(fetchDetail);

  useEffect(() => {
    fetchDetailRef.current = fetchDetail;
  }, [fetchDetail]);

  useEffect(() => {
    if (open && customerId) {
      fetchDetailRef.current();
    }
  }, [open, customerId]);

  const changeCategory = useCallback(
    async (categoryId: number | null) => {
      await actions.changeCategory(categoryId);
    },
    [actions]
  );

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
    categoryHistory,
    categoryHistoryLoading,
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
      refetchCategoryHistory: fetchCategoryHistory,
      ...actions,
      changeCategory,
    },
  };
}
