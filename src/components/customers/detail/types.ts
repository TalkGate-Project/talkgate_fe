import type { UpdateCustomerInput, CustomerDetail } from "@/types/customers";

// ============================================================================
// Form State Types
// ============================================================================

export type CustomerFormState = {
  name: string;
  contact1: string;
  contact2: string;
  residentFront: string;
  residentBack: string;
  ageRange: string;
  job: string;
  applicationRoute: string;
  site: string;
  mediaCompany: string;
  applicationDate: string;
  assignedMemberName: string;
  assignedTeamName: string;
  specialNotes: string;
  investmentInfo: string;
  investmentProfitLoss: string;
  investmentRiskLevel: string;
};

export const INITIAL_FORM_STATE: CustomerFormState = {
  name: "",
  contact1: "",
  contact2: "",
  residentFront: "",
  residentBack: "",
  ageRange: "",
  job: "",
  applicationRoute: "",
  site: "",
  mediaCompany: "",
  applicationDate: "",
  assignedMemberName: "",
  assignedTeamName: "",
  specialNotes: "",
  investmentInfo: "",
  investmentProfitLoss: "",
  investmentRiskLevel: "",
};

// ============================================================================
// Field Mapping Constants
// ============================================================================

/** 서버 API 필드 매핑 (form 필드 -> API 필드) */
export const FORM_TO_API_FIELD_MAP: Record<
  keyof CustomerFormState,
  keyof Omit<UpdateCustomerInput, "projectId"> | null
> = {
  name: "name",
  contact1: "contact1",
  contact2: "contact2",
  residentFront: null, // residentId로 합쳐서 처리
  residentBack: null, // residentId로 합쳐서 처리
  ageRange: "ageRange",
  job: "job",
  applicationRoute: "applicationRoute",
  site: "site",
  mediaCompany: "mediaCompany",
  applicationDate: "applicationDate",
  assignedMemberName: null, // 읽기 전용 필드
  assignedTeamName: null, // 읽기 전용 필드
  specialNotes: "specialNotes",
  investmentInfo: "investmentInfo",
  investmentProfitLoss: "investmentProfitLoss",
  investmentRiskLevel: "investmentRistLevel", // API는 오타 유지
};

/** 빈 값일 때 "-"로 표시할 필드 목록 (데이터 정보 탭 관련 필드) */
export const EMPTY_DISPLAY_DASH_FIELDS: Array<keyof CustomerFormState> = [
  "applicationRoute",
  "site",
  "mediaCompany",
  "applicationDate",
  "assignedMemberName",
  "assignedTeamName",
  "specialNotes",
];

// ============================================================================
// Utility Functions
// ============================================================================

/** 빈 값을 "-"로 변환하는 헬퍼 함수 (표시용) */
export function toDisplayValue(
  value: string | undefined | null,
  field: keyof CustomerFormState
): string {
  if (EMPTY_DISPLAY_DASH_FIELDS.includes(field)) {
    return value || "-";
  }
  return value || "";
}

/** "-"를 빈 값으로 변환하는 헬퍼 함수 (서버 전송용) */
export function fromDisplayValue(value: string): string | undefined {
  return value === "-" ? undefined : value || undefined;
}

// ============================================================================
// Messenger Type
// ============================================================================

export type MessengerLocal = {
  id?: number;
  messenger: string;
  account: string;
  createdAt?: string;
};

// ============================================================================
// Category Type
// ============================================================================

export type NoteCategory = {
  id: number;
  name: string;
  color?: string;
};

