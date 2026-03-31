import { RecentNote } from "@/types/customers";
import { formatDateTime } from "@/utils/datetime";
import { getBadgeStyle } from "@/utils/categoryBadge";
import { CustomerNoteCategory } from "@/services/customerNoteCategories";

type CustomersHoverPopoverProps = {
  name: string;
  notes: RecentNote[];
  categories: CustomerNoteCategory[];
  top: number;
  left: number;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
};

export default function CustomersHoverPopover({
  name,
  notes,
  categories,
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
            {notes.slice(0, 2).map((n) => {
              const category = categories.find((c) => c.id === n.categoryId);
              const categoryName = category?.name || "일반";
              const badgeStyle = getBadgeStyle(categoryName, n.categoryId || 0, category?.colorCode);

              return (
                <div key={n.id} className="bg-neutral-10 rounded-[12px] p-4">
                  <div className="flex items-center justify-between gap-3 text-neutral-60 text-[14px]">
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="inline-flex items-center h-[22px] max-w-[140px] rounded-[30px] px-3 text-[12px] leading-[14px] font-medium"
                        style={badgeStyle}
                        title={categoryName}
                      >
                        <span className="block min-w-0 truncate">{categoryName}</span>
                      </span>
                      {n.memberName && (
                        <span className="text-[12px] text-neutral-80 truncate max-w-[72px]" title={n.memberName}>
                          {n.memberName}
                        </span>
                      )}
                    </div>
                    <span className="flex-shrink-0">{formatDateTime(n.createdAt)}</span>
                  </div>
                  <div className="mt-2 text-[14px] text-neutral-70">{n.note}</div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="px-5 pb-6 text-[14px] text-neutral-70">최근 상담 내용이 없습니다</div>
        )}
      </div>
    </div>
  );
}

