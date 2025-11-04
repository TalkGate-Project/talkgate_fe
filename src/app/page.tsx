import { redirect } from "next/navigation";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "TalkGate",
  description: "TalkGate 고객 관리 시스템",
};

export default function Home() {
  // 루트에서는 클라이언트 깜빡임 방지를 위해 기본적으로 로그인 페이지로 보냅니다.
  // 이미 로그인된 사용자는 /login에서 실제 인증 검사 후 /dashboard로 이동합니다.
  redirect("/login");
}
