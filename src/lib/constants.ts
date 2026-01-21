/**
 * 애플리케이션 전역 상수
 */

import { env } from "./env";

/**
 * 문서/안내 페이지 URL
 */
export const DOCUMENTATION_URL = "https://talkgate.gitbook.io/talkgate";

/**
 * 랜딩 페이지 베이스 URL
 * 환경변수 NEXT_PUBLIC_LANDING_URL을 참조하며, 없을 경우 기본값은 https://talkgate.im입니다.
 */
export const LANDING_BASE_URL = env.NEXT_PUBLIC_LANDING_URL || "https://talkgate.im";

/**
 * 랜딩 페이지 URL들
 */
export const LANDING_URLS = {
  /** 이용약관 페이지 */
  TERMS: `${LANDING_BASE_URL}/terms`,
  /** 개인정보처리방침 페이지 */
  PRIVACY: `${LANDING_BASE_URL}/privacy`,
  /** 가격/결제 페이지 */
  PRICING: `${LANDING_BASE_URL}/pricing`,
} as const;
