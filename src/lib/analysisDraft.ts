import {
  createEmptyDiagnosisForm,
  type DiagnosisFormState,
} from "@/types/debtRelief";

const ANALYSIS_DRAFT_STORAGE_PREFIX = "tg_analysis_new_draft:";
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

  const step = value.step;
  if (typeof step !== "number" || !Number.isInteger(step) || step < 1 || step > 5) {
    return null;
  }

  // 탭 이동만 기록된 빈 초안은 복원 대상이 아니다. 저장 시뿐 아니라 읽기·정리 시점에도
  // 검사해야 과거 버전에서 남은 빈 초안이 복원 모달을 다시 띄우지 않는다.
  if (!hasMeaningfulAnalysisDraftData(form, selectedCustomerId)) return null;

  return {
    version: ANALYSIS_DRAFT_VERSION,
    projectId: value.projectId,
    memberId: value.memberId,
    savedAt: value.savedAt,
    form,
    selectedCustomerId,
    step,
  };
}

export function hasMeaningfulAnalysisDraftData(
  form: DiagnosisFormState,
  selectedCustomerId: number | null
): boolean {
  if (selectedCustomerId !== null) return true;
  return JSON.stringify(form) !== JSON.stringify(createEmptyDiagnosisForm());
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
  } catch (error) {
    console.error("Failed to clear analysis drafts:", error);
  }
}
