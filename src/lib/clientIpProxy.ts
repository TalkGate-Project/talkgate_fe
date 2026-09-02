import { getClientIpProxySecret } from "@/lib/env";

function normalizeIpv4(value: string): string | null {
  const candidate = value.trim().replace(/^::ffff:/i, "");
  const octets = candidate.split(".");

  if (octets.length !== 4) return null;
  if (!octets.every((octet) => /^\d{1,3}$/.test(octet))) return null;
  if (!octets.every((octet) => Number(octet) >= 0 && Number(octet) <= 255)) return null;

  return octets.map((octet) => String(Number(octet))).join(".");
}

function getForwardedClientIpv4(requestHeaders: Headers): string | null {
  const forwardedFor =
    requestHeaders.get("x-vercel-forwarded-for") ??
    requestHeaders.get("x-forwarded-for") ??
    requestHeaders.get("x-real-ip");

  if (!forwardedFor) return null;

  const firstForwardedAddress = forwardedFor.split(",")[0];
  return normalizeIpv4(firstForwardedAddress);
}

export function buildClientIpProxyHeaders(
  requestHeaders: Headers
): Record<string, string> {
  const clientIpv4 = getForwardedClientIpv4(requestHeaders);
  if (!clientIpv4) return {};

  return {
    "x-talkgate-client-ip": clientIpv4,
    "x-talkgate-ip-secret": getClientIpProxySecret(),
  };
}
