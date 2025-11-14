"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ProjectsService } from "@/services/projects";
import CreateProjectModal from "@/components/projects/CreateProjectModal";
import { setSelectedProjectId, setUseAttendanceMenu } from "@/lib/project";
import Image from "next/image";
import projectAssignedCustomerImg from "@/assets/images/projects/project-assigned-customer.png";
import projectReservedItemImg from "@/assets/images/projects/project-reserved-item.png";

export default function ProjectsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<any[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const montserratStyle = {
    fontFamily:
      'var(--font-montserrat), "Pretendard Variable", Pretendard, ui-sans-serif, system-ui',
  };
  // legacy inline modal state removed in favor of component

  useEffect(() => {
    document.title = "TalkGate - 프로젝트";
  }, []);

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
          관리할 서비스를 선택하거나 새로운 서비스를 생성하세요
        </p>

        {/* Projects row */}
        <div className="mt-20 grid grid-cols-1 lg:grid-cols-2 gap-x-[50px] gap-y-[40px]">
          {loading && (
            <div className="col-span-full text-center text-[#808080]">
              불러오는 중...
            </div>
          )}
          {!loading && projects.length === 0 && (
            <div className="col-span-full text-center text-[#808080]">
              표시할 프로젝트가 없습니다.
            </div>
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
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-3 min-w-0">
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
                </div>
                <div className="w-[72px] h-[24px] leading-[24px] text-center rounded-[30px] text-[12px] bg-neutral-30 text-neutral-70 traslate-y-[-2px]">
                  멤버 {p.memberCount ?? 0}명
                </div>
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
              새 서비스 생성
            </div>
            <div className="mt-2 text-[16px] font-medium text-[#808080]">
              새로운 고객관리 서비스를 만들어보세요
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
    </main>
  );
}
