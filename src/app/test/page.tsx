"use client";

import { useState } from "react";
import TableSkeleton from "@/components/common/TableSkeleton";
import ChartSkeleton from "@/components/common/ChartSkeleton";
import ScheduleSkeleton from "@/components/dashboard/ScheduleSkeleton";
import RankingSkeleton from "@/components/dashboard/RankingSkeleton";
import { showConfirmModal } from "@/providers/ConfirmModalProvider";
import { showErrorModal } from "@/providers/ErrorFeedbackModalProvider";

export default function TestPage() {
  const [loadingStates, setLoadingStates] = useState({
    button1: false,
    button2: false,
    button3: false,
    table: false,
    chart: false,
    schedule: false,
    ranking: false,
  });

  const handleButtonClick = (key: keyof typeof loadingStates, duration: number = 2000) => {
    setLoadingStates((prev) => ({ ...prev, [key]: true }));
    setTimeout(() => {
      setLoadingStates((prev) => ({ ...prev, [key]: false }));
    }, duration);
  };

  return (
    <div className="min-h-screen bg-neutral-0 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-neutral-90 mb-8">로딩 상태 테스트 페이지</h1>

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
                  <Spinner size="sm" />
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
                  <Spinner size="sm" />
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
                  <Spinner size="sm" />
                  저장 중...
                </span>
              ) : (
                "버튼 3 (1.5초)"
              )}
            </button>
          </div>
        </section>

        {/* 테이블 스켈레톤 테스트 */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-neutral-90 mb-4">테이블 스켈레톤</h2>
          <div className="bg-white rounded-lg border border-neutral-60 p-6">
            <div className="mb-4">
              <button
                onClick={() => handleButtonClick("table", 3000)}
                disabled={loadingStates.table}
                className="px-4 py-2 bg-neutral-70 text-white rounded hover:bg-neutral-80 disabled:opacity-50"
              >
                {loadingStates.table ? "로딩 중..." : "테이블 로딩 시뮬레이션"}
              </button>
            </div>
            {loadingStates.table ? (
              <TableSkeleton rows={5} columns={["flex", 120, 100, 150, 100]} />
            ) : (
              <div className="p-4 text-neutral-60">테이블 데이터 표시 영역</div>
            )}
          </div>
        </section>

        {/* 차트 스켈레톤 테스트 */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-neutral-90 mb-4">차트 스켈레톤</h2>
          <div className="bg-white rounded-lg border border-neutral-60 p-6">
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
          <h2 className="text-2xl font-semibold text-neutral-90 mb-4">스케줄 스켈레톤</h2>
          <div className="bg-white rounded-lg border border-neutral-60 p-6">
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
          <h2 className="text-2xl font-semibold text-neutral-90 mb-4">랭킹 스켈레톤</h2>
          <div className="bg-white rounded-lg border border-neutral-60 p-6">
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
          <div className="bg-white rounded-lg border border-neutral-60 p-6">
            <div className="flex items-center gap-8 flex-wrap">
              <div className="flex flex-col items-center gap-2">
                <Spinner size="xs" />
                <span className="text-sm text-neutral-60">Extra Small</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <Spinner size="sm" />
                <span className="text-sm text-neutral-60">Small</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <Spinner size="md" />
                <span className="text-sm text-neutral-60">Medium</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <Spinner size="lg" />
                <span className="text-sm text-neutral-60">Large</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <Spinner size="xl" />
                <span className="text-sm text-neutral-60">Extra Large</span>
              </div>
            </div>
          </div>
        </section>

        {/* 인라인 로딩 상태 테스트 */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-neutral-90 mb-4">인라인 로딩 상태</h2>
          <div className="bg-white rounded-lg border border-neutral-60 p-6 space-y-4">
            <div className="flex items-center gap-3">
              <Spinner size="sm" />
              <span className="text-neutral-90">데이터를 불러오는 중입니다...</span>
            </div>
            <div className="flex items-center gap-3">
              <Spinner size="md" />
              <span className="text-neutral-90">처리 중입니다. 잠시만 기다려주세요.</span>
            </div>
            <div className="flex items-center gap-3">
              <Spinner size="sm" />
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
      </div>
    </div>
  );
}

// 스피너 컴포넌트
function Spinner({ size = "md" }: { size?: "xs" | "sm" | "md" | "lg" | "xl" }) {
  const sizeClasses = {
    xs: "w-3 h-3 border-2",
    sm: "w-4 h-4 border-2",
    md: "w-6 h-6 border-[3px]",
    lg: "w-8 h-8 border-[3px]",
    xl: "w-12 h-12 border-4",
  };

  return (
    <div
      className={`${sizeClasses[size]} border-neutral-30 border-t-neutral-70 rounded-full animate-spin`}
      role="status"
      aria-label="로딩 중"
    >
      <span className="sr-only">로딩 중</span>
    </div>
  );
}

