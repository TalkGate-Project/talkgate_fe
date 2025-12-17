import { Suspense } from "react";
import type { Metadata } from "next";
import { AcceptInviteForm } from "@/components/invite";
import AuthLayout from "@/components/auth/AuthLayout";

export const metadata: Metadata = {
  title: "TalkGate - 초대 수락",
  description: "TalkGate 프로젝트 초대를 수락합니다.",
};

function LoadingFallback() {
  return (
    <AuthLayout ariaLabel="invite-accept-area">
      <div className="text-center text-white text-xl">로딩 중...</div>
    </AuthLayout>
  );
}

export default function AcceptInvitePage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <AcceptInviteForm />
    </Suspense>
  );
}
