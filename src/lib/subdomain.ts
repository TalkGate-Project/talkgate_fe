"use client";

/**
 * 현재 호스트에서 메인 도메인을 추출합니다.
 * 예: app-dev.talkgate.im → app-dev.talkgate.im
 *     project-123.app-dev.talkgate.im → app-dev.talkgate.im
 *     localhost:3000 → localhost:3000
 */
export function getMainDomain(): string {
  if (typeof window === "undefined") {
    return "";
  }

  const host = window.location.host;
  const hostWithoutPort = host.split(":")[0];

  // localhost 환경
  if (hostWithoutPort.includes("localhost") || hostWithoutPort.includes("127.0.0.1")) {
    return host; // 포트 포함하여 반환
  }

  // 프로덕션 환경 (app.talkgate.im)
  if (hostWithoutPort.includes("app.talkgate.im") && !hostWithoutPort.includes("app-dev")) {
    return "app.talkgate.im";
  }

  // 개발 환경 (app-dev.talkgate.im)
  if (hostWithoutPort.includes("app-dev") || hostWithoutPort.includes("talkgate.im")) {
    return "app-dev.talkgate.im";
  }

  // 기본값 (Vercel preview 등)
  return hostWithoutPort;
}

/**
 * 현재 환경에서 서브도메인을 사용할 수 있는지 확인합니다.
 * localhost나 IP 주소 환경에서는 서브도메인을 사용할 수 없습니다.
 */
export function canUseSubdomain(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  const host = window.location.host;
  const hostWithoutPort = host.split(":")[0];

  // localhost나 IP 주소 환경에서는 서브도메인 사용 불가
  if (
    hostWithoutPort.includes("localhost") ||
    hostWithoutPort.includes("127.0.0.1") ||
    /^\d+\.\d+\.\d+\.\d+$/.test(hostWithoutPort)
  ) {
    return false;
  }

  // 실제 도메인 환경에서만 서브도메인 사용 가능
  return hostWithoutPort.includes("talkgate.im");
}

/**
 * 프로젝트 서브도메인 URL을 생성합니다.
 * @param subDomain 프로젝트의 서브도메인 (예: "project-395cl")
 * @param path 이동할 경로 (기본값: "/dashboard")
 * @returns 서브도메인을 포함한 전체 URL (사용 불가능한 환경이면 빈 문자열 반환)
 */
export function getProjectSubdomainUrl(subDomain: string, path: string = "/dashboard"): string {
  if (typeof window === "undefined") {
    return "";
  }

  // 서브도메인을 사용할 수 없는 환경이면 빈 문자열 반환
  if (!canUseSubdomain()) {
    return "";
  }

  const mainDomain = getMainDomain();
  const protocol = window.location.protocol;

  // 프로덕션/개발 환경
  return `${protocol}//${subDomain}.${mainDomain}${path}`;
}

/**
 * 현재 접속 중인 서브도메인을 추출합니다.
 * @returns 서브도메인 또는 null (메인 도메인 접속 시)
 */
export function getCurrentSubdomain(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  const host = window.location.host;
  const hostWithoutPort = host.split(":")[0];

  // 예약된 서브도메인 목록
  const RESERVED_SUBDOMAINS = [
    "www",
    "app",
    "app-dev",
    "api",
    "api-dev",
    "landing",
    "landing-dev",
    "dev",
    "staging",
    "admin",
  ];

  // 메인 도메인 목록
  const MAIN_DOMAINS = ["talkgate.im", "localhost", "127.0.0.1"];

  for (const mainDomain of MAIN_DOMAINS) {
    if (hostWithoutPort === mainDomain) {
      return null; // 메인 도메인 직접 접속
    }

    if (hostWithoutPort.endsWith(`.${mainDomain}`)) {
      // 서브도메인 추출: subdomain.talkgate.im → subdomain
      const subdomain = hostWithoutPort.slice(0, -(mainDomain.length + 1));

      // 예약된 서브도메인 체크
      if (RESERVED_SUBDOMAINS.includes(subdomain.toLowerCase())) {
        return null;
      }

      // 멀티레벨 서브도메인의 경우 첫 번째 부분만 사용
      // 예: project-123.app-dev.talkgate.im → project-123
      const firstPart = subdomain.split(".")[0];
      if (firstPart && !RESERVED_SUBDOMAINS.includes(firstPart.toLowerCase())) {
        return firstPart;
      }

      return null;
    }
  }

  return null;
}

