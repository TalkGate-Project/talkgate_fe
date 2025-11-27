import { useState, useCallback, useMemo } from "react";
import dayjs from "dayjs";
import type { CustomerDetail, UpdateCustomerInput } from "@/types/customers";
import {
  CustomerFormState,
  INITIAL_FORM_STATE,
  FORM_TO_API_FIELD_MAP,
  EMPTY_DISPLAY_DASH_FIELDS,
  toDisplayValue,
  fromDisplayValue,
  MessengerLocal,
} from "./types";

type UseCustomerFormReturn = {
  form: CustomerFormState;
  setForm: React.Dispatch<React.SetStateAction<CustomerFormState>>;
  originalForm: CustomerFormState;
  hasChanges: boolean;
  messengersLocal: MessengerLocal[];
  setMessengersLocal: React.Dispatch<React.SetStateAction<MessengerLocal[]>>;
  initializeForm: (detail: CustomerDetail) => void;
  resetForm: (detail: CustomerDetail | null) => void;
  getChangedFields: () => Partial<Omit<UpdateCustomerInput, "projectId">>;
  commitForm: () => void;
};

export function useCustomerForm(): UseCustomerFormReturn {
  const [form, setForm] = useState<CustomerFormState>(INITIAL_FORM_STATE);
  const [originalForm, setOriginalForm] = useState<CustomerFormState>(INITIAL_FORM_STATE);
  const [messengersLocal, setMessengersLocal] = useState<MessengerLocal[]>([]);

  /** CustomerDetail에서 폼 상태 초기화 */
  const initializeForm = useCallback((detail: CustomerDetail) => {
    setMessengersLocal(detail.messengers || []);

    // applicationDate를 KST로 변환하고 YYYY-MM-DD HH:mm 형식으로 포맷
    const formattedApplicationDate = detail.applicationDate
      ? dayjs(detail.applicationDate).format("YYYY-MM-DD HH:mm")
      : "";

    const initialFormState: CustomerFormState = {
      name: detail.name || "",
      contact1: detail.contact1 || "",
      contact2: detail.contact2 || "",
      residentFront: detail.residentId?.slice(0, 6) || "",
      residentBack: detail.residentId?.slice(6) || "",
      ageRange: detail.ageRange || "",
      job: detail.job || "",
      applicationRoute: toDisplayValue(detail.applicationRoute, "applicationRoute"),
      site: toDisplayValue(detail.site, "site"),
      mediaCompany: toDisplayValue(detail.mediaCompany, "mediaCompany"),
      applicationDate: toDisplayValue(formattedApplicationDate, "applicationDate"),
      assignedMemberName: toDisplayValue(detail.assignedMemberName, "assignedMemberName"),
      assignedTeamName: toDisplayValue(detail.assignedTeamName, "assignedTeamName"),
      specialNotes: toDisplayValue(detail.specialNotes, "specialNotes"),
      investmentInfo: detail.investmentInfo || "",
      investmentProfitLoss: detail.investmentProfitLoss || "",
      investmentRiskLevel: detail.investmentRistLevel || "",
    };

    setForm(initialFormState);
    setOriginalForm(initialFormState);
  }, []);

  /** 폼을 원본 상태로 리셋 */
  const resetForm = useCallback(
    (detail: CustomerDetail | null) => {
      if (!detail) return;
      setForm({ ...originalForm });
      setMessengersLocal(detail.messengers || []);
    },
    [originalForm]
  );

  /** 변경된 필드만 추출 (API 전송용) */
  const getChangedFields = useCallback((): Partial<Omit<UpdateCustomerInput, "projectId">> => {
    const changedFields: Partial<Omit<UpdateCustomerInput, "projectId">> = {};

    // 일반 필드 비교
    (Object.keys(form) as Array<keyof CustomerFormState>).forEach((key) => {
      // residentFront/Back은 별도 처리
      if (key === "residentFront" || key === "residentBack") return;
      // 읽기 전용 필드는 스킵
      if (key === "assignedMemberName" || key === "assignedTeamName") return;

      if (form[key] !== originalForm[key]) {
        const apiField = FORM_TO_API_FIELD_MAP[key];
        if (apiField) {
          // "-" 표시 필드는 서버 전송 시 빈 값으로 변환
          if (EMPTY_DISPLAY_DASH_FIELDS.includes(key)) {
            (changedFields as any)[apiField] = fromDisplayValue(form[key]);
          } else {
            (changedFields as any)[apiField] = form[key] || undefined;
          }
        }
      }
    });

    // residentId 처리: residentFront 또는 residentBack이 변경된 경우
    const currentResidentId =
      form.residentFront || form.residentBack
        ? `${form.residentFront}${form.residentBack}`
        : "";
    const originalResidentId =
      originalForm.residentFront || originalForm.residentBack
        ? `${originalForm.residentFront}${originalForm.residentBack}`
        : "";

    if (currentResidentId !== originalResidentId) {
      changedFields.residentId = currentResidentId || undefined;
    }

    return changedFields;
  }, [form, originalForm]);

  /** 변경사항 존재 여부 */
  const hasChanges = useMemo(() => {
    const changedFields = getChangedFields();
    return Object.keys(changedFields).length > 0;
  }, [getChangedFields]);

  /** 저장 후 현재 form을 새로운 originalForm으로 설정 */
  const commitForm = useCallback(() => {
    setOriginalForm({ ...form });
  }, [form]);

  return {
    form,
    setForm,
    originalForm,
    hasChanges,
    messengersLocal,
    setMessengersLocal,
    initializeForm,
    resetForm,
    getChangedFields,
    commitForm,
  };
}

