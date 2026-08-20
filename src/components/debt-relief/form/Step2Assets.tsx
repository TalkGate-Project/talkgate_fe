"use client";

import Image from "next/image";
import { ASSET_CATEGORY_OPTIONS, createEmptyAssetItem, createEmptyDebtItem, type AssetItemFormState, type DebtItemFormState, type DiagnosisFormState } from "@/types/debtRelief";
import { FormSectionTitle, ManwonInput } from "./FormControls";
import FormToggle from "./FormToggle";
import DebtItemsTable from "./DebtItemsTable";
import { DebtModeToggle } from "./DebtHistoryCard";

type Props = { form: DiagnosisFormState; update: <K extends keyof DiagnosisFormState>(key: K, value: DiagnosisFormState[K]) => void };
const ASSET_ICON: Record<AssetItemFormState["category"], string> = {
  house: "/images/debt-relief/assets/home-icon@4x.png", land: "/images/debt-relief/assets/land-icon@4x.png",
  jeonse_deposit: "/images/debt-relief/assets/home-icon-2@4x.png", vehicle: "/images/debt-relief/assets/car-icon@4x.png",
  financial_asset: "/images/debt-relief/assets/wallet-icon@4x.png",
};

function PlusIcon() { return <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden><path d="M8 3.33v9.34M3.33 8h9.34" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>; }
function RemoveIcon() { return <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden><path d="m5 5 10 10M15 5 5 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>; }
function AssetIcon({ category }: { category: AssetItemFormState["category"] }) { return <Image src={ASSET_ICON[category]} alt="" width={80} height={80} unoptimized className="h-5 w-5 object-contain" />; }

export default function Step2Assets({ form, update }: Props) {
  const setAssets = (assets: AssetItemFormState[]) => {
    const assetIds = new Set(assets.filter((asset) => asset.category !== "financial_asset").map((asset) => asset.id));
    const removedCollateralDebtIds = new Set(form.debts.filter((debt) => debt.collateralAssetId && !assetIds.has(debt.collateralAssetId)).map((debt) => debt.id));
    update("assets", assets);
    update("debts", form.debts.map((debt) => debt.collateralAssetId && !assetIds.has(debt.collateralAssetId) ? { ...debt, collateralAssetId: undefined } : debt));
    update("assetOriginDebtIds", form.assetOriginDebtIds.filter((id) => !removedCollateralDebtIds.has(id)));
    update("realEstateStatusConfirmed", true);
  };
  const updateAsset = (id: string, patch: Partial<AssetItemFormState>) => setAssets(form.assets.map((asset) => asset.id === id ? { ...asset, ...patch } : asset));
  const replaceCollateralDebts = (assetId: string, debts: DebtItemFormState[]) => {
    const previousIds = new Set(form.debts.filter((debt) => debt.collateralAssetId === assetId).map((debt) => debt.id));
    update("debts", [...form.debts.filter((debt) => !previousIds.has(debt.id)), ...debts]);
    const nextIds = new Set(debts.map((debt) => debt.id));
    update("assetOriginDebtIds", [...form.assetOriginDebtIds.filter((id) => !previousIds.has(id)), ...nextIds]);
  };
  const toggleAsset = (category: AssetItemFormState["category"]) => {
    const existing = form.assets.find((asset) => asset.category === category);
    if (existing) {
      setAssets(form.assets.filter((asset) => asset.id !== existing.id));
      return;
    }
    setAssets([...form.assets, { ...createEmptyAssetItem(crypto.randomUUID()), category }]);
  };
  const totalAssetValue = form.assets.reduce((sum, asset) => sum + asset.marketValue, 0);

  return <div>
    <FormSectionTitle>고객 자산 현황</FormSectionTitle>
    <div className="mt-4 md:mt-5 flex flex-wrap gap-2" role="list" aria-label="자산 종류 추가">
      {ASSET_CATEGORY_OPTIONS.map((option) => {
        const hasAsset = form.assets.some((asset) => asset.category === option.value);
        return <button key={option.value} type="button" onClick={() => toggleAsset(option.value)} aria-pressed={hasAsset} aria-label={`${option.label} 자산 ${hasAsset ? "제거" : "추가"}`} className={`inline-flex h-[34px] cursor-pointer items-center gap-2 rounded-full border px-4 text-[14px] font-medium transition-colors ${hasAsset ? "border-neutral-90 bg-neutral-90 text-neutral-0" : "border-neutral-30 bg-card text-foreground hover:border-neutral-50"}`}><AssetIcon category={option.value} />{option.label}</button>;
      })}
    </div>

    <div className="mt-5 flex flex-col gap-5">
      {form.assets.length === 0 && <button type="button" onClick={() => toggleAsset("house")} className="flex min-h-28 cursor-pointer flex-col items-center justify-center gap-2 rounded-[14px] border border-dashed border-neutral-30 text-[14px] font-medium text-neutral-50 hover:border-neutral-50 hover:text-neutral-60"><PlusIcon />위 자산 종류를 선택해 보유 자산을 추가해주세요.</button>}
      {form.assets.map((asset) => {
        const category = ASSET_CATEGORY_OPTIONS.find((option) => option.value === asset.category);
        const collateralDebts = form.debts.filter((debt) => debt.collateralAssetId === asset.id);
        const collateralValueWon = collateralDebts.reduce((sum, debt) => sum + debt.currentBalanceWon, 0);
        const canHaveCollateral = asset.category !== "financial_asset";
        const setCollateralEnabled = (enabled: boolean) => {
          if (enabled) {
            const debt = { ...createEmptyDebtItem(crypto.randomUUID()), collateralAssetId: asset.id };
            update("debts", [...form.debts, debt]);
            update("assetOriginDebtIds", [...form.assetOriginDebtIds, debt.id]);
            return;
          }
          update("debts", form.debts.map((debt) => debt.collateralAssetId === asset.id ? { ...debt, collateralAssetId: undefined } : debt));
          update("assetOriginDebtIds", form.assetOriginDebtIds.filter((id) => !collateralDebts.some((debt) => debt.id === id)));
        };
        return <section key={asset.id} className="overflow-hidden rounded-[14px] border border-neutral-30 bg-card">
          <div className="flex min-h-14 flex-wrap items-center gap-3 bg-neutral-10 px-5 py-2.5 md:px-6">
            <div className="flex min-w-[130px] flex-1 items-center gap-2"><AssetIcon category={asset.category} /><strong className="text-[16px] font-semibold text-foreground">{category?.label}</strong></div>
            <div className="w-[152px] shrink-0"><ManwonInput value={asset.marketValue} onChange={(marketValue) => updateAsset(asset.id, { marketValue })} /></div>
            <button type="button" onClick={() => setAssets(form.assets.filter((item) => item.id !== asset.id))} aria-label={`${category?.label} 삭제`} className="grid h-8 w-8 cursor-pointer place-items-center text-neutral-50 hover:text-neutral-70"><RemoveIcon /></button>
          </div>
          {canHaveCollateral && <>
            <div className="flex min-h-12 items-center justify-between gap-3 border-t border-neutral-30 px-5 md:px-6">
              <span className="text-[14px] font-semibold text-neutral-90">담보대출</span>
              <div className="flex shrink-0 items-center gap-4">
                {collateralDebts.length > 0 && <DebtModeToggle compact value={form.debtInputMode} onChange={(mode) => update("debtInputMode", mode)} disabled={false} />}
                <FormToggle checked={collateralDebts.length > 0} onChange={setCollateralEnabled} ariaLabel={`${category?.label} 담보대출 여부`} />
              </div>
            </div>
            {collateralDebts.length > 0 && <div className="border-t border-neutral-30 px-5 py-4 md:px-6">
              <DebtItemsTable
                debts={collateralDebts}
                assets={[asset]}
                mode={form.debtInputMode}
                onChange={(debts) => replaceCollateralDebts(asset.id, debts)}
                defaultCollateralAssetId={asset.id}
                showSummaryCards={false}
                assetCollateralOnly
              />
            </div>}
          </>}
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-neutral-30 bg-neutral-10 px-5 py-3 text-[14px] md:px-6"><span className="font-medium text-neutral-60">시가 {asset.marketValue.toLocaleString("ko-KR")} - 담보 {Math.round(collateralValueWon / 10_000).toLocaleString("ko-KR")}</span><strong className="text-[16px] text-foreground">순 자산 {(asset.marketValue - Math.round(collateralValueWon / 10_000)).toLocaleString("ko-KR")}만원</strong></div>
        </section>;
      })}
      <div className="flex items-end justify-between gap-4 rounded-xl bg-neutral-10 px-5 py-4 md:px-6"><span className="text-[14px] font-medium text-neutral-60">등록된 자산 {form.assets.length}건</span><div className="flex items-baseline gap-1"><strong className="text-[20px] font-bold tracking-[-0.03em] text-foreground">{totalAssetValue.toLocaleString("ko-KR")}</strong><span className="text-[13px] font-semibold text-neutral-60">만원</span></div></div>
      <div className="flex items-center justify-between gap-3 rounded-[14px] border border-neutral-30 px-5 py-4 md:px-6"><span className="text-[14px] font-semibold text-neutral-90">최근 2년 내 재산 처분 이력</span><FormToggle checked={form.hasRecentAssetDisposal} onChange={(checked) => update("hasRecentAssetDisposal", checked)} ariaLabel="최근 2년 내 재산 처분 이력 있음" /></div>
    </div>
  </div>;
}
