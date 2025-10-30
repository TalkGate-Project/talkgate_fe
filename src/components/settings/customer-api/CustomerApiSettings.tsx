"use client";

import { useState } from "react";

const API_ENDPOINT_PLACEHOLDER = "https://api.talkgate.im/v1/projects/proj_1fdx73abc123/customers";
const API_KEY_PLACEHOLDER = "TGK-1a9d6sd9a6sd96asd9a6sd9a6sd9as6d";

export default function CustomerApiSettings() {
  const [showKey, setShowKey] = useState(false);
  const [copyState, setCopyState] = useState<"idle" | "copied">("idle");
  const [keyCopyState, setKeyCopyState] = useState<"idle" | "copied">("idle");

  const handleCopyEndpoint = async () => {
    try {
      await navigator.clipboard.writeText(API_ENDPOINT_PLACEHOLDER);
      setCopyState("copied");
      setTimeout(() => setCopyState("idle"), 1500);
    } catch (err) {
      console.error("Failed to copy endpoint", err);
      alert("복사에 실패했습니다. 다시 시도해주세요.");
    }
  };

  const handleCopyKey = async () => {
    try {
      await navigator.clipboard.writeText(API_KEY_PLACEHOLDER);
      setKeyCopyState("copied");
      setTimeout(() => setKeyCopyState("idle"), 1500);
    } catch (err) {
      console.error("Failed to copy API key", err);
      alert("복사에 실패했습니다. 다시 시도해주세요.");
    }
  };

  const handleRegenerate = () => {
    alert("API 키 재발급은 추후 API 연동 후 구현 예정입니다.");
  };

  return (
    <div className="bg-white rounded-[14px] shadow-sm p-10 flex flex-col gap-8">
      <header className="space-y-3">
        <div className="flex items-center justify-between">
          <h1 className="text-[24px] font-bold text-[#252525]">고객등록 API</h1>
        </div>
        <p className="text-[16px] font-medium text-[#808080]">
          외부 시스템에서 고객 정보를 등록할 수 있는 API 엔드포인트와 인증 키를 관리합니다.
        </p>
      </header>

      <section className="space-y-6">
        <div className="space-y-2">
          <h2 className="text-[16px] font-semibold text-[#252525]">API 엔드포인트</h2>
          <div className="flex items-center gap-3 bg-[#F8F8F8] rounded-[12px] px-6 py-4">
            <input
              type="text"
              value={API_ENDPOINT_PLACEHOLDER}
              readOnly
              className="flex-1 bg-transparent text-[14px] text-[#252525] font-medium outline-none"
            />
            <button
              onClick={handleCopyEndpoint}
              className="h-9 px-4 rounded-[5px] border border-[#E2E2E2] text-[14px] font-semibold text-[#252525] hover:bg-white"
            >
              {copyState === "copied" ? "복사됨" : "복사"}
            </button>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-[16px] font-semibold text-[#252525]">API 키</h2>
          </div>
          <div
            className="flex items-center gap-3 bg-[#F8F8F8] rounded-[12px] px-6 py-4"
            onMouseEnter={() => setShowKey(true)}
            onMouseLeave={() => setShowKey(false)}
          >
            <input
              type="text"
              value={API_KEY_PLACEHOLDER}
              readOnly
              className={`flex-1 bg-transparent text-[14px] text-[#252525] font-medium outline-none transition-filter ${showKey ? "filter-none" : "blur-sm"}`}
            />
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyKey}
                className="h-9 px-4 rounded-[5px] border border-[#E2E2E2] text-[14px] font-semibold text-[#252525] hover:bg-white"
              >
                {keyCopyState === "copied" ? "복사됨" : "복사"}
              </button>
              <button
                onClick={handleRegenerate}
                className="h-9 px-4 rounded-[5px] bg-[#252525] text-[14px] font-semibold text-white hover:opacity-90"
              >
                재발급
              </button>
            </div>
          </div>
          <p className="text-[14px] text-[#EFB008]">
            ⚠️ API 키는 안전한 곳에 보관하세요. 키가 노출되면 즉시 재발급하시기 바랍니다.
          </p>
        </div>
      </section>
    </div>
  );
}

