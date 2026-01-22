"use client";

import { useMemo, useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import { useSelectedProjectId } from "@/hooks/useSelectedProjectId";
import { useMyMember } from "@/hooks/useMyMember";
import { ProjectsService } from "@/services/projects";
import { AttendanceService } from "@/services/attendance";
import { useAttendanceMenu } from "@/hooks/useAttendanceMenu";
import { shouldShowAttendanceButton } from "@/utils/permissions";
import { showErrorModal } from "@/providers/ErrorFeedbackModalProvider";
import type { ProjectSummary } from "@/services/projects";

type GreetingBannerProps = {
  userName?: string | null;
  todayQuote?: string | null;
  loading?: boolean;
};

export default function GreetingBanner({ userName, todayQuote, loading }: GreetingBannerProps) {
  const gradient = "linear-gradient(90deg, var(--neutral-0) 65%, color-mix(in srgb, var(--primary-20) 35%, transparent))";
  const displayName = userName ? `${userName}님` : "팀원님";
  const [now, setNow] = useState(() => new Date());
  const [projectId, projectReady] = useSelectedProjectId();
  const queryClient = useQueryClient();
  const [isAttendanceMenuEnabled] = useAttendanceMenu();
  
  // 현재 사용자의 멤버 정보 (role 포함)
  const { member: myMember } = useMyMember(projectId);
  const currentRole = myMember?.role;
  
  // Update clock every second
  useEffect(() => {
    const interval = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formattedNow = useMemo(() => {
    return new Intl.DateTimeFormat("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "numeric",
      minute: "2-digit",
      second: "2-digit",
      hour12: false, 
    })
      .format(now)
      .replace(/\./g, ".") // Ensure consistent format if needed, though ko-KR usually does yyyy. mm. dd.
  }, [now]);
  
  // Format for "2025.09.19 오후 3:04:26" style as in screenshot
  const formattedDateString = useMemo(() => {
     const datePart = now.toLocaleDateString("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit" });
     const timePart = now.toLocaleTimeString("ko-KR", { hour12: true, hour: "numeric", minute: "2-digit", second: "2-digit" });
     return `${datePart} ${timePart}`;
  }, [now]);


  // 프로젝트 목록 조회
  const { data: projectsData } = useQuery<ProjectSummary[]>({
    queryKey: ["projects", "list"],
    queryFn: async () => {
      const res = await ProjectsService.list();
      const payload: any = (res as any)?.data;
      const list = Array.isArray(payload) ? payload : payload?.data;
      return Array.isArray(list) ? list : [];
    },
    staleTime: 5 * 60 * 1000,
    enabled: projectReady,
  });

  // 현재 선택된 프로젝트 찾기
  const currentProject = useMemo(() => {
    if (!projectId || !projectsData || !Array.isArray(projectsData)) return null;
    return projectsData.find((p: ProjectSummary) => String(p.id) === String(projectId)) || null;
  }, [projectId, projectsData]);

  const projectName = currentProject?.name || "프로젝트";
  const projectLogoUrl = currentProject?.logoUrl;
  
  // 출퇴근 버튼 표시 여부: 
  // 근태 메뉴를 사용하는 상태이면서 members/my API로 얻은 유저의 role이 관리자급(admin/subAdmin)이 아닐 경우에만 표시
  const showAttendance = isAttendanceMenuEnabled && shouldShowAttendanceButton(currentRole);

  // Attendance Logic
  const { data: myStatusData } = useQuery({
    queryKey: ["attendance", "myStatus", projectId],
    queryFn: () => AttendanceService.myStatus(String(projectId)),
    enabled: !!projectId && projectReady,
  });

  const isCheckedIn = myStatusData?.data?.data?.isCheckedIn ?? false;
  const attendanceAt = myStatusData?.data?.data?.todayAttendance?.attendanceAt;

  const checkInMutation = useMutation({
    mutationFn: () => AttendanceService.checkIn(String(projectId)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendance"] });
    },
    onError: (error: any) => {
      // 개발자용 로깅 (콘솔에만)
      console.error("Check-in failed:", error);
      
      // 사용자에게는 일반적인 친화적 메시지만 표시
      showErrorModal({
        type: "error",
        title: "출근 처리 실패",
        headline: "출근 처리에 실패했습니다",
        description: "잠시 후 다시 시도해주세요.",
        hideCancel: true,
      });
    },
  });

  const checkOutMutation = useMutation({
    mutationFn: () => AttendanceService.checkOut(String(projectId)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendance"] });
    },
    onError: (error: any) => {
      // 개발자용 로깅 (콘솔에만)
      console.error("Check-out failed:", error);
      
      // 사용자에게는 일반적인 친화적 메시지만 표시
      showErrorModal({
        type: "error",
        title: "퇴근 처리 실패",
        headline: "퇴근 처리에 실패했습니다",
        description: "잠시 후 다시 시도해주세요.",
        hideCancel: true,
      });
    },
  });

  const handleToggleAttendance = () => {
    if (!projectId) return;
    if (isCheckedIn) {
      if (confirm("퇴근하시겠습니까?")) {
        checkOutMutation.mutate();
      }
    } else {
      checkInMutation.mutate();
    }
  };

  // Timer for attendance duration
  const [elapsedTime, setElapsedTime] = useState<string>("");

  useEffect(() => {
    if (isCheckedIn && attendanceAt) {
      const updateTimer = () => {
        const start = new Date(attendanceAt).getTime();
        const current = new Date().getTime();
        const diff = current - start;
        
        if (diff >= 0) {
          const hours = Math.floor(diff / (1000 * 60 * 60));
          const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          const seconds = Math.floor((diff % (1000 * 60)) / 1000);
          setElapsedTime(`${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`);
        }
      };
      
      updateTimer(); // Initial call
      const interval = setInterval(updateTimer, 1000);
      return () => clearInterval(interval);
    } else {
      setElapsedTime("");
    }
  }, [isCheckedIn, attendanceAt]);


  return (
    <section
      className="surface md:rounded-[20px] lg:rounded-[32px] px-5 py-6 md:p-8 md:pl-[64px] md:pr-[76px] shadow-[6px_6px_54px_rgba(0,0,0,0.05)] md:h-[178px]"
      style={{
        background: gradient,
      }}
    >
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 md:gap-6 h-full">
        {/* Left: badge + title + quote */}
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            {loading || !projectReady ? (
              <div className="w-7 h-7 rounded-full bg-neutral-20 animate-pulse" />
            ) : projectLogoUrl ? (
              <div className="w-7 h-7 rounded-full overflow-hidden bg-neutral-90 grid place-items-center flex-shrink-0">
                <Image
                  src={projectLogoUrl}
                  alt={projectName}
                  width={28}
                  height={28}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="w-7 h-7 rounded-full bg-neutral-90 text-neutral-0 grid place-items-center flex-shrink-0">
                <span className="text-[14px] font-semibold">
                  {projectName.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <div className="text-[14px] md:text-[16px] lg:text-[16px] font-medium leading-[19px] tracking-[-0.02em] text-neutral-90">
              {loading || !projectReady ? (
                <span className="inline-flex h-5 w-40 animate-pulse rounded bg-neutral-20" />
              ) : (
                projectName
              )}
            </div>
          </div>
          <h1 className="mt-3 md:mt-[12px] text-[24px] md:text-[32px] lg:text-[32px] leading-[30px] md:leading-[38px] font-bold tracking-[-0.114286px] text-foreground">
            {loading ? (
              <span className="inline-flex h-8 w-60 animate-pulse rounded bg-neutral-20" />
            ) : (
              <>안녕하세요, {displayName} 👋</>
            )}
          </h1>
          <p className="mt-2 md:mt-[14px] text-[14px] md:text-[18px] leading-[18px] md:leading-[21px] font-medium tracking-[-0.04em] text-figma-muted">
            {loading ? (
              <span className="inline-flex h-6 w-80 animate-pulse rounded bg-neutral-20" />
            ) : todayQuote ? (
              <>"{todayQuote}"</>
            ) : (
              "-"
            )}
          </p>
        </div>

        {/* Right (Desktop) / Bottom (Mobile): timestamp + actions */}
        <div className="flex flex-col md:flex-col items-start md:items-end gap-3 md:justify-between md:h-full">
          {/* Timestamp - 모바일에서는 상단, 데스크톱에서는 하단 */}
          <div className="text-[14px] md:text-[18px] leading-[17px] md:leading-[21px] font-medium tracking-[-0.04em] text-figma-muted">
            {loading ? (
              <span className="inline-flex h-5 w-44 animate-pulse rounded bg-neutral-20" />
            ) : (
              formattedDateString
            )}
          </div>
          
          {/* Spacer for desktop layout */}
          <div className="hidden md:block" />
          
          {/* Attendance buttons - 모바일에서는 가장 아래 */}
          {showAttendance && (
            <div className="flex items-center gap-3 w-full md:w-auto">
              {isCheckedIn ? (
                  // Checked In State
                  <div className="flex items-center gap-3 w-full md:w-auto">
                      {/* 모바일: 퇴근하기 먼저 / 데스크톱: 근무중 먼저 */}
                      <button 
                          onClick={handleToggleAttendance}
                          disabled={checkOutMutation.isPending}
                          className="md:order-2 w-[72px] md:w-auto flex-shrink-0 h-[34px] px-0 md:px-3 rounded-[8px] md:rounded-[5px] border border-[#808080] bg-neutral-90 text-[14px] font-semibold tracking-[-0.02em] text-neutral-20 hover:bg-neutral-80 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                      >
                          {checkOutMutation.isPending ? "처리중..." : "퇴근하기"}
                      </button>
                      <div className="md:order-1 w-[152px] md:w-auto flex-shrink-0 h-[34px] md:px-3 rounded-[8px] md:rounded-[5px] border border-neutral-30 md:border-neutral-60 bg-neutral-10 md:bg-transparent flex items-center justify-center gap-2">
                          <span className="text-[14px] font-semibold tracking-[-0.02em] text-neutral-90 truncate">
                            🕑 근무중 {elapsedTime}
                          </span>
                      </div>
                  </div>
              ) : (
                  // Checked Out State (Default)
                  <div className="flex items-center gap-3 w-full md:w-auto">
                      {/* 모바일: 출근하기 먼저 / 데스크톱: 퇴근상태 먼저 */}
                      <button 
                          onClick={handleToggleAttendance}
                          disabled={checkInMutation.isPending}
                          className="md:order-2 w-[72px] md:w-auto flex-shrink-0 h-[34px] px-0 md:px-3 rounded-[8px] md:rounded-[5px] text-[14px] font-semibold tracking-[-0.02em] bg-neutral-90 text-neutral-0 hover:bg-neutral-80 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                      >
                          {checkInMutation.isPending ? "처리중..." : "출근하기"}
                      </button>
                      <div className="md:order-1 w-[152px] md:w-auto flex-shrink-0 h-[34px] px-4 md:px-3 rounded-[8px] md:rounded-[5px] border border-neutral-30 md:border-neutral-60 bg-neutral-10 md:bg-transparent flex items-center justify-center">
                           <span className="text-[14px] font-semibold tracking-[-0.02em] text-danger-40 truncate">
                             ● 퇴근상태
                           </span>
                      </div>
                  </div>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}