import ClientEnv from "./ClientEnv";
import { headers } from "next/headers";

function mask(value: string | undefined): string {
  if (!value) return "(missing)";
  const trimmed = value.trim();
  if (trimmed.length <= 6) return `${"*".repeat(Math.max(0, trimmed.length - 2))}${trimmed.slice(-2)}`;
  return `${trimmed.slice(0, 2)}***${trimmed.slice(-4)}`;
}

export default async function DebugEnvPage() {
  const h = await headers();
  const host = h.get("host") ?? "(unknown)";

  const serverGoogle = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const serverKakao = process.env.NEXT_PUBLIC_KAKAO_REST_API_KEY;
  const serverNaver = process.env.NEXT_PUBLIC_NAVER_CLIENT_ID;

  const vercelEnv = process.env.VERCEL_ENV ?? "(missing)";
  const commit = process.env.VERCEL_GIT_COMMIT_SHA ?? process.env.VERCEL_GIT_COMMIT_REF ?? "(missing)";

  return (
    <div style={{ padding: 24, maxWidth: 900, margin: "0 auto" }}>
      <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 12 }}>/debug/env</h2>

      <div style={{ marginBottom: 18 }}>
        <div style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace" }}>
          <div>host: {host}</div>
          <div>VERCEL_ENV: {vercelEnv}</div>
          <div>commit/ref: {commit}</div>
        </div>
      </div>

      <div style={{ display: "grid", gap: 16 }}>
        <div style={{ padding: 16, border: "1px solid #333", borderRadius: 8 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>Server runtime (process.env)</h3>
          <ul style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace", lineHeight: 1.7 }}>
            <li>NEXT_PUBLIC_GOOGLE_CLIENT_ID: {mask(serverGoogle)}</li>
            <li>NEXT_PUBLIC_KAKAO_REST_API_KEY: {mask(serverKakao)}</li>
            <li>NEXT_PUBLIC_NAVER_CLIENT_ID: {mask(serverNaver)}</li>
          </ul>
        </div>

        <div style={{ padding: 16, border: "1px solid #333", borderRadius: 8 }}>
          <ClientEnv />
        </div>
      </div>
    </div>
  );
}


