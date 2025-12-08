"use client";

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

  return (
    <div className="bg-[#F8F8F8] dark:bg-neutral-10 rounded-[12px] p-6">
      <h3 className="text-[16px] font-semibold leading-[19px] text-ink dark:text-neutral-90 mb-4">
        미리보기
      </h3>

      {/* 핸드폰 미리보기 */}
      <div className="relative w-[300px] h-[600px] mx-auto">
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

