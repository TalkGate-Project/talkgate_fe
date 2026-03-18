export const POST_AUTH_REDIRECT_STORAGE_KEY = "tg_redirect_url";

const isDevelopment = process.env.NODE_ENV === "development";

function isAllowedTalkgateHost(hostname: string): boolean {
  const normalizedHost = hostname.toLowerCase();
  return normalizedHost === "talkgate.im" || normalizedHost.endsWith(".talkgate.im");
}

function isLocalDevelopmentHost(hostname: string): boolean {
  const normalizedHost = hostname.toLowerCase();
  return (
    normalizedHost === "localhost" ||
    normalizedHost === "127.0.0.1" ||
    /^\d+\.\d+\.\d+\.\d+$/.test(normalizedHost)
  );
}

function getAllowedAbsoluteRedirect(raw: string | null | undefined): string | null {
  if (!raw) return null;

  try {
    const url = new URL(raw.trim());
    const normalizedProtocol = url.protocol.toLowerCase();
    const normalizedHostname = url.hostname.toLowerCase();

    if (
      isDevelopment &&
      isLocalDevelopmentHost(normalizedHostname) &&
      (normalizedProtocol === "http:" || normalizedProtocol === "https:")
    ) {
      return url.toString();
    }

    if (normalizedProtocol !== "https:") {
      return null;
    }

    if (!isAllowedTalkgateHost(normalizedHostname)) {
      return null;
    }

    return url.toString();
  } catch {
    return null;
  }
}

export function getAllowedPostAuthRedirect(raw: string | null | undefined): string | null {
  return getAllowedAbsoluteRedirect(raw);
}

export function getPostAuthDestination(
  raw: string | null | undefined,
  fallback = "/projects"
): string {
  return getAllowedPostAuthRedirect(raw) ?? fallback;
}

export function resolveLogoutRedirect(
  raw: string | null | undefined,
  currentOrigin: string,
  fallbackAbsoluteUrl: string
): string {
  if (!raw) return fallbackAbsoluteUrl;

  const trimmed = raw.trim();
  if (!trimmed) return fallbackAbsoluteUrl;

  if (trimmed.startsWith("/")) {
    return new URL(trimmed, currentOrigin).toString();
  }

  const allowedAbsoluteRedirect = getAllowedAbsoluteRedirect(trimmed);
  if (allowedAbsoluteRedirect) {
    return allowedAbsoluteRedirect;
  }

  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(trimmed)) {
    return fallbackAbsoluteUrl;
  }

  return new URL(`/${trimmed.replace(/^\/+/, "")}`, currentOrigin).toString();
}
