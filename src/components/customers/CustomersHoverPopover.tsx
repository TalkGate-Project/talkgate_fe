import { RecentNote } from "@/types/customers";

type CustomersHoverPopoverProps = {
  name: string;
  notes: RecentNote[];
  top: number;
  left: number;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
};

export default function CustomersHoverPopover({
  name,
  notes,
  top,
  left,
  onMouseEnter,
  onMouseLeave,
}: CustomersHoverPopoverProps) {
  return (
    <div
      className="fixed z-40"
      style={{ top, left, width: 384 }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div className="rounded-[5px] bg-white dark:bg-[#111111] shadow-[0_8px_12px_rgba(9,30,66,0.1)]">
        <div className="px-5 pt-5 pb-3 text-[14px] font-medium text-[#000] dark:text-[#E9E9E9]">
          {name}님의 최근 상담 내용
        </div>
        {notes.length > 0 ? (
          <div className="px-5 pb-5 space-y-3">
            {notes.slice(0, 2).map((n) => (
              <div key={n.id} className="bg-[#F8F8F8] dark:bg-[#1A1A1A] rounded-[12px] p-4">
                <div className="flex items-center justify-between text-[#808080] dark:text-[#B9B9B9] text-[14px]">
                  <span className="inline-flex items-center h-[22px] rounded-[30px] bg-[#D3E1FE] px-3 text-[12px] text-[#4D82F3] opacity-80">
                    메모
                  </span>
                  <span>{new Date(n.createdAt).toLocaleString()}</span>
                </div>
                <div className="mt-2 text-[14px] text-[#595959] dark:text-[#CFCFCF]">{n.note}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="px-5 pb-6 text-[14px] text-[#595959] dark:text-[#CFCFCF]">최근 상담 내용이 없습니다</div>
        )}
      </div>
    </div>
  );
}

