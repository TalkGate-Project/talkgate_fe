import { Suspense } from "react";
import type { Metadata } from "next";
import { SignupForm } from "@/components/signup";
import AuthLayout from "@/components/auth/AuthLayout";

export const metadata: Metadata = {
  title: "TalkGate - 회원가입",
  description: "TalkGate에 회원가입하세요.",
};

function LoadingFallback() {
  return (
    <AuthLayout ariaLabel="signup-area">
      <div className="text-center text-white text-xl">로딩 중...</div>
    </AuthLayout>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <SignupForm />
    </Suspense>
  );
}
