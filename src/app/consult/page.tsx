import type { Metadata } from "next";
import ConsultPageContent from "@/components/chat/ConsultPageContent";

export const metadata: Metadata = {
  title: "TalkGate - 상담",
};

export default function ConsultPage() {
  return <ConsultPageContent />;
}
