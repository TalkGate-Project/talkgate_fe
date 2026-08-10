import type { DiagnosisDerivedValues } from "@/types/debtRelief";

function formatManwon(value: number): string {
  return value.toLocaleString("ko-KR");
}

function SummaryRow({
  label,
  value,
  unit,
  highlight = "default",
}: {
  label: string;
  value: string;
  unit: string;
  highlight?: "default" | "danger";
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[13px] font-medium text-neutral-60">{label}</span>
      <span className="flex items-end gap-1">
        <span
          className={`font-montserrat font-bold text-[18px] leading-5 tracking-[-0.03em] ${
            highlight === "danger" ? "text-danger-40" : "text-foreground"
          }`}
        >
          {value}
        </span>
        <span className="text-[13px] font-semibold leading-4 text-neutral-60">{unit}</span>
      </span>
    </div>
  );
}

// FormSidebar(데스크톱)와 MobileFormSummaryDrawer(모바일)가 공유하는 파생 재무 요약 카드
export default function FormFinancialSummary({
  derived,
  className = "bg-neutral-10",
}: {
  derived: DiagnosisDerivedValues;
  /** 모바일 펼침 패널(#F8F8F8) 위에서는 흰 카드(`bg-card`)로 대비를 준다 */
  className?: string;
}) {
  return (
    <div className={`rounded-[12px] px-4 py-4 flex flex-col gap-3 ${className}`}>
      <SummaryRow label="총 채무" value={formatManwon(derived.totalDebtManwon)} unit="만원" />
      <SummaryRow
        label="월 소득"
        value={formatManwon(derived.monthlyIncomeManwon)}
        unit="만원"
      />
      <SummaryRow
        label="월 가용소득"
        value={formatManwon(derived.monthlyAvailableIncomeManwon)}
        unit="만원"
        highlight={derived.monthlyAvailableIncomeManwon < 0 ? "danger" : "default"}
      />
    </div>
  );
}
