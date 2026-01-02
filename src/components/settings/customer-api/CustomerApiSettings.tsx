"use client";

import { useEffect, useState } from "react";
import { useSelectedProjectId } from "@/hooks/useSelectedProjectId";
import { ProjectsService } from "@/services/projects";
import ApiKeyRegenerateModal from "./ApiKeyRegenerateModal";
import { showErrorModal } from "@/providers/ErrorFeedbackModalProvider";

export default function CustomerApiSettings() {
  const [projectId] = useSelectedProjectId();
  const [showKey, setShowKey] = useState(false);
  const [copyState, setCopyState] = useState<"idle" | "copied">("idle");
  const [keyCopyState, setKeyCopyState] = useState<"idle" | "copied">("idle");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [apiKey, setApiKey] = useState<string>("");
  const [apiEndpoint, setApiEndpoint] = useState<string>("");
  const [loading, setLoading] = useState(true);

  // API 데이터 로드
  useEffect(() => {
    const fetchApiData = async () => {
      if (!projectId) return;
      
      setLoading(true);
      try {
        const headers = { "x-project-id": projectId };
        
        // API Key와 Endpoint를 병렬로 가져오기
        const [apiKeyResponse, endpointResponse] = await Promise.all([
          ProjectsService.getApiKey(headers),
          ProjectsService.getExternalApiEndpoint(headers),
        ]);

        if (apiKeyResponse.data?.data?.apiKey) {
          setApiKey(apiKeyResponse.data.data.apiKey);
        }

        if (endpointResponse.data?.data?.endpoint) {
          setApiEndpoint(endpointResponse.data.data.endpoint);
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
  }, [projectId]);

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

  const handleCopyKey = async () => {
    if (!apiKey) return;
    
    try {
      await navigator.clipboard.writeText(apiKey);
      setKeyCopyState("copied");
      setTimeout(() => setKeyCopyState("idle"), 1500);
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

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleConfirmRegenerate = async () => {
    if (!projectId) return;

    try {
      const headers = { "x-project-id": projectId };
      const response = await ProjectsService.regenerateApiKey(headers);

      if (response.data?.data?.apiKey) {
        setApiKey(response.data.data.apiKey);
        setIsModalOpen(false);
        showErrorModal({
          type: "success",
          headline: "API 키가 재발급되었습니다.",
          hideCancel: true,
          confirmText: "확인",
        });
      }
    } catch (err) {
      console.error("Failed to regenerate API key", err);
      showErrorModal({
        type: "error",
        headline: "API 키 재발급에 실패했습니다.",
        hideCancel: true,
        confirmText: "확인",
      });
    }
  };

  return (
    <div className="bg-card rounded-[14px] lg:rounded-[14px] rounded-t-none lg:rounded-t-[14px] pb-4 md:pb-7 flex flex-col min-h-screen md:min-h-0 md:h-full">
      <h1 className="text-[20px] md:text-[24px] font-bold text-foreground px-4 md:px-7 leading-[1] h-[64px] md:h-[76px] flex items-center">
        고객등록 API
      </h1>

      {/* divider */}
      <div className="w-full h-[1px] bg-neutral-30 opacity-70"></div>

      <header className="space-y-3 md:space-y-4 px-4 md:px-7 pt-4 md:pt-[30px]">
        <div className="space-y-1">
          <p className="text-[14px] md:text-[16px] font-semibold text-foreground leading-[1]">API 정보</p>
          <p className="text-[13px] md:text-[14px] text-neutral-60">
            외부 시스템에서 고객 정보를 등록할 수 있는 API 엔드포인트와 인증 키를 관리합니다.
          </p>
        </div>
        {/* divider */}
        <div className="w-full h-[1px] bg-neutral-30 opacity-50"></div>
      </header>
      

      <section className="space-y-4 md:space-y-5 px-4 md:px-7 pt-4 md:pt-[18px]">
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

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-[13px] md:text-[14px] font-medium text-neutral-60 leading-[1]">API 키</h2>
          </div>
          <div
            className="flex items-center min-h-[50px] h-auto md:h-[50px] gap-2 bg-neutral-10 rounded-[5px] px-3 md:px-6 py-2 md:py-4"
            onMouseEnter={() => setShowKey(true)}
            onMouseLeave={() => setShowKey(false)}
          >
            <input
              type="text"
              value={loading ? "로딩 중..." : apiKey || ""}
              readOnly
              disabled={loading}
              className={`flex-1 min-w-0 bg-transparent text-[13px] md:text-[14px] text-neutral-70 font-medium outline-none tracking-[-0.02em] transition-filter disabled:text-neutral-50 ${showKey ? "filter-none" : "blur-sm"}`}
            />
            <div className="flex items-center gap-2 md:gap-4 flex-shrink-0">
              <button
                onClick={handleCopyKey}
                disabled={loading || !apiKey}
                className="cursor-pointer w-[44px] md:w-[48px] h-[34px] rounded-[5px] border border-neutral-30 text-[13px] md:text-[14px] font-semibold bg-neutral-0 hover:bg-neutral-10 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {keyCopyState === "copied" ? "복사됨" : "복사"}
              </button>
              <button
                onClick={handleOpenModal}
                disabled={loading}
                className="cursor-pointer w-[56px] md:w-[60px] h-[34px] rounded-[5px] bg-neutral-90 text-[13px] md:text-[14px] font-semibold text-neutral-0 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                재발급
              </button>
            </div>
          </div>
          <p className="text-[13px] md:text-[14px] text-warning-40">
            ⚠️ API 키는 안전한 곳에 보관하세요. 키가 노출되면 즉시 재발급하시기 바랍니다.
          </p>
        </div>
      </section>

      {/* API Key Regenerate Modal */}
      <ApiKeyRegenerateModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onConfirm={handleConfirmRegenerate}
      />
    </div>
  );
}

