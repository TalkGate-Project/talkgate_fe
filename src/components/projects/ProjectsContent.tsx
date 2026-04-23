"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ProjectsService } from "@/services/projects";
import { ProjectPrivacyConsentService } from "@/services/projectPrivacyConsent";
import type { Project, ProjectSummary } from "@/types/projects";
import { ProjectSubscriptionStatus } from "@/types/projects";
import CreateProjectModal from "@/components/projects/CreateProjectModal";
import SubscribeProjectModal from "@/components/projects/SubscribeProjectModal";
import SubscribeProjectExpiredModal from "@/components/projects/SubscribeProjectExpiredModal";
import ProjectPrivacyConsentModal from "@/components/projects/ProjectPrivacyConsentModal";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import { setSelectedProjectId, setUseAttendanceMenu } from "@/lib/project";
import { getProjectSubdomainUrl, isDevelopment } from "@/lib/subdomain";
import {
  getAllowedPostAuthRedirect,
  POST_AUTH_REDIRECT_STORAGE_KEY,
} from "@/lib/postAuthRedirect";
import Image from "next/image";
import projectAssignedCustomerImg from "@/assets/images/projects/project-assigned-customer.webp";
import projectReservedItemImg from "@/assets/images/projects/project-reserved-item.webp";
import projectNotAssignedCustomerImg from "@/assets/images/projects/project-not-assigned-customer.webp";
import projectNotReservedItemImg from "@/assets/images/projects/project-not-reserved-item.webp";

export default function ProjectsContent() {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [subscribeProject, setSubscribeProject] = useState<ProjectSummary | null>(null);
  const [expiredProject, setExpiredProject] = useState<ProjectSummary | null>(null);
  const [subdomainError, setSubdomainError] = useState<string | null>(null);
  // 클릭된 프로젝트 ID (로딩 상태 표시 및 중복 클릭 방지용)
  const [selectingProjectId, setSelectingProjectId] = useState<number | null>(
    null
  );
  // 개인정보 처리 위탁 계약 동의 모달 상태
  // next: "none"  - 단순 동의 수집 (프로젝트 생성 직후 등)
  //        "subscribe" - 동의 후 구독 안내 모달 오픈
  //        "expired"   - 동의 후 만료 모달 오픈
  //        "navigate"  - 동의 후 대시보드 진입
  type ConsentNext = "none" | "subscribe" | "expired" | "navigate";
  const [consentTarget, setConsentTarget] = useState<{
    project: ProjectSummary;
    next: ConsentNext;
  } | null>(null);
  const montserratStyle = {
    fontFamily:
      'var(--font-montserrat), "Pretendard Variable", Pretendard, ui-sans-serif, system-ui',
  };
  // legacy inline modal state removed in favor of component

  useEffect(() => {
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

  // returnUrl 체크 및 리디렉션 (소셜 로그인 회원가입 플로우 후)
  useEffect(() => {
    if (typeof window === "undefined") return;
    
    // 1. URL 쿼리 파라미터에서 returnUrl 확인 (우선순위 높음)
    const urlParams = new URLSearchParams(window.location.search);
    const queryReturnUrl = urlParams.get("returnUrl") || urlParams.get("redirectUrl");
    
    // 2. sessionStorage에서 returnUrl 확인 (fallback)
    const storedRedirectUrl = sessionStorage.getItem(POST_AUTH_REDIRECT_STORAGE_KEY);
    
    // 쿼리 파라미터가 있으면 우선 사용, 없으면 sessionStorage 사용
    const redirectUrl =
      getAllowedPostAuthRedirect(queryReturnUrl) ??
      getAllowedPostAuthRedirect(storedRedirectUrl);

    if (storedRedirectUrl) {
      sessionStorage.removeItem(POST_AUTH_REDIRECT_STORAGE_KEY);
    }

    if (queryReturnUrl) {
      urlParams.delete("returnUrl");
      urlParams.delete("redirectUrl");
      const newUrl = urlParams.toString() 
        ? `${window.location.pathname}?${urlParams.toString()}`
        : window.location.pathname;
      window.history.replaceState({}, "", newUrl);
    }

    if (redirectUrl) {
      window.location.replace(redirectUrl);
    }
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

  // 대시보드 진입 로직을 헬퍼로 분리해 동의 모달 이후에도 재사용할 수 있도록 한다.
  const navigateToProject = (p: ProjectSummary) => {
    setSelectingProjectId(p.id);

    const isDev = isDevelopment();

    if (isDev) {
      setSelectedProjectId(p.id);
      setUseAttendanceMenu(p.useAttendanceMenu ?? false);
      window.location.href = "/dashboard";
      return;
    }

    if (p.subDomain) {
      const subdomainUrl = getProjectSubdomainUrl(p.subDomain, "/dashboard");
      if (subdomainUrl) {
        setSelectedProjectId(p.id);
        setUseAttendanceMenu(p.useAttendanceMenu ?? false);
        window.location.href = subdomainUrl;
        return;
      }
    }

    setSelectedProjectId(p.id);
    setUseAttendanceMenu(p.useAttendanceMenu ?? false);
    window.location.href = "/dashboard";
  };

  const resolveIsProjectAdmin = (p: ProjectSummary): boolean => {
    const projectRole = p.myRole ?? p.role;
    return projectRole === "admin";
  };

  // 클릭 시 동의 체크 -> 구독/진입 분기 순서로 단계별 API 호출을 수행한다.
  // 구독 안내 모달을 띄우기 전에도 반드시 동의 모달이 먼저 진행되도록 한다.
  const handleProjectClick = async (p: ProjectSummary) => {
    if (selectingProjectId !== null) return;

    const subscriptionStatus = p.subscriptionStatus;
    const isInactive = subscriptionStatus === ProjectSubscriptionStatus.Inactive;
    const isNoneOrUnsubscribed =
      subscriptionStatus === ProjectSubscriptionStatus.None ||
      !p.hasActiveSubscription;

    // 기본 next: 활성 구독이면 dashboard 이동, 비활성이면 만료 모달, 미구독이면 구독 안내 모달
    const next: ConsentNext = isInactive
      ? "expired"
      : isNoneOrUnsubscribed
        ? "subscribe"
        : "navigate";

    setSelectingProjectId(p.id);
    try {
      // 1단계: admin 여부 판별
      const isProjectAdmin = resolveIsProjectAdmin(p);

      // 2단계: admin 이면 동의 여부 확인 (구독 안내 모달을 띄우기 전에 먼저 진행)
      if (isProjectAdmin) {
        try {
          const res = await ProjectPrivacyConsentService.get(p.id);
          const isConsented = Boolean(res.data?.data?.isConsented);
          if (!isConsented) {
            setSelectingProjectId(null);
            setConsentTarget({ project: p, next });
            return;
          }
        } catch (error) {
          // 동의 상태 확인 실패 시 기존 흐름으로 진행 (UI 차단 방지)
          console.error("Failed to check project privacy consent:", error);
        }
      }

      // 3단계: 기존 분기 (만료 모달 / 구독 안내 모달 / 대시보드 진입)
      if (next === "expired") {
        setExpiredProject(p);
        return;
      }
      if (next === "subscribe") {
        setSubscribeProject(p);
        return;
      }
      navigateToProject(p);
    } finally {
      // 대시보드로 window.location.href 전환 중이면 스피너 유지, 그 외에는 해제
      if (next !== "navigate") {
        setSelectingProjectId(null);
      }
    }
  };

  const handleConsentConfirmed = () => {
    if (!consentTarget) return;
    const { project, next } = consentTarget;
    setConsentTarget(null);

    if (next === "expired") {
      setExpiredProject(project);
      return;
    }
    if (next === "subscribe") {
      setSubscribeProject(project);
      return;
    }
    if (next === "navigate") {
      navigateToProject(project);
    }
    // next === "none" 인 경우 별도 동작 없이 목록에 머문다.
  };

  return (
    <main className="min-h-screen bg-background px-6 lg:px-0">
      <div className="max-w-[1422px] mx-auto pt-6 md:pt-[90px] pb-24 ">
        <h1 className="text-[18px] md:text-[32px] leading-[38px] font-bold text-foreground text-center mb-3 md:mb-6 lg:mb-6">
          프로젝트 선택
        </h1>
        <p className="text-[14px] md:text-[18px] leading-[21px] text-neutral-60 text-center">
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
        <div className="mt-6 md:mt-9 lg:mt-20 grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-4 md:gap-y-10">
          {loading && (
            <div className="col-span-full flex items-center justify-center py-20">
              <LoadingSpinner size="2xl" />
            </div>
          )}
          {!loading && projects.length === 0 && (
            <div className="col-span-full text-center text-neutral-60"></div>
          )}
          {projects.map((p) => {
            const isSelecting = selectingProjectId === p.id;
            const isAnySelecting = selectingProjectId !== null;

            return (
              <div
                key={p.id}
                className={`px-4 md:px-7 pt-4 md:pt-6 pb-4 md:pb-[30px] md:min-w-[646px] rounded-[14px] shadow-[0_13px_61px_rgba(169,169,169,0.37)] dark:shadow-[0px_18px_28px_0px_rgba(9,30,66,0.1)] bg-card border transition-all duration-300 ease-out ${
                  isSelecting
                    ? "border-primary-60 opacity-80"
                    : isAnySelecting
                    ? "opacity-50 cursor-not-allowed border-transparent"
                    : "cursor-pointer border-transparent hover:border-primary-60 hover:translate-y-[-20px]"
                }`}
                onClick={() => {
                  if (isAnySelecting) return;
                  void handleProjectClick(p);
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
                      <div className="w-7 h-7 rounded-full bg-neutral-20" />
                    )}
                    <div className="text-[18px] font-semibold text-foreground truncate">
                      {p.name}
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-[72px] h-[24px] leading-[24px] text-center rounded-[30px] text-[12px] bg-neutral-30 text-neutral-70">
                        멤버 {p.memberCount ?? 0}명
                      </div>
                      <div
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{
                          backgroundColor: p.hasActiveSubscription
                            ? "var(--primary-60)"
                            : "var(--danger-40)",
                        }}
                      />
                    </div>
                  </div>
                  {/* 로딩 스피너 */}
                  {isSelecting && <LoadingSpinner size="sm" />}
                </div>
                <div className="grid grid-cols-2 gap-3 md:gap-6 mt-5">
                  <div className="rounded-[14px] bg-card shadow-[6px_6px_54px_rgba(0,0,0,0.05)] p-5 hidden md:flex items-center justify-between">
                    <div>
                      <div className="text-[13px] md:text-[16px] font-semibold text-foreground">
                        나에게 할당된 고객
                      </div>
                      <div
                        className="mt-2 text-[18px] md:text-[28px] font-bold tracking-[1px] text-foreground font-montserrat"
                        style={montserratStyle}
                      >
                        {p.assignedCustomerCount ?? 0}건
                      </div>
                    </div>
                    <Image
                      src={
                        p.hasActiveSubscription
                          ? projectAssignedCustomerImg
                          : projectNotAssignedCustomerImg
                      }
                      alt="할당 고객 아이콘"
                      width={60}
                      height={60}
                      className="w-[60px] h-[60px]"
                    />
                  </div>
                  <div className="rounded-[14px] bg-card shadow-[6px_6px_54px_rgba(0,0,0,0.05)] p-5 md:hidden">
                    <div className="text-[13px] md:text-[16px] font-semibold text-foreground">
                      나에게 할당된 고객
                    </div>
                    <div
                      className="mt-2 flex items-center justify-between gap-2 text-[28px] font-bold tracking-[1px] text-foreground font-montserrat"
                      style={montserratStyle}
                    >
                      <span className="text-[18px] md:text-[28px]">{p.assignedCustomerCount ?? 0}건</span>
                      <Image
                        src={
                          p.hasActiveSubscription
                            ? projectAssignedCustomerImg
                            : projectNotAssignedCustomerImg
                        }
                        alt="할당 고객 아이콘"
                        width={32}
                        height={32}
                      />
                    </div>
                  </div>
                  <div className="rounded-[14px] bg-card shadow-[6px_6px_54px_rgba(0,0,0,0.05)] p-5 hidden md:flex items-center justify-between">
                    <div>
                      <div className="text-[13px] md:text-[16px] font-semibold text-foreground">
                        오늘 예약 일정
                      </div>
                      <div
                        className="mt-2 text-[28px] font-bold tracking-[1px] text-foreground font-montserrat"
                        style={montserratStyle}
                      >
                        {p.todayScheduleCount ?? 0}건
                      </div>
                    </div>
                    <Image
                      src={
                        p.hasActiveSubscription
                          ? projectReservedItemImg
                          : projectNotReservedItemImg
                      }
                      alt="예약 일정 아이콘"
                      width={60}
                      height={60}
                      className="w-[60px] h-[60px]"
                    />
                  </div>
                  <div className="rounded-[14px] bg-card shadow-[6px_6px_54px_rgba(0,0,0,0.05)] p-5 md:hidden">
                    <div className="text-[13px] md:text-[16px] font-semibold text-foreground">
                      오늘 예약 일정
                    </div>
                    <div
                      className="mt-2 flex items-center justify-between gap-2 text-[18px] md:text-[28px] font-bold tracking-[1px] text-foreground font-montserrat"
                      style={montserratStyle}
                    >
                      <span className="text-[18px] md:text-[28px]">{p.todayScheduleCount ?? 0}건</span>
                      <Image
                        src={
                          p.hasActiveSubscription
                            ? projectReservedItemImg
                            : projectNotReservedItemImg
                        }
                        alt="예약 일정 아이콘"
                        width={32}
                        height={32}
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Create new service */}
          {!loading && (
            <div
              className={`rounded-[14px] border-2 border-dashed border-neutral-30 transition-colors duration-200 bg-card p-12 flex flex-col items-center justify-center min-h-[225px] ${
                loading
                  ? "opacity-50 cursor-not-allowed"
                  : "hover:border-primary-60 cursor-pointer"
              }`}
              onClick={() => {
                if (!loading) {
                  setShowCreate(true);
                }
              }}
            >
              <div className="w-12 h-12 rounded-[12px] overflow-hidden grid place-items-center">
                <svg
                  width="48"
                  height="48"
                  viewBox="0 0 48 48"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="[&_circle]:fill-[var(--neutral-20)] [&_path]:stroke-[var(--neutral-60)]"
                >
                  <circle cx="24" cy="24" r="24" />
                  <path
                    d="M24 16V32M32 24L16 24"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <div className="mt-5 text-[14px] md:text-[16px] font-semibold text-foreground">
                새 프로젝트 생성
              </div>
              <div className="mt-2 text-[13px] md:text-[16px] font-medium text-neutral-60">
                새로운 고객관리 프로젝트를 만들어보세요
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create Modal (two-step) */}
      {showCreate && (
        <CreateProjectModal
          onClose={() => setShowCreate(false)}
          onCreated={async (created?: Project) => {
            // refresh list after creation
            const res = await ProjectsService.list();
            const payload: any = (res as any)?.data;
            const list = Array.isArray(payload) ? payload : payload?.data;
            const nextProjects: ProjectSummary[] = Array.isArray(list) ? list : [];
            setProjects(nextProjects);
            setShowCreate(false);

            // 프로젝트 생성 직후: 생성자는 해당 프로젝트의 어드민이므로 동의 모달을 띄운다.
            if (!created?.id) return;
            try {
              const consentRes = await ProjectPrivacyConsentService.get(created.id);
              const isConsented = Boolean(consentRes.data?.data?.isConsented);
              if (isConsented) return;
              const summary =
                nextProjects.find((item) => item.id === created.id) ??
                ({
                  ...created,
                  myRole: "admin",
                  role: "admin",
                } as ProjectSummary);
              setConsentTarget({ project: summary, next: "none" });
            } catch (error) {
              console.error("Failed to check consent for created project:", error);
            }
          }}
        />
      )}

      {/* Subscribe Modal (none 상태용) */}
      {subscribeProject && (
        <SubscribeProjectModal
          project={{
            id: String(subscribeProject.id),
            name: subscribeProject.name,
            logoUrl: subscribeProject.logoUrl ?? undefined,
            memberCount: subscribeProject.memberCount,
          }}
          onClose={() => setSubscribeProject(null)}
          onSubscribe={async (projectId) => {
            // TODO: 구독 API 호출 로직 구현
            void projectId; // 추후 구현 시 사용
          }}
          onCouponApplied={async () => {
            const res = await ProjectsService.list();
            const payload: any = (res as any)?.data;
            const list = Array.isArray(payload) ? payload : payload?.data;
            setProjects(Array.isArray(list) ? list : []);
          }}
        />
      )}

      {/* Subscribe Expired Modal (inactive 상태용) */}
      {expiredProject && (
        <SubscribeProjectExpiredModal
          project={{
            id: expiredProject.id,
            name: expiredProject.name,
            logoUrl: expiredProject.logoUrl,
            memberCount: expiredProject.memberCount,
          }}
          userRole={expiredProject.myRole ?? expiredProject.role}
          onClose={() => setExpiredProject(null)}
        />
      )}

      {/* 개인정보 처리 위탁 계약 동의 모달 (임의 종료 불가) */}
      {consentTarget && (
        <ProjectPrivacyConsentModal
          projectId={consentTarget.project.id}
          projectName={consentTarget.project.name}
          onConfirmed={handleConsentConfirmed}
        />
      )}
    </main>
  );
}
