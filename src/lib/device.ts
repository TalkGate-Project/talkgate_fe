const MOBILE_USER_AGENT_PATTERNS = [
  /Android/i,
  /webOS/i,
  /iPhone/i,
  /iPad/i,
  /iPod/i,
  /BlackBerry/i,
  /Windows Phone/i,
  /Opera Mini/i,
  /IEMobile/i,
  /Mobile/i,
  /Tablet/i,
  /SamsungBrowser/i,
];

type NavigatorDeviceInfo = {
  userAgent?: string;
  platform?: string;
  maxTouchPoints?: number;
  userAgentData?: {
    mobile?: boolean;
  };
};

/** 화면 크기가 아니라 User-Agent를 기준으로 실제 모바일·태블릿 기기인지 판정한다. */
export function isMobileDeviceUserAgent(userAgent: string | null | undefined): boolean {
  if (!userAgent) return false;
  return MOBILE_USER_AGENT_PATTERNS.some((pattern) => pattern.test(userAgent));
}

/** iPad의 '데스크톱 웹 사이트 요청'처럼 UA가 Macintosh로 바뀌는 경우까지 보완한다. */
export function isMobileDeviceNavigator(deviceNavigator: NavigatorDeviceInfo): boolean {
  if (deviceNavigator.userAgentData?.mobile) return true;
  if (isMobileDeviceUserAgent(deviceNavigator.userAgent)) return true;

  return (
    deviceNavigator.platform === "MacIntel" &&
    (deviceNavigator.maxTouchPoints ?? 0) > 1
  );
}
