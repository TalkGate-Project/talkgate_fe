import type { Metadata } from "next";
import StatsPageContent from "@/components/stats/StatsPageContent";

export const metadata: Metadata = {
  title: "TalkGate - 통계",
};

export default function StatsPage() {
  return <StatsPageContent />;
}
