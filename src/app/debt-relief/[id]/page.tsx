import type { Metadata } from "next";
import ResultDetailContent from "@/components/debt-relief/result/ResultDetailContent";

export const metadata: Metadata = {
  title: "TalkGate - 회생·파산 결과",
};

interface DebtReliefDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function DebtReliefDetailPage({ params }: DebtReliefDetailPageProps) {
  const { id } = await params;
  return <ResultDetailContent diagnosisId={id} />;
}
