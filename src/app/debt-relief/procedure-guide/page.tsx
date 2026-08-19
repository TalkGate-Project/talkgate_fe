import { Suspense } from "react";
import type { Metadata } from "next";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import ProcedureGuideContent from "@/components/debt-relief/procedure-guide/ProcedureGuideContent";

export const metadata: Metadata = {
  title: "TalkGate - 채무조정 제도 안내",
};

function LoadingFallback() {
  return (
    <div className="min-h-[400px] grid place-items-center">
      <LoadingSpinner />
    </div>
  );
}

export default function ProcedureGuidePage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <ProcedureGuideContent />
    </Suspense>
  );
}
