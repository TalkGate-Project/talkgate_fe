"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { DiagnosisFormState } from "@/types/debtRelief";
import {
  hasMeaningfulAnalysisDraftData,
  readAnalysisDraft,
  removeAnalysisDraft,
  sweepAnalysisDrafts,
  writeAnalysisDraft,
  type AnalysisDraft,
  type AnalysisDraftPayload,
  type AnalysisDraftScope,
} from "@/lib/analysisDraft";

type AnalysisDraftState =
  | { status: "waiting" }
  | { status: "checking" }
  | { status: "empty" }
  | { status: "prompting"; draft: AnalysisDraft }
  | { status: "active"; restored: boolean }
  | { status: "disabled" };

type UseAnalysisDraftOptions = {
  enabled: boolean;
  identityReady: boolean;
  projectId: string | null;
  memberId: number | null;
  form: DiagnosisFormState;
  selectedCustomerId: number | null;
  step: number;
  /** 이미 서버에 임시저장해 생성된 분석 건의 id(없으면 null). 로컬 초안에 같이 담아둬야 새로고침
   * 후 복원할 때 다음 임시저장이 PATCH로 이어지고, POST가 다시 불려 서버에 고아 drafting 건이
   * 하나 더 생기는 걸 막는다. */
  draftId: number | null;
  /** false면(관리자·부관리자가 고객 미연동 상태) 로컬 자동저장도 쓰지 않는다 — 서버 임시저장과
   * 같은 "고객 연동 필수" 제약을 로컬 스토리지 레벨에서도 지킨다. 이미 저장된 draft가 있으면
   * 지운다(연동 없이 작성한 내용이 브라우저에 남아있지 않도록). 기본값 true(항상 저장). */
  canPersistDraft?: boolean;
};

const SAVE_DEBOUNCE_MS = 500;

export function useAnalysisDraft({
  enabled,
  identityReady,
  projectId,
  memberId,
  form,
  selectedCustomerId,
  step,
  draftId,
  canPersistDraft = true,
}: UseAnalysisDraftOptions) {
  const [state, setState] = useState<AnalysisDraftState>(() =>
    enabled ? { status: "waiting" } : { status: "disabled" }
  );
  const checkedScopeKeyRef = useRef<string | null>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const finalizedRef = useRef(false);

  const scope = useMemo<AnalysisDraftScope | null>(() => {
    if (!projectId || memberId === null) return null;
    return { projectId, memberId };
  }, [projectId, memberId]);

  const latestPayloadRef = useRef<AnalysisDraftPayload>({
    form,
    selectedCustomerId,
    step,
    draftId,
  });
  const scopeRef = useRef<AnalysisDraftScope | null>(scope);
  const statusRef = useRef<AnalysisDraftState["status"]>(state.status);
  const canPersistDraftRef = useRef(canPersistDraft);

  latestPayloadRef.current = { form, selectedCustomerId, step, draftId };
  scopeRef.current = scope;
  statusRef.current = state.status;
  canPersistDraftRef.current = canPersistDraft;

  useEffect(() => {
    if (!enabled) {
      checkedScopeKeyRef.current = null;
      setState({ status: "disabled" });
      return;
    }
    if (!identityReady) {
      setState({ status: "waiting" });
      return;
    }
    if (!scope) {
      setState({ status: "disabled" });
      return;
    }

    const scopeKey = `${scope.projectId}:${scope.memberId}`;
    if (checkedScopeKeyRef.current === scopeKey) return;

    checkedScopeKeyRef.current = scopeKey;
    finalizedRef.current = false;
    setState({ status: "checking" });
    sweepAnalysisDrafts();
    const draft = readAnalysisDraft(scope);
    setState(draft ? { status: "prompting", draft } : { status: "empty" });
  }, [enabled, identityReady, scope]);

  // 디바운스 타이머(아래)가 저장 금지 상태에서는 애초에 걸리지 않아 이 함수가 그 경로로는
  // 호출되지 않는다. 그래도 pagehide/언마운트 시(아래 별도 useEffect)는 디바운스 없이 이
  // 함수를 직접 부르므로, canPersistDraftRef 체크는 그 즉시-flush 경로를 위한 마지막 방어선으로 남긴다.
  const flushLatestDraft = useCallback(() => {
    if (statusRef.current !== "active" || finalizedRef.current) return;

    const currentScope = scopeRef.current;
    if (!currentScope) return;

    const payload = latestPayloadRef.current;
    if (
      !canPersistDraftRef.current ||
      !hasMeaningfulAnalysisDraftData(payload.form, payload.selectedCustomerId, payload.draftId)
    ) {
      removeAnalysisDraft(currentScope);
      return;
    }

    writeAnalysisDraft(currentScope, payload);
  }, []);

  // 저장이 막힌 상태(관리자·부관리자 + 고객 미연동)로 바뀌는 순간 한 번만 기존 드래프트를
  // 정리한다. form을 의존성에 넣지 않아 타이핑마다 재실행되지 않는다 — 탭을 오래 켜두는
  // 제품 특성상 매 입력마다 불필요한 정리 호출이 쌓이는 걸 피하기 위함.
  useEffect(() => {
    if (canPersistDraft || state.status !== "active" || finalizedRef.current || !scope) return;
    removeAnalysisDraft(scope);
  }, [canPersistDraft, state.status, scope]);

  useEffect(() => {
    // 저장이 막힌 상태면 디바운스 타이머 자체를 걸지 않는다 — setTimeout을 만들었다 지웠다
    // 반복하는 대신 스케줄링 단계에서 아예 끊어서, 오래 열어두는 탭에서 불필요한 타이머 처리가
    // 계속 쌓이지 않게 한다. 막혀있는 동안 남는 드래프트 정리는 위 이펙트가 한 번만 처리한다.
    if (!canPersistDraft || state.status !== "active" || finalizedRef.current || !scope) return;

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      saveTimerRef.current = null;
      flushLatestDraft();
    }, SAVE_DEBOUNCE_MS);

    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
        saveTimerRef.current = null;
      }
    };
  }, [form, selectedCustomerId, step, draftId, state.status, scope, flushLatestDraft, canPersistDraft]);

  useEffect(() => {
    const handlePageHide = () => flushLatestDraft();
    window.addEventListener("pagehide", handlePageHide);
    return () => {
      window.removeEventListener("pagehide", handlePageHide);
      flushLatestDraft();
    };
  }, [flushLatestDraft]);

  const activateWithoutDraft = useCallback(() => {
    finalizedRef.current = false;
    setState({ status: "active", restored: false });
  }, []);

  const restoreDraft = useCallback((): AnalysisDraft | null => {
    if (state.status !== "prompting") return null;
    finalizedRef.current = false;
    setState({ status: "active", restored: true });
    return state.draft;
  }, [state]);

  const startFresh = useCallback(() => {
    const currentScope = scopeRef.current;
    if (currentScope) removeAnalysisDraft(currentScope);
    finalizedRef.current = false;
    setState({ status: "active", restored: false });
  }, []);

  const finalizeDraft = useCallback(() => {
    finalizedRef.current = true;
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
    const currentScope = scopeRef.current;
    if (currentScope) removeAnalysisDraft(currentScope);
  }, []);

  return {
    state,
    activateWithoutDraft,
    restoreDraft,
    startFresh,
    finalizeDraft,
  };
}
