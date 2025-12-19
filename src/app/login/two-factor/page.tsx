import type { Metadata } from "next";
import TwoFactorLoginContent from "@/components/auth/TwoFactorLoginContent";

export const metadata: Metadata = {
  title: "TalkGate - 2단계 인증",
};

export default function TwoFactorLoginPage() {
  return <TwoFactorLoginContent />;
}
