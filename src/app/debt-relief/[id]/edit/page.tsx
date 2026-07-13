import { Suspense } from "react";
import type { Metadata } from "next";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import DiagnosisFormContent from "@/components/debt-relief/form/DiagnosisFormContent";

export const metadata: Metadata = {
  title: "TalkGate - 회생·파산 진단 수정",
};

function LoadingFallback() {
  return (
    <div className="min-h-[400px] grid place-items-center">
      <LoadingSpinner />
    </div>
  );
}

interface DebtReliefEditPageProps {
  params: Promise<{ id: string }>;
}

export default async function DebtReliefEditPage({ params }: DebtReliefEditPageProps) {
  const { id } = await params;
  return (
    <Suspense fallback={<LoadingFallback />}>
      <DiagnosisFormContent diagnosisId={id} />
    </Suspense>
  );
}
