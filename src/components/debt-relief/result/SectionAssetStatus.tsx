import { ASSET_CATEGORY_OPTIONS, type DiagnosisDetail } from "@/types/debtRelief";
import type { AnalysisAssetCategory } from "@/types/analysis";
import { formatWon } from "@/components/debt-relief/format";

type AssetCompositionItem = {
  category: AnalysisAssetCategory;
  label: string;
  amountWon: number;
  percent: number;
};

function AssetMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-w-0 flex-col gap-2 md:gap-3">
      <p className="text-[13px] font-medium leading-4 text-neutral-60 md:text-[14px] md:leading-[17px]">
        {label}
      </p>
      <div className="flex items-baseline gap-1">
        <span className="font-montserrat text-[24px] font-extrabold leading-7 tracking-[-0.03em] text-neutral-90 md:text-[28px]">
          {value}
        </span>
        <span className="text-[13px] font-semibold leading-4 text-neutral-60 md:text-[14px] md:leading-[17px]">
          원
        </span>
      </div>
    </div>
  );
}

function buildAssetComposition(detail: DiagnosisDetail): AssetCompositionItem[] {
  const amounts = new Map<AnalysisAssetCategory, number>();
  const assetDetails = detail.collateralBreakdown?.assetDetails;
  const assets = assetDetails?.length ? assetDetails : detail.inputData.assets;

  for (const asset of assets) {
    const amountWon = "netValue" in asset ? asset.netValue : asset.marketValue;
    if (!Number.isFinite(amountWon) || amountWon <= 0) continue;
    amounts.set(asset.category, (amounts.get(asset.category) ?? 0) + amountWon);
  }

  const totalAmount = Array.from(amounts.values()).reduce((sum, amount) => sum + amount, 0);
  if (totalAmount <= 0) return [];

  return ASSET_CATEGORY_OPTIONS.flatMap((option) => {
    const amountWon = amounts.get(option.value) ?? 0;
    if (amountWon <= 0) return [];
    return [{
      category: option.value,
      label: option.label,
      amountWon,
      percent: Math.round((amountWon / totalAmount) * 100),
    }];
  });
}

export default function SectionAssetStatus({ detail }: { detail: DiagnosisDetail }) {
  const composition = buildAssetComposition(detail);

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-[16px] font-semibold leading-[19px] tracking-[0.2px] text-foreground">
          자산 현황
        </h2>
        <div className="mt-3 border-t border-neutral-30" />
      </div>

      {composition.length === 0 ? (
        <div className="grid min-h-[57px] place-items-center">
          <p className="text-[13px] font-medium leading-4 tracking-[-0.02em] text-neutral-60">
            보유 자산이 없습니다.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-10">
          <div className="grid min-w-0 grid-cols-2 gap-5 md:pl-3 md:gap-x-12">
            <AssetMetric
              label="총 자산"
              value={detail.debtStatus.totalAssetWon.toLocaleString("ko-KR")}
            />
            <AssetMetric
              label="월 가용 소득"
              value={`${detail.debtStatus.monthlyAvailableIncomeWon >= 0 ? "+" : ""}${detail.debtStatus.monthlyAvailableIncomeWon.toLocaleString("ko-KR")}`}
            />
          </div>

          <div className="min-w-0">
            <p className="mb-3 text-[14px] font-medium leading-[17px] text-neutral-60">자산 구성</p>
            <div className="flex flex-col gap-[13px]">
              {composition.map((item) => (
                <div key={item.category} className="flex items-center gap-3">
                  <span className="w-[45px] shrink-0 text-[13px] font-medium leading-4 tracking-[-0.02em] text-foreground">
                    {item.label}
                  </span>
                  <div className="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-neutral-30">
                    <div
                      className="h-full rounded-l-full bg-neutral-70"
                      style={{ width: `${item.percent}%` }}
                    />
                  </div>
                  <span className="w-8 shrink-0 text-[14px] font-medium leading-[17px] text-neutral-60">
                    {item.percent}%
                  </span>
                  <span className="min-w-[85px] shrink-0 whitespace-nowrap text-right text-[14px] font-medium leading-[17px] tabular-nums text-neutral-60">
                    {formatWon(item.amountWon)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
