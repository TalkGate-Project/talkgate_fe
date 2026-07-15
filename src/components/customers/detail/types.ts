import type { UpdateCustomerInput, CustomerDetail, ContactType } from "@/types/customers";

// ============================================================================
// Form State Types
// ============================================================================

export type CustomerFormState = {
  name: string;
  contact1: string;
  contact2: string;
  contact1Type: ContactType | null;
  contact2Type: ContactType | null;
  birth: string;
  ageRange: string;
  gender: string;
  job: string;
  applicationRoute: string;
  site: string;
  mediaCompany: string;
  keyword: string;
  ipAddress: string;
  applicationDate: string;
  assignedAt: string;
  assignedMemberName: string;
  assignedTeamName: string;
  specialNotes: string;
  summary: string;
  assetStatus: string;
  tendency: string;
  rejectionReason: string;
};

export type CustomerValidation = {
  nameError: string;
  contact1Error: string;
  isValid: boolean;
};

export const INITIAL_FORM_STATE: CustomerFormState = {
  name: "",
  contact1: "",
  contact2: "",
  contact1Type: null,
  contact2Type: null,
  birth: "",
  ageRange: "",
  gender: "",
  job: "",
  applicationRoute: "",
  site: "",
  mediaCompany: "",
  keyword: "",
  ipAddress: "",
  applicationDate: "",
  assignedAt: "",
  assignedMemberName: "",
  assignedTeamName: "",
  specialNotes: "",
  summary: "",
  assetStatus: "",
  tendency: "",
  rejectionReason: "",
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
  contact1Type: "contact1Type",
  contact2Type: "contact2Type",
  birth: "birth",
  ageRange: "ageRange",
  gender: "gender",
  job: "job",
  applicationRoute: "applicationRoute",
  site: "site",
  mediaCompany: "mediaCompany",
  keyword: "keyword",
  ipAddress: "ipAddress",
  applicationDate: "applicationDate",
  assignedAt: null, // 읽기 전용 필드
  assignedMemberName: null, // 읽기 전용 필드
  assignedTeamName: null, // 읽기 전용 필드
  specialNotes: "specialNotes",
  summary: "summary",
  assetStatus: "assetStatus",
  tendency: "tendency",
  rejectionReason: "rejectionReason",
};

/** 빈 값일 때 "-"로 표시할 필드 목록 (데이터 정보 탭 관련 필드) */
export const EMPTY_DISPLAY_DASH_FIELDS: Array<keyof CustomerFormState> = [
  "applicationRoute",
  "site",
  "mediaCompany",
  "keyword",
  "ipAddress",
  "applicationDate",
  "assignedAt",
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
  colorCode?: string;
};

