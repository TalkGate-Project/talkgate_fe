export function decodeNoticeContent(raw?: string | null): string {
  if (!raw) return "";
  return raw.replace(/\\n/g, "\n");
}

export function encodeNoticeContent(raw?: string | null): string {
  if (!raw) return "";
  const normalized = raw.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  return normalized.replace(/\n/g, "\\n");
}
