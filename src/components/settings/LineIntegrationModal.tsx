"use client";

import { useState, useEffect } from "react";
import { MessengerIntegrationService } from "@/services/messengerIntegration";

interface LineIntegrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: {
    channelId: string;
    channelSecret: string;
  }) => Promise<void>;
  projectId: string;
}

export default function LineIntegrationModal({
  isOpen,
  onClose,
  onConfirm,
  projectId,
}: LineIntegrationModalProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [channelId, setChannelId] = useState("");
  const [channelSecret, setChannelSecret] = useState("");
  const [webhookUrl, setWebhookUrl] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingWebhook, setIsLoadingWebhook] = useState(false);

  // 2단계 진입 시 webhookUrl 조회
  useEffect(() => {
    const fetchWebhookUrl = async () => {
      if (step !== 2 || !projectId || webhookUrl) return;

      setIsLoadingWebhook(true);
      try {
        const response = await MessengerIntegrationService.lineWebhookUrl({
          "x-project-id": projectId,
        });

        if (response.data?.data?.webhookUrl) {
          setWebhookUrl(response.data.data.webhookUrl);
        }
      } catch (error) {
        console.error("Failed to fetch webhook URL:", error);
        alert("웹훅 URL 조회에 실패했습니다.");
      } finally {
        setIsLoadingWebhook(false);
      }
    };

    fetchWebhookUrl();
  }, [step, projectId, webhookUrl]);

  const handleClose = () => {
    setStep(1);
    setChannelId("");
    setChannelSecret("");
    setWebhookUrl("");
    onClose();
  };

  const handleCopyWebhookUrl = () => {
    if (webhookUrl) {
      navigator.clipboard.writeText(webhookUrl);
      alert("웹훅 URL이 복사되었습니다.");
    }
  };

  const handleSubmit = async () => {
    if (!channelId.trim() || !channelSecret.trim()) {
      alert("채널 ID와 시크릿을 모두 입력해주세요.");
      return;
    }

    setIsSaving(true);
    try {
      await onConfirm({
        channelId: channelId.trim(),
        channelSecret: channelSecret.trim(),
      });
      handleClose();
    } catch (error) {
      console.error("Integration failed:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const canGoNext = () => {
    if (step === 1) return true; // 1단계는 항상 다음으로 갈 수 있음
    if (step === 2) return Boolean(webhookUrl); // 2단계는 webhook URL 로드 완료
    if (step === 3) return channelId.trim() && channelSecret.trim(); // 3단계는 모든 입력 필수
    return false;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/30" onClick={handleClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-[14px] shadow-[0px_13px_61px_rgba(169,169,169,0.37)] w-[848px] max-h-[90vh] flex flex-col">
        {/* 헤더 */}
        <div className="h-[64px] flex items-center px-7 border-b border-[#E2E2E2]">
          <div className="text-[18px] font-semibold leading-[21px] text-[#000]">
            라인 공식 계정 연동
          </div>
          <button
            aria-label="close"
            className="ml-auto w-6 h-6 grid place-items-center hover:opacity-70 transition-opacity"
            onClick={handleClose}
            disabled={isSaving}
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M6 18L18 6M6 6L18 18"
                stroke="#B0B0B0"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>

        {/* 단계 인디케이터 */}
        <div className="flex items-center justify-center gap-[30px] mt-8 mb-8">
          {/* 1단계 */}
          <div className="flex flex-col items-center gap-[17px]">
            <div
              className={`w-9 h-9 rounded-full grid place-items-center ${
                step >= 1 ? "bg-[#D6FAE8]" : "bg-[#EDEDED]"
              }`}
            >
              <span
                className={`text-[18px] font-semibold leading-[21px] ${
                  step >= 1 ? "text-[#00B55B]" : "text-[#808080]"
                }`}
              >
                1
              </span>
            </div>
            <div
              className={`text-[14px] font-medium leading-[17px] ${
                step >= 1 ? "text-[#00B55B]" : "text-[#808080]"
              }`}
            >
              계정 생성
            </div>
          </div>

          <div className="w-[60px] h-px bg-[#E2E2E2]" />

          {/* 2단계 */}
          <div className="flex flex-col items-center gap-[17px]">
            <div
              className={`w-9 h-9 rounded-full grid place-items-center ${
                step >= 2 ? "bg-[#D6FAE8]" : "bg-[#EDEDED]"
              }`}
            >
              <span
                className={`text-[18px] font-semibold leading-[21px] ${
                  step >= 2 ? "text-[#00B55B]" : "text-[#808080]"
                }`}
              >
                2
              </span>
            </div>
            <div
              className={`text-[14px] font-medium leading-[17px] ${
                step >= 2 ? "text-[#00B55B]" : "text-[#808080]"
              }`}
            >
              웹훅 설정
            </div>
          </div>

          <div className="w-[60px] h-px bg-[#E2E2E2]" />

          {/* 3단계 */}
          <div className="flex flex-col items-center gap-[17px]">
            <div
              className={`w-9 h-9 rounded-full grid place-items-center ${
                step >= 3 ? "bg-[#D6FAE8]" : "bg-[#EDEDED]"
              }`}
            >
              <span
                className={`text-[18px] font-semibold leading-[21px] ${
                  step >= 3 ? "text-[#00B55B]" : "text-[#808080]"
                }`}
              >
                3
              </span>
            </div>
            <div
              className={`text-[14px] font-medium leading-[17px] ${
                step >= 3 ? "text-[#00B55B]" : "text-[#808080]"
              }`}
            >
              인증 정보
            </div>
          </div>
        </div>

        {/* 본문 */}
        <div className="flex-1 px-7 pb-4 overflow-y-auto">
          {step === 1 && (
            <div className="bg-[#F8F8F8] rounded-[5px] p-6">
              <h3 className="text-[14px] font-medium text-foreground mb-4 leading-6">
                1단계: LINE Official Account Manager 설정
              </h3>
              <div className="text-[14px] font-medium text-neutral-60 leading-6">
                <div>1. LINE Official Account Manager 페이지에서 계정을 생성합니다.</div>
                <div>2. 계정 생성 후 홈 화면에서 우측 상단의 설정 버튼을 클릭합니다.</div>
                <div>3. 좌측 메뉴에서 답변 설정 메뉴를 선택합니다.</div>
                <div>4. Webhook 항목을 활성화합니다.</div>
                <div>5. 설정이 완료되면 다음 단계로 진행합니다.</div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="bg-[#F8F8F8] rounded-[5px] p-6">
              {/* 제목 */}
              <h3 className="text-[14px] font-medium text-foreground mb-3 leading-6">
                2단계: 웹훅 URL 등록
              </h3>

              {/* 설명 */}
              <div className="text-[14px] font-medium text-neutral-60 mb-4 leading-6">
                아래 웹훅 URL을 LINE Official Account Manager의 Webhook URL에 등록해주세요
              </div>

              {/* 웹훅 URL 입력 필드 + 복사 버튼 */}
              <div className="flex gap-3 mb-6">
                <input
                  type="text"
                  value={isLoadingWebhook ? "로딩 중..." : webhookUrl}
                  readOnly
                  className="flex-1 px-3 py-2 border border-border rounded-[5px] text-[14px] text-neutral-60 bg-card text-center tracking-[-0.02em] leading-[17px]"
                />
                <button
                  onClick={handleCopyWebhookUrl}
                  disabled={!webhookUrl || isLoadingWebhook}
                  className="cursor-pointer w-[72px] h-[34px] px-3 py-1.5 bg-neutral-90 text-neutral-20 rounded-[5px] text-[14px] font-semibold tracking-[-0.02em] leading-[17px] hover:opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  복사
                </button>
              </div>

              {/* 등록 방법 안내 */}
              <div className="text-[14px] font-medium text-neutral-60 leading-6">
                <div className="mb-2">등록 방법:</div>
                <div>1. LINE Official Account Manager에서 설정 → Messaging API메뉴로 이동</div>
                <div>2. Webhook URL 필드에 위 URL을 입력하고 저장 버튼을 클릭합니다.</div>
                <div>3. 등록이 완료되면 다음 단계로 진행합니다.</div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="bg-[#F8F8F8] rounded-[5px] p-6">
              <h3 className="text-[14px] font-medium text-foreground mb-3 leading-6">
                3단계: 인증 정보 입력
              </h3>

              <div className="text-[14px] font-medium text-neutral-60 mb-6 leading-6">
                설정 - Messaging API 메뉴에서 Channel ID와 Channel Secret을 확인하여 입력해주세요.
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-[14px] font-medium text-foreground mb-2">
                    Channel ID
                  </label>
                  <input
                    type="text"
                    value={channelId}
                    onChange={(e) => setChannelId(e.target.value)}
                    placeholder="1234567890"
                    className="w-full px-3 py-2 border border-border rounded-[5px] text-[14px] text-foreground bg-card focus:outline-none focus:border-foreground"
                    disabled={isSaving}
                  />
                </div>

                <div>
                  <label className="block text-[14px] font-medium text-foreground mb-2">
                    Channel Secret
                  </label>
                  <input
                    type="password"
                    value={channelSecret}
                    onChange={(e) => setChannelSecret(e.target.value)}
                    placeholder="abdcefghijklmnopqrstuvwxyz1234567890"
                    className="w-full px-3 py-2 border border-border rounded-[5px] text-[14px] text-foreground bg-card focus:outline-none focus:border-foreground"
                    disabled={isSaving}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 하단 버튼 영역 */}
        <div className="border-t border-[#E2E2E2] px-7 py-4 flex items-center justify-end gap-3">
          <button
            className="h-[34px] px-3 rounded-[5px] border border-[#E2E2E2] text-[14px] font-semibold text-[#000] bg-white hover:bg-neutral-10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleClose}
            disabled={isSaving}
          >
            취소
          </button>

          {step > 1 && (
            <button
              className="h-[34px] px-3 rounded-[5px] border border-[#E2E2E2] text-[14px] font-semibold text-[#000] bg-white hover:bg-neutral-10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={() => setStep((step - 1) as 1 | 2 | 3)}
              disabled={isSaving}
            >
              이전
            </button>
          )}

          {step < 3 ? (
            <button
              className="h-[34px] px-3 rounded-[5px] bg-[#252525] text-[#D0D0D0] text-[14px] font-semibold leading-[17px] hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={() => setStep((step + 1) as 1 | 2 | 3)}
              disabled={!canGoNext() || isSaving}
            >
              다음
            </button>
          ) : (
            <button
              className="h-[34px] px-3 rounded-[5px] bg-[#252525] text-[#D0D0D0] text-[14px] font-semibold leading-[17px] hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleSubmit}
              disabled={!canGoNext() || isSaving}
            >
              {isSaving ? "연동 중..." : "연동"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
