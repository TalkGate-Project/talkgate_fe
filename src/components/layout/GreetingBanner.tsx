"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import { useSelectedProjectId } from "@/hooks/useSelectedProjectId";
import { ProjectsService } from "@/services/projects";
import type { ProjectSummary } from "@/services/projects";

type GreetingBannerProps = {
  userName?: string | null;
  todayQuote?: string | null;
  loading?: boolean;
};

export default function GreetingBanner({ userName, todayQuote, loading }: GreetingBannerProps) {
  const gradient = "linear-gradient(90deg, var(--neutral-0) 65%, color-mix(in srgb, var(--primary-20) 35%, transparent))";
  const displayName = userName ? `${userName}님` : "팀원님";
  const [now] = useState(() => new Date());
  const [projectId, projectReady] = useSelectedProjectId();
  
  const formattedNow = useMemo(() => {
    return new Intl.DateTimeFormat("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "numeric",
      minute: "2-digit",
      second: "2-digit",
    })
      .format(now)
      .replace(".", ".");
  }, [now]);

  // 프로젝트 목록 조회
  const { data: projectsData } = useQuery<ProjectSummary[]>({
    queryKey: ["projects", "list"],
    queryFn: async () => {
      const res = await ProjectsService.list();
      // API 응답 구조에 따라 안전하게 배열 추출
      const payload: any = (res as any)?.data;
      const list = Array.isArray(payload) ? payload : payload?.data;
      return Array.isArray(list) ? list : [];
    },
    staleTime: 5 * 60 * 1000, // 5분간 캐시
    enabled: projectReady,
  });

  // 현재 선택된 프로젝트 찾기
  const currentProject = useMemo(() => {
    if (!projectId || !projectsData || !Array.isArray(projectsData)) return null;
    return projectsData.find((p: ProjectSummary) => String(p.id) === String(projectId)) || null;
  }, [projectId, projectsData]);

  const projectName = currentProject?.name || "프로젝트";
  const projectLogoUrl = currentProject?.logoUrl;

  return (
    <section
      className="surface rounded-[32px] p-6 md:p-8 shadow-[6px_6px_54px_rgba(0,0,0,0.05)]"
      style={{
        background: gradient,
      }}
    >
      <div className="flex items-start justify-between gap-6">
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
            <div className="text-[16px] font-medium leading-[19px] tracking-[-0.02em] text-neutral-90">
              {loading || !projectReady ? (
                <span className="inline-flex h-5 w-40 animate-pulse rounded bg-neutral-20" />
              ) : (
                projectName
              )}
            </div>
          </div>
          <h1 className="mt-4 text-[32px] leading-[38px] font-bold tracking-[-0.114286px] text-foreground">
            {loading ? (
              <span className="inline-flex h-8 w-60 animate-pulse rounded bg-neutral-20" />
            ) : (
              <>안녕하세요, {displayName} 👋</>
            )}
          </h1>
          <p className="mt-3 text-[18px] leading-[21px] font-medium tracking-[-0.04em] text-figma-muted">
            {loading ? (
              <span className="inline-flex h-6 w-80 animate-pulse rounded bg-neutral-20" />
            ) : todayQuote ? (
              <>“{todayQuote}”</>
            ) : (
              "-"
            )}
          </p>
        </div>

        {/* Right: actions + timestamp */}
        <div className="flex flex-col items-end gap-3 self-center">
          <div className="flex items-center gap-3">
            <button className="h-[34px] px-3 rounded-[5px] border border-neutral-50 bg-neutral-0 text-[14px] font-semibold tracking-[-0.02em] text-danger-40">
              ● 퇴근상태
            </button>
            <button className="h-[34px] px-3 rounded-[5px] text-[14px] font-semibold tracking-[-0.02em] bg-neutral-90 text-neutral-40">
              퇴근하기
            </button>
          </div>
          <div className="text-[18px] leading-[21px] font-medium tracking-[-0.04em] text-figma-muted">
            {loading ? (
              <span className="inline-flex h-5 w-44 animate-pulse rounded bg-neutral-20" />
            ) : (
              formattedNow
            )}
          </div>
        </div>
      </div>
    </section>
  );
}


