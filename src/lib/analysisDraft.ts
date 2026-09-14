import {
  createEmptyDiagnosisForm,
  type DiagnosisFormState,
} from "@/types/debtRelief";

const ANALYSIS_DRAFT_STORAGE_PREFIX = "tg_analysis_new_draft:";
export const ANALYSIS_DRAFTS_CLEARED_EVENT = "tg-analysis-drafts-cleared";
export const ANALYSIS_DRAFTS_CLEARED_AT_KEY = "tg_analysis_drafts_cleared_at";
const ANALYSIS_DRAFT_VERSION = 1;
const ANALYSIS_DRAFT_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000;

export type AnalysisDraftScope = {
  projectId: string;
  memberId: number;
};

export type AnalysisDraftPayload = {
  form: DiagnosisFormState;
  selectedCustomerId: number | null;
  step: number;
  /** 이미 서버에 임시저장(POST .../draft)해 생성된 분석 건의 id. 새로고침 후 복원할 때 이것도
   * 함께 돌려줘야 다음 임시저장이 PATCH(수정)로 이어진다 — 없으면 다시 POST(생성)를 타서
   * 서버에 고아 drafting 건이 하나 더 생긴다. */
  draftId: number | null;
};

export type AnalysisDraft = AnalysisDraftPayload & AnalysisDraftScope & {
  version: typeof ANALYSIS_DRAFT_VERSION;
  savedAt: number;
};

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function buildAnalysisDraftKey(scope: AnalysisDraftScope): string {
  return `${ANALYSIS_DRAFT_STORAGE_PREFIX}v${ANALYSIS_DRAFT_VERSION}:${scope.projectId}:${scope.memberId}`;
}

function normalizeForm(value: unknown): DiagnosisFormState | null {
  if (!isRecord(value)) return null;

  const arrayKeys: (keyof DiagnosisFormState)[] = [
    "assets",
    "realEstateTypes",
    "debtTypes",
    "debts",
    "assetOriginDebtIds",
    "debtCauses",
    "freshStartFundInsolvencyReasons",
    "specialEligibility",
  ];
  if (arrayKeys.some((key) => !Array.isArray(value[key]))) return null;

  if (!isRecord(value.realEstateAmounts) || !isRecord(value.debtAmounts)) return null;

  // 새 필드가 추가된 뒤에도 같은 버전의 초안을 안전하게 열 수 있도록 기본값을 먼저 깐다.
  const normalized = {
    ...createEmptyDiagnosisForm(),
    ...value,
  } as DiagnosisFormState;

  // 배우자 자산 필드 추가 전에는 재산 처분 토글의 기본값이 false였다. 해당 필드가 없는 구형
  // 초안의 false는 사용자가 "없음"을 선택한 값이 아니라 초기값이므로 새 폼의 미선택 상태로
  // 되돌린다. 그렇지 않으면 탭만 이동한 과거 빈 초안이 작성된 초안으로 오인된다.
  if (!("hasSpouseHousingAsset" in value) && value.hasRecentAssetDisposal === false) {
    normalized.hasRecentAssetDisposal = null;
  }

  return normalized;
}

function normalizeDraft(value: unknown, scope?: AnalysisDraftScope): AnalysisDraft | null {
  if (!isRecord(value)) return null;
  if (value.version !== ANALYSIS_DRAFT_VERSION) return null;
  if (typeof value.projectId !== "string" || value.projectId === "") return null;
  if (typeof value.memberId !== "number" || !Number.isFinite(value.memberId)) return null;
  if (typeof value.savedAt !== "number" || !Number.isFinite(value.savedAt)) return null;
  if (Date.now() - value.savedAt > ANALYSIS_DRAFT_EXPIRY_MS) return null;
  if (
    scope &&
    (value.projectId !== scope.projectId || value.memberId !== scope.memberId)
  ) {
    return null;
  }

  const form = normalizeForm(value.form);
  if (!form) return null;

  const selectedCustomerId = value.selectedCustomerId;
  if (
    selectedCustomerId !== null &&
    (typeof selectedCustomerId !== "number" || !Number.isFinite(selectedCustomerId))
  ) {
    return null;
  }

  // 구버전 초안(draftId 필드 추가 전)은 undefined로 읽히므로 null로 취급한다 — 어차피 그
  // 시점엔 서버 draft 대응 개념이 없었으니 다시 생성(POST)되는 게 맞다.
  const draftId = value.draftId ?? null;
  if (
    draftId !== null &&
    (typeof draftId !== "number" || !Number.isFinite(draftId))
  ) {
    return null;
  }

  const step = value.step;
  if (typeof step !== "number" || !Number.isInteger(step) || step < 1 || step > 5) {
    return null;
  }

  // 탭 이동만 기록된 빈 초안은 복원 대상이 아니다. 저장 시뿐 아니라 읽기·정리 시점에도
  // 검사해야 과거 버전에서 남은 빈 초안이 복원 모달을 다시 띄우지 않는다.
  if (!hasMeaningfulAnalysisDraftData(form, selectedCustomerId, draftId)) return null;

  return {
    version: ANALYSIS_DRAFT_VERSION,
    projectId: value.projectId,
    memberId: value.memberId,
    savedAt: value.savedAt,
    form,
    selectedCustomerId,
    draftId,
    step,
  };
}

export function hasMeaningfulAnalysisDraftData(
  form: DiagnosisFormState,
  selectedCustomerId: number | null,
  draftId: number | null = null
): boolean {
  if (selectedCustomerId !== null || draftId !== null) return true;

  // 자산 칩을 추가하면 realEstateStatusConfirmed가 true가 되고, 마지막 칩을 다시 제거해도
  // 그 조작 흔적은 남는다. 실제 입력값이 모두 빈 상태라면 이 내부 검증 플래그 하나만으로
  // 초안을 만들거나 복원 대상으로 취급하지 않는다.
  const comparableForm = { ...form, realEstateStatusConfirmed: false };
  return JSON.stringify(comparableForm) !== JSON.stringify(createEmptyDiagnosisForm());
}

export function readAnalysisDraft(scope: AnalysisDraftScope): AnalysisDraft | null {
  if (!isBrowser()) return null;

  const key = buildAnalysisDraftKey(scope);
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;

    const draft = normalizeDraft(JSON.parse(raw), scope);
    if (draft) return draft;

    window.localStorage.removeItem(key);
    return null;
  } catch (error) {
    console.error("Failed to read analysis draft:", error);
    try {
      window.localStorage.removeItem(key);
    } catch {
      // 저장소 접근 자체가 불가능한 환경에서는 정리도 생략한다.
    }
    return null;
  }
}

export function removeAnalysisDraft(scope: AnalysisDraftScope): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.removeItem(buildAnalysisDraftKey(scope));
  } catch (error) {
    console.error("Failed to remove analysis draft:", error);
  }
}

export function sweepAnalysisDrafts(): void {
  if (!isBrowser()) return;

  try {
    Object.keys(window.localStorage)
      .filter((key) => key.startsWith(ANALYSIS_DRAFT_STORAGE_PREFIX))
      .forEach((key) => {
        const raw = window.localStorage.getItem(key);
        if (!raw) {
          window.localStorage.removeItem(key);
          return;
        }

        try {
          if (!normalizeDraft(JSON.parse(raw))) window.localStorage.removeItem(key);
        } catch {
          window.localStorage.removeItem(key);
        }
      });
  } catch (error) {
    console.error("Failed to sweep analysis drafts:", error);
  }
}

export function writeAnalysisDraft(
  scope: AnalysisDraftScope,
  payload: AnalysisDraftPayload
): void {
  if (!isBrowser()) return;

  const draft: AnalysisDraft = {
    version: ANALYSIS_DRAFT_VERSION,
    projectId: scope.projectId,
    memberId: scope.memberId,
    savedAt: Date.now(),
    ...payload,
  };
  const key = buildAnalysisDraftKey(scope);

  try {
    window.localStorage.setItem(key, JSON.stringify(draft));
  } catch {
    // 오래된 초안 때문에 용량이 부족한 경우를 대비해 정리 후 한 번만 재시도한다.
    sweepAnalysisDrafts();
    try {
      window.localStorage.setItem(key, JSON.stringify(draft));
    } catch (error) {
      console.error("Failed to persist analysis draft:", error);
    }
  }
}

export function clearAllAnalysisDrafts(): void {
  if (!isBrowser()) return;

  try {
    Object.keys(window.localStorage)
      .filter((key) => key.startsWith(ANALYSIS_DRAFT_STORAGE_PREFIX))
      .forEach((key) => window.localStorage.removeItem(key));

    // 다른 탭에 열린 분석 폼도 자동저장을 중단하도록 storage 이벤트를 발생시킨다. 같은 탭의
    // 다른 폼에는 storage 이벤트가 오지 않으므로 별도 커스텀 이벤트도 함께 보낸다.
    window.localStorage.setItem(ANALYSIS_DRAFTS_CLEARED_AT_KEY, String(Date.now()));
    window.dispatchEvent(new Event(ANALYSIS_DRAFTS_CLEARED_EVENT));
  } catch (error) {
    console.error("Failed to clear analysis drafts:", error);
  }
}
