import type { Metadata } from "next";
import OAuthCallbackContent from "@/components/auth/OAuthCallbackContent";

export const metadata: Metadata = {
  title: "TalkGate - 로그인 중",
};

interface OAuthCallbackPageProps {
  params: Promise<{ provider: string }>;
}

export default async function OAuthCallbackPage({ params }: OAuthCallbackPageProps) {
  const { provider } = await params;
  return <OAuthCallbackContent provider={provider} />;
}
