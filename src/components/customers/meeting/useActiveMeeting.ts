"use client";

import { useEffect, useState } from "react";
import type { CustomerMeeting } from "@/types/customers";
import { isMeetingActive } from "./meetingTime";

// setTimeout 최대 지연(약 24.8일)을 넘기면 즉시 실행되므로 상한을 둔다.
const MAX_TIMEOUT_MS = 2_147_483_647;

/**
 * 종료시간이 지나면 화면을 새로 받지 않아도 미팅중 표시가 사라지도록 만료 시점에 다시 렌더링한다.
 * 미팅중이 아니면 null.
 */
export function useActiveMeeting(meeting: CustomerMeeting | null | undefined): CustomerMeeting | null {
  const [, setExpiredTick] = useState(0);
  const endsAt = meeting?.endsAt;

  useEffect(() => {
    if (!endsAt) return;
    const remainingMs = new Date(endsAt).getTime() - Date.now();
    if (remainingMs <= 0) return;
    const timer = setTimeout(() => setExpiredTick((tick) => tick + 1), Math.min(remainingMs, MAX_TIMEOUT_MS));
    return () => clearTimeout(timer);
  }, [endsAt]);

  return meeting && isMeetingActive(meeting) ? meeting : null;
}
