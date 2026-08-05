import type { Metadata } from "next";
import DebtReliefHubContent from "@/components/debt-relief/DebtReliefHubContent";

export const metadata: Metadata = {
  title: "TalkGate - 채무조정",
};

export default function DebtReliefPage() {
  return <DebtReliefHubContent />;
}
