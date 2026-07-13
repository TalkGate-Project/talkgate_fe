import {
  RECOMMENDED_PROCEDURE_LABEL,
  RECOMMENDED_PROCEDURE_ORDER,
  type DiagnosisHubSummary,
  type RecommendedProcedure,
} from "@/types/debtRelief";

type Props = {
  summary: DiagnosisHubSummary | null;
  active: RecommendedProcedure | undefined;
  onChange: (procedure: RecommendedProcedure | undefined) => void;
};

export default function DiagnosisFilterTabs({ summary, active, onChange }: Props) {
  const tabs: { key: RecommendedProcedure | undefined; label: string; count: number | null }[] = [
    { key: undefined, label: "전체", count: null },
    ...RECOMMENDED_PROCEDURE_ORDER.map((key) => ({
      key,
      label: RECOMMENDED_PROCEDURE_LABEL[key],
      count: summary ? summary.procedureDistribution[key] : null,
    })),
  ];

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {tabs.map((tab) => {
        const isActive = tab.key === active;
        return (
          <button
            key={tab.label}
            type="button"
            onClick={() => onChange(tab.key)}
            className={`cursor-pointer h-[34px] px-4 rounded-full text-[14px] font-medium transition-colors ${
              isActive
                ? "bg-neutral-90 text-neutral-0"
                : "bg-neutral-10 text-neutral-60 hover:bg-neutral-20"
            }`}
          >
            {tab.label}
            {tab.count !== null && (
              <span className={`ml-1.5 ${isActive ? "text-neutral-0/70" : "text-neutral-50"}`}>
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
