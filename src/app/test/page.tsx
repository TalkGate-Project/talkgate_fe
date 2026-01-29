"use client";

import { useState, useEffect } from "react";
import TableSkeletonRow from "@/components/common/TableSkeletonRow";
import ChartSkeleton from "@/components/common/ChartSkeleton";
import ScheduleSkeleton from "@/components/dashboard/ScheduleSkeleton";
import RankingSkeleton from "@/components/dashboard/RankingSkeleton";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import { showConfirmModal } from "@/providers/ConfirmModalProvider";
import { showErrorModal } from "@/lib/errorModalEvents";
import { usePersistentModal } from "@/providers/PersistentModalProvider";
import SubscribeProjectExpiredModal from "@/components/projects/SubscribeProjectExpiredModal";
import ReactivateSubscriptionModal from "@/components/my-settings/ReactivateSubscriptionModal";
import PartnerRequestModal from "@/components/dashboard/PartnerRequestModal";
import type { ProjectPartnerRequest } from "@/types/projectPartners";

const THEME_STORAGE_KEY = "talkgate-theme";

export default function TestPage() {
  const persistentModal = usePersistentModal();
  const [loadingStates, setLoadingStates] = useState({
    button1: false,
    button2: false,
    button3: false,
    table: false,
    tableRow: false,
    chart: false,
    schedule: false,
    ranking: false,
  });
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [showExpiredModal, setShowExpiredModal] = useState(false);
  const [expiredModalRole, setExpiredModalRole] = useState<"admin" | "subAdmin" | "member" | undefined>(undefined);
  const [showReactivateModal, setShowReactivateModal] = useState(false);
  const [isReactivating, setIsReactivating] = useState(false);
  const [showPartnerRequestModal, setShowPartnerRequestModal] = useState(false);

  // 테스트용 파트너 요청 더미 데이터
  const dummyPartnerRequests: ProjectPartnerRequest[] = [
    {
      id: 1,
      projectId: 100,
      projectName: "스마트 영업 지원",
      projectLogoUrl: "",
      partnerProjectId: 1,
      status: "pending",
      createdAt: "2026-01-29T08:00:00.000Z",
      updatedAt: "2026-01-29T08:00:00.000Z",
    },
    {
      id: 2,
      projectId: 101,
      projectName: "거래소 텔레마케팅 관리",
      projectLogoUrl: "",
      partnerProjectId: 1,
      status: "pending",
      createdAt: "2026-01-29T09:00:00.000Z",
      updatedAt: "2026-01-29T09:00:00.000Z",
    },
  ];

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || typeof window === "undefined") return;

    const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
    const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;

    const initialTheme = storedTheme === "dark" || storedTheme === "light"
      ? storedTheme
      : prefersDark
        ? "dark"
        : "light";

    setIsDarkMode(initialTheme === "dark");
  }, [mounted]);

  useEffect(() => {
    if (!mounted || typeof document === "undefined") return;

    const theme = isDarkMode ? "dark" : "light";
    const root = document.documentElement;
    root.dataset.theme = theme;
    root.classList.toggle("dark", isDarkMode);

    if (typeof window !== "undefined") {
      window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    }
  }, [mounted, isDarkMode]);

  const handleToggleTheme = () => {
    setIsDarkMode((prev) => !prev);
  };

  const handleButtonClick = (key: keyof typeof loadingStates, duration: number = 2000) => {
    setLoadingStates((prev) => ({ ...prev, [key]: true }));
    setTimeout(() => {
      setLoadingStates((prev) => ({ ...prev, [key]: false }));
    }, duration);
  };

  return (
    <div className="min-h-screen bg-neutral-0 p-8">
      <div className="max-w-7xl mx-auto">
        {/* 다크모드 토글 버튼 */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-neutral-90">컴포넌트 테스트 페이지</h1>
          <button
            onClick={handleToggleTheme}
            className="px-4 py-2 bg-neutral-90 dark:bg-neutral-20 text-neutral-0 dark:text-neutral-90 rounded-lg hover:opacity-80 transition-opacity flex items-center gap-2"
            aria-label={isDarkMode ? "라이트 모드로 전환" : "다크 모드로 전환"}
          >
            {isDarkMode ? (
              <>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M12 3V5M12 19V21M5 12H3M21 12H19M6.343 6.343L4.929 4.929M19.071 19.071L17.657 17.657M6.343 17.657L4.929 19.071M19.071 4.929L17.657 6.343M16 12C16 14.2091 14.2091 16 12 16C9.79086 16 8 14.2091 8 12C8 9.79086 9.79086 8 12 8C14.2091 8 16 9.79086 16 12Z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span>라이트 모드</span>
              </>
            ) : (
              <>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span>다크 모드</span>
              </>
            )}
          </button>
        </div>

        {/* 버튼 로딩 상태 테스트 */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-neutral-90 mb-4">버튼 로딩 상태</h2>
          <div className="flex flex-wrap gap-4">
            <button
              onClick={() => handleButtonClick("button1", 2000)}
              disabled={loadingStates.button1}
              className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loadingStates.button1 ? (
                <span className="flex items-center gap-2">
                  <LoadingSpinner size="sm" />
                  로딩 중...
                </span>
              ) : (
                "버튼 1 (2초)"
              )}
            </button>

            <button
              onClick={() => handleButtonClick("button2", 3000)}
              disabled={loadingStates.button2}
              className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loadingStates.button2 ? (
                <span className="flex items-center gap-2">
                  <LoadingSpinner size="sm" />
                  처리 중...
                </span>
              ) : (
                "버튼 2 (3초)"
              )}
            </button>

            <button
              onClick={() => handleButtonClick("button3", 1500)}
              disabled={loadingStates.button3}
              className="px-6 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loadingStates.button3 ? (
                <span className="flex items-center gap-2">
                  <LoadingSpinner size="sm" />
                  저장 중...
                </span>
              ) : (
                "버튼 3 (1.5초)"
              )}
            </button>
          </div>
        </section>

        {/* 테이블 행 스켈레톤 테스트 */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-semibold text-neutral-90">테이블 행 스켈레톤 (TableSkeletonRow)</h2>
            <div className="text-sm text-neutral-60 bg-neutral-10 px-3 py-1 rounded">
              <span className="font-semibold text-primary-60">✓ 동일 컴포넌트 사용</span>
            </div>
          </div>
          <div className="mb-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-sm text-neutral-70 dark:text-neutral-50">
              <span className="font-semibold">컴포넌트:</span> <code className="bg-white dark:bg-neutral-20 px-1 rounded">@/components/common/TableSkeletonRow</code>
            </p>
            <p className="text-sm text-neutral-70 dark:text-neutral-50 mt-1">
              <span className="font-semibold">실제 사용 위치:</span>
            </p>
            <ul className="text-sm text-neutral-70 dark:text-neutral-50 mt-1 ml-4 list-disc">
              <li><code className="bg-white dark:bg-neutral-20 px-1 rounded">CustomersTable.tsx</code> - 고객 목록 테이블 (체크박스 포함)</li>
              <li><code className="bg-white dark:bg-neutral-20 px-1 rounded">RegistrationDetailTable.tsx</code> - 신청통계 상세 데이터 테이블</li>
              <li><code className="bg-white dark:bg-neutral-20 px-1 rounded">AttendanceTable.tsx</code> - 출퇴근 현황 테이블</li>
              <li><code className="bg-white dark:bg-neutral-20 px-1 rounded">NoticeTable.tsx</code> - 공지사항 테이블</li>
              <li><code className="bg-white dark:bg-neutral-20 px-1 rounded">AssignMemberTable.tsx</code> - 배정통계 팀원별 테이블</li>
              <li><code className="bg-white dark:bg-neutral-20 px-1 rounded">PaymentMemberTable.tsx</code> - 매출통계 팀원별 테이블</li>
            </ul>
            <p className="text-xs text-neutral-60 dark:text-neutral-50 mt-2 italic">
              💡 이 스켈레톤을 수정하면 위 컴포넌트들의 로딩 상태도 함께 변경됩니다.
            </p>
          </div>
          <div className="bg-white dark:bg-neutral-10 rounded-lg border border-neutral-60 p-6">
            <div className="mb-4">
              <button
                onClick={() => handleButtonClick("tableRow", 3000)}
                disabled={loadingStates.tableRow}
                className="px-4 py-2 bg-neutral-70 text-white rounded hover:bg-neutral-80 disabled:opacity-50"
              >
                {loadingStates.tableRow ? "로딩 중..." : "테이블 행 로딩 시뮬레이션"}
              </button>
            </div>
            {loadingStates.tableRow ? (
              <div className="overflow-hidden rounded-[12px]">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-neutral-20 h-[40px]">
                      <th className="text-left px-4 pl-[30px] text-[16px] font-medium text-neutral-70 rounded-l-[8px]">날짜</th>
                      <th className="text-left px-4 text-[16px] font-medium text-neutral-70">신청 건수</th>
                      <th className="text-left px-4 text-[16px] font-medium text-neutral-70">직접입력</th>
                      <th className="text-left px-4 text-[16px] font-medium text-neutral-70">엑셀 업로드</th>
                      <th className="text-left px-4 text-[16px] font-medium text-neutral-70 rounded-r-[8px]">API</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Array.from({ length: 10 }).map((_, idx) => (
                      <TableSkeletonRow
                        key={`skeleton-${idx}`}
                        columns={[
                          { width: "flex", paddingX: 7.5, className: "pl-[30px]" }, // 날짜
                          { width: "flex", paddingX: 4 }, // 신청 건수
                          { width: "flex", paddingX: 4 }, // 직접입력
                          { width: "flex", paddingX: 4 }, // 엑셀 업로드
                          { width: "flex", paddingX: 4 }, // API
                        ]}
                        rowHeight={48}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="overflow-hidden rounded-[12px]">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-neutral-20 h-[40px]">
                      <th className="text-left px-4 pl-[30px] text-[16px] font-medium text-neutral-70 rounded-l-[8px]">날짜</th>
                      <th className="text-left px-4 text-[16px] font-medium text-neutral-70">신청 건수</th>
                      <th className="text-left px-4 text-[16px] font-medium text-neutral-70">직접입력</th>
                      <th className="text-left px-4 text-[16px] font-medium text-neutral-70">엑셀 업로드</th>
                      <th className="text-left px-4 text-[16px] font-medium text-neutral-70 rounded-r-[8px]">API</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-neutral-30/40 dark:!border-[#44444455]">
                      <td className="px-4 py-3 pl-[30px] text-[14px] font-medium text-foreground opacity-80">2024-01-15</td>
                      <td className="px-4 py-3 text-[14px] font-medium text-foreground opacity-80">1,234건</td>
                      <td className="px-4 py-3 text-[14px] font-medium text-foreground opacity-80">567건</td>
                      <td className="px-4 py-3 text-[14px] font-semibold text-foreground opacity-80">456건</td>
                      <td className="px-4 py-3 text-[14px] font-semibold text-foreground opacity-80">211건</td>
                    </tr>
                    <tr className="border-b border-neutral-30/40 dark:!border-[#44444455]">
                      <td className="px-4 py-3 pl-[30px] text-[14px] font-medium text-foreground opacity-80">2024-01-14</td>
                      <td className="px-4 py-3 text-[14px] font-medium text-foreground opacity-80">1,189건</td>
                      <td className="px-4 py-3 text-[14px] font-medium text-foreground opacity-80">523건</td>
                      <td className="px-4 py-3 text-[14px] font-semibold text-foreground opacity-80">432건</td>
                      <td className="px-4 py-3 text-[14px] font-semibold text-foreground opacity-80">234건</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>
          
          {/* CustomersTable 스타일 예시 */}
          <div className="mt-6 bg-white dark:bg-neutral-10 rounded-lg border border-neutral-60 p-6">
            <h3 className="text-lg font-semibold text-neutral-90 mb-4">CustomersTable 스타일 예시 (체크박스 포함)</h3>
            <div className="overflow-hidden rounded-[12px]">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-neutral-20 text-neutral-60">
                    <th className="px-6 h-[40px] align-middle rounded-l-[8px]">선택</th>
                    <th className="px-6 h-[40px] align-middle">이름</th>
                    <th className="px-4 h-[40px] align-middle">신청경로</th>
                    <th className="px-4 h-[40px] align-middle">매체사</th>
                    <th className="px-4 h-[40px] align-middle rounded-r-[8px]">사이트</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingStates.tableRow ? (
                    Array.from({ length: 5 }).map((_, idx) => (
                      <TableSkeletonRow
                        key={`customer-skeleton-${idx}`}
                        columns={[
                          { width: 24, paddingX: 6, type: "checkbox" }, // 체크박스
                          { width: "flex", paddingX: 6 }, // 이름
                          { width: "flex", paddingX: 4 }, // 신청경로
                          { width: "flex", paddingX: 4 }, // 매체사
                          { width: "flex", paddingX: 4 }, // 사이트
                        ]}
                        rowHeight={48}
                      />
                    ))
                  ) : (
                    <>
                      <tr className="border-b border-[#E2E2E2] dark:!border-[#44444455]">
                        <td className="px-6 h-[48px]">
                          <div className="flex items-center h-full">
                            <div className="w-6 h-6 border-2 border-neutral-30 rounded" />
                          </div>
                        </td>
                        <td className="px-6 h-[48px] align-middle text-neutral-90 opacity-80">홍길동</td>
                        <td className="px-4 h-[48px] align-middle text-neutral-90 opacity-80">웹사이트</td>
                        <td className="px-4 h-[48px] align-middle text-neutral-90 opacity-80">네이버</td>
                        <td className="px-4 h-[48px] align-middle text-neutral-90 opacity-80">example.com</td>
                      </tr>
                      <tr className="border-b border-[#E2E2E2] dark:!border-[#44444455]">
                        <td className="px-6 h-[48px]">
                          <div className="flex items-center h-full">
                            <div className="w-6 h-6 border-2 border-neutral-30 rounded" />
                          </div>
                        </td>
                        <td className="px-6 h-[48px] align-middle text-neutral-90 opacity-80">김철수</td>
                        <td className="px-4 h-[48px] align-middle text-neutral-90 opacity-80">API</td>
                        <td className="px-4 h-[48px] align-middle text-neutral-90 opacity-80">구글</td>
                        <td className="px-4 h-[48px] align-middle text-neutral-90 opacity-80">test.com</td>
                      </tr>
                    </>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* 차트 스켈레톤 테스트 */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-semibold text-neutral-90">차트 스켈레톤</h2>
            <div className="text-sm text-neutral-60 bg-neutral-10 px-3 py-1 rounded">
              <span className="font-semibold text-primary-60">✓ 동일 컴포넌트 사용</span>
            </div>
          </div>
          <div className="mb-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-sm text-neutral-70 dark:text-neutral-50">
              <span className="font-semibold">컴포넌트:</span> <code className="bg-white dark:bg-neutral-20 px-1 rounded">@/components/common/ChartSkeleton</code>
            </p>
            <p className="text-sm text-neutral-70 dark:text-neutral-50 mt-1">
              <span className="font-semibold">실제 사용 위치:</span>
            </p>
            <ul className="text-sm text-neutral-70 dark:text-neutral-50 mt-1 ml-4 list-disc">
              <li><code className="bg-white dark:bg-neutral-20 px-1 rounded">StatsSection.tsx</code> - 기본값 (rows=3)</li>
            </ul>
            <p className="text-xs text-neutral-60 dark:text-neutral-50 mt-2 italic">
              💡 이 스켈레톤을 수정하면 위 컴포넌트의 로딩 상태도 함께 변경됩니다.
            </p>
          </div>
          <div className="bg-white dark:bg-neutral-10 rounded-lg border border-neutral-60 p-6">
            <div className="mb-4">
              <button
                onClick={() => handleButtonClick("chart", 3000)}
                disabled={loadingStates.chart}
                className="px-4 py-2 bg-neutral-70 text-white rounded hover:bg-neutral-80 disabled:opacity-50"
              >
                {loadingStates.chart ? "로딩 중..." : "차트 로딩 시뮬레이션"}
              </button>
            </div>
            <div className="h-64">
              {loadingStates.chart ? (
                <ChartSkeleton rows={5} />
              ) : (
                <div className="h-full flex items-center justify-center text-neutral-60">
                  차트 데이터 표시 영역
                </div>
              )}
            </div>
          </div>
        </section>

        {/* 스케줄 스켈레톤 테스트 */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-semibold text-neutral-90">스케줄 스켈레톤</h2>
            <div className="text-sm text-neutral-60 bg-neutral-10 px-3 py-1 rounded">
              <span className="font-semibold text-primary-60">✓ 동일 컴포넌트 사용</span>
            </div>
          </div>
          <div className="mb-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-sm text-neutral-70 dark:text-neutral-50">
              <span className="font-semibold">컴포넌트:</span> <code className="bg-white dark:bg-neutral-20 px-1 rounded">@/components/dashboard/ScheduleSkeleton</code>
            </p>
            <p className="text-sm text-neutral-70 dark:text-neutral-50 mt-1">
              <span className="font-semibold">실제 사용 위치:</span>
            </p>
            <ul className="text-sm text-neutral-70 dark:text-neutral-50 mt-1 ml-4 list-disc">
              <li><code className="bg-white dark:bg-neutral-20 px-1 rounded">CalendarSection.tsx</code> - 대시보드 달력 & 일정 섹션</li>
            </ul>
            <p className="text-xs text-neutral-60 dark:text-neutral-50 mt-2 italic">
              💡 이 스켈레톤을 수정하면 위 컴포넌트의 로딩 상태도 함께 변경됩니다.
            </p>
          </div>
          <div className="bg-white dark:bg-neutral-10 rounded-lg border border-neutral-60 p-6">
            <div className="mb-4">
              <button
                onClick={() => handleButtonClick("schedule", 3000)}
                disabled={loadingStates.schedule}
                className="px-4 py-2 bg-neutral-70 text-white rounded hover:bg-neutral-80 disabled:opacity-50"
              >
                {loadingStates.schedule ? "로딩 중..." : "스케줄 로딩 시뮬레이션"}
              </button>
            </div>
            {loadingStates.schedule ? (
              <ScheduleSkeleton />
            ) : (
              <div className="p-4 text-neutral-60">스케줄 데이터 표시 영역</div>
            )}
          </div>
        </section>

        {/* 랭킹 스켈레톤 테스트 */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-semibold text-neutral-90">랭킹 스켈레톤</h2>
            <div className="text-sm text-neutral-60 bg-neutral-10 px-3 py-1 rounded">
              <span className="font-semibold text-primary-60">✓ 동일 컴포넌트 사용</span>
            </div>
          </div>
          <div className="mb-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-sm text-neutral-70 dark:text-neutral-50">
              <span className="font-semibold">컴포넌트:</span> <code className="bg-white dark:bg-neutral-20 px-1 rounded">@/components/dashboard/RankingSkeleton</code>
            </p>
            <p className="text-sm text-neutral-70 dark:text-neutral-50 mt-1">
              <span className="font-semibold">실제 사용 위치:</span>
            </p>
            <ul className="text-sm text-neutral-70 dark:text-neutral-50 mt-1 ml-4 list-disc">
              <li><code className="bg-white dark:bg-neutral-20 px-1 rounded">SalesRanking.tsx</code> - 대시보드 이달 매출 랭킹 섹션</li>
            </ul>
            <p className="text-xs text-neutral-60 dark:text-neutral-50 mt-2 italic">
              💡 이 스켈레톤을 수정하면 위 컴포넌트의 로딩 상태도 함께 변경됩니다.
            </p>
          </div>
          <div className="bg-white dark:bg-neutral-10 rounded-lg border border-neutral-60 p-6">
            <div className="mb-4">
              <button
                onClick={() => handleButtonClick("ranking", 3000)}
                disabled={loadingStates.ranking}
                className="px-4 py-2 bg-neutral-70 text-white rounded hover:bg-neutral-80 disabled:opacity-50"
              >
                {loadingStates.ranking ? "로딩 중..." : "랭킹 로딩 시뮬레이션"}
              </button>
            </div>
            {loadingStates.ranking ? (
              <RankingSkeleton />
            ) : (
              <div className="p-4 text-neutral-60">랭킹 데이터 표시 영역</div>
            )}
          </div>
        </section>

        {/* 다양한 스피너 크기 테스트 */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-neutral-90 mb-4">스피너 크기별 테스트</h2>
          <div className="bg-white dark:bg-neutral-10 rounded-lg border border-neutral-60 p-6">
            <div className="flex items-center gap-8 flex-wrap">
              <div className="flex flex-col items-center gap-2">
                <LoadingSpinner size="xs" />
                <span className="text-sm text-neutral-60">Extra Small</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <LoadingSpinner size="sm" />
                <span className="text-sm text-neutral-60">Small</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <LoadingSpinner size="md" />
                <span className="text-sm text-neutral-60">Medium</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <LoadingSpinner size="lg" />
                <span className="text-sm text-neutral-60">Large</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <LoadingSpinner size="xl" />
                <span className="text-sm text-neutral-60">Extra Large</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <LoadingSpinner size="2xl" />
                <span className="text-sm text-neutral-60">2X Large</span>
              </div>
            </div>
          </div>
        </section>

        {/* 스피너 색상별 테스트 */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-neutral-90 dark:text-neutral-80 mb-4">스피너 색상별 테스트</h2>
          <div className="bg-white dark:bg-neutral-10 rounded-lg border border-neutral-60 p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Default Variant (그레이 계열) */}
              <div className="flex flex-col gap-4 p-4 border border-neutral-30 dark:border-neutral-30 rounded-lg">
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-semibold text-neutral-90 dark:text-neutral-80">Default (그레이)</h3>
                  <span className="text-xs px-2 py-1 bg-neutral-20 dark:bg-neutral-30 text-neutral-70 dark:text-neutral-60 rounded">
                    기본값
                  </span>
                </div>
                <div className="flex items-center gap-6 flex-wrap">
                  <div className="flex flex-col items-center gap-2">
                    <LoadingSpinner size="sm" variant="default" />
                    <span className="text-xs text-neutral-60">Small</span>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <LoadingSpinner size="md" variant="default" />
                    <span className="text-xs text-neutral-60">Medium</span>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <LoadingSpinner size="lg" variant="default" />
                    <span className="text-xs text-neutral-60">Large</span>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <LoadingSpinner size="xl" variant="default" />
                    <span className="text-xs text-neutral-60">XL</span>
                  </div>
                </div>
                <div className="text-xs text-neutral-60 dark:text-neutral-50">
                  <p>색상: 연회색(#e2e2e2) + 진회색(#595959)</p>
                  <p className="mt-1">사용 예: <code className="bg-neutral-10 dark:bg-neutral-20 px-1 rounded">&lt;LoadingSpinner /&gt;</code></p>
                </div>
              </div>

              {/* Primary Variant (녹색 계열) */}
              <div className="flex flex-col gap-4 p-4 border border-neutral-30 dark:border-neutral-30 rounded-lg">
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-semibold text-neutral-90 dark:text-neutral-80">Primary (녹색)</h3>
                  <span className="text-xs px-2 py-1 bg-primary-10 text-primary-80 rounded">
                    강조
                  </span>
                </div>
                <div className="flex items-center gap-6 flex-wrap">
                  <div className="flex flex-col items-center gap-2">
                    <LoadingSpinner size="sm" variant="primary" />
                    <span className="text-xs text-neutral-60">Small</span>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <LoadingSpinner size="md" variant="primary" />
                    <span className="text-xs text-neutral-60">Medium</span>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <LoadingSpinner size="lg" variant="primary" />
                    <span className="text-xs text-neutral-60">Large</span>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <LoadingSpinner size="xl" variant="primary" />
                    <span className="text-xs text-neutral-60">XL</span>
                  </div>
                </div>
                <div className="text-xs text-neutral-60 dark:text-neutral-50">
                  <p>색상: 회색(#d0d0d0) + 녹색(#00e272)</p>
                  <p className="mt-1">사용 예: <code className="bg-neutral-10 dark:bg-neutral-20 px-1 rounded">&lt;LoadingSpinner variant="primary" /&gt;</code></p>
                </div>
              </div>

              {/* White Variant */}
              <div className="flex flex-col gap-4 p-4 border border-neutral-30 dark:border-neutral-30 rounded-lg bg-neutral-90 dark:bg-neutral-20">
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-semibold text-white dark:text-neutral-80">White (흰색)</h3>
                  <span className="text-xs px-2 py-1 bg-white/20 text-white rounded">
                    다크 배경용
                  </span>
                </div>
                <div className="flex items-center gap-6 flex-wrap">
                  <div className="flex flex-col items-center gap-2">
                    <LoadingSpinner size="sm" variant="white" />
                    <span className="text-xs text-white/80">Small</span>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <LoadingSpinner size="md" variant="white" />
                    <span className="text-xs text-white/80">Medium</span>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <LoadingSpinner size="lg" variant="white" />
                    <span className="text-xs text-white/80">Large</span>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <LoadingSpinner size="xl" variant="white" />
                    <span className="text-xs text-white/80">XL</span>
                  </div>
                </div>
                <div className="text-xs text-white/70 dark:text-neutral-50">
                  <p>색상: 반투명 흰색 + 흰색</p>
                  <p className="mt-1">사용 예: <code className="bg-white/10 px-1 rounded">&lt;LoadingSpinner variant="white" /&gt;</code></p>
                </div>
              </div>

              {/* Neutral Variant (더 진한 그레이) */}
              <div className="flex flex-col gap-4 p-4 border border-neutral-30 dark:border-neutral-30 rounded-lg">
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-semibold text-neutral-90 dark:text-neutral-80">Neutral (진한 그레이)</h3>
                  <span className="text-xs px-2 py-1 bg-neutral-30 dark:bg-neutral-40 text-neutral-70 dark:text-neutral-60 rounded">
                    대비 강화
                  </span>
                </div>
                <div className="flex items-center gap-6 flex-wrap">
                  <div className="flex flex-col items-center gap-2">
                    <LoadingSpinner size="sm" variant="neutral" />
                    <span className="text-xs text-neutral-60">Small</span>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <LoadingSpinner size="md" variant="neutral" />
                    <span className="text-xs text-neutral-60">Medium</span>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <LoadingSpinner size="lg" variant="neutral" />
                    <span className="text-xs text-neutral-60">Large</span>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <LoadingSpinner size="xl" variant="neutral" />
                    <span className="text-xs text-neutral-60">XL</span>
                  </div>
                </div>
                <div className="text-xs text-neutral-60 dark:text-neutral-50">
                  <p>색상: 중간회색(#b0b0b0) + 진회색(#474747)</p>
                  <p className="mt-1">사용 예: <code className="bg-neutral-10 dark:bg-neutral-20 px-1 rounded">&lt;LoadingSpinner variant="neutral" /&gt;</code></p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 인라인 로딩 상태 테스트 */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-neutral-90 mb-4">인라인 로딩 상태</h2>
          <div className="bg-white rounded-lg border border-neutral-60 p-6 space-y-4">
            <div className="flex items-center gap-3">
              <LoadingSpinner size="sm" />
              <span className="text-neutral-90">데이터를 불러오는 중입니다...</span>
            </div>
            <div className="flex items-center gap-3">
              <LoadingSpinner size="md" />
              <span className="text-neutral-90">처리 중입니다. 잠시만 기다려주세요.</span>
            </div>
            <div className="flex items-center gap-3">
              <LoadingSpinner size="sm" />
              <span className="text-neutral-60 text-sm">작은 텍스트와 함께 표시되는 스피너</span>
            </div>
          </div>
        </section>

        {/* 모달 테스트 */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-neutral-90 mb-4">모달 테스트</h2>
          <div className="bg-white rounded-lg border border-neutral-60 p-6">
            <div className="space-y-4">
              {/* Confirm Modal 테스트 */}
              <div>
                <h3 className="text-lg font-semibold text-neutral-90 mb-3">Confirm Modal</h3>
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => {
                      showConfirmModal({
                        title: "확인",
                        message: "이 작업을 진행하시겠습니까?",
                        confirmText: "확인",
                        cancelText: "취소",
                        onConfirm: () => {
                          console.log("확인 버튼 클릭됨");
                        },
                        onCancel: () => {
                          console.log("취소 버튼 클릭됨");
                        },
                      });
                    }}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    기본 Confirm Modal
                  </button>
                  <button
                    onClick={() => {
                      showConfirmModal({
                        title: "삭제 확인",
                        message: "정말로 이 항목을 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.",
                        confirmText: "삭제",
                        cancelText: "취소",
                        onConfirm: async () => {
                          // 비동기 작업 시뮬레이션
                          await new Promise((resolve) => setTimeout(resolve, 1000));
                          console.log("삭제 완료");
                        },
                      });
                    }}
                    className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                  >
                    삭제 확인 Modal (비동기)
                  </button>
                  <button
                    onClick={() => {
                      showConfirmModal({
                        title: "저장 확인",
                        message: "변경사항을 저장하시겠습니까?",
                        confirmText: "저장",
                        cancelText: null, // 취소 버튼 숨김
                        onConfirm: () => {
                          console.log("저장됨");
                        },
                      });
                    }}
                    className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                  >
                    취소 버튼 없는 Modal
                  </button>
                </div>
              </div>

              {/* Error Modal 테스트 */}
              <div className="pt-4 border-t border-neutral-30">
                <h3 className="text-lg font-semibold text-neutral-90 mb-3">Error Modal</h3>
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => {
                      showErrorModal({
                        type: "error",
                        title: "오류 발생",
                        headline: "일시적인 오류가 발생했습니다.",
                        description:
                          "데이터를 불러오거나 이동하는 과정에서 예상치 못한 문제가 발생했습니다. 불편하시겠지만 잠시 기다린 후 새로고침(Refresh) 버튼을 눌러 다시 시도해 주시기 바랍니다.",
                        confirmText: "확인",
                        cancelText: "취소",
                        onConfirm: () => {
                          console.log("에러 모달 확인");
                        },
                      });
                    }}
                    className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                  >
                    기본 Error Modal
                  </button>
                  <button
                    onClick={() => {
                      showErrorModal("간단한 에러 메시지입니다.");
                    }}
                    className="px-4 py-2 bg-red-400 text-white rounded hover:bg-red-500"
                  >
                    간단한 Error Modal (문자열)
                  </button>
                  <button
                    onClick={() => {
                      showErrorModal({
                        type: "error",
                        headline: "네트워크 오류",
                        description: "서버에 연결할 수 없습니다. 인터넷 연결을 확인해주세요.",
                        hideCancel: true,
                        onConfirm: () => {
                          console.log("에러 모달 확인");
                        },
                      });
                    }}
                    className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                  >
                    취소 버튼 없는 Error Modal
                  </button>
                </div>
              </div>

              {/* Success Modal 테스트 */}
              <div className="pt-4 border-t border-neutral-30">
                <h3 className="text-lg font-semibold text-neutral-90 mb-3">Success Modal</h3>
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => {
                      showErrorModal({
                        type: "success",
                        title: "완료",
                        headline: "처리가 완료되었습니다.",
                        description: "모든 작업이 성공적으로 완료되었습니다.",
                        confirmText: "확인",
                        cancelText: "취소",
                        onConfirm: () => {
                          console.log("성공 모달 확인");
                        },
                      });
                    }}
                    className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                  >
                    기본 Success Modal
                  </button>
                  <button
                    onClick={() => {
                      showErrorModal({
                        type: "success",
                        headline: "저장 완료",
                        description: "변경사항이 성공적으로 저장되었습니다.",
                        hideCancel: true,
                        onConfirm: () => {
                          console.log("저장 완료 확인");
                        },
                      });
                    }}
                    className="px-4 py-2 bg-green-400 text-white rounded hover:bg-green-500"
                  >
                    저장 완료 Modal
                  </button>
                </div>
              </div>

              {/* Info Modal 테스트 */}
              <div className="pt-4 border-t border-neutral-30">
                <h3 className="text-lg font-semibold text-neutral-90 mb-3">Info Modal</h3>
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => {
                      showErrorModal({
                        type: "info",
                        title: "알림",
                        headline: "중요한 정보",
                        description:
                          "이 기능은 베타 버전입니다. 사용 중 문제가 발생할 수 있습니다.",
                        confirmText: "확인",
                        cancelText: "취소",
                        onConfirm: () => {
                          console.log("정보 모달 확인");
                        },
                      });
                    }}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    기본 Info Modal
                  </button>
                  <button
                    onClick={() => {
                      showErrorModal({
                        type: "info",
                        headline: "업데이트 알림",
                        description:
                          "새로운 버전이 출시되었습니다. 업데이트를 진행하시겠습니까?",
                        confirmText: "업데이트",
                        cancelText: "나중에",
                        onConfirm: () => {
                          console.log("업데이트 진행");
                        },
                        onCancel: () => {
                          console.log("업데이트 취소");
                        },
                      });
                    }}
                    className="px-4 py-2 bg-blue-400 text-white rounded hover:bg-blue-500"
                  >
                    업데이트 알림 Modal
                  </button>
                  <button
                    onClick={() => {
                      showErrorModal({
                        type: "info",
                        headline: "안내사항",
                        description: "이 작업은 몇 분 정도 소요될 수 있습니다.",
                        hideCancel: true,
                        onConfirm: () => {
                          console.log("안내 확인");
                        },
                      });
                    }}
                    className="px-4 py-2 bg-blue-300 text-white rounded hover:bg-blue-400"
                  >
                    취소 버튼 없는 Info Modal
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Persistent Modal 테스트 */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-neutral-90 mb-4">Persistent Modal 테스트</h2>
          <div className="bg-white dark:bg-neutral-10 rounded-lg border border-neutral-60 p-6">
            <div className="space-y-4">
              {/* 약관 동의 모달 테스트 */}
              <div>
                <h3 className="text-lg font-semibold text-neutral-90 mb-3">약관 동의 필요 모달</h3>
                <div className="mb-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <p className="text-sm text-neutral-70 dark:text-neutral-50">
                    <span className="font-semibold">컴포넌트:</span> <code className="bg-white dark:bg-neutral-20 px-1 rounded">@/components/common/TermsGuard</code>
                  </p>
                  <p className="text-sm text-neutral-70 dark:text-neutral-50 mt-1">
                    <span className="font-semibold">실제 사용 위치:</span> 레이아웃 레벨에서 전역 적용 (<code className="bg-white dark:bg-neutral-20 px-1 rounded">app/layout.tsx</code>)
                  </p>
                  <p className="text-sm text-neutral-70 dark:text-neutral-50 mt-1">
                    <span className="font-semibold">모달 타입:</span> <code className="bg-white dark:bg-neutral-20 px-1 rounded">ErrorFeedbackModalProvider</code>의 <code className="bg-white dark:bg-neutral-20 px-1 rounded">info</code> 타입
                  </p>
                  <p className="text-xs text-neutral-60 dark:text-neutral-50 mt-2 italic">
                    💡 약관 미동의 사용자가 인증된 페이지에 접근할 때 자동으로 표시됩니다. 실제 사용되는 모달과 동일한 디자인입니다.
                  </p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => {
                      showErrorModal({
                        type: "info",
                        title: "약관 동의 필요",
                        headline: "서비스 이용을 위해 약관 동의가 필요합니다.",
                        description: "약관 동의를 완료하시면 서비스를 이용하실 수 있습니다.",
                        confirmText: "약관 동의하러 가기",
                        hideCancel: true,
                        persistent: true,
                        hideCloseButton: true,
                        onConfirm: () => {
                          console.log("약관 동의 페이지로 이동");
                        },
                      });
                    }}
                    className="px-4 py-2 bg-secondary-80 dark:bg-secondary-20 text-white rounded hover:opacity-90 transition-opacity"
                  >
                    약관 동의 필요 모달 (Info 타입)
                  </button>
                </div>
              </div>

              {/* 다른 Persistent Modal 타입 테스트 */}
              <div className="pt-4 border-t border-neutral-30">
                <h3 className="text-lg font-semibold text-neutral-90 mb-3">다른 Persistent Modal 타입</h3>
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => {
                      persistentModal.show({
                        type: "default",
                        title: "알림",
                        headline: "기본 타입 모달",
                        description: "이것은 기본 타입의 Persistent Modal입니다.",
                        confirmText: "확인",
                        cancelText: null,
                        hideCancel: true,
                        onConfirm: () => {
                          console.log("기본 모달 확인");
                        },
                      });
                    }}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    Default 타입
                  </button>
                  <button
                    onClick={() => {
                      persistentModal.show({
                        type: "system",
                        title: "시스템 알림",
                        headline: "시스템 타입 모달",
                        description: "이것은 시스템 타입의 Persistent Modal입니다.",
                        confirmText: "확인",
                        cancelText: null,
                        hideCancel: true,
                        onConfirm: () => {
                          console.log("시스템 모달 확인");
                        },
                      });
                    }}
                    className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                  >
                    System 타입 (아이콘 포함)
                  </button>
                  <button
                    onClick={() => {
                      persistentModal.show({
                        type: "talkgate",
                        title: "TalkGate 알림",
                        headline: "TalkGate 타입 모달",
                        description: "이것은 TalkGate 타입의 Persistent Modal입니다.",
                        confirmText: "확인",
                        cancelText: null,
                        hideCancel: true,
                        onConfirm: () => {
                          console.log("TalkGate 모달 확인");
                        },
                      });
                    }}
                    className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                  >
                    TalkGate 타입 (아이콘 포함)
                  </button>
                  <button
                    onClick={() => {
                      persistentModal.show({
                        type: "system",
                        title: "확인 필요",
                        headline: "취소 버튼이 있는 모달",
                        description: "이 모달은 확인과 취소 버튼을 모두 가지고 있습니다.",
                        confirmText: "확인",
                        cancelText: "취소",
                        hideCancel: false,
                        onConfirm: () => {
                          console.log("확인 클릭");
                        },
                        onCancel: () => {
                          console.log("취소 클릭");
                        },
                      });
                    }}
                    className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
                  >
                    취소 버튼 포함
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ReactivateSubscriptionModal 테스트 */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-neutral-90 mb-4">구독 활성화 모달 테스트</h2>
          <div className="mb-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-sm text-neutral-70 dark:text-neutral-50">
              <span className="font-semibold">컴포넌트:</span> <code className="bg-white dark:bg-neutral-20 px-1 rounded">@/components/my-settings/ReactivateSubscriptionModal</code>
            </p>
            <p className="text-sm text-neutral-70 dark:text-neutral-50 mt-1">
              <span className="font-semibold">실제 사용 위치:</span>
            </p>
            <ul className="text-sm text-neutral-70 dark:text-neutral-50 mt-1 ml-4 list-disc">
              <li><code className="bg-white dark:bg-neutral-20 px-1 rounded">ProjectBillingDetail.tsx</code> - 프로젝트 관리 페이지에서 구독이 취소된 경우</li>
            </ul>
            <p className="text-xs text-neutral-60 dark:text-neutral-50 mt-2 italic">
              💡 구독이 취소된 프로젝트(autoRenewal: false)에서 구독 활성화 버튼을 클릭하면 표시됩니다.
            </p>
          </div>
          <div className="bg-white dark:bg-neutral-10 rounded-lg border border-neutral-60 p-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-neutral-90 mb-3">모달 테스트</h3>
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => setShowReactivateModal(true)}
                    className="px-4 py-2 bg-primary-60 text-white rounded hover:bg-primary-70 transition-colors"
                  >
                    구독 활성화 모달 열기
                  </button>
                  <button
                    onClick={() => {
                      setIsReactivating(true);
                      setShowReactivateModal(true);
                    }}
                    className="px-4 py-2 bg-primary-50 text-white rounded hover:bg-primary-60 transition-colors"
                  >
                    로딩 상태 모달 열기
                  </button>
                </div>
              </div>
              <div className="pt-4 border-t border-neutral-30">
                <h3 className="text-lg font-semibold text-neutral-90 mb-3">모달 동작 설명</h3>
                <div className="space-y-2 text-sm text-neutral-70 dark:text-neutral-50">
                  <div className="p-3 bg-neutral-10 dark:bg-neutral-20 rounded">
                    <p className="font-semibold mb-1">구독 활성화 모달:</p>
                    <ul className="ml-4 list-disc space-y-1">
                      <li>제목: "구독을 다시 활성화할까요?"</li>
                      <li>설명: "결제 예정일에 다시 결제가 진행됩니다."</li>
                      <li>안내: "결제 수단이 등록되어 있지 않으면 활성화할 수 없습니다."</li>
                      <li>버튼: [취소] [구독 활성화]</li>
                      <li>에러 처리: INVALID_BILLING_KEY 에러 시 "결제 수단을 등록해주세요." 메시지 표시</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* PartnerRequestModal 테스트 */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-neutral-90 mb-4">파트너 요청 모달 테스트</h2>
          <div className="mb-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-sm text-neutral-70 dark:text-neutral-50">
              <span className="font-semibold">컴포넌트:</span> <code className="bg-white dark:bg-neutral-20 px-1 rounded">@/components/dashboard/PartnerRequestModal</code>
            </p>
            <p className="text-sm text-neutral-70 dark:text-neutral-50 mt-1">
              <span className="font-semibold">실제 사용 위치:</span>
            </p>
            <ul className="text-sm text-neutral-70 dark:text-neutral-50 mt-1 ml-4 list-disc">
              <li><code className="bg-white dark:bg-neutral-20 px-1 rounded">DashboardPageContent.tsx</code> - 대시보드 진입 시 pending 상태의 파트너 요청이 있으면 표시</li>
            </ul>
            <p className="text-xs text-neutral-60 dark:text-neutral-50 mt-2 italic">
              💡 Admin/SubAdmin 권한을 가진 사용자에게만 표시됩니다. 수락/거절 시 API 호출 후 다음 요청으로 이동합니다.
            </p>
          </div>
          <div className="bg-white dark:bg-neutral-10 rounded-lg border border-neutral-60 p-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-neutral-90 mb-3">모달 테스트</h3>
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => setShowPartnerRequestModal(true)}
                    className="px-4 py-2 bg-primary-60 text-white rounded hover:bg-primary-70 transition-colors"
                  >
                    파트너 요청 모달 열기
                  </button>
                </div>
              </div>
              <div className="pt-4 border-t border-neutral-30">
                <h3 className="text-lg font-semibold text-neutral-90 mb-3">모달 동작 설명</h3>
                <div className="space-y-2 text-sm text-neutral-70 dark:text-neutral-50">
                  <div className="p-3 bg-neutral-10 dark:bg-neutral-20 rounded">
                    <p className="font-semibold mb-1">파트너 요청 모달:</p>
                    <ul className="ml-4 list-disc space-y-1">
                      <li>대시보드 진입 시 GET /v1/project-partners/requests?status=pending 호출</li>
                      <li>pending 상태의 요청이 있으면 모달 표시</li>
                      <li>&quot;수락&quot; 클릭 → PATCH /v1/project-partners/{"{id}"}/status (status: &quot;approved&quot;)</li>
                      <li>&quot;거절&quot; 클릭 → PATCH /v1/project-partners/{"{id}"}/status (status: &quot;rejected&quot;)</li>
                      <li>여러 요청이 있으면 순차적으로 처리 (1/2, 2/2 등 표시)</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SubscribeProjectExpiredModal 테스트 */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-neutral-90 mb-4">구독 만료 모달 테스트</h2>
          <div className="mb-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-sm text-neutral-70 dark:text-neutral-50">
              <span className="font-semibold">컴포넌트:</span> <code className="bg-white dark:bg-neutral-20 px-1 rounded">@/components/projects/SubscribeProjectExpiredModal</code>
            </p>
            <p className="text-sm text-neutral-70 dark:text-neutral-50 mt-1">
              <span className="font-semibold">실제 사용 위치:</span>
            </p>
            <ul className="text-sm text-neutral-70 dark:text-neutral-50 mt-1 ml-4 list-disc">
              <li><code className="bg-white dark:bg-neutral-20 px-1 rounded">ProjectsContent.tsx</code> - 프로젝트 목록에서 구독이 만료된 프로젝트 클릭 시</li>
            </ul>
            <p className="text-xs text-neutral-60 dark:text-neutral-50 mt-2 italic">
              💡 사용자 역할(admin/subAdmin/member)에 따라 다른 메시지와 버튼이 표시됩니다.
            </p>
          </div>
          <div className="bg-white dark:bg-neutral-10 rounded-lg border border-neutral-60 p-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-neutral-90 mb-3">역할별 모달 테스트</h3>
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => {
                      setExpiredModalRole("admin");
                      setShowExpiredModal(true);
                    }}
                    className="px-4 py-2 bg-primary-60 text-white rounded hover:bg-primary-70 transition-colors"
                  >
                    어드민 모달 (결제관리 버튼)
                  </button>
                  <button
                    onClick={() => {
                      setExpiredModalRole("subAdmin");
                      setShowExpiredModal(true);
                    }}
                    className="px-4 py-2 bg-primary-50 text-white rounded hover:bg-primary-60 transition-colors"
                  >
                    부관리자 모달 (결제관리 버튼)
                  </button>
                  <button
                    onClick={() => {
                      setExpiredModalRole("member");
                      setShowExpiredModal(true);
                    }}
                    className="px-4 py-2 bg-neutral-70 text-white rounded hover:bg-neutral-80 transition-colors"
                  >
                    일반 멤버 모달 (확인 버튼)
                  </button>
                  <button
                    onClick={() => {
                      setExpiredModalRole(undefined);
                      setShowExpiredModal(true);
                    }}
                    className="px-4 py-2 bg-neutral-50 text-neutral-90 rounded hover:bg-neutral-60 transition-colors border border-neutral-30"
                  >
                    역할 없음 (일반 멤버로 처리)
                  </button>
                </div>
              </div>
              <div className="pt-4 border-t border-neutral-30">
                <h3 className="text-lg font-semibold text-neutral-90 mb-3">모달 동작 설명</h3>
                <div className="space-y-2 text-sm text-neutral-70 dark:text-neutral-50">
                  <div className="p-3 bg-neutral-10 dark:bg-neutral-20 rounded">
                    <p className="font-semibold mb-1">어드민/부관리자 (admin/subAdmin):</p>
                    <ul className="ml-4 list-disc space-y-1">
                      <li>메시지: "구독 기간이 만료되었어요.\n서비스를 계속 이용하시려면 구독을 갱신해 주세요."</li>
                      <li>버튼: "결제관리" - 클릭 시 결제관리 페이지(/my-settings?tab=billing)로 이동</li>
                    </ul>
                  </div>
                  <div className="p-3 bg-neutral-10 dark:bg-neutral-20 rounded">
                    <p className="font-semibold mb-1">일반 멤버 (member 또는 역할 없음):</p>
                    <ul className="ml-4 list-disc space-y-1">
                      <li>메시지: "구독 기간이 만료되었어요.\n프로젝트 관리자가 구독을 갱신하면 서비스를 계속 이용할 수 있어요."</li>
                      <li>버튼: "확인" - 클릭 시 모달 닫기</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* SubscribeProjectExpiredModal */}
      {showExpiredModal && (
        <SubscribeProjectExpiredModal
          project={{
            id: 1,
            name: "테스트 프로젝트",
            logoUrl: null,
            memberCount: 10,
          }}
          userRole={expiredModalRole}
          onClose={() => setShowExpiredModal(false)}
        />
      )}

      {/* ReactivateSubscriptionModal */}
      <ReactivateSubscriptionModal
        isOpen={showReactivateModal}
        onClose={() => {
          setShowReactivateModal(false);
          setIsReactivating(false);
        }}
        onConfirm={async () => {
          // 테스트용 시뮬레이션
          if (isReactivating) {
            await new Promise((resolve) => setTimeout(resolve, 2000));
            setIsReactivating(false);
            setShowReactivateModal(false);
            console.log("구독 활성화 완료");
          } else {
            setShowReactivateModal(false);
            console.log("구독 활성화 확인");
          }
        }}
        isLoading={isReactivating}
      />

      {/* PartnerRequestModal */}
      <PartnerRequestModal
        isOpen={showPartnerRequestModal}
        onClose={() => setShowPartnerRequestModal(false)}
        requests={dummyPartnerRequests}
        projectId="test-project-id"
        onActionComplete={() => {
          console.log("파트너 요청 처리 완료");
        }}
      />
    </div>
  );
}


