"use client";

import { useEffect, useState } from "react";
import { useSelectedProjectId } from "@/hooks/useSelectedProjectId";
import { ProjectsService } from "@/services/projects";
import { ApiKeysService } from "@/services/apiKeys";
import type { ApiKey } from "@/types/apiKeys";
import ApiKeyCreateModal from "./ApiKeyCreateModal";
import ApiKeyLinkModal from "./ApiKeyLinkModal";
import ApiKeyHistoryView from "./ApiKeyHistoryView";
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

  // 연동 모달 상태
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [selectedApiKeyForLink, setSelectedApiKeyForLink] = useState<ApiKey | null>(null);

  // 히스토리 뷰 상태
  const [selectedApiKeyForHistory, setSelectedApiKeyForHistory] = useState<ApiKey | null>(null);

  // API 키 이름 수정 모드
  const [editingKeyId, setEditingKeyId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState("");
  const [savingKeyId, setSavingKeyId] = useState<number | null>(null);

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

  // 연동 버튼 클릭 핸들러
  const handleOpenLinkModal = (apiKey: ApiKey) => {
    setSelectedApiKeyForLink(apiKey);
    setIsLinkModalOpen(true);
  };

  // 히스토리 버튼 클릭 핸들러
  const handleOpenHistory = (apiKey: ApiKey) => {
    setSelectedApiKeyForHistory(apiKey);
  };

  // 히스토리 뷰에서 뒤로가기
  const handleBackFromHistory = () => {
    setSelectedApiKeyForHistory(null);
  };

  // API 키 이름 수정 시작
  const handleStartEditName = (apiKey: ApiKey) => {
    setEditingKeyId(apiKey.id);
    setEditingName(apiKey.name);
  };

  // API 키 이름 수정 취소
  const handleCancelEditName = () => {
    setEditingKeyId(null);
    setEditingName("");
  };

  // API 키 이름 저장
  const handleSaveApiKeyName = async () => {
    if (!projectId || editingKeyId == null) return;
    const name = editingName.trim();
    if (!name) return;

    setSavingKeyId(editingKeyId);
    try {
      const headers = { "x-project-id": projectId };
      const response = await ApiKeysService.update(editingKeyId, { name }, headers);

      if (response.data?.data) {
        setApiKeys((prev) =>
          prev.map((k) => (k.id === editingKeyId ? { ...k, name: response.data!.data!.name } : k))
        );
        setEditingKeyId(null);
        setEditingName("");
        showErrorModal({
          type: "success",
          headline: "API 키 이름이 수정되었습니다.",
          hideCancel: true,
          confirmText: "확인",
        });
      }
    } catch (err) {
      console.error("Failed to update API key name", err);
      showErrorModal({
        type: "error",
        headline: "API 키 이름 수정에 실패했습니다.",
        hideCancel: true,
        confirmText: "확인",
      });
    } finally {
      setSavingKeyId(null);
    }
  };

  // 히스토리 뷰 렌더링
  if (selectedApiKeyForHistory && projectId) {
    return (
      <ApiKeyHistoryView
        apiKey={selectedApiKeyForHistory}
        projectId={projectId}
        onBack={handleBackFromHistory}
      />
    );
  }

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
                className="cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
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
                  <div className="flex items-center justify-between gap-2 md:gap-3">
                    <div className="flex-1 min-w-0">
                      {editingKeyId === apiKey.id ? (
                        <div className="flex items-center gap-2 md:gap-3 flex-wrap">
                          <input
                            type="text"
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleSaveApiKeyName();
                              if (e.key === "Escape") handleCancelEditName();
                            }}
                            className="w-full max-w-[240px] md:max-w-[280px] h-[28px] text-[13px] md:text-[14px] font-medium text-foreground leading-none bg-neutral-10 dark:bg-neutral-20 border border-neutral-30 rounded-[5px] px-2 py-0 outline-none focus:border-primary-50"
                            autoFocus
                            disabled={savingKeyId === apiKey.id}
                          />
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <button
                              type="button"
                              onClick={handleCancelEditName}
                              disabled={savingKeyId === apiKey.id}
                              className="cursor-pointer min-w-[44px] h-[28px] flex items-center justify-center px-2 rounded-[5px] bg-white dark:bg-neutral-10 border border-neutral-30 dark:border-neutral-30 text-[13px] md:text-[14px] font-semibold text-ink dark:text-neutral-80 tracking-[-0.02em] hover:bg-neutral-10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed leading-none"
                            >
                              취소
                            </button>
                            <button
                              type="button"
                              onClick={handleSaveApiKeyName}
                              disabled={savingKeyId === apiKey.id || !editingName.trim()}
                              className="cursor-pointer min-w-[44px] h-[28px] flex items-center justify-center px-2 rounded-[5px] bg-[#252525] dark:bg-neutral-90 text-[13px] md:text-[14px] font-semibold text-[#EDEDED] dark:text-neutral-20 tracking-[-0.02em] hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed leading-none"
                            >
                              저장
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 md:gap-3">
                          <span className="text-[13px] md:text-[14px] font-medium text-foreground truncate">
                            {apiKey.name}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleStartEditName(apiKey)}
                            className="cursor-pointer flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                            aria-label="이름 수정"
                          >
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M16.8898 3.11019L17.4201 2.57986V2.57986L16.8898 3.11019ZM5.41667 17.5296V18.2796C5.61558 18.2796 5.80634 18.2005 5.947 18.0599L5.41667 17.5296ZM2.5 17.5296H1.75C1.75 17.9438 2.08579 18.2796 2.5 18.2796V17.5296ZM2.5 14.5537L1.96967 14.0233C1.82902 14.164 1.75 14.3548 1.75 14.5537H2.5ZM13.9435 3.11019L14.4738 3.64052C14.9945 3.11983 15.8387 3.11983 16.3594 3.64052L16.8898 3.11019L17.4201 2.57986C16.3136 1.47338 14.5196 1.47338 13.4132 2.57986L13.9435 3.11019ZM16.8898 3.11019L16.3594 3.64052C16.8801 4.16122 16.8801 5.00544 16.3594 5.52614L16.8898 6.05647L17.4201 6.5868C18.5266 5.48032 18.5266 3.68635 17.4201 2.57986L16.8898 3.11019ZM16.8898 6.05647L16.3594 5.52614L4.88634 16.9992L5.41667 17.5296L5.947 18.0599L17.4201 6.5868L16.8898 6.05647ZM5.41667 17.5296V16.7796H2.5V17.5296V18.2796H5.41667V17.5296ZM13.9435 3.11019L13.4132 2.57986L1.96967 14.0233L2.5 14.5537L3.03033 15.084L14.4738 3.64052L13.9435 3.11019ZM2.5 14.5537H1.75V17.5296H2.5H3.25V14.5537H2.5ZM12.6935 4.36019L12.1632 4.89052L15.1094 7.8368L15.6398 7.30647L16.1701 6.77614L13.2238 3.82986L12.6935 4.36019Z" fill="#B0B0B0" />
                            </svg>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center min-h-[50px] h-auto md:h-[50px] gap-2 bg-neutral-10 rounded-[5px] px-3 md:px-6 py-2 md:py-4">
                    <input
                      type="text"
                      value={apiKey.keyValue}
                      readOnly
                      className={`flex-1 min-w-0 bg-transparent text-[13px] md:text-[14px] text-neutral-70 font-medium outline-none tracking-[-0.02em] transition-filter ${hoveredKeyId === apiKey.id ? "filter-none" : "blur-sm"
                        }`}
                    />
                    <div className="flex items-center gap-2 md:gap-4 flex-shrink-0">
                      {/* 히스토리 버튼 */}
                      <button
                        onClick={() => handleOpenHistory(apiKey)}
                        className="cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        aria-label="히스토리"
                      >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M9 12H15M9 16H15M17 21H7C5.89543 21 5 20.1046 5 19V5C5 3.89543 5.89543 3 7 3H12.5858C12.851 3 13.1054 3.10536 13.2929 3.29289L18.7071 8.70711C18.8946 8.89464 19 9.149 19 9.41421V19C19 20.1046 18.1046 21 17 21Z" stroke="#B0B0B0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </button>
                      {/* 연동 버튼 */}
                      <button
                        onClick={() => handleOpenLinkModal(apiKey)}
                        className="cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        aria-label="연동"
                      >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M13.8284 10.1716C12.2663 8.60948 9.73367 8.60948 8.17157 10.1716L4.17157 14.1716C2.60948 15.7337 2.60948 18.2663 4.17157 19.8284C5.73367 21.3905 8.26633 21.3905 9.82843 19.8284L10.93 18.7269M10.1716 13.8284C11.7337 15.3905 14.2663 15.3905 15.8284 13.8284L19.8284 9.82843C21.3905 8.26633 21.3905 5.73367 19.8284 4.17157C18.2663 2.60948 15.7337 2.60948 14.1716 4.17157L13.072 5.27118" stroke="#B0B0B0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </button>
                      {/* 복사 버튼 */}
                      <button
                        onClick={() => handleCopyKey(apiKey.keyValue, apiKey.id)}
                        className="cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        aria-label="복사"
                      >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M8 16H6C4.89543 16 4 15.1046 4 14V6C4 4.89543 4.89543 4 6 4H14C15.1046 4 16 4.89543 16 6V8M10 20H18C19.1046 20 20 19.1046 20 18V10C20 8.89543 19.1046 8 18 8H10C8.89543 8 8 8.89543 8 10V18C8 19.1046 8.89543 20 10 20Z" stroke="#B0B0B0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </button>
                      {/* 삭제 버튼 */}
                      <button
                        onClick={() => handleDeleteApiKey(apiKey.id)}
                        className="cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        aria-label="삭제"
                      >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M6 18L18 6M6 6L18 18" stroke="#B0B0B0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
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

      {/* API Key Link Modal */}
      {selectedApiKeyForLink && projectId && (
        <ApiKeyLinkModal
          isOpen={isLinkModalOpen}
          onClose={() => {
            setIsLinkModalOpen(false);
            setSelectedApiKeyForLink(null);
          }}
          apiKeyId={selectedApiKeyForLink.id}
          apiKeyName={selectedApiKeyForLink.name}
          projectId={projectId}
        />
      )}
    </>
  );
}
