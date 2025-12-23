import { Suspense } from "react";
import type { Metadata } from "next";
import { ProjectSignupForm } from "@/components/signup/ProjectSignupForm";
import AuthLayout from "@/components/auth/AuthLayout";

export const metadata: Metadata = {
  title: "TalkGate - 프로젝트 가입",
  description: "프로젝트에서 사용할 정보를 입력해주세요.",
};

function LoadingFallback() {
  return (
    <AuthLayout ariaLabel="project-signup-area">
      <div className="text-center text-white text-xl">로딩 중...</div>
    </AuthLayout>
  );
}

export default function ProjectSignupPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <ProjectSignupForm />
    </Suspense>
  );
}

