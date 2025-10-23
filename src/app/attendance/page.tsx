"use client";

import { useState, useMemo } from "react";
import Panel from "@/components/Panel";
import { mockAttendanceData, AttendanceRecord } from "@/data/mockAttendanceData";
import AttendanceFilterModal, { AttendanceFilterState } from "@/components/AttendanceFilterModal";
import EmployeeInfoModal from "@/components/EmployeeInfoModal";

export default function AttendancePage() {
  const [selectedDate, setSelectedDate] = useState("2025-10-01");
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = 10;
  const [isFilterOpen, setFilterOpen] = useState(false);
  const [filters, setFilters] = useState<AttendanceFilterState>({
    team: 'all',
    position: 'all'
  });
  const [isEmployeeModalOpen, setEmployeeModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<AttendanceRecord | null>(null);

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

  // Filter attendance data based on selected filters
  const filteredData = useMemo(() => {
    return mockAttendanceData.filter((record) => {
      const teamMatch = filters.team === 'all' || record.team === filters.team;
      const positionMatch = filters.position === 'all' || record.position === filters.position;
      return teamMatch && positionMatch;
    });
  }, [filters]);

  const handleEmployeeClick = (employee: AttendanceRecord) => {
    setSelectedEmployee(employee);
    setEmployeeModalOpen(true);
  };

  return (
    <main className="container mx-auto max-w-[1324px] pt-[90px] pb-12">
      {/* Top panel: title + date selector */}
      <Panel
        className="rounded-[14px] mb-4"
        title={
          <div className="-mx-6 px-7 pb-3 flex items-end gap-3">
            <h1 className="text-[24px] leading-[20px] font-bold text-[#252525]">근태</h1>
            <span className="text-[#808080]">|</span>
            <p className="text-[18px] leading-[20px] font-medium text-[#808080]">직원들의 출퇴근 현황을 확인하고 관리하세요</p>
          </div>
        }
        bodyClassName="px-7 pb-4 pt-3 border-t border-[#E2E2E2]"
      >
        {/* Date selector */}
        <div className="flex justify-center">
          <div className="h-[48px] bg-[#EDEDED] rounded-[12px] px-3 flex items-center gap-3">
            {/* Previous button */}
            <button
              onClick={() => navigateDate('prev')}
              className="w-[34px] h-[34px] bg-white border border-[#E2E2E2] rounded-[5px] flex items-center justify-center"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path
                  d="M15 18L9 12L15 6"
                  stroke="#B0B0B0"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            
            {/* Date display */}
            <div className="px-8 py-[6px] bg-white rounded-[5px]">
              <span className="text-[16px] font-bold text-[#252525]">
                {formatDate(selectedDate)}
              </span>
            </div>
            
            {/* Next button */}
            <button
              onClick={() => navigateDate('next')}
              className="w-[34px] h-[34px] bg-white border border-[#E2E2E2] rounded-[5px] flex items-center justify-center"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path
                  d="M9 18L15 12L9 6"
                  stroke="#B0B0B0"
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
            <h2 className="text-[18px] font-semibold text-[#000000]">출퇴근 현황</h2>
            <button 
              onClick={() => setFilterOpen(true)}
              className="w-6 h-6 border border-[#E2E2E2] rounded-[5px] flex items-center justify-center"
            >
              <svg width="18" height="18" viewBox="0 0 26 26" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M7 8C7 7.45 7.45 7 8 7H18C18.55 7 19 7.45 19 8V9.25C19 9.52 18.89 9.77 18.71 9.96L14.63 14.04C14.44 14.23 14.33 14.48 14.33 14.75V16.33L11.67 19V14.75C11.67 14.48 11.56 14.23 11.37 14.04L7.29 9.96C7.11 9.77 7 9.52 7 9.25V8Z" stroke="#B0B0B0" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
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
              <tr className="bg-[#EDEDED] text-[#808080]">
                <th className="px-6 h-[48px] rounded-l-[12px] text-[16px] font-bold">이름</th>
                <th className="px-6 h-[48px] text-[16px] font-bold">팀</th>
                <th className="px-6 h-[48px] text-[16px] font-bold">직급</th>
                <th className="px-6 h-[48px] text-[16px] font-bold">출근시간</th>
                <th className="px-6 h-[48px] text-[16px] font-bold">퇴근시간</th>
                <th className="px-6 h-[48px] rounded-r-[12px] text-[16px] font-bold">근무시간</th>
              </tr>
            </thead>
            <tbody className="text-[14px] text-[#252525]">
              {filteredData.map((record, index) => (
                <tr 
                  key={record.id} 
                  className="border-b-[0.4px] border-[#E2E2E2] cursor-pointer hover:bg-[#F8F8F8] transition-colors"
                  onClick={() => handleEmployeeClick(record)}
                >
                  <td className="px-6 h-[58px] align-middle opacity-80">{record.name}</td>
                  <td className="px-6 h-[58px] align-middle opacity-80">{record.team}</td>
                  <td className="px-6 h-[58px] align-middle opacity-80">{record.position}</td>
                  <td className="px-6 h-[58px] align-middle opacity-80">{record.clockIn}</td>
                  <td className="px-6 h-[58px] align-middle opacity-80">{record.clockOut}</td>
                  <td className="px-6 h-[58px] align-middle opacity-80 font-semibold">{record.workTime}</td>
                </tr>
              ))}
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
                stroke="#B0B0B0"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>

          {/* Page numbers */}
          {Array.from({ length: Math.min(10, totalPages) }, (_, i) => {
            const pageNum = i + 1;
            const isActive = pageNum === currentPage;
            return (
              <button
                key={i}
                onClick={() => setCurrentPage(pageNum)}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-[14px] ${
                  isActive 
                    ? "bg-[#252525] text-white" 
                    : "text-[#808080]"
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
                stroke="#B0B0B0"
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
