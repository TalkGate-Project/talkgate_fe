/**
 * 환경별 로깅 유틸리티
 * - 개발 환경에서만 debug/info 로그 출력
 * - 프로덕션에서는 warn/error만 출력
 * - 서버사이드 로그는 유저에게 노출되지 않음
 */

const isDev = process.env.NODE_ENV === "development";
const isServer = typeof window === "undefined";

export const logger = {
  /**
   * 개발 환경에서만 출력되는 디버그 로그
   * 프로덕션에서는 출력되지 않음
   */
  debug: (...args: unknown[]) => {
    if (isDev) {
      console.log("[DEBUG]", ...args);
    }
  },

  /**
   * 개발 환경에서만 출력되는 정보 로그
   * 프로덕션에서는 출력되지 않음
   */
  info: (...args: unknown[]) => {
    if (isDev) {
      console.log("[INFO]", ...args);
    }
  },

  /**
   * 경고 로그 (항상 출력)
   */
  warn: (...args: unknown[]) => {
    console.warn("[WARN]", ...args);
  },

  /**
   * 에러 로그 (항상 출력)
   * TODO: Sentry 등 에러 모니터링 서비스 연동 가능
   */
  error: (...args: unknown[]) => {
    console.error("[ERROR]", ...args);
    // TODO: Sentry.captureException() 연동
  },

  /**
   * 서버사이드 전용 로그 (미들웨어, API routes에서 사용)
   * 클라이언트에서는 출력되지 않음 (유저가 볼 수 없음)
   */
  server: (...args: unknown[]) => {
    if (isServer) {
      console.log("[Server]", ...args);
    }
  },

  /**
   * 서버사이드 전용 에러 로그
   * 클라이언트에서는 출력되지 않음
   */
  serverError: (...args: unknown[]) => {
    if (isServer) {
      console.error("[Server Error]", ...args);
    }
  },
};

export default logger;
