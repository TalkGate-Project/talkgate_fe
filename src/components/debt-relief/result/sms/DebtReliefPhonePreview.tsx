"use client";

import { useEffect, useRef, useState } from "react";
import { usePhoneDragScroll } from "@/components/customers/sms";
import type { ImageFileWithPreview, ContentType } from "@/components/customers/sms";

type DebtReliefPhonePreviewProps = {
  senderNumber: string;
  title: string;
  fixedBlock: string; // 고정 안내문 (읽기 전용, 항상 본문 위에 표시)
  body: string; // 사용자가 편집하는 본문
  imageFiles: ImageFileWithPreview[];
  contentType: ContentType;
  businessName: string;
  mode?: "desktop" | "mobile";
};

// 광고성일 때는 (광고) 상호명, 정보성이고 제목이 있을 때만 제목을 굵게 표시
function buildHeaderLine(contentType: ContentType, title: string, businessName: string): string | null {
  const trimmedTitle = title.trim();
  if (contentType === "advertising") {
    return `(광고) ${trimmedTitle || businessName.trim() || "(상호명)"}`;
  }
  return trimmedTitle || null;
}

function MessageBubble({
  headerLine,
  fixedBlock,
  body,
  imageFiles,
  bubbleClassName,
}: {
  headerLine: string | null;
  fixedBlock: string;
  body: string;
  imageFiles: ImageFileWithPreview[];
  bubbleClassName: string;
}) {
  const combined = [fixedBlock, body].filter((part) => part.trim().length > 0).join("\n\n");

  return (
    <>
      <div className={bubbleClassName}>
        {headerLine && (
          <div className="font-semibold text-[14px] leading-[20px] text-ink dark:text-neutral-90 mb-2">
            {headerLine}
          </div>
        )}
        <div className="text-[13px] leading-[20px] text-neutral-80 dark:text-neutral-70 whitespace-pre-wrap break-words">
          <span className="block mb-1">[Web발신]</span>
          {combined || (
            <span className="text-neutral-50 dark:text-neutral-50">메시지 내용이 여기에 표시됩니다.</span>
          )}
        </div>
      </div>
      {imageFiles.length > 0 && (
        <div className="mt-2 space-y-1 max-w-[90%]">
          {imageFiles.map((img) => (
            <img
              key={img.id}
              src={img.previewUrl}
              alt="첨부 이미지 미리보기"
              className="w-full rounded-[8px] object-cover"
              draggable={false}
            />
          ))}
        </div>
      )}
    </>
  );
}

export default function DebtReliefPhonePreview({
  senderNumber,
  title,
  fixedBlock,
  body,
  imageFiles,
  contentType,
  businessName,
  mode = "desktop",
}: DebtReliefPhonePreviewProps) {
  const { phoneScreenRef, dragHandlers } = usePhoneDragScroll();
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  const headerLine = buildHeaderLine(contentType, title, businessName);

  // 화면 크기에 따라 스케일 조정 (customers/sms/PhonePreview와 동일한 로직)
  useEffect(() => {
    const updateScale = () => {
      if (!containerRef.current) return;

      const modalContainer = containerRef.current.closest('[class*="max-h"]');
      if (!modalContainer) {
        setScale(1);
        return;
      }

      const modalHeight = modalContainer.clientHeight;
      const modalScrollHeight = modalContainer.scrollHeight;
      const hasScroll = modalScrollHeight > modalHeight;

      const computedStyle = window.getComputedStyle(modalContainer);
      const maxHeightStr = computedStyle.maxHeight;
      const maxHeight = maxHeightStr && maxHeightStr !== "none" ? parseFloat(maxHeightStr) : null;

      if (!hasScroll && (!maxHeight || modalHeight < maxHeight)) {
        setScale(1);
        return;
      }

      const previewContainer = containerRef.current;
      const previewContainerHeight = previewContainer.clientHeight;
      const phoneBaseHeight = 600;
      const previewPadding = 48;
      const titleHeight = 32;
      const availableHeight = previewContainerHeight - previewPadding - titleHeight;

      let calculatedScale = 1;
      if (availableHeight < phoneBaseHeight) {
        calculatedScale = (availableHeight / phoneBaseHeight) * 0.98;
        calculatedScale = Math.max(0.7, calculatedScale);
      }
      setScale(calculatedScale);
    };

    updateScale();
    const timeoutId = setTimeout(updateScale, 100);
    const timeoutId2 = setTimeout(updateScale, 300);
    window.addEventListener("resize", updateScale);

    const resizeObserver = new ResizeObserver(updateScale);
    if (containerRef.current) {
      const modalContainer = containerRef.current.closest('[class*="max-h"]');
      if (modalContainer) resizeObserver.observe(modalContainer);
    }

    return () => {
      clearTimeout(timeoutId);
      clearTimeout(timeoutId2);
      window.removeEventListener("resize", updateScale);
      resizeObserver.disconnect();
    };
  }, []);

  if (mode === "mobile") {
    return (
      <div className="h-full flex flex-col">
        <div
          ref={phoneScreenRef}
          className="flex-1 min-h-0 overflow-y-auto select-none"
          style={{ cursor: "grab" }}
          {...dragHandlers}
        >
          <div className="flex justify-center py-3 sticky top-0 bg-card dark:bg-neutral-10 z-[1]">
            <span className="inline-flex items-center h-[34px] px-4 border border-neutral-30 dark:border-neutral-30 rounded-[30px] text-[14px] text-neutral-70 dark:text-neutral-60">
              {senderNumber || "010-0000-0000"}
            </span>
          </div>
          <div className="pt-2 pb-4 flex flex-col items-start px-4">
            <MessageBubble
              headerLine={headerLine}
              fixedBlock={fixedBlock}
              body={body}
              imageFiles={imageFiles}
              bubbleClassName="bg-neutral-20 dark:bg-neutral-20 rounded-[12px] p-4 max-w-[90%]"
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="bg-[#F8F8F8] dark:bg-neutral-25 rounded-[12px] p-6">
      <h3 className="text-[16px] font-semibold leading-[19px] text-ink dark:text-neutral-90 mb-4">미리보기</h3>

      <div
        className="relative w-[300px] h-[600px] mx-auto origin-top"
        style={{ transform: `scale(${scale})`, transformOrigin: "top center" }}
      >
        <img
          src="/phone_case.png"
          alt="Phone case"
          className="absolute inset-0 w-full h-full object-contain pointer-events-none dark:hidden"
        />
        <img
          src="/phone_case_dark.png"
          alt="Phone case"
          className="absolute inset-0 w-full h-full object-contain pointer-events-none hidden dark:block"
        />

        <div
          ref={phoneScreenRef}
          className="absolute top-[58px] left-[22px] right-[22px] bottom-[62px] bg-white dark:bg-neutral-0 overflow-y-auto rounded-[20px] select-none"
          style={{ cursor: "grab" }}
          {...dragHandlers}
        >
          <div className="flex justify-center py-3 sticky top-0 bg-white dark:bg-neutral-0 z-[1]">
            <span className="inline-flex items-center h-[28px] px-4 border border-neutral-30 dark:border-neutral-30 rounded-[30px] text-[13px] text-neutral-70 dark:text-neutral-60">
              {senderNumber || "010-0000-0000"}
            </span>
          </div>

          <div className="px-4 pt-2 pb-4 flex flex-col items-start">
            <MessageBubble
              headerLine={headerLine}
              fixedBlock={fixedBlock}
              body={body}
              imageFiles={imageFiles}
              bubbleClassName="bg-neutral-10 dark:bg-neutral-20 rounded-[12px] p-4 max-w-[85%]"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
