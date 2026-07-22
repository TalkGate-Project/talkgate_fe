"use client";

import { useEffect, useState, useRef } from "react";
import type { ImageFileWithPreview, ContentType } from "./types";
import { usePhoneDragScroll } from "./usePhoneDragScroll";

type PhonePreviewProps = {
  senderNumber: string; // Recipient number -> Sender number for display
  recipientNumber?: string; // Keep this just in case, but we display senderNumber at top
  title: string;
  body: string;
  imageFiles: ImageFileWithPreview[];
  contentType: ContentType;
  businessName: string;
  mode?: "desktop" | "mobile";
};

export default function PhonePreview({
  senderNumber,
  title,
  body,
  imageFiles,
  contentType,
  businessName,
  mode = "desktop",
}: PhonePreviewProps) {
  const { phoneScreenRef, dragHandlers } = usePhoneDragScroll();
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  // 화면 크기에 따라 스케일 조정
  useEffect(() => {
    const updateScale = () => {
      if (!containerRef.current) return;

      // 모달 컨테이너 찾기
      const modalContainer = containerRef.current.closest('[class*="max-h"]');

      // 세로: 모달의 실제 높이와 스크롤 여부 확인해 max-height에 걸릴 때만 축소
      let heightScale = 1;
      if (modalContainer) {
        const modalHeight = modalContainer.clientHeight;
        const modalScrollHeight = modalContainer.scrollHeight;
        const hasScroll = modalScrollHeight > modalHeight;

        const computedStyle = window.getComputedStyle(modalContainer);
        const maxHeightStr = computedStyle.maxHeight;
        const maxHeight =
          maxHeightStr && maxHeightStr !== "none"
            ? parseFloat(maxHeightStr)
            : null;

        if (hasScroll || (maxHeight != null && modalHeight >= maxHeight)) {
          const previewContainerHeight = containerRef.current.clientHeight;
          const phoneBaseHeight = 600;
          const previewPadding = 48; // p-6 * 2
          const titleHeight = 32; // "미리보기" 제목

          const availableHeight =
            previewContainerHeight - previewPadding - titleHeight;

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

    // 초기 계산
    updateScale();

    // 약간의 지연 후 다시 계산 (레이아웃이 완전히 렌더링된 후)
    const timeoutId = setTimeout(updateScale, 100);
    const timeoutId2 = setTimeout(updateScale, 300);

    window.addEventListener("resize", updateScale);

    // ResizeObserver로 모달 크기 변화 감지
    const resizeObserver = new ResizeObserver(updateScale);
    if (containerRef.current) {
      const modalContainer = containerRef.current.closest('[class*="max-h"]');
      if (modalContainer) {
        resizeObserver.observe(modalContainer);
      }
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
          <div className="pt-2 pb-4 flex flex-col items-start">
            <div className="bg-neutral-20 dark:bg-neutral-20 rounded-[12px] p-4 max-w-[90%]">
              {(() => {
                const hasValidTitle = title.trim().length > 0;
                const shouldShowTitle = hasValidTitle || contentType === "advertising";

                if (!shouldShowTitle) return null;

                return (
                  <div className="font-semibold text-[14px] leading-[20px] text-ink dark:text-neutral-90 mb-2">
                    {contentType === "advertising"
                      ? hasValidTitle
                        ? `(광고) ${title}`
                        : "제목없음"
                      : title}
                  </div>
                );
              })()}
              <div className="text-[13px] leading-[20px] text-neutral-80 dark:text-neutral-70 whitespace-pre-wrap break-words">
                <span className="block mb-1">[Web발신]</span>
                {contentType === "advertising" && (
                  <span className="block mb-1">
                    (광고){businessName ? `[${businessName}]` : ""}
                  </span>
                )}
                {body || (
                  <span className="text-neutral-50 dark:text-neutral-50">
                    메시지 내용이 여기에 표시됩니다.
                  </span>
                )}
                {contentType === "advertising" && (
                  <span className="block mt-2 text-neutral-60 dark:text-neutral-60">
                    수신거부 080-880-4005
                  </span>
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
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="bg-[#F8F8F8] dark:bg-neutral-25 rounded-[12px] p-6"
    >
      <h3 className="text-[16px] font-semibold leading-[19px] text-ink dark:text-neutral-90 mb-4">
        미리보기
      </h3>

      {/* 핸드폰 미리보기 */}
      <div
        className="relative w-[300px] h-[600px] mx-auto origin-top"
        style={{
          transform: `scale(${scale})`,
          transformOrigin: "top center",
        }}
      >
        {/* 폰 케이스 이미지 */}
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

        {/* 폰 화면 내용 - 드래그/터치 스크롤 가능 */}
        <div
          ref={phoneScreenRef}
          className="absolute top-[58px] left-[22px] right-[22px] bottom-[62px] bg-white dark:bg-neutral-0 overflow-y-auto rounded-[20px] select-none"
          style={{ cursor: "grab" }}
          {...dragHandlers}
        >
          {/* 수신번호 (사실 발신번호가 표시되어야 함) */}
          <div className="flex justify-center py-3 sticky top-0 bg-white dark:bg-neutral-0 z-[1]">
            <span className="inline-flex items-center h-[28px] px-4 border border-neutral-30 dark:border-neutral-30 rounded-[30px] text-[13px] text-neutral-70 dark:text-neutral-60">
              {senderNumber || "010-0000-0000"}
            </span>
          </div>

          {/* 메시지 내용 - 왼쪽 정렬 (상대방 메시지 스타일) */}
          <div className="px-4 pt-2 pb-4 flex flex-col items-start">
            <div className="bg-neutral-10 dark:bg-neutral-20 rounded-[12px] p-4 max-w-[85%]">
              {(() => {
                const hasValidTitle = title.trim().length > 0;
                const shouldShowTitle = hasValidTitle || contentType === "advertising";
                
                if (!shouldShowTitle) return null;
                
                return (
                  <div className="font-semibold text-[14px] text-ink dark:text-neutral-90 mb-2">
                    {contentType === "advertising"
                      ? hasValidTitle
                        ? `(광고) ${title}`
                        : "제목없음"
                      : title}
                  </div>
                );
              })()}
              <div className="text-[13px] leading-[20px] text-neutral-80 dark:text-neutral-70 whitespace-pre-wrap break-words">
                <span className="block mb-1">[Web발신]</span>
                {contentType === "advertising" && (
                  <span className="block mb-1">
                    (광고){businessName ? `[${businessName}]` : ""}
                  </span>
                )}
                {body || (
                  <span className="text-neutral-50 dark:text-neutral-50">
                    메시지 내용이 여기에 표시됩니다.
                  </span>
                )}
                {contentType === "advertising" && (
                  <span className="block mt-2 text-neutral-60 dark:text-neutral-60">
                    수신거부 080-880-4005
                  </span>
                )}
              </div>
            </div>

            {/* 이미지 미리보기 - 오래된 순으로 위에서 아래로 */}
            {imageFiles.length > 0 && (
              <div className="mt-2 space-y-1 max-w-[85%]">
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
          </div>
        </div>
      </div>
    </div>
  );
}
