"use client";

import { env } from "@/lib/env";

function mask(value: string | undefined): string {
  if (!value) return "(missing)";
  const trimmed = value.trim();
  if (trimmed.length <= 6) return `${"*".repeat(Math.max(0, trimmed.length - 2))}${trimmed.slice(-2)}`;
  return `${trimmed.slice(0, 2)}***${trimmed.slice(-4)}`;
}

export default function ClientEnv() {
  return (
    <div style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace" }}>
      <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>Client bundle (env imported from @/lib/env)</h3>
      <ul style={{ lineHeight: 1.7 }}>
        <li>NEXT_PUBLIC_GOOGLE_CLIENT_ID: {mask(env.NEXT_PUBLIC_GOOGLE_CLIENT_ID)}</li>
        <li>NEXT_PUBLIC_KAKAO_REST_API_KEY: {mask(env.NEXT_PUBLIC_KAKAO_REST_API_KEY)}</li>
        <li>NEXT_PUBLIC_NAVER_CLIENT_ID: {mask(env.NEXT_PUBLIC_NAVER_CLIENT_ID)}</li>
      </ul>
    </div>
  );
}


