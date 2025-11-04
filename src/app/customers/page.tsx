"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import Panel from "@/components/common/Panel";
import { useCustomersList } from "@/hooks/useCustomersList";
import { CustomersListQuery, CustomerListItem, RecentNote } from "@/types/customers";
import { CustomersBulkService } from "@/services/customersBulk";
import { AssetsService } from "@/services/assets";
import FilterModal from "@/components/common/FilterModal";
import AssignCustomersModal from "@/components/customers/AssignCustomersModal";
import CustomerDetailModal from "@/components/customers/CustomerDetailModal";
import { CustomersService } from "@/services/customers";
import Checkbox from "@/components/common/Checkbox";
import { getSelectedProjectId } from "@/lib/project";
import { useRouter, useSearchParams } from "next/navigation";

function CustomersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [projectId, setProjectId] = useState<string | null>(null);

  useEffect(() => {
    document.title = "TalkGate - 고객목록";
  }, []);

  useEffect(() => {
    const id = getSelectedProjectId();
    if (!id) {
      router.replace("/projects");
      return;
    }
    setProjectId(id);
  }, [router]);

  const [filters, setFilters] = useState<{ name?: string; contact1?: string; teamId?: number; memberId?: number; applicationRoute?: string; mediaCompany?: string; site?: string; categoryIds?: number[]; noteContent?: string; applicationDateFrom?: string; applicationDateTo?: string; assignedAtFrom?: string; assignedAtTo?: string }>({});
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(10);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isFilterOpen, setFilterOpen] = useState(false);
  const [isAssignOpen, setAssignOpen] = useState(false);
  const [detailId, setDetailId] = useState<number | null>(null);
  const [hoverInfo, setHoverInfo] = useState<{ name: string; notes: RecentNote[]; top: number; left: number } | null>(null);
  const hoverHideRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [hoveredId, setHoveredId] = useState<number | null>(null);

  // Applied filters are read from the URL; local filters are draft values edited in inputs/modals
  const applied = useMemo(() => {
    const obj: any = {};
    if (!searchParams) return obj;
    function g(key: string) { return searchParams.get(key) || undefined; }
    function gi(key: string) { const v = g(key); return v ? Number(v) : undefined; }
    function ga(key: string) { const vals = searchParams.getAll(key); return vals.length ? vals.map((v) => Number(v)) : undefined; }
    obj.name = g("name");
    obj.contact1 = g("contact1");
    obj.contact2 = g("contact2");
    obj.noteContent = g("noteContent");
    obj.assignType = g("assignType");
    obj.teamId = gi("teamId");
    obj.memberId = gi("memberId");
    obj.applicationRoute = g("applicationRoute");
    obj.mediaCompany = g("mediaCompany");
    obj.site = g("site");
    obj.categoryIds = ga("categoryIds");
    obj.applicationDateFrom = g("applicationDateFrom");
    obj.applicationDateTo = g("applicationDateTo");
    obj.assignedAtFrom = g("assignedAtFrom");
    obj.assignedAtTo = g("assignedAtTo");
    obj.page = Number(searchParams.get("page") || "1");
    obj.limit = Number(searchParams.get("limit") || "10");
    return obj;
  }, [searchParams]);

  // Sync local UI states with applied URL on mount/URL change
  useEffect(() => {
    // Keep page/limit in sync with URL only
    setPage(applied.page || 1);
    setLimit(applied.limit || 10);
    // Only update draft filters when URL truly changes values; avoid infinite loops
    setFilters((prev) => {
      const next = {
        name: applied.name,
        contact1: applied.contact1,
        teamId: applied.teamId,
        memberId: applied.memberId,
        applicationRoute: applied.applicationRoute,
        mediaCompany: applied.mediaCompany,
        site: applied.site,
        categoryIds: applied.categoryIds,
        noteContent: applied.noteContent,
        applicationDateFrom: applied.applicationDateFrom,
        applicationDateTo: applied.applicationDateTo,
        assignedAtFrom: applied.assignedAtFrom,
        assignedAtTo: applied.assignedAtTo,
      } as any;
      const prevStr = JSON.stringify(prev);
      const nextStr = JSON.stringify(next);
      return prevStr === nextStr ? prev : next;
    });
  }, [applied]);

  const query: CustomersListQuery | null = useMemo(
    () => (projectId ? { projectId, page: applied.page || 1, limit: applied.limit || 10, name: applied.name, contact1: applied.contact1, teamId: applied.teamId, memberId: applied.memberId, applicationRoute: applied.applicationRoute, mediaCompany: applied.mediaCompany, site: applied.site, categoryIds: applied.categoryIds, noteContent: applied.noteContent, applicationDateFrom: applied.applicationDateFrom, applicationDateTo: applied.applicationDateTo, assignedAtFrom: applied.assignedAtFrom, assignedAtTo: applied.assignedAtTo } : null),
    [projectId, applied]
  );

  const { data, loading, error, refetch } = useCustomersList(query as any);

  useEffect(() => {
    // refetch happens automatically through deps, this ensures consistency when projectId changes
  }, [projectId]);

  const customers: CustomerListItem[] = data?.data.customers ?? [];
  const totalPages = data?.data.totalPages ?? 1;

  const allSelectedOnPage = customers.length > 0 && customers.every((c) => selectedIds.includes(c.id));
  const toggleSelectAll = () => {
    if (allSelectedOnPage) {
      setSelectedIds((prev) => prev.filter((id) => !customers.some((c) => c.id === id)));
    } else {
      const add = customers.map((c) => c.id).filter((id) => !selectedIds.includes(id));
      setSelectedIds((prev) => [...prev, ...add]);
    }
  };

  function Chip({ label, onRemove }: { label: string; onRemove: () => void }) {
    return (
      <div className="inline-flex items-center gap-2 px-3 h-[34px] rounded-[30px] bg-[#F2F2F2] dark:bg-[#222222]">
        <span className="text-[14px] text-[#000] dark:text-[#FFFFFF]">{label}</span>
        <button aria-label="remove" onClick={onRemove} className="w-4 h-4 grid place-items-center text-[#000] dark:text-[#FFFFFF]">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 9L9 3M3 3L9 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    );
  }

  if (!projectId) return null;

  return (
    <main className="container mx-auto max-w-[1324px] min-h-screen pt-[90px] pb-12 text-[#252525] dark:text-[#E9E9E9]">
      {/* Top panel: title + search */}
      <Panel
        className="rounded-[14px] mb-4"
        title={
          <div className="-mx-6 px-7 pb-3 flex items-end gap-3">
            <h1 className="text-[24px] leading-[20px] font-bold text-[#252525] dark:text-[#E9E9E9]">고객목록</h1>
            <span className="text-[#808080] dark:text-[#B9B9B9]">|</span>
            <p className="text-[18px] leading-[20px] font-medium text-[#808080] dark:text-[#B9B9B9]">고객 데이터를 확인하고 관리하세요</p>
          </div>
        }
        bodyClassName="px-7 pb-4 pt-3 border-t border-[#E2E2E2] dark:border-[#444444]"
      >
        {/* Filters row (Figma: two 384x59 inputs; buttons follow immediately) */}
        <div className="mb-2 flex flex-wrap items-end gap-3" style={{ minHeight: 59 }}>
          {/* 이름 */}
          <div className="min-w-[384px]" style={{ width: 384 }}>
            <label className="block text-[14px] leading-[17px] text-[#808080] dark:text-[#B9B9B9] mb-2">이름</label>
            <div className="flex flex-col justify-center items-center px-3 py-2 gap-[10px] border border-[#E2E2E2] dark:border-[#444444] rounded-[5px] bg-white dark:bg-[#111111]">
              <div className="flex flex-row items-center p-0 gap-[30px] w-[360px] h-[17px]">
                <input
                  className="w-full h-[17px] outline-none border-none bg-transparent text-[14px] leading-[17px] tracking-[-0.02em] placeholder:text-[#808080] dark:placeholder:text-[#B9B9B9] text-[#252525] dark:text-[#E9E9E9]"
                  placeholder="이름 검색"
                  value={filters.name ?? ""}
                  onChange={(e) => setFilters((f) => ({ ...f, name: e.target.value }))}
                />
              </div>
            </div>
          </div>

          {/* 핸드폰번호 */}
          <div className="min-w-[384px]" style={{ width: 384 }}>
            <label className="block text-[14px] leading-[17px] text-[#808080] dark:text-[#B9B9B9] mb-2">핸드폰번호</label>
            <div className="flex flex-col justify-center items-center px-3 py-2 gap-[10px] border border-[#E2E2E2] dark:border-[#444444] rounded-[5px] bg-white dark:bg-[#111111]">
              <div className="flex flex-row items-center p-0 gap-[30px] w-[360px] h-[17px]">
                <input
                  className="w-full h-[17px] outline-none border-none bg-transparent text-[14px] leading-[17px] tracking-[-0.02em] placeholder:text-[#808080] dark:placeholder:text-[#B9B9B9] text-[#252525] dark:text-[#E9E9E9]"
                  placeholder="핸드폰번호 검색"
                  value={filters.contact1 ?? ""}
                  onChange={(e) => setFilters((f) => ({ ...f, contact1: e.target.value }))}
                />
              </div>
            </div>
          </div>

          {/* Buttons immediately after inputs */}
          <div className="flex items-end gap-2">
            <button
              className="h-[34px] px-3 rounded-[5px] border border-[#E2E2E2] dark:border-[#444444] text-[14px] font-semibold tracking-[-0.02em] text-[#000] dark:text-[#FDFDFD] bg-white dark:bg-[#111111]"
              onClick={() => setFilterOpen(true)}
            >
              필터추가
            </button>
            <button
              className="h-[34px] px-3 rounded-[5px] bg-[#252525] dark:bg-[#E9E9E9] text-[#D0D0D0] dark:text-[#111111] text-[14px] font-semibold tracking-[-0.02em]"
              onClick={() => {
                // Apply draft filters to URL; this triggers data fetching
                const params = new URLSearchParams();
                function setIf(key: string, val?: any) { if (val !== undefined && val !== null && val !== "") params.set(key, String(val)); }
                setIf("page", 1);
                setIf("limit", limit);
                setIf("name", filters.name);
                setIf("contact1", filters.contact1);
                setIf("teamId", filters.teamId);
                setIf("memberId", filters.memberId);
                setIf("applicationRoute", filters.applicationRoute);
                setIf("mediaCompany", filters.mediaCompany);
                setIf("site", filters.site);
                if (filters.categoryIds && filters.categoryIds.length) {
                  filters.categoryIds.forEach((id) => params.append("categoryIds", String(id)));
                }
                setIf("noteContent", filters.noteContent);
                setIf("applicationDateFrom", filters.applicationDateFrom);
                setIf("applicationDateTo", filters.applicationDateTo);
                setIf("assignedAtFrom", filters.assignedAtFrom);
                setIf("assignedAtTo", filters.assignedAtTo);
                router.push(`/customers?${params.toString()}`);
              }}
            >
              검색
            </button>
          </div>
        </div>

        {/* Applied filters pills */}
        <div className="flex flex-wrap items-center gap-2">
          {filters.teamId && <Chip label={`팀 ${filters.teamId}`} onRemove={() => setFilters((f) => ({ ...f, teamId: undefined }))} />}
          {filters.memberId && <Chip label={`담당자 ${filters.memberId}`} onRemove={() => setFilters((f) => ({ ...f, memberId: undefined }))} />}
          {filters.applicationRoute && <Chip label={filters.applicationRoute} onRemove={() => setFilters((f) => ({ ...f, applicationRoute: undefined }))} />}
          {filters.mediaCompany && <Chip label={filters.mediaCompany} onRemove={() => setFilters((f) => ({ ...f, mediaCompany: undefined }))} />}
          {filters.site && <Chip label={filters.site} onRemove={() => setFilters((f) => ({ ...f, site: undefined }))} />}
          {Array.isArray(filters.categoryIds) && filters.categoryIds!.length > 0 && filters.categoryIds!.map((id) => (
            <Chip key={id} label={`카테고리 ${id}`} onRemove={() => setFilters((f) => ({ ...f, categoryIds: (f.categoryIds || []).filter((x) => x !== id) }))} />
          ))}
          {(filters.applicationDateFrom || filters.applicationDateTo) && (
            <Chip label={`${filters.applicationDateFrom || ""} - ${filters.applicationDateTo || ""}`} onRemove={() => setFilters((f) => ({ ...f, applicationDateFrom: undefined, applicationDateTo: undefined }))} />
          )}
          {(filters.assignedAtFrom || filters.assignedAtTo) && (
            <Chip label={`${filters.assignedAtFrom || ""} - ${filters.assignedAtTo || ""}`} onRemove={() => setFilters((f) => ({ ...f, assignedAtFrom: undefined, assignedAtTo: undefined }))} />
          )}
        </div>
      </Panel>

      {/* Bottom panel: actions (top-right) + table */}
      <Panel
        className="rounded-[14px]"
        action={
          <div className="w-full flex justify-end items-center gap-3">
            <input ref={fileInputRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              try {
                const fileType = file.type || "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
                const presign = await AssetsService.presignBulkImport({ fileName: file.name, fileType });
                const { uploadUrl, fileUrl, url } = presign.data as any;
                const putUrl = uploadUrl || url;
                if (putUrl) await AssetsService.uploadToS3(putUrl, file, fileType);
                await CustomersBulkService.createImport({ fileUrl: fileUrl || undefined, fileName: file.name, projectId: projectId! });
                alert("업로드 요청이 접수되었습니다.");
              } catch (err) {
                console.error(err);
                alert("업로드에 실패했습니다.");
              } finally {
                if (fileInputRef.current) fileInputRef.current.value = "";
              }
            }} />
            <button
              className="h-[34px] px-3 rounded-[5px] border border-[#E2E2E2] dark:border-[#444444] text-[14px] font-semibold tracking-[-0.02em] text-[#000] dark:text-[#FDFDFD] bg-white dark:bg-[#111111]"
              onClick={() => fileInputRef.current?.click()}
            >
              엑셀 업로드
            </button>
            <button
              className="h-[34px] px-3 rounded-[5px] border border-[#E2E2E2] dark:border-[#444444] text-[14px] font-semibold tracking-[-0.02em] text-[#000] dark:text-[#FDFDFD] bg-white dark:bg-[#111111]"
              onClick={async () => {
                const exportQuery: Record<string, string | number | boolean> = { page: applied.page || 1, limit: applied.limit || 10 } as any;
                const appliedForExport: any = applied;
                if (appliedForExport.name) exportQuery.name = appliedForExport.name;
                if (appliedForExport.contact1) exportQuery.contact1 = appliedForExport.contact1;
                const blobRes = await CustomersBulkService.exportExcel({ projectId: projectId!, query: exportQuery });
                const blob = blobRes.data;
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = "customers.xlsx";
                a.click();
                URL.revokeObjectURL(url);
              }}
            >
              엑셀 다운로드
            </button>
            <button className="h-[34px] px-3 rounded-[5px] bg-[#252525] dark:bg-[#E9E9E9] text-[#D0D0D0] dark:text-[#111111] text-[14px] font-semibold tracking-[-0.02em]" onClick={() => alert("고객등록 폼은 추후 연결")}>고객등록</button>
            <button className="h-[34px] px-3 rounded-[5px] bg-[#252525] dark:bg-[#E9E9E9] text-[#D0D0D0] dark:text-[#111111] text-[14px] font-semibold tracking-[-0.02em]" onClick={() => setAssignOpen(true)}>일괄배정</button>
          </div>
        }
        bodyClassName="p-6"
      >
        {/* Table */}
        <div className="overflow-hidden rounded-[12px]" style={{ width: "100%" }}>
          <table className="w-full text-left border-separate border-spacing-0">
            <thead>
              <tr className="bg-[#EDEDED] dark:bg-[#222222] text-[#808080] dark:text-[#B9B9B9]">
                <th className="px-6 h-[48px] rounded-l-[12px]">
                  <input type="checkbox" checked={allSelectedOnPage} onChange={toggleSelectAll} />
                </th>
                {[
                  "이름",
                  "신청경로",
                  "매체사",
                  "사이트",
                  "담당팀",
                  "담당자",
                  "신청시간",
                  "배정시간",
                ].map((h, i, arr) => (
                  <th key={h} className={`typo-title-2 font-bold px-6 h-[48px] ${i === arr.length - 1 ? "rounded-r-[12px]" : ""}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="typo-body-3">
              {loading && (
                <tr>
                  <td colSpan={9} className="px-6 h-[72px] text-center text-[#808080] dark:text-[#B9B9B9]">불러오는 중...</td>
                </tr>
              )}
              {Boolean(error) && !loading && (
                <tr>
                  <td colSpan={9} className="px-6 h-[72px] text-center text-red-500">데이터를 불러오지 못했습니다</td>
                </tr>
              )}
              {customers.map((c) => {
                const checked = selectedIds.includes(c.id);
                return (
                  <tr
                    key={c.id}
                    className={`border-b-[0.5px] border-[#E2E2E2] dark:border-[#444444] ${hoveredId === c.id ? "bg-[#F8F8F8] dark:bg-[#1A1A1A]" : ""}`}
                    onMouseEnter={(e) => {
                      if (hoverHideRef.current) { clearTimeout(hoverHideRef.current); hoverHideRef.current = null; }
                      const { clientX, clientY } = e;
                      const notes = Array.isArray(c.recentNotes) ? c.recentNotes : [];
                      setHoveredId(c.id);
                      setHoverInfo({
                        name: c.name,
                        notes,
                        top: clientY + 12,
                        left: Math.min(clientX + 12, window.innerWidth - 400),
                      });
                    }}
                    onMouseMove={(e) => {
                      if (!hoverInfo) return;
                      const { clientX, clientY } = e;
                      setHoverInfo((prev) => prev ? { ...prev, top: clientY + 12, left: Math.min(clientX + 12, window.innerWidth - 400) } : prev);
                    }}
                    onMouseLeave={() => {
                      if (hoverHideRef.current) clearTimeout(hoverHideRef.current);
                      hoverHideRef.current = setTimeout(() => { setHoverInfo(null); setHoveredId(null); }, 150);
                    }}
                  >
                    <td className="px-6 h-[58px] align-middle">
                      <Checkbox checked={checked} onChange={(next) => {
                        setSelectedIds((prev) => (next ? [...prev, c.id] : prev.filter((id) => id !== c.id)));
                      }} ariaLabel={`select ${c.name}`} />
                    </td>
                    <td className="px-6 h-[58px] align-middle text-[#252525] dark:text-[#E9E9E9] opacity-80">
                      <button className="underline underline-offset-2 text-inherit" onClick={() => setDetailId(c.id)}>{c.name}</button>
                    </td>
                    <td className="px-6 h-[58px] align-middle text-[#252525] dark:text-[#E9E9E9] opacity-80">{c.applicationRoute}</td>
                    <td className="px-6 h-[58px] align-middle text-[#252525] dark:text-[#E9E9E9] opacity-80">{c.mediaCompany}</td>
                    <td className="px-6 h-[58px] align-middle text-[#252525] dark:text-[#E9E9E9] opacity-80">{c.site}</td>
                    <td className="px-6 h-[58px] align-middle text-[#252525] dark:text-[#E9E9E9] opacity-80">{c.assignedTeamName}</td>
                    <td className="px-6 h-[58px] align-middle text-[#252525] dark:text-[#E9E9E9] opacity-80">{c.assignedMemberName}</td>
                    <td className="px-6 h-[58px] align-middle text-[#252525] dark:text-[#E9E9E9] opacity-80">{new Date(c.applicationDate || c.createdAt).toLocaleString()}</td>
                    <td className="px-6 h-[58px] align-middle text-[#252525] dark:text-[#E9E9E9] opacity-80">{c.assignedAt ? new Date(c.assignedAt).toLocaleString() : "-"}</td>
                  </tr>
                );
              })}
              {data && customers.length === 0 && !loading && (
                <tr>
                  <td colSpan={9} className="px-6 h-[72px] text-center text-[#808080] dark:text-[#B9B9B9]">결과가 없습니다</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer row: count + pagination + limit */}
        <div className="h-[64px] flex items-center justify-between gap-4 mt-2">
          <div className="text-[#B0B0B0] dark:text-[#959595] text-[14px]">총 {data?.data.total ?? 0}건 ({selectedIds.length}개 선택)</div>
          <div className="flex items-center gap-2">
            <button aria-label="prev" disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="w-8 h-8 grid place-items-center text-[#B0B0B0] dark:text-[#959595] disabled:opacity-40">
              <span className="block w-4 h-4 border-2 border-current rotate-90" style={{ borderLeft: "transparent", borderBottom: "transparent" }} />
            </button>
            {Array.from({ length: Math.min(10, totalPages) }).map((_, i) => {
              const start = Math.max(1, Math.min(page - 4, totalPages - 9));
              const num = start + i;
              const isActive = num === page;
              return (
                <button key={i} onClick={() => setPage(num)} className={`w-8 h-8 rounded-full grid place-items-center text-[14px] ${isActive ? "bg-[#252525] dark:bg-[#E9E9E9] text-white dark:text-[#111111]" : "text-[#808080] dark:text-[#B9B9B9]"}`}>{num}</button>
              );
            })}
            <button aria-label="next" disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="w-8 h-8 grid place-items-center text-[#B0B0B0] dark:text-[#959595] disabled:opacity-40">
              <span className="block w-4 h-4 border-2 border-current -rotate-90" style={{ borderLeft: "transparent", borderBottom: "transparent" }} />
            </button>
          </div>
          <select
            className="h-[34px] px-2 border border-[#E2E2E2] dark:border-[#444444] rounded-[5px] bg-white dark:bg-[#111111] text-[#252525] dark:text-[#FDFDFD]"
            value={String(limit)}
            onChange={(e) => {
              setLimit(Number(e.target.value));
              setPage(1);
            }}
          >
            {[10, 20, 50].map((n) => (
              <option key={n} value={n}>{n}개</option>
            ))}
          </select>
        </div>
      </Panel>
      <FilterModal
        open={isFilterOpen}
        onClose={() => setFilterOpen(false)}
        defaults={filters}
        onApply={(values) => {
          setFilters((prev) => ({ ...prev, ...values }));
          setFilterOpen(false);
          setPage(1);
        }}
      />

      {/* Assign customers modal */}
      <AssignCustomersModal
        open={isAssignOpen}
        onClose={() => setAssignOpen(false)}
        selectedCustomerIds={selectedIds}
        onAssign={async (targetId) => {
          // Simple integration: use Assign API with ids
          try {
            await CustomersService.assign({ assignmentType: "ids", memberId: targetId as any, customerIds: selectedIds, expectedCount: selectedIds.length, projectId: projectId! });
            setSelectedIds([]);
            await refetch();
          } catch (e) {
            throw e;
          }
        }}
      />

      {/* Customer detail modal */}
      <CustomerDetailModal open={detailId !== null} onClose={() => setDetailId(null)} customerId={detailId} />

      {/* Hover: recent notes popover */}
      {hoverInfo && (
        <div
          className="fixed z-40"
          style={{ top: hoverInfo.top, left: hoverInfo.left, width: 384 }}
          onMouseEnter={() => { if (hoverHideRef.current) { clearTimeout(hoverHideRef.current); hoverHideRef.current = null; } }}
          onMouseLeave={() => { setHoverInfo(null); setHoveredId(null); }}
        >
          <div className="rounded-[5px] bg-white dark:bg-[#111111] shadow-[0_8px_12px_rgba(9,30,66,0.1)]">
            <div className="px-5 pt-5 pb-3 text-[14px] font-medium text-[#000] dark:text-[#E9E9E9]">{hoverInfo.name}님의 최근 상담 내용</div>
            {hoverInfo.notes.length > 0 ? (
              <div className="px-5 pb-5 space-y-3">
                {hoverInfo.notes.slice(0, 2).map((n) => (
                  <div key={n.id} className="bg-[#F8F8F8] dark:bg-[#1A1A1A] rounded-[12px] p-4">
                    <div className="flex items-center justify-between text-[#808080] dark:text-[#B9B9B9] text-[14px]">
                      <span className="inline-flex items-center h-[22px] rounded-[30px] bg-[#D3E1FE] px-3 text-[12px] text-[#4D82F3] opacity-80">메모</span>
                      <span>{new Date(n.createdAt).toLocaleString()}</span>
                    </div>
                    <div className="mt-2 text-[14px] text-[#595959] dark:text-[#CFCFCF]">{n.note}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="px-5 pb-6 text-[14px] text-[#595959] dark:text-[#CFCFCF]">최근 상담 내용이 없습니다</div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}

export default function CustomersPageWrapper() {
  return (
    <Suspense fallback={
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-[#808080] dark:text-[#B9B9B9]">불러오는 중...</div>
      </main>
    }>
      <CustomersPage />
    </Suspense>
  );
}
