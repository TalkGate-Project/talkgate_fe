"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import { useSelectedProjectId } from "@/hooks/useSelectedProjectId";
import { showConfirmModal } from "@/lib/confirmModalEvents";
import { showErrorModal } from "@/providers/ErrorFeedbackModalProvider";
import { ProjectAllowedIpsService } from "@/services/projectAllowedIps";
import type { ProjectAllowedIp, ProjectAllowedIpList } from "@/types/projectAllowedIps";

const PAGE_SIZE = 5;
const ALLOWED_IP_LIMIT = 20;
type IpInputMode = "current" | "single" | "cidr" | "range";

const IP_INPUT_MODE_LABELS: Record<IpInputMode, string> = {
  current: "내 IP",
  single: "특정 IP",
  cidr: "CIDR 대역",
  range: "시작~끝 범위",
};

const inputClassName = "h-[34px] rounded-[5px] border border-neutral-30 bg-card px-3 text-[14px] font-medium text-foreground outline-none placeholder:text-neutral-60 focus:border-primary-60";

function getErrorCode(error: unknown): string | undefined {
  if (!error || typeof error !== "object" || !("data" in error)) return undefined;
  const data = error.data;
  if (!data || typeof data !== "object" || !("code" in data)) return undefined;
  return typeof data.code === "string" ? data.code : undefined;
}

function showRequestError(error: unknown, fallbackHeadline: string) {
  console.error(fallbackHeadline, error);
  const errorCode = getErrorCode(error);
  const commonOptions = { type: "error" as const, hideCancel: true, confirmText: "확인" };

  if (errorCode === "IP_NOT_ALLOWED") {
    showErrorModal({ ...commonOptions, headline: "현재 네트워크에서는 보안 설정을 변경할 수 없습니다.", description: "허용된 네트워크에서 다시 시도해주세요." });
    return;
  }
  if (errorCode === "ALLOWED_IP_LIMIT_EXCEEDED") {
    showErrorModal({ ...commonOptions, headline: "허용 IP를 더 추가할 수 없습니다.", description: `허용 IP는 최대 ${ALLOWED_IP_LIMIT}개까지 등록할 수 있습니다.` });
    return;
  }
  if (errorCode === "ALREADY_EXISTS") {
    showErrorModal({ ...commonOptions, headline: "이미 등록된 IP입니다.", description: "입력한 IP 또는 대역을 확인해주세요." });
    return;
  }
  if (errorCode === "CANNOT_ENABLE_IP_RESTRICTION") {
    showErrorModal({ ...commonOptions, headline: "IP 제한을 활성화할 수 없습니다.", description: "현재 접속 IP가 허용 목록에 포함되어 있는지 확인해주세요." });
    return;
  }
  showErrorModal({ ...commonOptions, headline: fallbackHeadline, description: "잠시 후 다시 시도해주세요." });
}

function splitIpv4(value: string): string[] {
  const octets = value.split(".").slice(0, 4);
  return Array.from({ length: 4 }, (_, index) => octets[index] ?? "");
}

function updateIpv4Octet(value: string, index: number, nextValue: string): string {
  const octets = splitIpv4(value);
  const digits = nextValue.replace(/\D/g, "").slice(0, 3);
  octets[index] = digits === "" ? "" : String(Math.min(Number(digits), 255));
  return octets.join(".");
}

function isValidIpv4(value: string): boolean {
  const octets = value.split(".");
  return octets.length === 4 && octets.every((octet) => {
    if (!/^\d{1,3}$/.test(octet)) return false;
    const numericOctet = Number(octet);
    return numericOctet >= 0 && numericOctet <= 255;
  });
}

interface Ipv4InputProps {
  ariaLabel: string;
  value: string;
  onChange: (value: string) => void;
}

function Ipv4Input({ ariaLabel, value, onChange }: Ipv4InputProps) {
  const octets = splitIpv4(value);
  return (
    <div role="group" aria-label={ariaLabel} className="flex h-[34px] w-[136px] flex-shrink-0 items-center rounded-[5px] border border-neutral-30 bg-card px-2 focus-within:border-primary-60">
      {octets.map((octet, index) => (
        <div key={index} className="flex min-w-0 flex-1 items-center">
          <input
            type="text"
            inputMode="numeric"
            maxLength={3}
            value={octet}
            onChange={(event) => onChange(updateIpv4Octet(value, index, event.target.value))}
            aria-label={`${ariaLabel} ${index + 1}번째 자리`}
            className="min-w-0 flex-1 bg-transparent text-center text-[14px] font-medium text-foreground outline-none"
          />
          {index < 3 && <span className="text-[14px] text-neutral-60">.</span>}
        </div>
      ))}
    </div>
  );
}

function SelectArrow() {
  return (
    <svg aria-hidden="true" viewBox="0 0 10 8" className="pointer-events-none absolute right-3 top-1/2 h-2 w-[10px] -translate-y-1/2 fill-foreground">
      <path d="M5 8 0 0h10L5 8Z" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M4 7h16M9 7V4h6v3m3 0-1 13H7L6 7m4 4v5m4-5v5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function SecuritySettings() {
  const [projectId, projectReady] = useSelectedProjectId();
  const [allowedIpData, setAllowedIpData] = useState<ProjectAllowedIpList | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [inputMode, setInputMode] = useState<IpInputMode>("current");
  const [ipValue, setIpValue] = useState("");
  const [rangeEndValue, setRangeEndValue] = useState("");
  const [cidrPrefix, setCidrPrefix] = useState("");
  const [memo, setMemo] = useState("");
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
  const visibleAllowedIps = useMemo(() => allowedIps.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), [allowedIps, page]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const composedIpValue = useMemo(() => {
    if (inputMode === "current") return allowedIpData?.currentIp ?? "";
    if (inputMode === "single") return isValidIpv4(ipValue) ? ipValue : "";
    if (inputMode === "cidr") {
      const prefix = Number(cidrPrefix);
      if (!isValidIpv4(ipValue) || cidrPrefix === "" || prefix < 0 || prefix > 32) return "";
      return `${ipValue}/${prefix}`;
    }
    if (!isValidIpv4(ipValue) || !isValidIpv4(rangeEndValue)) return "";
    return `${ipValue}-${rangeEndValue}`;
  }, [allowedIpData?.currentIp, cidrPrefix, inputMode, ipValue, rangeEndValue]);

  const resetCreateForm = () => {
    setIpValue("");
    setRangeEndValue("");
    setCidrPrefix("");
    setMemo("");
  };

  const handleInputModeChange = (nextMode: IpInputMode) => {
    setInputMode(nextMode);
    resetCreateForm();
  };

  const handleCreate = async () => {
    if (!projectId || !composedIpValue || isSaving) return;
    setIsSaving(true);
    try {
      const response = await ProjectAllowedIpsService.create(projectId, { value: composedIpValue, memo: memo.trim() });
      setAllowedIpData((previous) => previous ? { ...previous, list: [...previous.list, response.data.data] } : previous);
      resetCreateForm();
      showErrorModal({ type: "success", headline: "허용 IP가 추가되었습니다.", hideCancel: true, confirmText: "확인" });
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
      const response = await ProjectAllowedIpsService.updateEnabled(projectId, { enabled: !allowedIpData.isEnabled });
      setAllowedIpData(response.data.data);
      showErrorModal({ type: "success", headline: `IP 제한이 ${response.data.data.isEnabled ? "활성화" : "비활성화"}되었습니다.`, hideCancel: true, confirmText: "확인" });
    } catch (error: unknown) {
      showRequestError(error, "IP 제한 설정을 변경하지 못했습니다.");
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
          setAllowedIpData((previous) => previous ? { ...previous, list: previous.list.filter((item) => item.id !== allowedIp.id) } : previous);
          showErrorModal({ type: "success", headline: "허용 IP가 삭제되었습니다.", hideCancel: true, confirmText: "확인" });
        } catch (error: unknown) {
          showRequestError(error, "허용 IP를 삭제하지 못했습니다.");
        } finally {
          setIsSaving(false);
        }
      },
    });
  };

  if (!projectReady || isLoading) {
    return <div className="flex min-h-[320px] items-center justify-center"><LoadingSpinner size="lg" variant="primary" aria-label="보안 설정 로딩 중" /></div>;
  }

  if (!projectId) {
    return <div className="p-6 text-center text-muted-foreground md:rounded-[14px] md:bg-card md:p-7 md:shadow-sm">프로젝트를 선택한 뒤 다시 시도해주세요.</div>;
  }

  const isEnabled = allowedIpData?.isEnabled ?? false;
  return (
    <div className="min-h-[620px] bg-card md:min-h-[828px] md:rounded-[14px] md:shadow-sm">
      <header className="flex h-[68px] items-center px-5 md:h-[76px] md:px-7">
        <h1 className="text-[20px] font-bold leading-none text-foreground md:text-[24px]">보안</h1>
      </header>
      <div className="h-px bg-neutral-30/50" />

      <div className="px-5 pb-8 pt-[30px] md:px-7">
        <section>
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <h2 className="text-[16px] font-semibold leading-[19px] tracking-[0.2px] text-foreground">접속 허용 IP</h2>
              <p className="mt-2 text-[13px] font-medium leading-[17px] tracking-[0.2px] text-muted-foreground md:text-[14px]">관리자와 부관리자를 제외한 멤버는 등록된 IP에서만 접속이 가능합니다.</p>
            </div>
            <div className="flex flex-shrink-0 items-center gap-5 md:gap-6">
              <span className="text-[14px] font-medium text-foreground">{allowedIps.length}<span className="text-neutral-50">/{ALLOWED_IP_LIMIT}</span></span>
              <button
                type="button"
                role="switch"
                aria-checked={isEnabled}
                aria-label="IP 제한 사용"
                disabled={!allowedIpData || isSaving}
                onClick={handleToggleEnabled}
                className={`relative h-6 w-10 flex-shrink-0 cursor-pointer rounded-full p-1 transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${isEnabled ? "bg-primary-60" : "bg-neutral-40"}`}
              >
                <span className={`block h-4 w-4 rounded-full bg-white transition-transform ${isEnabled ? "translate-x-4" : "translate-x-0"}`} />
              </button>
            </div>
          </div>

          <div className="mt-3 h-px bg-neutral-30" />
          <div className="mt-4">
            <p className="mb-3 text-[14px] font-medium leading-[17px] tracking-[0.2px] text-muted-foreground">IP 관리</p>
            <div className="flex min-h-[50px] flex-wrap items-center gap-3 rounded-[5px] bg-neutral-10 px-3 py-2 md:flex-nowrap md:gap-4 md:px-6">
              <div className="relative h-[34px] w-[136px] flex-shrink-0">
                <label className="sr-only" htmlFor="ip-input-mode">IP 입력 형식</label>
                <select id="ip-input-mode" value={inputMode} onChange={(event) => handleInputModeChange(event.target.value as IpInputMode)} className={`${inputClassName} w-full cursor-pointer appearance-none pr-8`}>
                  {Object.entries(IP_INPUT_MODE_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
                <SelectArrow />
              </div>

              {inputMode === "current" && <input value={allowedIpData?.currentIp ?? ""} readOnly aria-label="현재 접속 IP" className={`${inputClassName} w-[136px] flex-shrink-0 bg-neutral-20 text-center text-muted-foreground`} />}
              {inputMode === "single" && <Ipv4Input ariaLabel="특정 IP" value={ipValue} onChange={setIpValue} />}
              {inputMode === "cidr" && (
                <div className="flex flex-shrink-0 items-center gap-3">
                  <Ipv4Input ariaLabel="CIDR IP" value={ipValue} onChange={setIpValue} />
                  <span className="text-[14px] font-medium text-muted-foreground">/</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={2}
                    value={cidrPrefix}
                    onChange={(event) => {
                      const nextValue = event.target.value.replace(/\D/g, "").slice(0, 2);
                      setCidrPrefix(nextValue === "" ? "" : String(Math.min(Number(nextValue), 32)));
                    }}
                    aria-label="CIDR prefix"
                    className={`${inputClassName} w-[41px] px-2 text-center`}
                  />
                </div>
              )}
              {inputMode === "range" && (
                <div className="flex flex-shrink-0 items-center gap-3">
                  <span className="text-[14px] font-medium text-muted-foreground">시작</span>
                  <Ipv4Input ariaLabel="시작 IP" value={ipValue} onChange={setIpValue} />
                  <span className="text-[14px] font-medium text-muted-foreground">~</span>
                  <span className="text-[14px] font-medium text-muted-foreground">끝</span>
                  <Ipv4Input ariaLabel="끝 IP" value={rangeEndValue} onChange={setRangeEndValue} />
                </div>
              )}

              <input value={memo} onChange={(event) => setMemo(event.target.value)} placeholder="메모" aria-label="메모" className={`${inputClassName} min-w-[160px] flex-1`} />
              <button type="button" onClick={handleCreate} disabled={!composedIpValue || isSaving || allowedIps.length >= ALLOWED_IP_LIMIT} className="h-[34px] w-12 flex-shrink-0 cursor-pointer rounded-[5px] bg-neutral-90 text-[14px] font-semibold text-neutral-20 hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-50">추가</button>
            </div>
          </div>

          <div className="mt-3 divide-y divide-neutral-30">
            {visibleAllowedIps.length === 0 ? (
              <div className="py-10 text-center text-[14px] text-muted-foreground">등록된 허용 IP가 없습니다.</div>
            ) : visibleAllowedIps.map((allowedIp) => (
              <div key={allowedIp.id} className="flex min-h-[49px] items-center px-6">
                <p className="w-[250px] min-w-0 flex-shrink-0 truncate text-[14px] font-semibold text-foreground/80">{allowedIp.value}</p>
                <p className="min-w-0 flex-1 truncate text-[14px] font-semibold text-muted-foreground/80">{allowedIp.memo}</p>
                <button type="button" onClick={() => handleDelete(allowedIp)} disabled={isSaving} aria-label={`${allowedIp.value} 삭제`} className="ml-4 flex h-8 w-8 flex-shrink-0 cursor-pointer items-center justify-center text-neutral-50 hover:text-danger-60 disabled:cursor-not-allowed disabled:opacity-50"><TrashIcon /></button>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <nav aria-label="허용 IP 페이지" className="mt-5 flex items-center justify-center gap-3">
              <button type="button" onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={page === 1} className="cursor-pointer text-[13px] font-semibold text-foreground disabled:cursor-not-allowed disabled:opacity-40">이전</button>
              <span className="text-[13px] text-muted-foreground">{page} / {totalPages}</span>
              <button type="button" onClick={() => setPage((value) => Math.min(totalPages, value + 1))} disabled={page === totalPages} className="cursor-pointer text-[13px] font-semibold text-foreground disabled:cursor-not-allowed disabled:opacity-40">다음</button>
            </nav>
          )}
        </section>
      </div>
    </div>
  );
}
