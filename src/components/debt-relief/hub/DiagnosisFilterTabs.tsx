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
  totalCount: number;
  selectedCount: number;
};

export default function DiagnosisFilterTabs({
  summary,
  active,
  onChange,
  totalCount,
  selectedCount,
}: Props) {
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
            className={`cursor-pointer inline-flex items-center justify-center h-[34px] rounded-[30px] text-[14px] font-medium leading-[17px] tracking-[-0.02em] transition-colors ${
              isActive
                ? "bg-neutral-90 text-neutral-0 px-5 gap-3"
                : "border border-neutral-30 dark:!border-neutral-50 bg-transparent text-foreground/80 px-4 gap-1 hover:bg-neutral-10"
            }`}
          >
            <span>{tab.label}</span>
            {tab.count !== null && (
              <span
                className={`text-[13px] font-medium leading-4 ${
                  isActive ? "text-neutral-0/70" : "text-neutral-60/80"
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}

      <span className="hidden md:inline text-[14px] font-medium leading-5 text-neutral-50 whitespace-nowrap">
        총 {totalCount}건
        {selectedCount > 0 ? ` (${selectedCount}개 선택)` : ""}
      </span>
    </div>
  );
}
