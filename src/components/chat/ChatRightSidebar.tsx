"use client";

import SendIcon from "./icons/SendIcon";

export default function ChatRightSidebar() {
  return (
    <div className="col-span-3 rounded-[14px] bg-white dark:bg-[#111111] border border-[#E2E2E2] dark:border-[#444444] flex flex-col">
      <div className="px-4 py-4 flex items-center justify-between border-b border-[#E2E2E2] dark:border-[#444444]">
        <div className="flex items-center gap-2">
          <h3 className="text-[20px] font-bold">AI상담도우미</h3>
          <span className="inline-block w-2 h-2 rounded-full bg-[#00E272]" />
        </div>
        <button className="h-[34px] px-4 rounded-[5px] bg-[#252525] text-[#D0D0D0] text-[14px]">
          완료
        </button>
      </div>
      <div className="flex-1 overflow-auto p-4 space-y-3">
        {/* 샘플 가이드/에코 영역 - 실제 연동 시 별도 소켓/REST로 교체 가능 */}
        <div className="max-w-[85%] bg-[#EDEDED] text-[#000] rounded-[16px] rounded-tl-none px-5 py-4">
          <div className="text-[13px] leading-[20px]">
            AI 상담 도우미 연결되었습니다. 무엇을 도와드릴까요?
          </div>
          <div className="mt-2 text-[11px] text-[#808080]">
            {new Date().toLocaleString()}
          </div>
        </div>
      </div>
      <div className="h-[76px] px-4 border-t border-[#E2E2E2] dark:border-[#444444]">
        <div className="h-full flex items-center gap-2">
          <input
            className="flex-1 h-[40px] px-3 text-[12px] outline-none bg-transparent border-0"
            placeholder="메세지를 입력하세요."
          />
          <button
            className="w-[34px] h-[34px] grid place-items-center"
            aria-label="send"
          >
            <SendIcon />
          </button>
        </div>
      </div>
    </div>
  );
}

