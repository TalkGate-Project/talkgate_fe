"use client";

type Props = {
  open: boolean;
  onClose: () => void;
  onSelect: (mode: "existing" | "create") => void;
};

export default function CustomerLinkModeModal({ open, onClose, onSelect }: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[120]">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="absolute left-1/2 top-1/2 w-[520px] -translate-x-1/2 -translate-y-1/2">
        <div className="relative w-full rounded-[16px] bg-white shadow-[0px_28px_80px_rgba(38,38,38,0.18)] px-8 py-10">
          <button
            aria-label="close"
            onClick={onClose}
            className="absolute right-6 top-6 h-8 w-8 rounded-full border border-[#E2E2E2] text-[#808080]"
          >
            ×
          </button>
          <h2 className="text-[22px] font-semibold text-[#111827]">고객 연동 방식 선택</h2>
          <p className="mt-2 text-[14px] text-[#6B7280]">고객 정보 연동 방식을 선택해주세요.</p>

          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <button
              onClick={() => onSelect("create")}
              className="group h-[150px] rounded-[14px] border border-[#E2E2E2] bg-[#F8FFFC] p-6 text-left transition-all hover:-translate-y-1 hover:border-[#00C97E] hover:shadow-[0_12px_32px_rgba(0,201,126,0.18)]"
            >
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#E6FBF3] text-[#00C97E] text-[20px] font-bold">
                +
              </div>
              <div className="mt-4 text-[18px] font-semibold text-[#111827]">새 고객 정보 추가</div>
              <div className="mt-1 text-[13px] text-[#6B7280]">새로운 고객 정보를 입력하여 등록합니다.</div>
            </button>

            <button
              onClick={() => onSelect("existing")}
              className="group h-[150px] rounded-[14px] border border-[#E2E2E2] bg-[#F6F8FF] p-6 text-left transition-all hover:-translate-y-1 hover:border-[#4D82F3] hover:shadow-[0_12px_32px_rgba(77,130,243,0.18)]"
            >
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#E7EDFF] text-[#4D82F3] text-[20px] font-semibold">
                ↻
              </div>
              <div className="mt-4 text-[18px] font-semibold text-[#111827]">기존 고객과 연동</div>
              <div className="mt-1 text-[13px] text-[#6B7280]">이미 등록된 고객과 채팅을 연결합니다.</div>
            </button>
          </div>

          <p className="mt-6 text-[12px] text-[#9CA3AF]">
            고객 연동 후에는 고객 정보 화면에서 상세 내역을 확인하고 관리할 수 있습니다.
          </p>
        </div>
      </div>
    </div>
  );
}


