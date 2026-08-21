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
  });
  const scopeRef = useRef<AnalysisDraftScope | null>(scope);
  const statusRef = useRef<AnalysisDraftState["status"]>(state.status);

  latestPayloadRef.current = { form, selectedCustomerId, step };
  scopeRef.current = scope;
  statusRef.current = state.status;

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

  const flushLatestDraft = useCallback(() => {
    if (statusRef.current !== "active" || finalizedRef.current) return;

    const currentScope = scopeRef.current;
    if (!currentScope) return;

    const payload = latestPayloadRef.current;
    if (!hasMeaningfulAnalysisDraftData(payload.form, payload.selectedCustomerId)) {
      removeAnalysisDraft(currentScope);
      return;
    }

    writeAnalysisDraft(currentScope, payload);
  }, []);

  useEffect(() => {
    if (state.status !== "active" || finalizedRef.current || !scope) return;

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
  }, [form, selectedCustomerId, step, state.status, scope, flushLatestDraft]);

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
