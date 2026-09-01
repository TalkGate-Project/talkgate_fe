"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import { useSelectedProjectId } from "@/hooks/useSelectedProjectId";
import { showConfirmModal } from "@/lib/confirmModalEvents";
import { showErrorModal } from "@/providers/ErrorFeedbackModalProvider";
import { ProjectAllowedIpsService } from "@/services/projectAllowedIps";
import type {
  ProjectAllowedIp,
  ProjectAllowedIpList,
} from "@/types/projectAllowedIps";

const PAGE_SIZE = 5;
const ALLOWED_IP_LIMIT = 20;

type IpInputMode = "current" | "single" | "cidr" | "range";

const IP_INPUT_MODE_LABELS: Record<IpInputMode, string> = {
  current: "현재 접속 IP",
  single: "특정 IP",
  cidr: "CIDR 대역",
  range: "시작~끝 범위",
};

function getErrorCode(error: unknown): string | undefined {
  if (!error || typeof error !== "object" || !("data" in error)) return undefined;
  const data = error.data;
  if (!data || typeof data !== "object" || !("code" in data)) return undefined;
  return typeof data.code === "string" ? data.code : undefined;
}

function showRequestError(error: unknown, fallbackHeadline: string) {
  console.error(fallbackHeadline, error);
  const errorCode = getErrorCode(error);

  if (errorCode === "IP_NOT_ALLOWED") {
    showErrorModal({
      type: "error",
      headline: "현재 네트워크에서는 보안 설정을 변경할 수 없습니다.",
      description: "허용된 네트워크에서 다시 시도해주세요.",
      hideCancel: true,
      confirmText: "확인",
    });
    return;
  }

  if (errorCode === "ALLOWED_IP_LIMIT_EXCEEDED") {
    showErrorModal({
      type: "error",
      headline: "허용 IP를 더 추가할 수 없습니다.",
      description: `허용 IP는 최대 ${ALLOWED_IP_LIMIT}개까지 등록할 수 있습니다.`,
      hideCancel: true,
      confirmText: "확인",
    });
    return;
  }

  if (errorCode === "ALREADY_EXISTS") {
    showErrorModal({
      type: "error",
      headline: "이미 등록된 IP입니다.",
      description: "입력한 IP 또는 대역을 확인해주세요.",
      hideCancel: true,
      confirmText: "확인",
    });
    return;
  }

  if (errorCode === "CANNOT_ENABLE_IP_RESTRICTION") {
    showErrorModal({
      type: "error",
      headline: "IP 제한을 활성화할 수 없습니다.",
      description: "현재 접속 IP가 허용 목록에 포함되어 있는지 확인해주세요.",
      hideCancel: true,
      confirmText: "확인",
    });
    return;
  }

  showErrorModal({
    type: "error",
    headline: fallbackHeadline,
    description: "잠시 후 다시 시도해주세요.",
    hideCancel: true,
    confirmText: "확인",
  });
}

export default function SecuritySettings() {
  const [projectId, projectReady] = useSelectedProjectId();
  const [allowedIpData, setAllowedIpData] = useState<ProjectAllowedIpList | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [inputMode, setInputMode] = useState<IpInputMode>("single");
  const [ipValue, setIpValue] = useState("");
  const [rangeEndValue, setRangeEndValue] = useState("");
  const [memo, setMemo] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingValue, setEditingValue] = useState("");
  const [editingMemo, setEditingMemo] = useState("");
  const [page, setPage] = useState(1);

  const loadAllowedIps = useCallback(async () => {
    if (!projectId) return;

    setIsLoading(true);
    try {
      const response = await ProjectAllowedIpsService.list(projectId);
      setAllowedIpData(response.data.data);
    } catch (error: unknown) {
      showRequestError(error, "허용 IP 목록을 불러오지 못했습니다.");
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    if (!projectReady) return;
    if (!projectId) {
      setIsLoading(false);
      return;
    }
    void loadAllowedIps();
  }, [loadAllowedIps, projectId, projectReady]);

  const allowedIps = useMemo(() => allowedIpData?.list ?? [], [allowedIpData?.list]);
  const totalPages = Math.max(1, Math.ceil(allowedIps.length / PAGE_SIZE));
  const visibleAllowedIps = useMemo(
    () => allowedIps.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [allowedIps, page]
  );

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const composedIpValue = useMemo(() => {
    if (inputMode === "current") return allowedIpData?.currentIp ?? "";
    if (inputMode === "range") {
      if (!ipValue.trim() || !rangeEndValue.trim()) return "";
      return `${ipValue.trim()}-${rangeEndValue.trim()}`;
    }
    return ipValue.trim();
  }, [allowedIpData?.currentIp, inputMode, ipValue, rangeEndValue]);

  const resetCreateForm = () => {
    setIpValue("");
    setRangeEndValue("");
    setMemo("");
  };

  const handleCreate = async () => {
    if (!projectId || !composedIpValue || isSaving) return;

    setIsSaving(true);
    try {
      const response = await ProjectAllowedIpsService.create(projectId, {
        value: composedIpValue,
        memo: memo.trim(),
      });
      setAllowedIpData((previous) => previous ? {
        ...previous,
        list: [...previous.list, response.data.data],
      } : previous);
      resetCreateForm();
      showErrorModal({
        type: "success",
        headline: "허용 IP가 추가되었습니다.",
        hideCancel: true,
        confirmText: "확인",
      });
    } catch (error: unknown) {
      showRequestError(error, "허용 IP를 추가하지 못했습니다.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleEnabled = async () => {
    if (!projectId || !allowedIpData || isSaving) return;

    setIsSaving(true);
    try {
      const response = await ProjectAllowedIpsService.updateEnabled(projectId, {
        enabled: !allowedIpData.isEnabled,
      });
      setAllowedIpData(response.data.data);
      showErrorModal({
        type: "success",
        headline: `IP 제한이 ${response.data.data.isEnabled ? "활성화" : "비활성화"}되었습니다.`,
        hideCancel: true,
        confirmText: "확인",
      });
    } catch (error: unknown) {
      showRequestError(error, "IP 제한 설정을 변경하지 못했습니다.");
    } finally {
      setIsSaving(false);
    }
  };

  const startEditing = (allowedIp: ProjectAllowedIp) => {
    setEditingId(allowedIp.id);
    setEditingValue(allowedIp.value);
    setEditingMemo(allowedIp.memo);
  };

  const handleUpdate = async () => {
    if (!projectId || editingId == null || !editingValue.trim() || isSaving) return;

    setIsSaving(true);
    try {
      const response = await ProjectAllowedIpsService.update(projectId, editingId, {
        value: editingValue.trim(),
        memo: editingMemo.trim(),
      });
      setAllowedIpData((previous) => previous ? {
        ...previous,
        list: previous.list.map((item) => item.id === editingId ? response.data.data : item),
      } : previous);
      setEditingId(null);
      showErrorModal({
        type: "success",
        headline: "허용 IP가 수정되었습니다.",
        hideCancel: true,
        confirmText: "확인",
      });
    } catch (error: unknown) {
      showRequestError(error, "허용 IP를 수정하지 못했습니다.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = (allowedIp: ProjectAllowedIp) => {
    if (!projectId || isSaving) return;

    showConfirmModal({
      type: "warning",
      headline: "허용 IP를 삭제하시겠습니까?",
      message: `${allowedIp.value}${allowedIp.memo ? ` · ${allowedIp.memo}` : ""}`,
      confirmText: "삭제",
      cancelText: "취소",
      onConfirm: async () => {
        setIsSaving(true);
        try {
          await ProjectAllowedIpsService.remove(projectId, allowedIp.id);
          setAllowedIpData((previous) => previous ? {
            ...previous,
            list: previous.list.filter((item) => item.id !== allowedIp.id),
          } : previous);
          showErrorModal({
            type: "success",
            headline: "허용 IP가 삭제되었습니다.",
            hideCancel: true,
            confirmText: "확인",
          });
        } catch (error: unknown) {
          showRequestError(error, "허용 IP를 삭제하지 못했습니다.");
        } finally {
          setIsSaving(false);
        }
      },
    });
  };

  if (!projectReady || isLoading) {
    return (
      <div className="min-h-[320px] flex items-center justify-center">
        <LoadingSpinner size="lg" variant="primary" aria-label="보안 설정 로딩 중" />
      </div>
    );
  }

  if (!projectId) {
    return (
      <div className="md:bg-card md:rounded-[14px] md:shadow-sm p-6 md:p-7 text-center text-muted-foreground">
        프로젝트를 선택한 뒤 다시 시도해주세요.
      </div>
    );
  }

  return (
    <div className="md:bg-card md:rounded-[14px] md:shadow-sm p-5 md:p-7 space-y-7">
      <div>
        <h2 className="text-[20px] font-bold text-foreground">보안</h2>
        <p className="mt-1 text-[14px] text-muted-foreground">
          프로젝트에 접속할 수 있는 네트워크를 관리합니다.
        </p>
      </div>

      <section className="rounded-[10px] border border-border p-4 md:p-6 space-y-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-[17px] font-bold text-foreground">접속 허용 IP</h3>
              <span className="text-[13px] font-semibold text-primary-80">
                {allowedIps.length}/{ALLOWED_IP_LIMIT}
              </span>
            </div>
            <p className="mt-1 text-[13px] text-muted-foreground">
              IP 제한을 사용하면 등록된 IP 또는 대역에서만 프로젝트에 접속할 수 있습니다.
            </p>
            {allowedIpData?.currentIp && (
              <p className="mt-2 text-[13px] text-muted-foreground">
                현재 접속 IP <code className="ml-1 font-semibold text-foreground">{allowedIpData.currentIp}</code>
              </p>
            )}
          </div>

          <button
            type="button"
            role="switch"
            aria-checked={allowedIpData?.isEnabled ?? false}
            aria-label="IP 제한 사용"
            disabled={!allowedIpData || isSaving}
            onClick={handleToggleEnabled}
            className="cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 flex items-center gap-2 self-start"
          >
            <span className="text-[14px] font-semibold text-foreground">
              {allowedIpData?.isEnabled ? "사용" : "미사용"}
            </span>
            <span className={`relative h-6 w-11 rounded-full transition-colors ${allowedIpData?.isEnabled ? "bg-primary-60" : "bg-neutral-40"}`}>
              <span className={`absolute top-1 h-4 w-4 rounded-full bg-neutral-0 shadow-sm transition-transform ${allowedIpData?.isEnabled ? "translate-x-6" : "translate-x-1"}`} />
            </span>
          </button>
        </div>

        <div className="rounded-[8px] bg-neutral-10 p-4">
          <div className="grid gap-3 lg:grid-cols-[160px_minmax(0,1fr)_minmax(180px,0.7fr)_72px]">
            <label className="sr-only" htmlFor="ip-input-mode">IP 입력 형식</label>
            <select
              id="ip-input-mode"
              value={inputMode}
              onChange={(event) => {
                setInputMode(event.target.value as IpInputMode);
                setIpValue("");
                setRangeEndValue("");
              }}
              className="h-11 rounded-[6px] border border-border bg-card px-3 text-[14px] text-foreground outline-none focus:border-primary-60"
            >
              {Object.entries(IP_INPUT_MODE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>

            {inputMode === "range" ? (
              <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                <input
                  value={ipValue}
                  onChange={(event) => setIpValue(event.target.value)}
                  placeholder="192.168.0.1"
                  aria-label="시작 IP"
                  className="h-11 min-w-0 rounded-[6px] border border-border bg-card px-3 text-[14px] text-foreground outline-none focus:border-primary-60"
                />
                <span className="text-muted-foreground">~</span>
                <input
                  value={rangeEndValue}
                  onChange={(event) => setRangeEndValue(event.target.value)}
                  placeholder="192.168.0.50"
                  aria-label="끝 IP"
                  className="h-11 min-w-0 rounded-[6px] border border-border bg-card px-3 text-[14px] text-foreground outline-none focus:border-primary-60"
                />
              </div>
            ) : (
              <input
                value={inputMode === "current" ? allowedIpData?.currentIp ?? "" : ipValue}
                onChange={(event) => setIpValue(event.target.value)}
                readOnly={inputMode === "current"}
                placeholder={inputMode === "cidr" ? "192.168.0.0/24" : "192.168.0.10"}
                aria-label="허용 IP"
                className="h-11 min-w-0 rounded-[6px] border border-border bg-card px-3 text-[14px] text-foreground outline-none read-only:bg-neutral-20 focus:border-primary-60"
              />
            )}

            <input
              value={memo}
              onChange={(event) => setMemo(event.target.value)}
              placeholder="메모 (선택)"
              aria-label="메모"
              className="h-11 min-w-0 rounded-[6px] border border-border bg-card px-3 text-[14px] text-foreground outline-none focus:border-primary-60"
            />
            <button
              type="button"
              onClick={handleCreate}
              disabled={!composedIpValue || isSaving || allowedIps.length >= ALLOWED_IP_LIMIT}
              className="cursor-pointer h-11 rounded-[6px] bg-primary-60 px-4 text-[14px] font-bold text-white hover:bg-primary-80 disabled:cursor-not-allowed disabled:opacity-50"
            >
              추가
            </button>
          </div>
        </div>

        <div className="divide-y divide-neutral-30/40 rounded-[8px] border border-border">
          {visibleAllowedIps.length === 0 ? (
            <div className="px-4 py-10 text-center text-[14px] text-muted-foreground">
              등록된 허용 IP가 없습니다.
            </div>
          ) : visibleAllowedIps.map((allowedIp) => (
            <div key={allowedIp.id} className="p-4">
              {editingId === allowedIp.id ? (
                <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(160px,0.7fr)_auto]">
                  <input
                    value={editingValue}
                    onChange={(event) => setEditingValue(event.target.value)}
                    aria-label="수정할 허용 IP"
                    className="h-10 min-w-0 rounded-[6px] border border-border bg-card px-3 text-[14px] text-foreground outline-none focus:border-primary-60"
                  />
                  <input
                    value={editingMemo}
                    onChange={(event) => setEditingMemo(event.target.value)}
                    aria-label="수정할 메모"
                    className="h-10 min-w-0 rounded-[6px] border border-border bg-card px-3 text-[14px] text-foreground outline-none focus:border-primary-60"
                  />
                  <div className="flex gap-2">
                    <button type="button" onClick={handleUpdate} disabled={!editingValue.trim() || isSaving} className="cursor-pointer h-10 rounded-[6px] bg-primary-60 px-3 text-[13px] font-bold text-white disabled:cursor-not-allowed disabled:opacity-50">저장</button>
                    <button type="button" onClick={() => setEditingId(null)} disabled={isSaving} className="cursor-pointer h-10 rounded-[6px] border border-border px-3 text-[13px] font-semibold text-foreground disabled:cursor-not-allowed disabled:opacity-50">취소</button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <code className="block truncate text-[14px] font-semibold text-foreground">{allowedIp.value}</code>
                    <p className="mt-1 truncate text-[13px] text-muted-foreground">{allowedIp.memo || "메모 없음"}</p>
                  </div>
                  <div className="flex flex-shrink-0 gap-2">
                    <button type="button" onClick={() => startEditing(allowedIp)} disabled={isSaving} className="cursor-pointer rounded-[5px] border border-border px-3 py-2 text-[13px] font-semibold text-foreground hover:bg-neutral-10 disabled:cursor-not-allowed disabled:opacity-50">수정</button>
                    <button type="button" onClick={() => handleDelete(allowedIp)} disabled={isSaving} className="cursor-pointer rounded-[5px] border border-danger-20 px-3 py-2 text-[13px] font-semibold text-danger-60 hover:bg-danger-10 disabled:cursor-not-allowed disabled:opacity-50">삭제</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {totalPages > 1 && (
          <nav aria-label="허용 IP 페이지" className="flex items-center justify-center gap-2">
            <button type="button" onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={page === 1} className="cursor-pointer h-9 rounded-[5px] border border-border px-3 text-[13px] font-semibold text-foreground disabled:cursor-not-allowed disabled:opacity-40">이전</button>
            <span className="text-[13px] text-muted-foreground">{page} / {totalPages}</span>
            <button type="button" onClick={() => setPage((value) => Math.min(totalPages, value + 1))} disabled={page === totalPages} className="cursor-pointer h-9 rounded-[5px] border border-border px-3 text-[13px] font-semibold text-foreground disabled:cursor-not-allowed disabled:opacity-40">다음</button>
          </nav>
        )}
      </section>
    </div>
  );
}
