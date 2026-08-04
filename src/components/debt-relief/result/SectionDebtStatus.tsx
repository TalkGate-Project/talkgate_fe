import type { DebtStatusSummary, DiagnosisDetail } from "@/types/debtRelief";
import { formatManwonComma } from "@/components/debt-relief/format";

function Metric({
  label,
  value,
  unit,
  note,
}: {
  label: string;
  value: string;
  unit: string;
  /** 값 아래 작게 붙는 보조 표기 (예: "이자 포함 시 3,100만원"). 없으면 렌더하지 않는다 */
  note?: string;
}) {
  return (
    <div className="flex flex-col gap-2 md:gap-[12px]">
      <p className="text-[13px] md:text-[14px] font-medium leading-[17px] text-neutral-60">{label}</p>
      <div className="flex flex-col gap-1">
        <div className="flex items-baseline gap-1">
          <span className="font-montserrat font-bold text-[24px] md:text-[28px] leading-7 tracking-[-0.03em] text-neutral-90">
            {value}
          </span>
          <span className="text-[13px] md:text-[14px] font-semibold leading-[17px] text-neutral-60">{unit}</span>
        </div>
        {note && (
          <p className="text-[12px] font-medium leading-[14px] text-neutral-50 whitespace-nowrap">
            {note}
          </p>
        )}
      </div>
    </div>
  );
}

export default function SectionDebtStatus({ detail }: { detail: DiagnosisDetail }) {
  const debt: DebtStatusSummary = detail.debtStatus;
  const availableSign = debt.monthlyAvailableIncomeManwon >= 0 ? "+" : "";

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-[16px] font-semibold leading-[19px] tracking-[0.2px] text-foreground">
          채무 현황
        </h2>
        <div className="mt-3 border-t border-neutral-30" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-10">
        {/* 좌: 2x2 지표 */}
      <div className="grid grid-cols-2 gap-x-5 md:gap-x-[48px] gap-y-5 md:gap-y-6 min-w-0">
          {/* 이자 포함 총채무는 채무 상세입력 모드로 생성된 건에만 내려온다 — 간편모드 건에서는
              값 자체가 없으므로 "0"이 아니라 병기를 통째로 숨긴다. */}
          <Metric
            label="총 채무"
            value={debt.totalDebtManwon.toLocaleString("ko-KR")}
            unit="만원"
            note={
              debt.totalDebtWithInterestManwon != null
                ? `이자 포함 시 ${debt.totalDebtWithInterestManwon.toLocaleString("ko-KR")}만원`
                : undefined
            }
          />
          <Metric
            label="총 자산"
            value={debt.totalAssetManwon.toLocaleString("ko-KR")}
            unit="만원"
          />
          <Metric
            label="월 가용 소득"
            value={`${availableSign}${debt.monthlyAvailableIncomeManwon.toLocaleString("ko-KR")}`}
            unit="만원"
          />
          <Metric label="연체 기간" value={String(debt.overdueMonths)} unit="개월" />
        </div>

        {/* 우: 채무 구성 */}
        <div className="min-w-0">
          <p className="text-[14px] font-medium leading-[17px] text-neutral-60 mb-[12px]">채무 구성</p>
          <div className="flex flex-col gap-[13px]">
            {debt.composition.map((item) => (
              <div key={item.label} className="flex items-center gap-3">
                <span className="w-[45px] shrink-0 text-[13px] font-medium leading-4 tracking-[-0.02em] text-foreground">
                  {item.label}
                </span>
                <div className="flex-1 min-w-0 h-2 rounded-full bg-neutral-30 overflow-hidden">
                  <div
                    className="h-full bg-neutral-70 rounded-l-full"
                    style={{ width: `${item.percent}%` }}
                  />
                </div>
                <span className="w-8 shrink-0 text-[14px] font-medium leading-[17px] text-neutral-60">
                  {item.percent}%
                </span>
                <span className="w-[68px] shrink-0 text-right text-[14px] font-medium leading-[17px] text-neutral-60">
                  {formatManwonComma(item.amountManwon)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
