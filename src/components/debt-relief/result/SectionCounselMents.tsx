"use client";

import { useEffect, useRef, useState } from "react";
import {
  COUNSEL_MENT_TABS,
  type CounselMentCategory,
  type DiagnosisDetail,
} from "@/types/debtRelief";
import { useDebtReliefAiChat, type DebtReliefChatHistory } from "./useDebtReliefAiChat";
import DisclaimerInfoTooltip from "./DisclaimerInfoTooltip";
import CopyIconButton from "@/components/common/CopyIconButton";
import MarkdownRenderer from "@/components/common/MarkdownRenderer";

function AiSparkleIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
      <path
        d="M7 1.2L8.05 5.05L11.9 6.1L8.05 7.15L7 11L5.95 7.15L2.1 6.1L5.95 5.05L7 1.2Z"
        fill="url(#aiSparkleGrad)"
      />
      <path
        d="M11.2 0.8L11.55 2.05L12.8 2.4L11.55 2.75L11.2 4L10.85 2.75L9.6 2.4L10.85 2.05L11.2 0.8Z"
        fill="url(#aiSparkleGrad)"
      />
      <defs>
        <linearGradient id="aiSparkleGrad" x1="7" y1="0.8" x2="7" y2="11" gradientUnits="userSpaceOnUse">
          <stop stopColor="#00E272" />
          <stop offset="1" stopColor="#A9FFD4" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function SendIcon() {
  return (
    <svg width="34" height="34" viewBox="0 0 34 34" fill="none" aria-hidden>
      <rect width="34" height="34" rx="17" fill="#252525" />
      <path
        d="M22.0352 10.2059C22.5449 10.1152 23.0802 10.1211 23.4795 10.5203C23.8786 10.9196 23.8846 11.455 23.7939 11.9647C23.7026 12.478 23.4795 13.1414 23.209 13.9529L20.3721 22.4656C19.985 23.6269 19.6782 24.5485 19.374 25.1736C19.0903 25.7568 18.6906 26.3377 18 26.3377C17.3094 26.3377 16.9097 25.7568 16.626 25.1736C16.3218 24.5485 16.015 23.6269 15.6279 22.4656L14.8418 20.1063C14.671 19.5939 14.6262 19.5011 14.5625 19.4373C14.4987 19.3735 14.4063 19.3289 13.8936 19.158L11.5342 18.3719C10.3728 17.9848 9.45142 17.678 8.82617 17.3738C8.24306 17.0902 7.66232 16.6903 7.66211 15.9998C7.66211 15.3092 8.243 14.9095 8.82617 14.6258C9.4514 14.3216 10.3728 14.0149 11.5342 13.6277L20.0469 10.7908C20.8586 10.5203 21.5218 10.2972 22.0352 10.2059ZM22.7725 11.2274C22.7347 11.1896 22.6373 11.1142 22.21 11.1902C21.7862 11.2657 21.2072 11.4578 20.3633 11.7391L11.8506 14.577C10.6591 14.9741 9.81502 15.2561 9.26367 15.5242C8.67044 15.8128 8.66211 15.9697 8.66211 15.9998C8.66218 16.0308 8.67268 16.1879 9.26367 16.4754C9.81504 16.7436 10.6592 17.0255 11.8506 17.4227L14.5137 18.3104C14.8076 18.413 15.0681 18.5269 15.2705 18.7293C15.5404 18.9993 15.6517 19.373 15.791 19.7908L16.5771 22.1492C16.9743 23.3406 17.2563 24.1848 17.5244 24.7361C17.813 25.3292 17.9699 25.3377 18 25.3377C18.0301 25.3377 18.187 25.3292 18.4756 24.7361C18.7437 24.1848 19.0257 23.3406 19.4229 22.1492L22.2607 13.6365C22.542 12.7929 22.7341 12.2135 22.8096 11.7899C22.8855 11.3632 22.8103 11.2652 22.7725 11.2274Z"
        fill="#B0B0B0"
      />
      <path
        d="M22.0352 10.2059L21.9476 9.71359L21.9476 9.7136L22.0352 10.2059ZM23.4795 10.5203L23.8331 10.1668L23.833 10.1668L23.4795 10.5203ZM23.7939 11.9647L24.2862 12.0523L24.2862 12.0522L23.7939 11.9647ZM23.209 13.9529L22.7346 13.7948L22.7346 13.7949L23.209 13.9529ZM20.3721 22.4656L20.8464 22.6237L20.8464 22.6237L20.3721 22.4656ZM19.374 25.1736L19.8236 25.3924L19.8236 25.3924L19.374 25.1736ZM16.626 25.1736L16.1764 25.3924L16.1764 25.3924L16.626 25.1736ZM15.6279 22.4656L15.1536 22.6237L15.1536 22.6237L15.6279 22.4656ZM14.8418 20.1063L15.3162 19.9482L15.3161 19.9481L14.8418 20.1063ZM14.5625 19.4373L14.9163 19.084L14.9161 19.0838L14.5625 19.4373ZM13.8936 19.158L14.0517 18.6837L14.0516 18.6837L13.8936 19.158ZM11.5342 18.3719L11.3761 18.8462L11.3761 18.8462L11.5342 18.3719ZM8.82617 17.3738L8.60744 17.8235L8.60746 17.8235L8.82617 17.3738ZM7.66211 15.9998H7.16211L7.16211 16L7.66211 15.9998ZM8.82617 14.6258L8.60744 14.1762L8.60743 14.1762L8.82617 14.6258ZM11.5342 13.6277L11.3761 13.1534L11.3761 13.1534L11.5342 13.6277ZM20.0469 10.7908L20.205 11.2652L20.205 11.2652L20.0469 10.7908ZM22.7725 11.2274L23.1264 10.8741L23.126 10.8738L22.7725 11.2274ZM22.21 11.1902L22.1224 10.698L22.1224 10.698L22.21 11.1902ZM20.3633 11.7391L20.2052 11.2647L20.2052 11.2647L20.3633 11.7391ZM11.8506 14.577L12.0087 15.0513L12.0087 15.0513L11.8506 14.577ZM9.26367 15.5242L9.04498 15.0746L9.04493 15.0746L9.26367 15.5242ZM8.66211 15.9998H8.16211L8.16211 16.001L8.66211 15.9998ZM9.26367 16.4754L9.04494 16.925L9.04499 16.925L9.26367 16.4754ZM11.8506 17.4227L12.0087 16.9483H12.0087L11.8506 17.4227ZM14.5137 18.3104L14.6786 17.8383L14.6718 17.836L14.5137 18.3104ZM15.2705 18.7293L15.6241 18.3758L15.6241 18.3758L15.2705 18.7293ZM15.791 19.7908L15.3167 19.9489V19.9489L15.791 19.7908ZM16.5771 22.1492L16.1028 22.3073V22.3073L16.5771 22.1492ZM17.5244 24.7361L17.0748 24.9548L17.0748 24.9549L17.5244 24.7361ZM18.4756 24.7361L18.9252 24.9549L18.9252 24.9548L18.4756 24.7361ZM19.4229 22.1492L18.9485 21.9911L18.9485 21.9911L19.4229 22.1492ZM22.2607 13.6365L22.7351 13.7947L22.7351 13.7946L22.2607 13.6365ZM22.8096 11.7899L23.3018 11.8775L23.3018 11.8774L22.8096 11.7899Z"
        fill="#B0B0B0"
      />
    </svg>
  );
}

// 실 API에 추천 질문 필드가 없어 UI 프리셋으로 제공. 클릭 시 채팅 전송과 동일하게 동작.
const DEFAULT_AI_SUGGESTED_QUESTIONS = [
  "대부업체 채무가 있으면 개인회생이 어렵나요?",
  "월 가용소득이 줄어들면 어떻게 되나요?",
  "변제 기간을 단축할 수 있나요?",
  "신청 후 직장에 영향이 있나요?",
  "배우자 소득도 변제액에 포함되나요?",
];

export default function SectionCounselMents({
  detail,
  projectId,
  chatHistory,
}: {
  detail: DiagnosisDetail;
  projectId: string | null;
  chatHistory: DebtReliefChatHistory;
}) {
  const [activeTab, setActiveTab] = useState<CounselMentCategory | "all">("all");
  const [input, setInput] = useState("");
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const { messages, sending, sendMessage } = useDebtReliefAiChat(detail.id, projectId, chatHistory);
  const messagesScrollRef = useRef<HTMLDivElement>(null);
  const copyResetTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (copyResetTimeoutRef.current) clearTimeout(copyResetTimeoutRef.current);
    };
  }, []);

  // 새 메시지·스트리밍 응답이 추가될 때 채팅 영역을 맨 아래로 유지
  useEffect(() => {
    const el = messagesScrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages]);

  const suggestedQuestions =
    detail.aiSuggestedQuestions.length > 0
      ? detail.aiSuggestedQuestions
      : DEFAULT_AI_SUGGESTED_QUESTIONS;

  const visibleMents =
    activeTab === "all"
      ? detail.counselMents
      : detail.counselMents.filter((ment) => ment.category === activeTab);

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard
      ?.writeText(text)
      .then(() => {
        setCopiedIndex(index);
        if (copyResetTimeoutRef.current) clearTimeout(copyResetTimeoutRef.current);
        copyResetTimeoutRef.current = setTimeout(() => setCopiedIndex(null), 1500);
      })
      .catch(() => undefined);
  };

  const handleSend = (rawText?: string) => {
    if (sending) return;
    const text = (rawText ?? input).trim();
    if (!text) return;
    setInput("");
    void sendMessage(text);
  };

  const handleSuggestedQuestion = (question: string) => {
    handleSend(question);
  };

  return (
    <div className="flex flex-col gap-5">
      <div>
        <div className="flex items-center gap-1">
          <h2 className="inline-flex h-6 items-center text-[16px] font-semibold leading-none tracking-[0.2px] text-foreground">
            상담 포인트
          </h2>
          <DisclaimerInfoTooltip label="상담 포인트 안내">
            상담을 돕기 위한 참고 자료이며, 최종 상담 내용은{" "}
            <span className="font-extrabold">고객 상황에 맞게 검토·수정하여 활용해 주세요.</span>
          </DisclaimerInfoTooltip>
        </div>
        <div className="mt-3 border-t border-neutral-30" />
      </div>

      {/* 카테고리 탭 */}
      <div className="flex items-center gap-2 flex-wrap">
        {COUNSEL_MENT_TABS.map((tab) => {
          const isActive = tab.key === activeTab;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`cursor-pointer h-[34px] rounded-full text-[14px] font-medium leading-[17px] transition-colors ${
                isActive
                  ? "bg-neutral-100 text-neutral-0 px-5"
                  : "bg-transparent border border-neutral-30 text-foreground/80 px-4 hover:bg-neutral-10"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* 상담사 멘트 카드 */}
      <div className="flex flex-col gap-3">
        {visibleMents.map((ment, index) => (
          <div
            key={index}
            className="bg-neutral-10 rounded-[12px] px-4 md:px-7 py-4 md:py-5 flex items-start justify-between gap-4"
          >
            <div className="min-w-0 flex-1">
              <p className="text-[14px] font-medium leading-[17px] text-neutral-60 mb-3">상담사</p>
              <div className="flex items-stretch gap-[18px]">
                <span className="w-0.5 shrink-0 bg-neutral-100 self-stretch min-h-[27px]" aria-hidden />
                <p className="text-[14px] font-semibold leading-[22px] text-foreground">{ment.text}</p>
              </div>
            </div>
            <CopyIconButton
              copied={copiedIndex === index}
              onClick={() => handleCopy(ment.text, index)}
              className="self-center"
            />
          </div>
        ))}
      </div>

      {/* AI 추가 질문 — 회색 wrapper > 흰 태그 + 흰 채팅창 */}
      <div className="bg-neutral-10 rounded-[12px] px-4 md:px-7 py-4 md:py-5 flex flex-col gap-4">
        <div className="flex items-center gap-1.5">
          <AiSparkleIcon />
          <span className="text-[14px] font-medium leading-[17px] text-neutral-60">AI 추가 질문</span>
        </div>

        {/* 흰 배경 태그 버튼 — 클릭 시 채팅 입력·전송과 동일 */}
        <div className="flex flex-wrap gap-2">
          {suggestedQuestions.map((question) => (
            <button
              key={question}
              type="button"
              disabled={sending}
              onClick={() => handleSuggestedQuestion(question)}
              className="cursor-pointer h-[34px] px-4 rounded-full bg-neutral-0 border border-neutral-30 text-[14px] font-medium leading-[17px] text-foreground/80 hover:opacity-80 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {question}
            </button>
          ))}
        </div>

        {/* 흰 채팅 컨테이너 */}
        <div className="bg-neutral-0 rounded-[14px] flex flex-col overflow-hidden">
          <div
            ref={messagesScrollRef}
            className={`flex flex-col gap-5 px-4 md:px-7 py-4 md:py-7 max-h-[280px] overflow-y-auto ${
              messages.length === 0 ? "items-center justify-center text-center" : ""
            }`}
          >
            {messages.length === 0 ? (
              <p className="text-[14px] font-medium leading-[17px] tracking-[0.2px] text-neutral-60">
                AI에게 자유롭게 질문해보세요.
              </p>
            ) : (
              messages.map((message) => (
              <div
                key={message.localId}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[90%] px-5 py-4 text-[14px] font-medium leading-[26px] tracking-[0.1px] ${
                    message.role === "user"
                      ? "bg-neutral-90 text-neutral-0 rounded-[16px_16px_0_16px] whitespace-pre-wrap"
                      : "bg-neutral-20 text-foreground/95 rounded-[16px_16px_16px_0]"
                  }`}
                >
                  {message.role === "assistant" ? (
                    message.content ? (
                      <MarkdownRenderer content={message.content} />
                    ) : message.status === "streaming" ? (
                      "답변 작성 중…"
                    ) : null
                  ) : (
                    message.content
                  )}
                </div>
              </div>
              ))
            )}
          </div>

          <div className="border-t border-neutral-30 px-4 md:px-7 py-3 md:py-4 flex items-center gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSend();
              }}
              disabled={sending}
              placeholder="메세지를 입력하세요."
              className="flex-1 h-[34px] text-[14px] font-medium leading-[17px] tracking-[0.2px] text-foreground placeholder:text-neutral-60 bg-transparent focus:outline-none disabled:opacity-60"
            />
            <button
              type="button"
              onClick={() => handleSend()}
              disabled={sending}
              aria-label="전송"
              className="cursor-pointer w-[34px] h-[34px] grid place-items-center hover:opacity-90 shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <SendIcon />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
