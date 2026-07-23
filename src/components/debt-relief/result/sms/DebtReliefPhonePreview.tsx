"use client";

import { useEffect, useRef, useState } from "react";
import { usePhoneDragScroll } from "@/components/customers/sms";
import type { ImageFileWithPreview, ContentType } from "@/components/customers/sms";
import { formatPhoneNumber } from "@/utils/format";

type DebtReliefPhonePreviewProps = {
  senderNumber: string;
  title: string;
  body: string;
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
  body,
  imageFiles,
  bubbleClassName,
}: {
  headerLine: string | null;
  body: string;
  imageFiles: ImageFileWithPreview[];
  bubbleClassName: string;
}) {
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
          {body.trim() ? (
            body
          ) : (
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

      // 세로: 모달이 max-height에 걸려 스크롤이 생기는 경우에만 축소
      let heightScale = 1;
      if (modalContainer) {
        const modalHeight = modalContainer.clientHeight;
        const modalScrollHeight = modalContainer.scrollHeight;
        const hasScroll = modalScrollHeight > modalHeight;

        const computedStyle = window.getComputedStyle(modalContainer);
        const maxHeightStr = computedStyle.maxHeight;
        const maxHeight = maxHeightStr && maxHeightStr !== "none" ? parseFloat(maxHeightStr) : null;

        if (hasScroll || (maxHeight != null && modalHeight >= maxHeight)) {
          const previewContainerHeight = containerRef.current.clientHeight;
          const phoneBaseHeight = 600;
          const previewPadding = 48;
          const titleHeight = 32;
          const availableHeight = previewContainerHeight - previewPadding - titleHeight;

          if (availableHeight < phoneBaseHeight) {
            heightScale = Math.max(0.7, (availableHeight / phoneBaseHeight) * 0.98);
          }
        }
      }

      // 가로: 태블릿 폭에서 좌우 2열(폼/미리보기)이 300px 폰 목업보다 좁게 눌리는
      // 구간이 있어 overflow-hidden에 의해 오른쪽이 잘린다 — 컨테이너 실측 폭 기준으로도 축소
      const previewContainerWidth = containerRef.current.clientWidth;
      const phoneBaseWidth = 300;
      const previewPaddingX = 48; // p-6 좌우
      const availableWidth = previewContainerWidth - previewPaddingX;

      let widthScale = 1;
      if (availableWidth < phoneBaseWidth) {
        widthScale = Math.max(0.7, availableWidth / phoneBaseWidth);
      }

      setScale(Math.min(heightScale, widthScale));
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
              {senderNumber ? formatPhoneNumber(senderNumber) : "010-0000-0000"}
            </span>
          </div>
          <div className="pt-2 pb-4 flex flex-col items-start px-4">
            <MessageBubble
              headerLine={headerLine}
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

      {/* justify-center로 감싸야 태블릿 폭처럼 300px 박스가 컨테이너보다 넓어지는 구간에서도
          중앙 정렬이 유지된다. mx-auto는 오버플로 시 margin이 0으로 붕괴해 박스가 왼쪽으로 붙고,
          그 상태로 scale(top center)을 적용하면 시각적으로 오른쪽에 치우쳐 보인다.
          shrink-0 필수: flex item은 기본 flex-shrink:1이라 300px 지정폭이 flexbox에 의해
          먼저 눌린 뒤 scale()이 중첩 적용되면서 폰 케이스 object-contain 비율까지 깨진다
          (실측 재현 완료 — shrink-0 없이는 300px 박스가 실제로 180px대로 짓눌림). */}
      <div className="flex justify-center">
        <div
          className="relative w-[300px] h-[600px] shrink-0 origin-top"
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
                {senderNumber ? formatPhoneNumber(senderNumber) : "010-0000-0000"}
              </span>
            </div>

            <div className="px-4 pt-2 pb-4 flex flex-col items-start">
              <MessageBubble
                headerLine={headerLine}
                body={body}
                imageFiles={imageFiles}
                bubbleClassName="bg-neutral-10 dark:bg-neutral-20 rounded-[12px] p-4 max-w-[85%]"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
