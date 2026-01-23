"use client";

import { useEffect, useState } from "react";
import { useSelectedProjectId } from "@/hooks/useSelectedProjectId";
import { ProjectsService } from "@/services/projects";
import { ApiKeysService } from "@/services/apiKeys";
import type { ApiKey } from "@/types/apiKeys";
import ApiKeyCreateModal from "./ApiKeyCreateModal";
import { showErrorModal } from "@/providers/ErrorFeedbackModalProvider";

export default function CustomerApiSettings() {
  const [projectId] = useSelectedProjectId();
  const [copyState, setCopyState] = useState<"idle" | "copied">("idle");
  const [apiEndpoint, setApiEndpoint] = useState<string>("");
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [copyStates, setCopyStates] = useState<Record<number, "idle" | "copied">>({});
  const [hoveredKeyId, setHoveredKeyId] = useState<number | null>(null);

  const limit = 20;

  // API 데이터 로드
  useEffect(() => {
    const fetchApiData = async () => {
      if (!projectId) return;

      setLoading(true);
      try {
        const headers = { "x-project-id": projectId };

        // API Endpoint와 API Keys를 병렬로 가져오기
        const [endpointResponse, apiKeysResponse] = await Promise.all([
          ProjectsService.getExternalApiEndpoint(headers),
          ApiKeysService.list({ page, limit }, headers),
        ]);

        if (endpointResponse.data?.data?.endpoint) {
          setApiEndpoint(endpointResponse.data.data.endpoint);
        }

        if (apiKeysResponse.data?.data) {
          setApiKeys(apiKeysResponse.data.data.apiKeys);
          setTotalPages(apiKeysResponse.data.data.totalPages);
        }
      } catch (err) {
        console.error("Failed to fetch API data", err);
        showErrorModal({
          type: "error",
          headline: "API 정보를 불러오는데 실패했습니다.",
          hideCancel: true,
          confirmText: "확인",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchApiData();
  }, [projectId, page]);

  const handleCopyEndpoint = async () => {
    if (!apiEndpoint) return;

    try {
      await navigator.clipboard.writeText(apiEndpoint);
      setCopyState("copied");
      setTimeout(() => setCopyState("idle"), 1500);
    } catch (err) {
      console.error("Failed to copy endpoint", err);
      showErrorModal({
        type: "error",
        headline: "복사에 실패했습니다. 잠시 후 다시 시도해주세요.",
        hideCancel: true,
        confirmText: "확인",
      });
    }
  };

  const handleCopyKey = async (keyValue: string, keyId: number) => {
    if (!keyValue) return;

    try {
      await navigator.clipboard.writeText(keyValue);
      setCopyStates((prev) => ({ ...prev, [keyId]: "copied" }));
      setTimeout(() => {
        setCopyStates((prev) => ({ ...prev, [keyId]: "idle" }));
      }, 1500);
    } catch (err) {
      console.error("Failed to copy API key", err);
      showErrorModal({
        type: "error",
        headline: "복사에 실패했습니다. 잠시 후 다시 시도해주세요.",
        hideCancel: true,
        confirmText: "확인",
      });
    }
  };

  const handleCreateApiKey = async (name: string) => {
    if (!projectId) return;

    try {
      const headers = { "x-project-id": projectId };
      const response = await ApiKeysService.create({ name }, headers);

      if (response.data?.data) {
        // 새로 생성된 API 키를 목록에 추가
        setApiKeys((prev) => [response.data.data, ...prev]);
        showErrorModal({
          type: "success",
          headline: "API 키가 생성되었습니다.",
          hideCancel: true,
          confirmText: "확인",
        });
      }
    } catch (err) {
      console.error("Failed to create API key", err);
      showErrorModal({
        type: "error",
        headline: "API 키 생성에 실패했습니다.",
        hideCancel: true,
        confirmText: "확인",
      });
      throw err;
    }
  };

  const handleDeleteApiKey = async (id: number) => {
    if (!projectId) return;

    showErrorModal({
      type: "error",
      headline: "API 키를 삭제하시겠습니까?",
      description: "이 작업은 되돌릴 수 없습니다.",
      onConfirm: async () => {
        try {
          const headers = { "x-project-id": projectId };
          await ApiKeysService.remove(id, headers);

          // 삭제된 API 키를 목록에서 제거
          setApiKeys((prev) => prev.filter((key) => key.id !== id));
          showErrorModal({
            type: "success",
            headline: "API 키가 삭제되었습니다.",
            hideCancel: true,
            confirmText: "확인",
          });
        } catch (err) {
          console.error("Failed to delete API key", err);
          showErrorModal({
            type: "error",
            headline: "API 키 삭제에 실패했습니다.",
            hideCancel: true,
            confirmText: "확인",
          });
        }
      },
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  return (
    <>
      {/* Box 1: API 정보 */}
      <div className="bg-card rounded-[14px] lg:rounded-[14px] rounded-t-none lg:rounded-t-[14px] pb-4 md:pb-7 flex flex-col">
        <h1 className="text-[20px] md:text-[24px] font-bold text-foreground px-4 md:px-7 leading-[1] h-[64px] md:h-[76px] flex items-center">
          고객등록 API
        </h1>

        {/* divider */}
        <div className="w-full h-[1px] bg-neutral-30 opacity-70"></div>

        {/* Section 1: API 정보 */}
        <section className="px-4 md:px-7 pt-4 md:pt-[30px]">
          <header className="space-y-3 md:space-y-4 mb-4 md:mb-5">
            <div className="space-y-1">
              <p className="text-[14px] md:text-[16px] font-semibold text-foreground leading-[1]">API 정보</p>
              <p className="text-[13px] md:text-[14px] text-neutral-60">
                외부 시스템에서 고객 정보를 등록할 수 있는 API 엔드포인트와 인증 키를 관리합니다.
              </p>
            </div>
            {/* divider */}
            <div className="w-full h-[1px] bg-neutral-30 opacity-50"></div>
          </header>

          <div className="space-y-2">
            <h2 className="text-[13px] md:text-[14px] font-medium text-neutral-60 leading-[1]">API 엔드포인트</h2>
            <div className="flex items-center min-h-[50px] h-auto md:h-[50px] gap-2 bg-neutral-10 rounded-[5px] px-3 md:px-6 py-2 md:py-0">
              <input
                type="text"
                value={loading ? "로딩 중..." : apiEndpoint || ""}
                readOnly
                disabled={loading}
                className="flex-1 min-w-0 bg-transparent text-[13px] md:text-[14px] text-neutral-70 font-medium outline-none tracking-[-0.02em] disabled:text-neutral-50"
              />
              <button
                onClick={handleCopyEndpoint}
                disabled={loading || !apiEndpoint}
                className="cursor-pointer w-[44px] md:w-[48px] h-[34px] rounded-[5px] border border-neutral-30 text-[13px] md:text-[14px] font-semibold bg-neutral-0 hover:bg-neutral-10 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
              >
                {copyState === "copied" ? "복사됨" : "복사"}
              </button>
            </div>
          </div>
        </section>
      </div>

      {/* Box 2: API 키 */}
      <div className="bg-card rounded-[14px] pb-4 md:pb-7 flex flex-col mt-8">
        {/* Section 2: API 키 */}
        <section className="px-4 md:px-7 pt-4 md:pt-[30px]">
          <header className="space-y-3 md:space-y-4 mb-4 md:mb-5">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-[14px] md:text-[16px] font-semibold text-foreground leading-[1]">API 키</p>
                <p className="text-[13px] md:text-[14px] text-neutral-60">
                  API 호출 시 신원 확인 및 보안 인증에 필요한 전용 API 키를 생성하고 관리합니다.
                </p>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(true)}
                disabled={loading}
                className="cursor-pointer h-[34px] px-3 md:px-4 rounded-[5px] bg-neutral-90 text-[13px] md:text-[14px] font-semibold text-neutral-0 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0 whitespace-nowrap"
              >
                API 키 생성
              </button>
            </div>
            {/* divider */}
            <div className="w-full h-[1px] bg-neutral-30 opacity-50"></div>
          </header>

          <p className="text-[13px] md:text-[14px] text-warning-40 mt-2 md:mt-3 mb-7">
            ⚠️ API 키는 안전한 곳에 보관하세요. 키가 노출되면 즉시 삭제하시기 바랍니다.
          </p>

          {loading ? (
            <div className="text-[13px] md:text-[14px] text-neutral-60 py-8 text-center">
              로딩 중...
            </div>
          ) : apiKeys.length === 0 ? (
            <div className="text-[13px] md:text-[14px] text-neutral-60 py-8 text-center">
              생성된 API 키가 없습니다.
            </div>
          ) : (
            <div className="space-y-3 md:space-y-4">
              {apiKeys.map((apiKey) => (
                <div
                  key={apiKey.id}
                  className="space-y-2"
                  onMouseEnter={() => setHoveredKeyId(apiKey.id)}
                  onMouseLeave={() => setHoveredKeyId(null)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 md:gap-3">
                        <span className="text-[13px] md:text-[14px] font-medium text-foreground truncate">
                          {apiKey.name}
                        </span>
                        <span className="text-[12px] md:text-[13px] text-neutral-50 whitespace-nowrap">
                          {formatDate(apiKey.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center min-h-[50px] h-auto md:h-[50px] gap-2 bg-neutral-10 rounded-[5px] px-3 md:px-6 py-2 md:py-4">
                    <input
                      type="text"
                      value={apiKey.keyValue}
                      readOnly
                      className={`flex-1 min-w-0 bg-transparent text-[13px] md:text-[14px] text-neutral-70 font-medium outline-none tracking-[-0.02em] transition-filter ${
                        hoveredKeyId === apiKey.id ? "filter-none" : "blur-sm"
                      }`}
                    />
                    <div className="flex items-center gap-2 md:gap-4 flex-shrink-0">
                      <button
                        onClick={() => handleCopyKey(apiKey.keyValue, apiKey.id)}
                        className="cursor-pointer w-[44px] md:w-[48px] h-[34px] rounded-[5px] border border-neutral-30 text-[13px] md:text-[14px] font-semibold bg-neutral-0 hover:bg-neutral-10 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {copyStates[apiKey.id] === "copied" ? "복사됨" : "복사"}
                      </button>
                      <button
                        onClick={() => handleDeleteApiKey(apiKey.id)}
                        className="cursor-pointer w-[44px] md:w-[48px] h-[34px] rounded-[5px] border border-danger-40 text-[13px] md:text-[14px] font-semibold text-danger-40 hover:bg-danger-10 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        삭제
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6 md:mt-8">
              <button
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                disabled={page === 1 || loading}
                className="cursor-pointer h-[34px] px-3 rounded-[5px] border border-neutral-30 text-[13px] md:text-[14px] font-semibold bg-neutral-0 hover:bg-neutral-10 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                이전
              </button>
              <span className="text-[13px] md:text-[14px] text-neutral-60">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={page === totalPages || loading}
                className="cursor-pointer h-[34px] px-3 rounded-[5px] border border-neutral-30 text-[13px] md:text-[14px] font-semibold bg-neutral-0 hover:bg-neutral-10 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                다음
              </button>
            </div>
          )}

          
        </section>
      </div>

      {/* API Key Create Modal */}
      <ApiKeyCreateModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onConfirm={handleCreateApiKey}
      />
    </>
  );
}
