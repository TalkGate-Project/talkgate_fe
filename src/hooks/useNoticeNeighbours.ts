import { useMemo } from "react";
import { Notice, NoticeListData } from "@/types/notices";

export interface NoticeNeighbours {
  /** 이전 공지 (더 최신) */
  prev: Notice | null;
  /** 다음 공지 (더 오래된) */
  next: Notice | null;
}

/**
 * 현재 공지사항의 이전/다음 공지를 계산하는 훅
 * @param currentNotice 현재 공지사항
 * @param listData 공지사항 목록 데이터
 */
export function useNoticeNeighbours(
  currentNotice: Notice | null,
  listData: NoticeListData | null
): NoticeNeighbours {
  return useMemo(() => {
    if (!currentNotice || !listData?.notices?.length) {
      return { prev: null, next: null };
    }

    const idx = listData.notices.findIndex(
      (candidate) => candidate.id === currentNotice.id
    );

    if (idx === -1) {
      return { prev: null, next: null };
    }

    const prev = idx > 0 ? listData.notices[idx - 1] : null;
    const next = idx < listData.notices.length - 1 ? listData.notices[idx + 1] : null;

    return { prev, next };
  }, [listData, currentNotice]);
}

