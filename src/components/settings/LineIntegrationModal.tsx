"use client";

import { useState, useEffect } from "react";
import { MessengerIntegrationService } from "@/services/messengerIntegration";
import { showErrorModal } from "@/lib/errorModalEvents";
import BaseModal from "@/components/common/BaseModal";

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
        showErrorModal({
          type: "error",
          headline: "웹훅 URL 조회에 실패했습니다.",
          hideCancel: true,
        });
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
      showErrorModal({
        type: "success",
        headline: "웹훅 URL이 복사되었습니다.",
        hideCancel: true,
      });
    }
  };

  const handleSubmit = async () => {
    if (!channelId.trim() || !channelSecret.trim()) {
      showErrorModal({
        type: "error",
        headline: "채널 ID와 시크릿을 모두 입력해주세요.",
        hideCancel: true,
      });
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

  // Step indicator click handler
  const handleStepClick = (targetStep: 1 | 2 | 3) => {
    if (isSaving) return;
    setStep(targetStep);
  };

  if (!isOpen) return null;

  return (
    <BaseModal
      onClose={handleClose}
      zIndexClassName="z-50"
      overlayClassName="bg-black/30 dark:bg-[#000000CC]"
      ariaLabel="라인 공식 계정 연동"
      positionerClassName="md:flex md:items-center md:justify-center"
      disableAutoContainerSizing
      containerClassName="relative bg-card dark:bg-neutral-10 w-full h-full md:w-[848px] md:h-auto md:rounded-[14px] md:max-h-[90vh] flex flex-col"
    >
        {/* 헤더 */}
        <div className="h-[64px] flex items-center px-4 md:px-7 md:border-b md:border-neutral-30/40 dark:border-neutral-30/40">
          <button
            aria-label="back"
            className="md:hidden cursor-pointer w-6 h-6 grid place-items-center hover:opacity-70 transition-opacity mr-2"
            onClick={handleClose}
            disabled={isSaving}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M15 19L8 12L15 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <h2 className="text-[18px] font-semibold leading-[21px] text-ink dark:text-neutral-80">
            라인 공식 계정 연동
          </h2>
          <button
            aria-label="close"
            className="cursor-pointer ml-auto w-6 h-6 grid place-items-center hover:opacity-70 transition-opacity"
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
                stroke="currentColor"
                className="text-neutral-50 dark:text-neutral-50"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>

        {/* 단계 인디케이터 */}
        <div className="flex justify-center gap-4 md:gap-[30px] mt-6 md:mt-8 mb-6 md:mb-8">
          {/* 1단계 */}
          <div 
            className="flex flex-col items-center gap-2 cursor-pointer"
            onClick={() => handleStepClick(1)}
          >
            <div
              className={`w-9 h-9 rounded-full grid place-items-center transition-colors ${
                step >= 1 ? "bg-primary-10 dark:bg-primary-10" : "bg-neutral-20 dark:bg-neutral-20"
              }`}
            >
              <span
                className={`text-[18px] font-semibold leading-[21px] transition-colors ${
                  step >= 1 ? "text-primary-80 dark:text-primary-80" : "text-neutral-60 dark:text-neutral-60"
                }`}
              >
                1
              </span>
            </div>
            <div
              className={`text-[12px] md:text-[14px] font-medium leading-[17px] transition-colors ${
                step >= 1 ? "text-primary-80 dark:text-primary-80" : "text-neutral-60 dark:text-neutral-60"
              }`}
            >
              계정 생성
            </div>
          </div>

          <div className="w-[30px] md:w-[60px] h-px bg-neutral-30 translate-y-4" />

          {/* 2단계 */}
          <div 
            className="flex flex-col items-center gap-2 cursor-pointer"
            onClick={() => handleStepClick(2)}
          >
            <div
              className={`w-9 h-9 rounded-full grid place-items-center transition-colors ${
                step >= 2 ? "bg-primary-10 dark:bg-primary-10" : "bg-neutral-20 dark:bg-neutral-20"
              }`}
            >
              <span
                className={`text-[18px] font-semibold leading-[21px] transition-colors ${
                  step >= 2 ? "text-primary-80 dark:text-primary-80" : "text-neutral-60 dark:text-neutral-60"
                }`}
              >
                2
              </span>
            </div>
            <div
              className={`text-[12px] md:text-[14px] font-medium leading-[17px] transition-colors ${
                step >= 2 ? "text-primary-80 dark:text-primary-80" : "text-neutral-60 dark:text-neutral-60"
              }`}
            >
              웹훅 설정
            </div>
          </div>

          <div className="w-[30px] md:w-[60px] h-px bg-neutral-30 translate-y-4" />

          {/* 3단계 */}
          <div 
            className="flex flex-col items-center gap-2 cursor-pointer"
            onClick={() => handleStepClick(3)}
          >
            <div
              className={`w-9 h-9 rounded-full grid place-items-center transition-colors ${
                step >= 3 ? "bg-primary-10 dark:bg-primary-10" : "bg-neutral-20 dark:bg-neutral-20"
              }`}
            >
              <span
                className={`text-[18px] font-semibold leading-[21px] transition-colors ${
                  step >= 3 ? "text-primary-80 dark:text-primary-80" : "text-neutral-60 dark:text-neutral-60"
                }`}
              >
                3
              </span>
            </div>
            <div
              className={`text-[12px] md:text-[14px] font-medium leading-[17px] transition-colors ${
                step >= 3 ? "text-primary-80 dark:text-primary-80" : "text-neutral-60 dark:text-neutral-60"
              }`}
            >
              인증 정보
            </div>
          </div>
        </div>

        {/* 본문 */}
        <div className="flex-1 px-4 md:px-7 pb-4 md:pb-[30px] overflow-y-auto">
          {step === 1 && (
            <div className="bg-neutral-10 dark:bg-neutral-20 rounded-[5px] px-4 md:px-6 py-3">
              <h3 className="text-[14px] font-medium text-foreground dark:text-neutral-80 mb-4 leading-6">
                1단계: LINE Official Account Manager 설정
              </h3>
              <div className="text-[14px] font-medium text-neutral-60 dark:text-neutral-60 leading-6 space-y-1">
                <div className="pl-6" style={{ textIndent: '-1rem' }}>1. LINE Official Account Manager 페이지에서 계정을 생성합니다.</div>
                <div className="pl-6" style={{ textIndent: '-1rem' }}>2. 계정 생성 후 홈 화면에서 우측 상단의 설정 버튼을 클릭합니다.</div>
                <div className="pl-6" style={{ textIndent: '-1rem' }}>3. 좌측 메뉴에서 답변 설정 메뉴를 선택합니다.</div>
                <div className="pl-6" style={{ textIndent: '-1rem' }}>4. Webhook 항목을 활성화합니다.</div>
                <div className="pl-6" style={{ textIndent: '-1rem' }}>5. 설정이 완료되면 다음 단계로 진행합니다.</div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="bg-neutral-10 dark:bg-neutral-20 rounded-[5px] px-4 md:px-6 py-3">
              {/* 제목 */}
              <h3 className="text-[14px] font-medium text-foreground dark:text-neutral-80 mb-2 leading-6">
                2단계: 웹훅 URL 등록
              </h3>

              {/* 설명 */}
              <div className="text-[14px] font-medium text-neutral-60 dark:text-neutral-60 mb-2 leading-6">
                아래 웹훅 URL을 LINE Official Account Manager의 Webhook URL에 등록해주세요
              </div>

              {/* 웹훅 URL 입력 필드 + 복사 버튼 */}
              <div className="flex gap-3 mb-2">
                <input
                  type="text"
                  value={isLoadingWebhook ? "로딩 중..." : webhookUrl}
                  readOnly
                  className="flex-1 px-3 py-2 border border-neutral-30 dark:border-neutral-30 rounded-[5px] text-[14px] text-neutral-60 dark:text-neutral-60 bg-card dark:bg-neutral-10 tracking-[-0.02em] leading-[17px]"
                />
                <button
                  onClick={handleCopyWebhookUrl}
                  disabled={!webhookUrl || isLoadingWebhook}
                  className="cursor-pointer md:w-[72px] h-[34px] px-3 py-1.5 bg-neutral-90 dark:bg-neutral-80 text-neutral-20 dark:text-neutral-0 rounded-[5px] text-[14px] font-semibold tracking-[-0.02em] leading-[17px] hover:opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  복사
                </button>
              </div>

              {/* 등록 방법 안내 */}
              <div className="text-[14px] font-medium text-neutral-60 dark:text-neutral-60 leading-6 space-y-1">
                <div>등록 방법:</div>
                <div className="pl-6" style={{ textIndent: '-1rem' }}>1. LINE Official Account Manager에서 설정 → Messaging API메뉴로 이동</div>
                <div className="pl-6" style={{ textIndent: '-1rem' }}>2. Webhook URL 필드에 위 URL을 입력하고 저장 버튼을 클릭합니다.</div>
                <div className="pl-6" style={{ textIndent: '-1rem' }}>3. 등록이 완료되면 다음 단계로 진행합니다.</div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="bg-neutral-10 dark:bg-neutral-20 rounded-[5px] px-4 md:px-6 py-3">
              <h3 className="text-[14px] font-medium text-foreground dark:text-neutral-80 mb-2 leading-6">
                3단계: 인증 정보 입력
              </h3>

              <div className="text-[14px] font-medium text-neutral-60 dark:text-neutral-60 mb-3 leading-6">
                설정 - Messaging API 메뉴에서 Channel ID와 Channel Secret을 확인하여 입력해주세요.
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-[14px] font-medium text-neutral-60 dark:text-neutral-60 mb-2">
                    Channel ID
                  </label>
                  <input
                    type="text"
                    value={channelId}
                    onChange={(e) => setChannelId(e.target.value)}
                    placeholder="1234567890"
                    className="w-full px-3 py-2 border border-neutral-30 dark:border-neutral-30 font-medium rounded-[5px] text-[14px] text-foreground dark:text-neutral-80 bg-card dark:bg-neutral-10 focus:outline-none focus:border-foreground dark:focus:border-neutral-80"
                    disabled={isSaving}
                  />
                </div>

                <div>
                  <label className="block text-[14px] font-medium text-neutral-60 dark:text-neutral-60 mb-2">
                    Channel Secret
                  </label>
                  <input
                    type="password"
                    value={channelSecret}
                    onChange={(e) => setChannelSecret(e.target.value)}
                    placeholder="abdcefghijklmnopqrstuvwxyz1234567890"
                    className="w-full px-3 py-2 border border-neutral-30 dark:border-neutral-30 font-medium rounded-[5px] text-[14px] text-foreground dark:text-neutral-80 bg-card dark:bg-neutral-10 focus:outline-none focus:border-foreground dark:focus:border-neutral-80"
                    disabled={isSaving}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 하단 버튼 영역 */}
        <div className="border-t border-neutral-30 dark:border-neutral-30 px-4 md:px-7 py-3 flex items-center justify-end gap-2 md:gap-3">
          <button
            className="cursor-pointer flex-1 md:flex-none h-[34px] px-3 rounded-[5px] border border-neutral-30 dark:border-neutral-30 text-[14px] font-semibold text-ink dark:text-neutral-80 bg-card dark:bg-neutral-10 hover:bg-neutral-10 dark:hover:bg-neutral-20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleClose}
            disabled={isSaving}
          >
            취소
          </button>

          {step > 1 && (
            <button
              className="cursor-pointer flex-1 md:flex-none h-[34px] px-3 rounded-[5px] border border-neutral-30 dark:border-neutral-30 text-[14px] font-semibold text-ink dark:text-neutral-80 bg-card dark:bg-neutral-10 hover:bg-neutral-10 dark:hover:bg-neutral-20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={() => setStep((step - 1) as 1 | 2 | 3)}
              disabled={isSaving}
            >
              이전
            </button>
          )}

          {step < 3 ? (
            <button
              className="cursor-pointer flex-1 md:flex-none h-[34px] px-3 rounded-[5px] bg-neutral-90 dark:bg-neutral-80 text-neutral-20 dark:text-neutral-0 text-[14px] font-semibold leading-[17px] hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={() => setStep((step + 1) as 1 | 2 | 3)}
              disabled={!canGoNext() || isSaving}
            >
              다음
            </button>
          ) : (
            <button
              className="cursor-pointer flex-1 md:flex-none h-[34px] px-3 rounded-[5px] bg-neutral-90 dark:bg-neutral-80 text-neutral-20 dark:text-neutral-0 text-[14px] font-semibold leading-[17px] hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleSubmit}
              disabled={!canGoNext() || isSaving}
            >
              {isSaving ? "연동 중..." : "연동"}
            </button>
          )}
        </div>
    </BaseModal>
  );
}
