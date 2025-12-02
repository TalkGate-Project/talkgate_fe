"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ProjectsService } from "@/services/projects";
import CreateProjectModal from "@/components/projects/CreateProjectModal";
import SubscribeProjectModal from "@/components/projects/SubscribeProjectModal";
import { setSelectedProjectId, setUseAttendanceMenu } from "@/lib/project";
import Image from "next/image";
import projectAssignedCustomerImg from "@/assets/images/projects/project-assigned-customer.png";
import projectReservedItemImg from "@/assets/images/projects/project-reserved-item.png";

function ProjectsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<any[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [subscribeProject, setSubscribeProject] = useState<any | null>(null);
  const [subdomainError, setSubdomainError] = useState<string | null>(null);
  const montserratStyle = {
    fontFamily:
      'var(--font-montserrat), "Pretendard Variable", Pretendard, ui-sans-serif, system-ui',
  };
  // legacy inline modal state removed in favor of component

  useEffect(() => {
    document.title = "TalkGate - 프로젝트";

    // 서브도메인 에러 확인
    const error = searchParams.get("error");
    const subdomain = searchParams.get("subdomain");
    if (error === "invalid_subdomain" && subdomain) {
      setSubdomainError(
        `'${subdomain}' 서브도메인에 해당하는 프로젝트를 찾을 수 없습니다.`
      );
      // URL에서 에러 파라미터 제거 (히스토리 정리)
      const url = new URL(window.location.href);
      url.searchParams.delete("error");
      url.searchParams.delete("subdomain");
      window.history.replaceState({}, "", url.pathname);
    }
  }, [searchParams]);

  useEffect(() => {
    let mounted = true;
    ProjectsService.list()
      .then((res) => {
        if (!mounted) return;
        const payload: any = (res as any)?.data;
        const list = Array.isArray(payload) ? payload : payload?.data;
        setProjects(Array.isArray(list) ? list : []);
      })
      .catch(() => {
        if (!mounted) return;
        setProjects([]);
      })
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <main className="min-h-screen bg-white dark:bg-[#111111]">
      <div className="max-w-[1428px] mx-auto pt-[90px] pb-24">
        <h1 className="text-[32px] leading-[38px] font-bold text-[#252525] text-center mb-6">
          프로젝트 선택
        </h1>
        <p className="text-[18px] leading-[21px] text-[#808080] text-center">
          관리할 프로젝트를 선택하거나 새로운 프로젝트를 생성하세요
        </p>

        {/* 서브도메인 에러 알림 */}
        {subdomainError && (
          <div className="mt-6 mx-auto max-w-[688px] p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="flex items-center gap-3">
              <svg
                className="w-5 h-5 text-red-500 flex-shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <div className="flex-1">
                <p className="text-[14px] text-red-700 dark:text-red-300">
                  {subdomainError}
                </p>
                <p className="text-[12px] text-red-500 dark:text-red-400 mt-1">
                  아래에서 접근 가능한 프로젝트를 선택하거나 관리자에게
                  문의하세요.
                </p>
              </div>
              <button
                onClick={() => setSubdomainError(null)}
                className="text-red-400 hover:text-red-600 dark:text-red-500 dark:hover:text-red-300"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Projects row */}
        <div className="mt-20 grid grid-cols-1 lg:grid-cols-2 gap-x-[50px] gap-y-[40px]">
          {loading && (
            <div className="col-span-full text-center text-[#808080]">
              불러오는 중...
            </div>
          )}
          {!loading && projects.length === 0 && (
            <div className="col-span-full text-center text-[#808080]"></div>
          )}
          {projects.map((p: any) => (
            <div
              key={p.id}
              className="px-7 pt-6 pb-[30px] md:min-w-[688px] cursor-pointer rounded-[14px] shadow-[0_13px_61px_rgba(169,169,169,0.37)] bg-white border border-transparent hover:border-primary-60 hover:translate-y-[-20px] transition-colors transition-transform duration-300 ease-out"
              onClick={() => {
                setSelectedProjectId(p.id);
                // 근태 메뉴 사용 여부도 함께 저장
                setUseAttendanceMenu(p.useAttendanceMenu ?? false);
                router.push(`/projects/${p.id}/dashboard`);
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  {p.logoUrl ? (
                    <img
                      src={p.logoUrl}
                      alt={`${p.name} 로고`}
                      width={28}
                      height={28}
                      className="w-7 h-7 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-[#EDEDED]" />
                  )}
                  <div className="text-[18px] font-semibold text-[#000] truncate">
                    {p.name}
                  </div>
                  <div className="w-[72px] h-[24px] leading-[24px] text-center rounded-[30px] text-[12px] bg-neutral-30 text-neutral-70">
                    멤버 {p.memberCount ?? 0}명
                  </div>
                </div>
                <button
                  className="cursor-pointer h-[32px] px-4 rounded-[6px] bg-[#252525] text-white text-[13px] font-semibold hover:bg-[#3a3a3a] transition-colors flex-shrink-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSubscribeProject(p);
                  }}
                >
                  구독하기
                </button>
              </div>
              <div className="grid grid-cols-2 gap-6 mt-5">
                <div className="rounded-[14px] bg-white shadow-[6px_6px_54px_rgba(0,0,0,0.05)] p-5 flex items-center justify-between">
                  <div>
                    <div className="text-[16px] font-semibold text-[#252525]">
                      나에게 할당된 고객
                    </div>
                    <div
                      className="mt-2 text-[28px] font-bold tracking-[1px] text-[#252525] font-montserrat"
                      style={montserratStyle}
                    >
                      {p.assignedCustomerCount ?? 0}건
                    </div>
                  </div>
                  <Image
                    src={projectAssignedCustomerImg}
                    alt="할당 고객 아이콘"
                    width={60}
                    height={60}
                    className="w-[60px] h-[60px]"
                  />
                </div>
                <div className="rounded-[14px] bg-white shadow-[6px_6px_54px_rgba(0,0,0,0.05)] p-5 flex items-center justify-between">
                  <div>
                    <div className="text-[16px] font-semibold text-[#252525]">
                      오늘 예약 일정
                    </div>
                    <div
                      className="mt-2 text-[28px] font-bold tracking-[1px] text-[#252525] font-montserrat"
                      style={montserratStyle}
                    >
                      {p.todayScheduleCount ?? 0}건
                    </div>
                  </div>
                  <Image
                    src={projectReservedItemImg}
                    alt="예약 일정 아이콘"
                    width={60}
                    height={60}
                    className="w-[60px] h-[60px]"
                  />
                </div>
              </div>
            </div>
          ))}

          {/* Create new service */}
          <div
            className="rounded-[14px] border-2 border-dashed border-[#E2E2E2] hover:border-[#00E272] transition-colors duration-200 bg-white p-12 flex flex-col items-center justify-center min-h-[225px] cursor-pointer"
            onClick={() => setShowCreate(true)}
          >
            <div className="w-12 h-12 rounded-[12px] overflow-hidden grid place-items-center">
              <svg
                width="48"
                height="48"
                viewBox="0 0 48 48"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <circle cx="24" cy="24" r="24" fill="#EDEDED" />
                <path
                  d="M24 16V32M32 24L16 24"
                  stroke="#808080"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div className="mt-5 text-[16px] font-semibold text-[#252525]">
              새 프로젝트 생성
            </div>
            <div className="mt-2 text-[16px] font-medium text-[#808080]">
              새로운 고객관리 프로젝트를 만들어보세요
            </div>
          </div>
        </div>
      </div>

      {/* Create Modal (two-step) */}
      {showCreate && (
        <CreateProjectModal
          onClose={() => setShowCreate(false)}
          onCreated={async () => {
            // refresh list after creation
            const res = await ProjectsService.list();
            const payload: any = (res as any)?.data;
            const list = Array.isArray(payload) ? payload : payload?.data;
            setProjects(Array.isArray(list) ? list : []);
            setShowCreate(false);
          }}
        />
      )}

      {/* Subscribe Modal */}
      {subscribeProject && (
        <SubscribeProjectModal
          project={{
            id: subscribeProject.id,
            name: subscribeProject.name,
            logoUrl: subscribeProject.logoUrl,
            memberCount: subscribeProject.memberCount,
          }}
          onClose={() => setSubscribeProject(null)}
          onSubscribe={async (projectId) => {
            // TODO: 구독 API 호출 로직 구현
            console.log("Subscribe to project:", projectId);
            // 구독 성공 후 프로젝트 목록 새로고침 필요 시
            // const res = await ProjectsService.list();
            // const payload: any = (res as any)?.data;
            // const list = Array.isArray(payload) ? payload : payload?.data;
            // setProjects(Array.isArray(list) ? list : []);
          }}
        />
      )}
    </main>
  );
}

export default function ProjectsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ProjectsContent />
    </Suspense>
  );
}
