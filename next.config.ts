import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "talkgate-dev.s3.ap-northeast-2.amazonaws.com",
        pathname: "/**",
      },
      // 프로덕션 환경을 위한 추가 도메인 필요시 여기에 추가
      // {
      //   protocol: "https",
      //   hostname: "talkgate-prod.s3.ap-northeast-2.amazonaws.com",
      //   pathname: "/**",
      // },
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
      ? "https://landing.talkgate.im" 
      : (isVercel ? "https://landing-dev.talkgate.im" : "http://localhost:3001");
    
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
