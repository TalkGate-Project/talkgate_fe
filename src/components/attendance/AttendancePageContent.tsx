"use client";

import { Suspense, useEffect, useMemo, useState, useCallback } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { format } from "date-fns";
import AttendanceFilterModal, {
  AttendanceFilterState,
} from "@/components/attendance/AttendanceFilterModal";
import TeamMemberInfoModal from "@/components/settings/teamManagement/TeamMemberInfoModal";
import AttendanceHeader from "@/components/attendance/AttendanceHeader";
import AttendanceTable from "@/components/attendance/AttendanceTable";
import { getSelectedProjectId } from "@/lib/project";
import { useAttendanceMenu } from "@/hooks/useAttendanceMenu";
import { useMyMember } from "@/hooks/useMyMember";
import { AttendanceItem } from "@/types/attendance";
import { useAttendanceList } from "@/hooks/useAttendanceList";
import { useAttendanceDate } from "@/hooks/useAttendanceDate";

function AttendancePageContentInner() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isAttendanceMenuEnabled, attendanceReady] = useAttendanceMenu();
  const { loading: memberLoading } = useMyMember();

  const [projectId, setProjectId] = useState<string | null>(null);
  const { date: selectedDate, setDate: setSelectedDate, navigateDate } = useAttendanceDate();
  
  const [isFilterOpen, setFilterOpen] = useState(false);
  const [filters, setFilters] = useState<AttendanceFilterState>({
    team: "all",
    position: "all",
  });
  const [isEmployeeModalOpen, setEmployeeModalOpen] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState<number | null>(null);

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
  // 백엔드에서 권한 기반 필터링을 처리하므로 프론트엔드에서는 권한 체크 불필요
  useEffect(() => {
    if (!attendanceReady || memberLoading) return;

    // 근태 메뉴가 비활성화된 경우 대시보드로 리다이렉트
    if (!isAttendanceMenuEnabled) {
      router.replace("/dashboard");
    }
  }, [isAttendanceMenuEnabled, attendanceReady, memberLoading, router]);

  useEffect(() => {
    const id = getSelectedProjectId();
    setProjectId(id || null);
  }, []);

  // 백엔드에서 권한 기반 필터링을 처리하므로 프론트엔드에서 팀장 필터링 로직 제거

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

  // 권한 관련 에러가 발생한 경우 대시보드로 리디렉션
  useEffect(() => {
    if (error && (
      error.includes("Only admin") || 
      error.includes("admin can perform") ||
      error.includes("권한") ||
      error.includes("permission") ||
      error.includes("access denied")
    )) {
      router.replace("/dashboard");
    }
  }, [error, router]);

  // 근태 데이터에서 고유한 팀 목록 추출
  const teamOptions = useMemo(() => {
    const teamSet = new Set<string>();
    rows.forEach((row) => {
      const teamName = row.teamName?.trim() || null;
      if (teamName) {
        teamSet.add(teamName);
      } else {
        teamSet.add("배정되지않음");
      }
    });
    
    const teamList = Array.from(teamSet).sort((a, b) => {
      // "배정되지않음"은 맨 뒤로
      if (a === "배정되지않음") return 1;
      if (b === "배정되지않음") return -1;
      return a.localeCompare(b, "ko");
    });
    
    return [
      { label: "전체", value: "all" },
      ...teamList.map((team) => ({ label: team, value: team })),
    ];
  }, [rows]);

  // 서버 데이터 필터링 (팀/포지션 필터만 클라이언트에서 적용)
  // 백엔드에서 권한 기반 필터링을 처리하므로 프론트엔드에서는 UI 필터만 적용
  const filteredData = useMemo(() => {
    return rows.filter((r) => {
      const teamMatch = filters.team === "all" || (filters.team === "배정되지않음" ? !r.teamName?.trim() : r.teamName === filters.team);
      const positionMatch =
        filters.position === "all" || 
        (filters.position === "팀장" && r.role === "leader") ||
        (filters.position === "팀원" && r.role === "member");
      return teamMatch && positionMatch;
    });
  }, [filters, rows]);

  const handleEmployeeClick = (employee: AttendanceItem) => {
    setSelectedMemberId(employee.memberId);
    setEmployeeModalOpen(true);
  };

  // 근태 메뉴가 준비되지 않았거나 비활성화된 경우 로딩 표시
  if (!attendanceReady || memberLoading || !isAttendanceMenuEnabled) {
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
      <div className="mx-auto max-w-[1324px] w-full px-0 md:pt-9 md:pb-12">
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
          teamOptions={teamOptions}
        />

        {/* Employee Info Modal */}
        {selectedMemberId && (
          <TeamMemberInfoModal
            open={isEmployeeModalOpen}
            onClose={() => {
              setEmployeeModalOpen(false);
              setSelectedMemberId(null);
            }}
            memberId={selectedMemberId}
            projectId={projectId}
          />
        )}
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

