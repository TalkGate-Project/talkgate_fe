"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Panel from "@/components/Panel";
import { useCustomersList } from "@/hooks/useCustomersList";
import { CustomersListQuery, CustomerListItem } from "@/types/customers";
import { CustomersBulkService } from "@/services/customersBulk";
import { AssetsService } from "@/services/assets";
import FilterModal from "@/components/FilterModal";
import { getSelectedProjectId } from "@/lib/project";
import { useRouter } from "next/navigation";

export default function CustomersPage() {
  const router = useRouter();
  const [projectId, setProjectId] = useState<string | null>(null);

  useEffect(() => {
    const id = getSelectedProjectId();
    if (!id) {
      router.replace("/projects");
      return;
    }
    setProjectId(id);
  }, [router]);

  const [filters, setFilters] = useState<{ name?: string; contact1?: string }>({});
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(10);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isFilterOpen, setFilterOpen] = useState(false);

  const query: CustomersListQuery | null = useMemo(
    () => (projectId ? { projectId, page, limit, name: filters.name, contact1: filters.contact1 } : null),
    [projectId, page, limit, filters]
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

  if (!projectId) return null;

  return (
    <main className="container mx-auto max-w-[1324px] pt-[90px] pb-12">
      {/* Top panel: title + search */}
      <Panel
        className="rounded-[14px] mb-4"
        title={
          <div className="-mx-6 px-7 pb-3 flex items-end gap-3">
            <h1 className="text-[24px] leading-[20px] font-bold text-[#252525]">고객목록</h1>
            <span className="text-[#808080]">|</span>
            <p className="text-[18px] leading-[20px] font-medium text-[#808080]">고객 데이터를 확인하고 관리하세요</p>
          </div>
        }
        bodyClassName="px-7 pb-4 pt-3 border-t border-[#E2E2E2]"
      >
        {/* Filters row (Figma: two 384x59 inputs; buttons follow immediately) */}
        <div className="mb-2 flex flex-wrap items-end gap-3" style={{ minHeight: 59 }}>
          {/* 이름 */}
          <div className="min-w-[384px]" style={{ width: 384 }}>
            <label className="block text-[14px] leading-[17px] text-[#808080] mb-2">이름</label>
            <div className="flex flex-col justify-center items-center px-3 py-2 gap-[10px] border border-[#E2E2E2] rounded-[5px]">
              <div className="flex flex-row items-center p-0 gap-[30px] w-[360px] h-[17px]">
                <input
                  className="w-full h-[17px] outline-none border-none bg-transparent text-[14px] leading-[17px] tracking-[-0.02em] placeholder:text-[#808080] text-[#252525]"
                  placeholder="이름 검색"
                  value={filters.name ?? ""}
                  onChange={(e) => setFilters((f) => ({ ...f, name: e.target.value }))}
                />
              </div>
            </div>
          </div>

          {/* 핸드폰번호 */}
          <div className="min-w-[384px]" style={{ width: 384 }}>
            <label className="block text-[14px] leading-[17px] text-[#808080] mb-2">핸드폰번호</label>
            <div className="flex flex-col justify-center items-center px-3 py-2 gap-[10px] border border-[#E2E2E2] rounded-[5px]">
              <div className="flex flex-row items-center p-0 gap-[30px] w-[360px] h-[17px]">
                <input
                  className="w-full h-[17px] outline-none border-none bg-transparent text-[14px] leading-[17px] tracking-[-0.02em] placeholder:text-[#808080] text-[#252525]"
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
              className="h-[34px] px-3 rounded-[5px] border border-[#E2E2E2] text-[14px] font-semibold tracking-[-0.02em] text-[#000] bg-white"
              onClick={() => setFilterOpen(true)}
            >
              필터추가
            </button>
            <button
              className="h-[34px] px-3 rounded-[5px] bg-[#252525] text-[#D0D0D0] text-[14px] font-semibold tracking-[-0.02em]"
              onClick={() => refetch()}
            >
              검색
            </button>
          </div>
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
                const presign = await AssetsService.presignBulkImport({ fileName: file.name, fileType: file.type || "application/octet-stream" });
                const { uploadUrl, fileUrl, url } = presign.data as any;
                const putUrl = uploadUrl || url;
                if (putUrl) await AssetsService.uploadToS3(putUrl, file);
                await CustomersBulkService.createImport({ fileUrl: fileUrl || undefined, fileName: file.name });
                alert("업로드 요청이 접수되었습니다.");
              } catch (err) {
                console.error(err);
                alert("업로드에 실패했습니다.");
              } finally {
                if (fileInputRef.current) fileInputRef.current.value = "";
              }
            }} />
            <button
              className="h-[34px] px-3 rounded-[5px] border border-[#E2E2E2] text-[14px] font-semibold tracking-[-0.02em] text-[#000] bg-white"
              onClick={() => fileInputRef.current?.click()}
            >
              엑셀 업로드
            </button>
            <button
              className="h-[34px] px-3 rounded-[5px] border border-[#E2E2E2] text-[14px] font-semibold tracking-[-0.02em] text-[#000] bg-white"
              onClick={async () => {
                const exportQuery: Record<string, string | number | boolean> = { page, limit };
                if (filters.name) exportQuery.name = filters.name;
                if (filters.contact1) exportQuery.contact1 = filters.contact1;
                const blobRes = await CustomersBulkService.exportExcel(exportQuery);
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
            <button className="h-[34px] px-3 rounded-[5px] bg-[#252525] text-[#D0D0D0] text-[14px] font-semibold tracking-[-0.02em]" onClick={() => alert("고객등록 폼은 추후 연결")}>고객등록</button>
            <button className="h-[34px] px-3 rounded-[5px] bg-[#252525] text-[#D0D0D0] text-[14px] font-semibold tracking-[-0.02em]" onClick={() => alert("일괄배정은 추후 연결")}>일괄배정</button>
          </div>
        }
        bodyClassName="p-6"
      >
        {/* Table */}
        <div className="overflow-hidden rounded-[12px]" style={{ width: "100%" }}>
          <table className="w-full text-left border-separate border-spacing-0">
            <thead>
              <tr className="bg-[#EDEDED] text-[#808080]">
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
                  <td colSpan={9} className="px-6 h-[72px] text-center text-[#808080]">불러오는 중...</td>
                </tr>
              )}
              {error && !loading && (
                <tr>
                  <td colSpan={9} className="px-6 h-[72px] text-center text-red-500">데이터를 불러오지 못했습니다</td>
                </tr>
              )}
              {customers.map((c) => {
                const checked = selectedIds.includes(c.id);
                return (
                  <tr key={c.id} className="border-b-[0.5px] border-[#E2E2E2]">
                    <td className="px-6 h-[58px] align-middle">
                      <input type="checkbox" checked={checked} onChange={(e) => {
                        setSelectedIds((prev) => (e.target.checked ? [...prev, c.id] : prev.filter((id) => id !== c.id)));
                      }} />
                    </td>
                    <td className="px-6 h-[58px] align-middle text-[#252525] opacity-80">{c.name}</td>
                    <td className="px-6 h-[58px] align-middle text-[#252525] opacity-80">{c.applicationRoute}</td>
                    <td className="px-6 h-[58px] align-middle text-[#252525] opacity-80">{c.mediaCompany}</td>
                    <td className="px-6 h-[58px] align-middle text-[#252525] opacity-80">{c.site}</td>
                    <td className="px-6 h-[58px] align-middle text-[#252525] opacity-80">{c.assignedTeamName}</td>
                    <td className="px-6 h-[58px] align-middle text-[#252525] opacity-80">{c.assignedMemberName}</td>
                    <td className="px-6 h-[58px] align-middle text-[#252525] opacity-80">{new Date(c.applicationDate || c.createdAt).toLocaleString()}</td>
                    <td className="px-6 h-[58px] align-middle text-[#252525] opacity-80">{c.assignedAt ? new Date(c.assignedAt).toLocaleString() : "-"}</td>
                  </tr>
                );
              })}
              {data && customers.length === 0 && !loading && (
                <tr>
                  <td colSpan={9} className="px-6 h-[72px] text-center text-[#808080]">결과가 없습니다</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer row: count + pagination + limit */}
        <div className="h-[64px] flex items-center justify-between gap-4 mt-2">
          <div className="text-[#B0B0B0] text-[14px]">총 {data?.data.total ?? 0}건 ({selectedIds.length}개 선택)</div>
          <div className="flex items-center gap-2">
            <button aria-label="prev" disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="w-8 h-8 grid place-items-center text-[#B0B0B0] disabled:opacity-40">
              <span className="block w-4 h-4 border-2 border-current rotate-90" style={{ borderLeft: "transparent", borderBottom: "transparent" }} />
            </button>
            {Array.from({ length: Math.min(10, totalPages) }).map((_, i) => {
              const start = Math.max(1, Math.min(page - 4, totalPages - 9));
              const num = start + i;
              const isActive = num === page;
              return (
                <button key={i} onClick={() => setPage(num)} className={`w-8 h-8 rounded-full grid place-items-center text-[14px] ${isActive ? "bg-[#252525] text-white" : "text-[#808080]"}`}>{num}</button>
              );
            })}
            <button aria-label="next" disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="w-8 h-8 grid place-items-center text-[#B0B0B0] disabled:opacity-40">
              <span className="block w-4 h-4 border-2 border-current -rotate-90" style={{ borderLeft: "transparent", borderBottom: "transparent" }} />
            </button>
          </div>
          <select
            className="h-[34px] px-2 border border-[#E2E2E2] rounded-[5px]"
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
      <FilterModal open={isFilterOpen} onClose={() => setFilterOpen(false)} onApply={() => setFilterOpen(false)} />
    </main>
  );
}


