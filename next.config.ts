import type { NextConfig } from "next";

// ========== 빌드 시점 환경변수 디버깅 ==========
console.log("=".repeat(60));
console.log("[BUILD TIME] Environment Variables Check:");
console.log("  NEXT_PUBLIC_GOOGLE_CLIENT_ID:", process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ? "✅ SET" : "❌ MISSING");
console.log("  NEXT_PUBLIC_KAKAO_REST_API_KEY:", process.env.NEXT_PUBLIC_KAKAO_REST_API_KEY ? "✅ SET" : "❌ MISSING");
console.log("  NEXT_PUBLIC_NAVER_CLIENT_ID:", process.env.NEXT_PUBLIC_NAVER_CLIENT_ID ? "✅ SET" : "❌ MISSING");
console.log("  VERCEL:", process.env.VERCEL ? "✅ YES" : "❌ NO");
console.log("  VERCEL_ENV:", process.env.VERCEL_ENV ?? "(not set)");
console.log("=".repeat(60));
// ================================================

const nextConfig: NextConfig = {
  // subset-font(harfbuzzjs)는 hb-subset.wasm을 require.resolve()로 디스크에서 직접 찾아
  // 읽는다. 번들러가 이 패키지를 서버 번들 안으로 끌어들이면 그 경로 해석이 깨져
  // /api/pdf-font-subset가 500을 낸다(2026-09-01 확인) — 번들링하지 않고 node_modules에서
  // 그대로 require하도록 제외한다.
  serverExternalPackages: ["subset-font", "harfbuzzjs", "fontverter"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "talkgate-dev.s3.ap-northeast-2.amazonaws.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "talkgate-prod.s3.ap-northeast-2.amazonaws.com",
        pathname: "/**",
      },
    ],
  },
  
  // 랜딩 페이지와의 도메인 간 통신을 위한 CORS 헤더 설정
  async headers() {
    // 환경별 랜딩 페이지 도메인 설정
    // Vercel 배포 환경 감지: VERCEL_URL 환경 변수 존재 여부
    const isVercelProduction = process.env.VERCEL_ENV === "production";
    const isVercel = !!process.env.VERCEL;
    
    // 프로덕션: landing.talkgate.im (추후 확정 시 수정)
    // 개발: landing-dev.talkgate.im 또는 localhost
    const allowedOrigin = isVercelProduction 
      ? "https://talkgate.im" 
      : (isVercel ? "https://talkgate.im" : "http://localhost:3001");
    
    return [
      {
        // 모든 API 라우트 및 페이지에 CORS 헤더 적용
        source: "/:path*",
        headers: [
          {
            key: "Access-Control-Allow-Credentials",
            value: "true",
          },
          {
            key: "Access-Control-Allow-Origin",
            value: allowedOrigin,
          },
          {
            key: "Access-Control-Allow-Methods",
            value: "GET,DELETE,PATCH,POST,PUT,OPTIONS",
          },
          {
            key: "Access-Control-Allow-Headers",
            value: "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization, x-project-id",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
