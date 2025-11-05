"use client";

import { useEffect, useMemo, useState } from "react";
import Panel from "@/components/common/Panel";
import AttendanceFilterModal, { AttendanceFilterState } from "@/components/attendance/AttendanceFilterModal";
import EmployeeInfoModal from "@/components/attendance/EmployeeInfoModal";
import { AttendanceService, AttendanceItem } from "@/services/attendance";
import { getSelectedProjectId } from "@/lib/project";
import type { AttendanceRecord } from "@/data/mockAttendanceData";

export default function AttendancePage() {
  const [projectId, setProjectId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(20);
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

  useEffect(() => {
    document.title = "TalkGate - 근태";
  }, []);

  useEffect(() => {
    const id = getSelectedProjectId();
    setProjectId(id || null);
  }, []);

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
        const payload: any = res.data as any;
        const data = (payload?.data || payload)?.data || payload;
        setRows(data?.attendances || []);
        setTotalPages(data?.totalPages || 1);
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
    <main className="container mx-auto max-w-[1324px] pt-6 pb-12 bg-background">
      {/* Top panel: title + date selector */}
      <Panel
        className="rounded-[14px] mb-4"
        title={
          <div className="-mx-6 px-7 pb-3 flex items-end gap-3">
            <h1 className="text-[24px] leading-[20px] font-bold text-foreground">근태</h1>
            <span className="text-neutral-60">|</span>
            <p className="text-[18px] leading-[20px] font-medium text-neutral-60">직원들의 출퇴근 현황을 확인하고 관리하세요</p>
          </div>
        }
        bodyClassName="px-7 pb-4 pt-3 border-t border-border"
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

      {/* Bottom panel: attendance table */}
      <Panel
        className="rounded-[14px]"
        title={
          <div className="flex items-center gap-3">
            <h2 className="text-[18px] font-semibold text-foreground">출퇴근 현황</h2>
            <button 
              onClick={() => setFilterOpen(true)}
              className="w-6 h-6 border border-border rounded-[5px] flex items-center justify-center"
            >
              <svg width="18" height="18" viewBox="0 0 26 26" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M7 8C7 7.45 7.45 7 8 7H18C18.55 7 19 7.45 19 8V9.25C19 9.52 18.89 9.77 18.71 9.96L14.63 14.04C14.44 14.23 14.33 14.48 14.33 14.75V16.33L11.67 19V14.75C11.67 14.48 11.56 14.23 11.37 14.04L7.29 9.96C7.11 9.77 7 9.52 7 9.25V8Z" stroke="var(--neutral-50)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        }
        bodyClassName="p-0"
      >
        {/* Table */}
        <div className="overflow-hidden rounded-[12px]">
          <table className="w-full text-left border-separate border-spacing-0">
            <thead>
              <tr className="bg-neutral-20 text-neutral-60">
                <th className="px-6 h-[48px] rounded-l-[12px] text-[16px] font-bold">이름</th>
                <th className="px-6 h-[48px] text-[16px] font-bold">팀</th>
                <th className="px-6 h-[48px] text-[16px] font-bold">직급</th>
                <th className="px-6 h-[48px] text-[16px] font-bold">출근시간</th>
                <th className="px-6 h-[48px] text-[16px] font-bold">퇴근시간</th>
                <th className="px-6 h-[48px] rounded-r-[12px] text-[16px] font-bold">근무시간</th>
              </tr>
            </thead>
            <tbody className="text-[14px] text-foreground">
              {loading && (
                <tr>
                  <td className="px-6 h-[58px]" colSpan={6}>불러오는 중...</td>
                </tr>
              )}
              {Boolean(error) && !loading && (
                <tr>
                  <td className="px-6 h-[58px] text-danger-40" colSpan={6}>{error}</td>
                </tr>
              )}
              {filteredData.map((record) => (
                <tr 
                  key={record.id}
                  className="border-b-[0.4px] border-border cursor-pointer hover:bg-neutral-10 transition-colors"
                  onClick={() => handleEmployeeClick(record)}
                >
                  <td className="px-6 h-[58px] align-middle opacity-80">{record.memberName}</td>
                  <td className="px-6 h-[58px] align-middle opacity-80">{record.teamName}</td>
                  <td className="px-6 h-[58px] align-middle opacity-80">{String(record.role)}</td>
                  <td className="px-6 h-[58px] align-middle opacity-80">{record.attendanceAt ? new Date(record.attendanceAt).toLocaleTimeString() : '-'}</td>
                  <td className="px-6 h-[58px] align-middle opacity-80">{record.leaveAt ? new Date(record.leaveAt).toLocaleTimeString() : '-'}</td>
                  <td className="px-6 h-[58px] align-middle opacity-80 font-semibold">{/* 서버가 근무시간을 직접 주지 않으므로 표시 생략 */}</td>
                </tr>
              ))}
              {!loading && !error && filteredData.length === 0 && (
                <tr>
                  <td className="px-6 h-[58px]" colSpan={6}>데이터가 없습니다</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-center gap-2 p-6">
          {/* Previous button */}
          <button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage <= 1}
            className="w-6 h-6 flex items-center justify-center disabled:opacity-40"
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

          {/* Page numbers */}
          {Array.from({ length: Math.min(10, totalPages) }, (_, i) => {
            const start = Math.max(1, Math.min(currentPage - 4, totalPages - 9));
            const pageNum = start + i;
            const isActive = pageNum === currentPage;
            return (
              <button
                key={i}
                onClick={() => setCurrentPage(pageNum)}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-[14px] ${
                  isActive 
                    ? "bg-neutral-90 text-neutral-0" 
                    : "text-neutral-60"
                }`}
              >
                {pageNum}
              </button>
            );
          })}

          {/* Next button */}
          <button
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage >= totalPages}
            className="w-6 h-6 flex items-center justify-center disabled:opacity-40"
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
      </Panel>

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
    </main>
  );
}
