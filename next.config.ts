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
};

export default nextConfig;
