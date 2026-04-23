import BaseModal from "@/components/common/BaseModal";
import { CustomerCategoryHistoryItem } from "@/types/customers";
import { getBadgeStyle } from "@/utils/categoryBadge";
import { formatDetailDate } from "./utils";

type Props = {
  open: boolean;
  onClose: () => void;
  customerName: string;
  history: CustomerCategoryHistoryItem[];
  loading?: boolean;
};

export default function CategoryHistoryModal({
  open,
  onClose,
  customerName,
  history,
  loading = false,
}: Props) {
  if (!open) return null;

  return (
    <BaseModal
      onClose={onClose}
      overlayClassName="bg-black/35"
      containerClassName="w-[calc(100vw-32px)] max-w-[360px] rounded-[16px] bg-card dark:bg-neutral-10 shadow-[0_8px_24px_rgba(9,30,66,0.14)]"
      ariaLabel="카테고리 기록"
      disableAutoContainerSizing
    >
      <div className="px-5 py-5">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="text-[18px] font-semibold text-foreground">
            {customerName}님의 카테고리 기록
          </div>
          <button
            type="button"
            className="grid h-6 w-6 cursor-pointer place-items-center rounded-full text-neutral-60 hover:bg-neutral-10"
            onClick={onClose}
            aria-label="닫기"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M4 12L12 4M4 4L12 12"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>

        <div
          className="touch-pan-y space-y-3 overflow-y-auto overscroll-y-contain [-webkit-overflow-scrolling:touch] pr-1 max-h-[min(400px,calc(100dvh-168px))] sm:max-h-[min(440px,calc(100dvh-168px))]"
          role="region"
          aria-label="카테고리 변경 기록 목록"
        >
          {loading ? (
            <div className="rounded-[14px] bg-neutral-10 px-5 py-6 text-[14px] text-neutral-60">
              불러오는 중...
            </div>
          ) : history.length > 0 ? (
            history.map((historyItem) => {
              const badgeStyle = getBadgeStyle(
                historyItem.categoryName,
                historyItem.categoryId ?? 0,
                historyItem.colorCode ?? undefined
              );

              return (
                <div
                  key={historyItem.id}
                  className="flex items-center justify-between gap-4 rounded-[14px] bg-neutral-10 px-5 py-4"
                >
                  <span
                    className="inline-flex items-center rounded-[30px] px-3 py-1 text-[12px] font-medium"
                    style={badgeStyle}
                  >
                    {historyItem.categoryName}
                  </span>
                  <span className="shrink-0 text-[14px] text-neutral-60">
                    {formatDetailDate(historyItem.createdAt)}
                  </span>
                </div>
              );
            })
          ) : (
            <div className="rounded-[14px] bg-neutral-10 px-5 py-6 text-[14px] text-neutral-60">
              카테고리 기록이 없습니다.
            </div>
          )}
        </div>
      </div>
    </BaseModal>
  );
}
