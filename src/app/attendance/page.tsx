"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import Panel from "@/components/common/Panel";
import AttendanceFilterModal, { AttendanceFilterState } from "@/components/attendance/AttendanceFilterModal";
import EmployeeInfoModal from "@/components/attendance/EmployeeInfoModal";
import { AttendanceService, AttendanceItem } from "@/services/attendance";
import { getSelectedProjectId } from "@/lib/project";
import type { AttendanceRecord } from "@/data/mockAttendanceData";

export default function AttendancePage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const [projectId, setProjectId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [totalPages, setTotalPages] = useState(1);
  const [isFilterOpen, setFilterOpen] = useState(false);
  const [filters, setFilters] = useState<AttendanceFilterState>({
    team: 'all',
    position: 'all'
  });
  const [isEmployeeModalOpen, setEmployeeModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<AttendanceRecord | null>(null);
  const [rows, setRows] = useState<AttendanceItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 쿼리스트링에서 페이지와 limit 가져오기
  const currentPage = useMemo(() => {
    const pageParam = searchParams.get("page");
    const parsed = pageParam ? Number(pageParam) : 1;
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
  }, [searchParams]);

  const limit = useMemo(() => {
    const limitParam = searchParams.get("limit");
    const parsed = limitParam ? Number(limitParam) : 20;
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 20;
  }, [searchParams]);

  useEffect(() => {
    document.title = "TalkGate - 근태";
  }, []);

  useEffect(() => {
    const id = getSelectedProjectId();
    setProjectId(id || null);
  }, []);

  // URL 쿼리스트링 업데이트 함수
  const persistQuery = useCallback(
    (updates: Record<string, string | number | undefined | null>) => {
      const params = new URLSearchParams(searchParams);
      Object.entries(updates).forEach(([key, value]) => {
        if (value === undefined || value === null || value === "") {
          params.delete(key);
        } else {
          params.set(key, String(value));
        }
      });
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams]
  );

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
    const weekday = weekdays[date.getDay()];
    
    return `${year} - ${month} - ${day} (${weekday})`;
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    const date = new Date(selectedDate);
    if (direction === 'prev') {
      date.setDate(date.getDate() - 1);
    } else {
      date.setDate(date.getDate() + 1);
    }
    setSelectedDate(date.toISOString().split('T')[0]);
    // 날짜 변경 시 페이지를 1로 리셋
    persistQuery({ page: 1 });
  };

  const handlePageChange = (page: number) => {
    if (loading) return;
    if (page === currentPage) return;
    persistQuery({ page });
  };

  // 서버 데이터 필터링 (현재 스웨거 기준 서버가 팀/포지션 필터는 제공하지 않으므로 클라이언트 필터만 적용)
  const filteredData = useMemo(() => {
    return rows.filter((r) => {
      const teamMatch = filters.team === 'all' || r.teamName === filters.team;
      const positionMatch = filters.position === 'all' || String(r.role) === filters.position;
      return teamMatch && positionMatch;
    });
  }, [filters, rows]);

  useEffect(() => {
    if (!projectId) return;
    setLoading(true);
    setError(null);
    AttendanceService.list({ projectId, date: selectedDate, page: currentPage, limit })
      .then((res) => {
        const response = res.data as any;
        if (response?.result && response?.data) {
          setRows(response.data.attendances || []);
          setTotalPages(response.data.totalPages || 1);
        } else {
          setRows([]);
          setTotalPages(1);
        }
      })
      .catch((e: any) => setError(e?.data?.message || e?.message || "불러오지 못했습니다"))
      .finally(() => setLoading(false));
  }, [projectId, selectedDate, currentPage, limit]);

  function formatHm(iso?: string | null) {
    if (!iso) return "-";
    const d = new Date(iso);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  function computeWorkTime(att?: string | null, leave?: string | null) {
    if (!att || !leave) return "";
    const diffMs = new Date(leave).getTime() - new Date(att).getTime();
    if (diffMs <= 0) return "";
    const mins = Math.floor(diffMs / 60000);
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h}시간 ${m}분`;
  }

  const handleEmployeeClick = (employee: AttendanceItem) => {
    const mapped: AttendanceRecord = {
      id: employee.id,
      name: employee.memberName,
      team: employee.teamName,
      position: String(employee.role),
      clockIn: formatHm(employee.attendanceAt),
      clockOut: formatHm(employee.leaveAt),
      workTime: computeWorkTime(employee.attendanceAt, employee.leaveAt) || "-",
    };
    setSelectedEmployee(mapped);
    setEmployeeModalOpen(true);
  };

  return (
    <main className="min-h-[calc(100vh-54px)] bg-neutral-10">
      <div className="mx-auto max-w-[1324px] w-full px-0 pt-6 pb-12">
        {/* Top panel: title + date selector */}
        <Panel
          className="rounded-[14px] mb-4"
          title={
            <div className="flex items-end gap-3">
              <h1 className="text-[24px] leading-[20px] font-bold text-neutral-90">근태</h1>
              <span className="w-px h-4 bg-neutral-60 opacity-60" />
              <p className="text-[18px] leading-[20px] font-medium text-neutral-60">직원들의 출퇴근 현황을 확인하고 관리하세요</p>
            </div>
          }
          bodyClassName="px-7 pb-4 pt-3 border-t border-neutral-30"
        >
        {/* Date selector */}
        <div className="flex justify-center">
          <div className="h-[48px] bg-neutral-20 rounded-[12px] px-3 flex items-center gap-3">
            {/* Previous button */}
            <button
              onClick={() => navigateDate('prev')}
              className="w-[34px] h-[34px] bg-card border border-border rounded-[5px] flex items-center justify-center"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path
                  d="M15 18L9 12L15 6"
                  stroke="var(--neutral-50)"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            
            {/* Date display */}
            <div className="px-8 py-[6px] bg-card rounded-[5px]">
              <span className="text-[16px] font-bold text-foreground">
                {formatDate(selectedDate)}
              </span>
            </div>
            
            {/* Next button */}
            <button
              onClick={() => navigateDate('next')}
              className="w-[34px] h-[34px] bg-card border border-border rounded-[5px] flex items-center justify-center"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path
                  d="M9 18L15 12L9 6"
                  stroke="var(--neutral-50)"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
        </div>
      </Panel>

        {/* Bottom area: attendance table */}
        <div className="bg-card rounded-[14px] p-6 shadow-[0_13px_61px_rgba(169,169,169,0.12)]">
          {/* 헤더 영역 */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[18px] font-semibold text-neutral-90">출퇴근 현황</h2>
            <button 
              onClick={() => setFilterOpen(true)}
              className="w-6 h-6 border border-border rounded-[5px] flex items-center justify-center hover:bg-neutral-10 transition-colors"
            >
              <svg width="18" height="18" viewBox="0 0 26 26" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M7 8C7 7.45 7.45 7 8 7H18C18.55 7 19 7.45 19 8V9.25C19 9.52 18.89 9.77 18.71 9.96L14.63 14.04C14.44 14.23 14.33 14.48 14.33 14.75V16.33L11.67 19V14.75C11.67 14.48 11.56 14.23 11.37 14.04L7.29 9.96C7.11 9.77 7 9.52 7 9.25V8Z" stroke="var(--neutral-50)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>

          {/* 테이블 헤더 */}
          <div className="bg-neutral-20 rounded-[12px] h-[48px] flex items-center px-6">
            <div className="flex-1 text-[16px] font-bold text-neutral-60">이름</div>
            <div className="w-[120px] text-[16px] font-bold text-neutral-60 text-center">팀</div>
            <div className="w-[80px] text-[16px] font-bold text-neutral-60 text-center">직급</div>
            <div className="w-[100px] text-[16px] font-bold text-neutral-60 text-center">출근시간</div>
            <div className="w-[100px] text-[16px] font-bold text-neutral-60 text-center">퇴근시간</div>
            <div className="w-[100px] text-[16px] font-bold text-neutral-60 text-center">근무시간</div>
          </div>

          {/* 테이블 본문 */}
          <div>
            {loading ? (
              <div className="py-12 text-center text-[14px] text-neutral-60">근태 데이터를 불러오는 중입니다...</div>
            ) : error ? (
              <div className="py-12 text-center text-[14px] text-danger-40">{error}</div>
            ) : filteredData.length === 0 ? (
              <div className="py-12 text-center text-[14px] text-neutral-60">근태 데이터가 없습니다.</div>
            ) : (
              filteredData.map((record, index) => (
                <div key={record.memberId || index}>
                  <div
                    className="flex items-center py-4 px-6 hover:bg-neutral-10 cursor-pointer transition-colors"
                    onClick={() => handleEmployeeClick(record)}
                  >
                    {/* 이름 */}
                    <div className="flex-1 text-[14px] font-medium text-neutral-90 opacity-80">
                      {record.memberName || '-'}
                    </div>
                    {/* 팀 */}
                    <div className="w-[120px] text-[14px] font-medium text-neutral-90 opacity-80 text-center">
                      {record.teamName || '-'}
                    </div>
                    {/* 직급 */}
                    <div className="w-[80px] text-[14px] font-medium text-neutral-90 opacity-80 text-center">
                      {record.role === 'leader' ? '리더' : record.role === 'member' ? '멤버' : record.role || '-'}
                    </div>
                    {/* 출근시간 */}
                    <div className="w-[100px] text-[14px] font-medium text-neutral-90 opacity-80 text-center">
                      {formatHm(record.attendanceAt)}
                    </div>
                    {/* 퇴근시간 */}
                    <div className="w-[100px] text-[14px] font-medium text-neutral-90 opacity-80 text-center">
                      {formatHm(record.leaveAt)}
                    </div>
                    {/* 근무시간 */}
                    <div className="w-[100px] text-[14px] font-semibold text-neutral-90 opacity-80 text-center">
                      {computeWorkTime(record.attendanceAt, record.leaveAt) || '-'}
                    </div>
                  </div>

                  {/* 구분선 */}
                  {index < filteredData.length - 1 && (
                    <div className="border-t border-border opacity-50" />
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-center gap-2 mt-6">
          {/* Previous button */}
          <button
            onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage <= 1}
            className="w-6 h-6 flex items-center justify-center disabled:opacity-50"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M15 18L9 12L15 6" stroke="var(--neutral-50)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>

          {/* Page numbers */}
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              onClick={() => handlePageChange(page)}
              className={`w-8 h-8 rounded-full text-[14px] font-normal flex items-center justify-center ${
                currentPage === page
                  ? "bg-neutral-90 text-neutral-0"
                  : "text-neutral-60 hover:bg-neutral-10"
              }`}
            >
              {page}
            </button>
          ))}

          {/* Next button */}
          <button
            onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage >= totalPages}
            className="w-6 h-6 flex items-center justify-center disabled:opacity-50"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9 18L15 12L9 6" stroke="var(--neutral-50)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>

        {/* Filter Modal */}
        <AttendanceFilterModal
        open={isFilterOpen}
        onClose={() => setFilterOpen(false)}
        onApply={(newFilters) => {
          setFilters(newFilters);
          setFilterOpen(false);
        }}
        defaults={filters}
      />

        {/* Employee Info Modal */}
        <EmployeeInfoModal
          open={isEmployeeModalOpen}
          onClose={() => {
            setEmployeeModalOpen(false);
            setSelectedEmployee(null);
          }}
          employee={selectedEmployee}
        />
      </div>
    </main>
  );
}
