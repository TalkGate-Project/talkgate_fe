import { Suspense } from "react";
import type { Metadata } from "next";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import DiagnosisFormContent from "@/components/debt-relief/form/DiagnosisFormContent";

export const metadata: Metadata = {
  title: "TalkGate - 채무조정 진단",
};

function LoadingFallback() {
  return (
    <div className="min-h-[calc(100vh-54px)] bg-card lg:bg-background grid place-items-center">
      <LoadingSpinner />
    </div>
  );
}

export default function DebtReliefNewPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <DiagnosisFormContent />
    </Suspense>
  );
}
