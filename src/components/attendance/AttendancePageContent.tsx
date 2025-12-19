"use client";

import { Suspense, useEffect, useMemo, useState, useCallback } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { format } from "date-fns";
import AttendanceFilterModal, {
  AttendanceFilterState,
} from "@/components/attendance/AttendanceFilterModal";
import EmployeeInfoModal from "@/components/attendance/EmployeeInfoModal";
import AttendanceHeader from "@/components/attendance/AttendanceHeader";
import AttendanceTable from "@/components/attendance/AttendanceTable";
import { getSelectedProjectId } from "@/lib/project";
import { useAttendanceMenu } from "@/hooks/useAttendanceMenu";
import type { AttendanceRecord } from "@/types/attendance";
import { AttendanceItem } from "@/types/attendance";
import { useAttendanceList } from "@/hooks/useAttendanceList";
import { useAttendanceDate } from "@/hooks/useAttendanceDate";
import { formatHm, computeWorkTime } from "@/utils/attendance";
import { showErrorModal } from "@/providers/ErrorFeedbackModalProvider";

function AttendancePageContentInner() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isAttendanceMenuEnabled, attendanceReady] = useAttendanceMenu();

  const [projectId, setProjectId] = useState<string | null>(null);
  const { date: selectedDate, setDate: setSelectedDate, navigateDate } = useAttendanceDate();
  
  const [isFilterOpen, setFilterOpen] = useState(false);
  const [filters, setFilters] = useState<AttendanceFilterState>({
    team: "all",
    position: "all",
  });
  const [isEmployeeModalOpen, setEmployeeModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] =
    useState<AttendanceRecord | null>(null);

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

  // 근태 메뉴 사용 여부 체크
  useEffect(() => {
    if (!attendanceReady) return;

    if (!isAttendanceMenuEnabled) {
      // 근태 메뉴가 비활성화된 경우 대시보드로 리다이렉트
      showErrorModal({
        title: "알림",
        headline: "근태 메뉴는 현재 비활성화되어 있습니다.",
        description: "대시보드로 이동합니다.",
        confirmText: "확인",
        cancelText: null,
        hideCancel: true,
        onConfirm: () => {
          router.replace("/dashboard");
        },
      });
    }
  }, [isAttendanceMenuEnabled, attendanceReady, router]);

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

  const handleNavigateDate = (direction: "prev" | "next") => {
    navigateDate(direction);
    // 날짜 변경 시 페이지를 1로 리셋
    persistQuery({ page: 1 });
  };

  const handlePageChange = (page: number) => {
    if (loading) return;
    if (page === currentPage) return;
    persistQuery({ page });
  };

  // Data fetching hook
  const { rows, totalPages, loading, error } = useAttendanceList({
    projectId,
    date: selectedDate,
    page: currentPage,
    limit,
  });

  // 서버 데이터 필터링 (현재 스웨거 기준 서버가 팀/포지션 필터는 제공하지 않으므로 클라이언트 필터만 적용)
  const filteredData = useMemo(() => {
    return rows.filter((r) => {
      const teamMatch = filters.team === "all" || r.teamName === filters.team;
      const positionMatch =
        filters.position === "all" || String(r.role) === filters.position;
      return teamMatch && positionMatch;
    });
  }, [filters, rows]);

  const handleEmployeeClick = (employee: AttendanceItem) => {
    const mapped: AttendanceRecord = {
      id: employee.memberId, // Use memberId instead of attendance record id
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

  // 근태 메뉴가 준비되지 않았거나 비활성화된 경우 로딩 표시
  if (!attendanceReady || !isAttendanceMenuEnabled) {
    return (
      <main className="min-h-[calc(100vh-54px)] bg-neutral-10">
        <div className="mx-auto max-w-[1324px] w-full px-0 pt-9 pb-12">
          <div className="flex items-center justify-center h-64">
            <div className="text-neutral-60">페이지를 확인하는 중...</div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-[calc(100vh-54px)] bg-neutral-10">
      <div className="mx-auto max-w-[1324px] w-full px-0 pt-9 pb-12">
        {/* Top panel: title + date selector */}
        <AttendanceHeader
          selectedDate={selectedDate}
          onNavigateDate={handleNavigateDate}
          onDateChange={(d) => {
            setSelectedDate(format(d, "yyyy-MM-dd"));
            persistQuery({ page: 1 });
          }}
        />

        {/* Bottom area: attendance table */}
        <AttendanceTable
          rows={filteredData}
          loading={loading}
          error={error}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
          onRowClick={handleEmployeeClick}
          onFilterClick={() => setFilterOpen(true)}
        />

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

export default function AttendancePageContent() {
  return (
    <Suspense
      fallback={
        <main className="min-h-[calc(100vh-54px)] bg-neutral-10">
          <div className="mx-auto max-w-[1324px] w-full px-0 pt-9 pb-12">
            <div className="text-neutral-60">불러오는 중...</div>
          </div>
        </main>
      }
    >
      <AttendancePageContentInner />
    </Suspense>
  );
}

