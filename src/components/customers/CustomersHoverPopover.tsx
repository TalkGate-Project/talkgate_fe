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
      <div className="rounded-[5px] bg-neutral-0 shadow-[0_8px_12px_rgba(9,30,66,0.1)]">
        <div className="px-5 pt-5 pb-3 text-[14px] font-medium text-neutral-90">
          {name}님의 최근 상담 내용
        </div>
        {notes.length > 0 ? (
          <div className="px-5 pb-5 space-y-3">
            {notes.slice(0, 2).map((n) => (
              <div key={n.id} className="bg-neutral-10 rounded-[12px] p-4">
                <div className="flex items-center justify-between text-neutral-60 text-[14px]">
                  <span className="inline-flex items-center h-[22px] rounded-[30px] bg-secondary-10 px-3 text-[12px] text-secondary-40 opacity-80">
                    메모
                  </span>
                  <span>{new Date(n.createdAt).toLocaleString()}</span>
                </div>
                <div className="mt-2 text-[14px] text-neutral-70">{n.note}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="px-5 pb-6 text-[14px] text-neutral-70">최근 상담 내용이 없습니다</div>
        )}
      </div>
    </div>
  );
}

