"use client";

import { useEffect, useMemo, useState } from "react";
import BaseModal from "@/components/common/BaseModal";
import Checkbox from "@/components/common/Checkbox";
import { DEBT_ITEM_TYPE_OPTIONS, type DebtItemFormState } from "@/types/debtRelief";
import { isDebtCollateralLoan } from "@/types/analysis";

type Props = { open: boolean; debts: DebtItemFormState[]; onClose: () => void; onConfirm: (selectedDebtIds: string[]) => void };
const debtTypeLabels = new Map(DEBT_ITEM_TYPE_OPTIONS.map((option) => [option.value, option.label]));

function CloseIcon() {
  return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden><path d="M6 18 18 6M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>;
}

function formatWon(value: number) {
  return `${Math.max(0, value).toLocaleString("ko-KR")}원`;
}

function formatManwonUnits(value: number) {
  const placeValues = [1000, 100, 10, 1] as const;
  const placeLabels = ["천", "백", "십", ""] as const;
  let remaining = value;

  return placeValues.map((placeValue, index) => {
    const digit = Math.floor(remaining / placeValue);
    remaining %= placeValue;
    return digit > 0 ? `${digit}${placeLabels[index]}` : "";
  }).join("");
}

function formatCompactKoreanWon(value: number) {
  const amountWon = Math.max(0, Math.floor(value));
  if (amountWon < 10_000) return formatWon(amountWon);

  const eok = Math.floor(amountWon / 100_000_000);
  const amountBelowEok = amountWon % 100_000_000;
  const manwon = Math.floor(amountBelowEok / 10_000);
  const won = amountBelowEok % 10_000;

  const eokText = eok > 0 ? `${eok.toLocaleString("ko-KR")}억` : "";
  const manwonText = manwon > 0 ? `${formatManwonUnits(manwon)}만` : "";
  const wonText = won > 0 ? won.toLocaleString("ko-KR") : "";
  return `${eokText}${manwonText}${wonText}원`;
}

export default function AnalysisDebtSelectionModal({ open, debts, onClose, onConfirm }: Props) {
  const [selectedDebtIds, setSelectedDebtIds] = useState<string[]>([]);
  useEffect(() => {
    if (open) {
      setSelectedDebtIds(
        debts.filter((debt) => !debt.isExcludedFromAnalysis).map((debt) => debt.id)
      );
    }
  }, [open, debts]);
  const selectedDebtIdSet = useMemo(() => new Set(selectedDebtIds), [selectedDebtIds]);
  const selectedTotalWon = useMemo(
    () =>
      debts
        .filter((debt) => selectedDebtIdSet.has(debt.id))
        .reduce((sum, debt) => sum + (debt.currentBalanceWon || 0), 0),
    [debts, selectedDebtIdSet]
  );
  if (!open) return null;

  const toggleDebt = (debtId: string, checked: boolean) => {
    setSelectedDebtIds((previous) => checked ? [...previous, debtId] : previous.filter((id) => id !== debtId));
  };

  return (
    <BaseModal
      onClose={onClose}
      overlayClassName="bg-black/50 dark:bg-[#000000CC]"
      containerClassName="w-[calc(100vw-2rem)] max-w-[360px] overflow-hidden rounded-[14px] bg-card shadow-[0_13px_61px_rgba(169,169,169,0.366)] drop-shadow-[0_8px_12px_rgba(9,30,66,0.1)] dark:shadow-none dark:drop-shadow-none lg:w-[776px] lg:max-w-[776px]"
      ariaLabel="채무 현황 선택"
      disableAutoContainerSizing
    >
      <div className="relative px-6 pb-4 pt-6 lg:flex lg:min-h-[74px] lg:items-center lg:px-7 lg:py-0 lg:pr-16">
        <h2 className="shrink-0 text-[16px] font-semibold leading-[19px] text-foreground lg:text-[18px] lg:leading-[21px]">채무 현황 선택</h2>
        <span className="mx-4 hidden h-4 w-px shrink-0 bg-neutral-60 lg:block" aria-hidden />
        <p className="mt-2 pr-8 text-[13px] font-medium leading-5 text-neutral-60 lg:mt-0 lg:min-w-0 lg:flex-1 lg:truncate lg:pr-0 lg:text-[16px]">체크를 해제하면 채무내역은 남아있지만 분석 대상에서 제외됩니다.</p>
        <button type="button" onClick={onClose} aria-label="닫기" className="absolute right-6 top-6 grid h-6 w-6 cursor-pointer place-items-center text-neutral-50 hover:text-neutral-70 lg:right-7 lg:top-1/2 lg:-translate-y-1/2"><CloseIcon /></button>
      </div>

      <div className="max-h-[calc(100vh-220px)] overflow-y-auto px-6 pb-7 lg:max-h-[376px] lg:px-7 lg:pb-[30px]">
        <div className="flex flex-col gap-4 lg:gap-5">
          {debts.map((debt) => {
            const typeLabel = debtTypeLabels.get(debt.debtType) ?? "채무";
            const creditorLabel = debt.creditorName.trim() || typeLabel;
            return (
              <label key={debt.id} className="flex h-16 cursor-pointer items-center rounded-[12px] bg-neutral-10 px-5 max-[366px]:h-auto max-[366px]:min-h-[84px] max-[366px]:py-3 lg:h-[71px] lg:px-6">
                <Checkbox checked={selectedDebtIdSet.has(debt.id)} onChange={(checked) => toggleDebt(debt.id, checked)} size={24} className="shrink-0" ariaLabel={`${creditorLabel} 선택`} />
                <span className="ml-3 grid min-w-0 flex-1 grid-cols-[minmax(0,1fr)_auto] items-center gap-x-2 lg:ml-[17px] lg:gap-x-4">
                  <span className="col-start-1 row-start-1 block min-w-0 truncate text-[14px] font-semibold leading-[17px] tracking-[0.2px] text-foreground lg:text-[16px] lg:leading-[19px]">{creditorLabel} ({typeLabel})</span>
                  <span className="col-start-1 row-start-2 mt-1 whitespace-nowrap text-[14px] font-medium leading-[17px] tracking-[0.2px] text-neutral-60">{isDebtCollateralLoan(debt) ? "담보부" : "무담보"}<span className="ml-4">{debt.overdueMonths === 0 ? "연체 없음" : `연체 ${debt.overdueMonths}개월`}</span></span>
                  <span className="col-start-2 row-span-2 row-start-1 min-w-0 truncate whitespace-nowrap text-right text-[14px] font-bold leading-[17px] tracking-[0.2px] text-foreground lg:text-[16px] lg:leading-[19px]">
                    <span className="lg:hidden">{formatCompactKoreanWon(debt.currentBalanceWon)}</span>
                    <span className="hidden lg:inline">{formatWon(debt.currentBalanceWon)}</span>
                  </span>
                </span>
              </label>
            );
          })}
        </div>
      </div>

      <div className="flex h-[60px] items-center justify-between border-t border-neutral-30 px-6 lg:h-[58px] lg:px-7">
        <span className="text-[13px] font-medium text-neutral-60">
          분석 대상 {selectedDebtIds.length}건 · {formatWon(selectedTotalWon)}
        </span>
        <div className="flex shrink-0 items-center gap-3">
          <button type="button" onClick={onClose} className="inline-flex h-[34px] min-w-[48px] shrink-0 cursor-pointer items-center justify-center whitespace-nowrap rounded-[5px] border border-neutral-30 px-3 text-[14px] font-semibold leading-[17px] tracking-[-0.02em] text-foreground hover:bg-neutral-10">닫기</button>
          <button type="button" disabled={selectedDebtIds.length === 0} onClick={() => onConfirm(selectedDebtIds)} className="inline-flex h-[34px] min-w-[48px] shrink-0 cursor-pointer items-center justify-center whitespace-nowrap rounded-[5px] bg-neutral-90 px-3 text-[14px] font-semibold leading-[17px] tracking-[-0.02em] text-neutral-20 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40">다음</button>
        </div>
      </div>
    </BaseModal>
  );
}
