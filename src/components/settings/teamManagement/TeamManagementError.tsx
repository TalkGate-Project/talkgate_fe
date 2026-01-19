"use client";

export default function TeamManagementError() {
  return (
    <div className="w-full h-full bg-card rounded-[14px] p-8 flex flex-col gap-4 items-center justify-center text-danger-40">
      <span>조직 정보를 불러오지 못했습니다.</span>
      <button
        className="px-4 py-2 bg-neutral-90 text-neutral-0 rounded-[5px] text-[14px] font-semibold"
        onClick={() => location.reload()}
      >
        새로고침
      </button>
    </div>
  );
}
