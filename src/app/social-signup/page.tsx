"use client";

import { Suspense } from "react";
import type { Metadata } from "next";
import { SocialSignupForm } from "@/components/signup/SocialSignupForm";
import AuthLayout from "@/components/auth/AuthLayout";

function LoadingFallback() {
  return (
    <AuthLayout ariaLabel="social-signup-area">
      <div className="text-center text-white text-xl">로딩 중...</div>
    </AuthLayout>
  );
}

export default function SocialSignupPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <SocialSignupForm />
    </Suspense>
  );
}

