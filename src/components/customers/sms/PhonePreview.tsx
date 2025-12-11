"use client";

import { useEffect, useState, useRef } from "react";
import type { ImageFileWithPreview } from "./types";
import { usePhoneDragScroll } from "./usePhoneDragScroll";

type PhonePreviewProps = {
  recipientNumber: string;
  title: string;
  body: string;
  imageFiles: ImageFileWithPreview[];
};

export default function PhonePreview({
  recipientNumber,
  title,
  body,
  imageFiles,
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
      
      if (!modalContainer) {
        setScale(1);
        return;
      }

      // 모달의 실제 높이와 스크롤 여부 확인
      const modalHeight = modalContainer.clientHeight;
      const modalScrollHeight = modalContainer.scrollHeight;
      const hasScroll = modalScrollHeight > modalHeight;
      
      // 모달의 max-height 값 가져오기
      const computedStyle = window.getComputedStyle(modalContainer);
      const maxHeightStr = computedStyle.maxHeight;
      const maxHeight = maxHeightStr && maxHeightStr !== 'none' 
        ? parseFloat(maxHeightStr) 
        : null;
      
      // 스크롤이 없고 모달이 max-height에 도달하지 않았다면 scale 1 유지
      if (!hasScroll && (!maxHeight || modalHeight < maxHeight)) {
        setScale(1);
        return;
      }
      
      // 스크롤이 있거나 max-height에 도달한 경우에만 스케일 계산
      // PhonePreview 컨테이너의 실제 높이 측정
      const previewContainer = containerRef.current;
      const previewContainerHeight = previewContainer.clientHeight;
      
      // 핸드폰 기본 높이 (600px)
      const phoneBaseHeight = 600;
      const previewPadding = 48; // p-6 * 2
      const titleHeight = 32; // "미리보기" 제목
      
      // 실제 사용 가능한 높이 (PhonePreview 컨테이너 높이에서 제목과 패딩 제외)
      const availableHeight = previewContainerHeight - previewPadding - titleHeight;
      
      // 스케일 계산: 사용 가능한 높이가 충분하면 1, 아니면 비례적으로 축소
      let calculatedScale = 1;
      
      if (availableHeight < phoneBaseHeight) {
        // 공간이 부족하면 축소 (여유 공간을 위해 0.98 곱함)
        calculatedScale = (availableHeight / phoneBaseHeight) * 0.98;
        // 최소 스케일 제한
        calculatedScale = Math.max(0.7, calculatedScale);
      }
      
      setScale(calculatedScale);
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

  return (
    <div ref={containerRef} className="bg-[#F8F8F8] dark:bg-neutral-10 rounded-[12px] p-6">
      <h3 className="text-[16px] font-semibold leading-[19px] text-ink dark:text-neutral-90 mb-4">
        미리보기
      </h3>

      {/* 핸드폰 미리보기 */}
      <div 
        className="relative w-[300px] h-[600px] mx-auto origin-top"
        style={{ 
          transform: `scale(${scale})`,
          transformOrigin: "top center"
        }}
      >
        {/* 폰 케이스 이미지 */}
        <img
          src="/phone_case.png"
          alt="Phone case"
          className="absolute inset-0 w-full h-full object-contain pointer-events-none"
        />

        {/* 폰 화면 내용 - 드래그/터치 스크롤 가능 */}
        <div
          ref={phoneScreenRef}
          className="absolute top-[58px] left-[22px] right-[22px] bottom-[62px] bg-white dark:bg-neutral-0 overflow-y-auto rounded-[20px] select-none"
          style={{ cursor: "grab" }}
          {...dragHandlers}
        >
          {/* 수신번호 */}
          <div className="flex justify-center py-3 sticky top-0 bg-white dark:bg-neutral-0 z-[1]">
            <span className="inline-flex items-center h-[28px] px-4 border border-neutral-30 dark:border-neutral-30 rounded-[30px] text-[13px] text-neutral-70 dark:text-neutral-60">
              {recipientNumber}
            </span>
          </div>

          {/* 메시지 내용 - 왼쪽 정렬 (상대방 메시지 스타일) */}
          <div className="px-4 pt-2 pb-4 flex flex-col items-start">
            <div className="bg-neutral-10 dark:bg-neutral-20 rounded-[12px] p-4 max-w-[85%]">
              {title && (
                <div className="font-semibold text-[14px] text-ink dark:text-neutral-90 mb-2">
                  {title}
                </div>
              )}
              <div className="text-[13px] leading-[20px] text-neutral-80 dark:text-neutral-70 whitespace-pre-wrap break-words">
                {body || (
                  <span className="text-neutral-50 dark:text-neutral-50">
                    메시지 내용이 여기에 표시됩니다.
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

