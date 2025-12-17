import { Suspense } from "react";
import type { Metadata } from "next";
import { InviteLanding } from "@/components/invite";

export const metadata: Metadata = {
  title: "TalkGate - 초대",
  description: "TalkGate 프로젝트에 초대되었습니다.",
};

function LoadingFallback() {
  return (
    <main
      className="min-h-screen relative flex items-center justify-center"
      style={{
        backgroundImage: "url('/login_bg.png')",
        backgroundRepeat: "no-repeat",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="text-center text-white text-xl">
        초대 정보를 불러오는 중...
      </div>
    </main>
  );
}

export default function InvitePage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <InviteLanding />
    </Suspense>
  );
}
