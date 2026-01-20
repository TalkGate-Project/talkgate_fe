"use client";

/**
 * 개발 환경인지 확인합니다.
 * 환경변수 기반으로 판단: NODE_ENV === "development" 또는 VERCEL 환경변수가 없는 경우
 * 호스트명은 보조적으로만 사용 (localhost 체크)
 */
export function isDevelopment(): boolean {
  // 환경변수 기반 판단 (우선순위 1)
  // npm run dev: NODE_ENV === "development"
  // Vercel 배포: NODE_ENV === "production", VERCEL 환경변수 존재
  if (typeof window === "undefined") {
    // 서버 사이드: NODE_ENV가 development이거나 VERCEL이 없으면 개발 환경
    return process.env.NODE_ENV === "development" || !process.env.VERCEL;
  }

  // 클라이언트 사이드: Next.js가 빌드 시 NODE_ENV를 인라인하므로 직접 체크 가능
  // 하지만 런타임에서는 접근 불가하므로 호스트명으로 판단
  const host = window.location.host;
  const hostWithoutPort = host.split(":")[0];
  
  // localhost나 127.0.0.1 환경은 개발 환경으로 간주
  if (
    hostWithoutPort.includes("localhost") ||
    hostWithoutPort.includes("127.0.0.1") ||
    /^\d+\.\d+\.\d+\.\d+$/.test(hostWithoutPort)
  ) {
    return true;
  }

  // 그 외의 경우는 배포 환경으로 간주
  return false;
}

/**
 * 현재 환경에 맞는 메인 도메인을 반환합니다.
 * NEXT_PUBLIC_SITE_URL 환경변수에서 추출하며, 환경변수를 참조하지 못한 경우 app-dev.talkgate.im으로 폴백합니다.
 * host 기반 판단은 제거되어 의도치 않은 프로덕션 도메인으로의 리다이렉트를 방지합니다.
 */
export function getMainDomain(): string {
  // NEXT_PUBLIC_SITE_URL에서 메인 도메인 추출 (host 기반 판단 제거)
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (!siteUrl) return "app-dev.talkgate.im";
  
  try {
    const url = new URL(siteUrl);
    const port = url.port && url.port !== "80" && url.port !== "443" ? `:${url.port}` : "";
    return `${url.hostname}${port}`;
  } catch {
    // URL 파싱 실패 시 문자열에서 프로토콜만 제거
    return siteUrl.replace(/^https?:\/\//, "").split("/")[0];
  }
}

/**
 * 현재 환경에서 서브도메인을 사용할 수 있는지 확인합니다.
 * 개발 환경(localhost)에서는 사용 불가, Vercel 배포 환경에서는 사용 가능
 */
export function canUseSubdomain(): boolean {
  // 개발 환경에서는 서브도메인 사용 불가
  if (isDevelopment()) {
    return false;
  }

  if (typeof window === "undefined") {
    // 서버 사이드에서는 Vercel 환경인지 확인
    return !!process.env.VERCEL;
  }

  const host = window.location.host;
  const hostWithoutPort = host.split(":")[0];

  // 실제 도메인 환경(talkgate.im 또는 vercel.app)에서만 서브도메인 사용 가능
  return hostWithoutPort.includes("talkgate.im") || hostWithoutPort.includes("vercel.app");
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

