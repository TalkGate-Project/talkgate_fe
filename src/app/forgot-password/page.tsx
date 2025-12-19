import type { Metadata } from "next";
import ForgotPasswordContent from "@/components/auth/ForgotPasswordContent";

export const metadata: Metadata = {
  title: "TalkGate - 비밀번호 찾기",
};

export default function ForgotPasswordPage() {
  return <ForgotPasswordContent />;
}
