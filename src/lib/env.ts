// Centralized environment variables with minimal runtime validation
// Use NEXT_PUBLIC_* for client-side. Server-only vars should not be imported in the client bundle.

export type AppEnv = {
  NEXT_PUBLIC_API_BASE_URL: string;
  NEXT_PUBLIC_API_TIMEOUT_MS: number; // integer milliseconds
};

function readString(key: keyof AppEnv, fallback?: string): string {
  const value = process.env[key as string] ?? fallback;
  if (value === undefined || value === "") {
    throw new Error(`Missing environment variable: ${String(key)}`);
  }
  return value;
}

function readNumber(key: keyof AppEnv, fallback?: number): number {
  const raw = process.env[key as string];
  if ((raw === undefined || raw === "") && fallback !== undefined) return fallback;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) {
    throw new Error(`Invalid number for ${String(key)}: ${raw}`);
  }
  return parsed;
}

export const env: AppEnv = {
  NEXT_PUBLIC_API_BASE_URL: readString(
    "NEXT_PUBLIC_API_BASE_URL",
    process.env.NODE_ENV === "production" ? "https://api.talkgate.im" : "https://api-dev.talkgate.im"
  ),
  NEXT_PUBLIC_API_TIMEOUT_MS: readNumber("NEXT_PUBLIC_API_TIMEOUT_MS", 10000),
};


