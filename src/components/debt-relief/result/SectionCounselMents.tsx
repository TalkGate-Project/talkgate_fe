"use client";

import { useEffect, useRef, useState } from "react";
import {
  COUNSEL_MENT_TABS,
  type CounselMentCategory,
  type DiagnosisDetail,
} from "@/types/debtRelief";
import { useDebtReliefAiChat } from "./useDebtReliefAiChat";

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
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// 실 API에 추천 질문 필드가 없어 UI 프리셋으로 제공. 클릭 시 채팅 전송과 동일하게 동작.
const DEFAULT_AI_SUGGESTED_QUESTIONS = [
  "사채가 있으면 개인회생이 어렵나요?",
  "월 가용소득이 줄어들면 어떻게 되나요?",
  "변제 기간을 단축할 수 있나요?",
  "신청 후 직장에 영향이 있나요?",
  "배우자 소득도 변제액에 포함되나요?",
];

export default function SectionCounselMents({
  detail,
  projectId,
}: {
  detail: DiagnosisDetail;
  projectId: string | null;
}) {
  const [activeTab, setActiveTab] = useState<CounselMentCategory | "all">("all");
  const [input, setInput] = useState("");
  const { messages, sending, sendMessage } = useDebtReliefAiChat(detail.id, projectId);
  const messagesScrollRef = useRef<HTMLDivElement>(null);

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

  const handleCopy = (text: string) => {
    navigator.clipboard?.writeText(text).catch(() => undefined);
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
        <h2 className="text-[16px] font-semibold leading-[19px] tracking-[0.2px] text-foreground">
          추천 상담 멘트
        </h2>
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
            <button
              type="button"
              onClick={() => handleCopy(ment.text)}
              className="cursor-pointer shrink-0 h-[34px] px-3 rounded-[5px] border border-neutral-30 bg-neutral-0 text-[14px] font-semibold leading-[17px] tracking-[-0.02em] text-foreground hover:bg-neutral-10"
            >
              복사하기
            </button>
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
            className="flex flex-col gap-5 px-4 md:px-7 py-4 md:py-7 max-h-[280px] overflow-y-auto"
          >
            {messages.map((message) => (
              <div
                key={message.localId}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[90%] px-5 py-4 text-[14px] font-medium leading-[26px] tracking-[0.1px] ${
                    message.role === "user"
                      ? "bg-neutral-90 text-neutral-0 rounded-[16px_16px_0_16px]"
                      : "bg-neutral-20 text-foreground/95 rounded-[16px_16px_16px_0]"
                  }`}
                >
                  {message.content || (message.status === "streaming" ? "답변 작성 중…" : "")}
                </div>
              </div>
            ))}
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
              className="cursor-pointer w-[34px] h-[34px] rounded-full bg-neutral-90 text-neutral-0 grid place-items-center hover:opacity-90 shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <SendIcon />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
