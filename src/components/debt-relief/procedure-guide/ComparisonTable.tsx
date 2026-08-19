"use client";

import type { RecommendedProcedure } from "@/types/debtRelief";
import { PROCEDURE_GUIDE_COMPARISON_ROWS, type ProcedureGuideDetail } from "@/services/procedureGuide";

interface ComparisonTableProps {
  details: ProcedureGuideDetail[];
  onSelectProcedure: (key: RecommendedProcedure) => void;
}

export default function ComparisonTable({ details, onSelectProcedure }: ComparisonTableProps) {
  const highlightedRows = new Set([0, 2, 5]);

  return (
    <div className="scrollbar-hide overflow-x-auto rounded-[12px] border border-neutral-30">
      <table className="w-full min-w-[1266px] table-fixed border-collapse text-left" aria-label="채무조정 제도 비교">
        <colgroup>
          <col className="w-[121px]" />
          {details.map((item) => (
            <col key={item.key} />
          ))}
        </colgroup>
        <thead>
          <tr className="h-12 border-b border-neutral-30 bg-neutral-10">
            <th className="sticky left-0 z-[2] bg-neutral-10 px-7 text-[14px] font-medium leading-[17px] tracking-[-0.02em] text-neutral-60">
              항목
            </th>
            {details.map((item) => (
              <th key={item.key} className="px-3 text-center">
                <button
                  type="button"
                  onClick={() => onSelectProcedure(item.key)}
                  className="cursor-pointer rounded-[4px] px-1 text-[14px] font-semibold leading-[17px] tracking-[-0.02em] text-foreground hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-40"
                >
                  {item.tabLabel}
                </button>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {PROCEDURE_GUIDE_COMPARISON_ROWS.map((row, rowIndex) => (
            <tr
              key={row.label}
              className={`border-b border-neutral-30 last:border-b-0 ${
                rowIndex === PROCEDURE_GUIDE_COMPARISON_ROWS.length - 1 ? "h-[84px]" : "h-[55px]"
              } ${highlightedRows.has(rowIndex) ? "bg-secondary-10/30 dark:bg-secondary-10/10" : "bg-card"}`}
            >
              <th
                scope="row"
                className="sticky left-0 z-[1] bg-neutral-10 px-7 py-3 align-middle text-[14px] font-medium leading-[17px] tracking-[-0.02em] text-neutral-80 whitespace-nowrap"
              >
                {row.label}
              </th>
              {details.map((item) => {
                const value = row.getValue(item);
                return (
                  <td
                    key={item.key}
                    className="px-5 py-2 align-middle text-center text-[13px] font-medium leading-4 tracking-[-0.02em] text-neutral-80"
                  >
                    {row.isIncomeRow ? (
                      <span
                        className={
                          value === "필요"
                            ? "inline-flex h-[22px] items-center justify-center rounded-full bg-secondary-10 px-3 text-[12px] font-medium leading-[14px] text-secondary-40"
                            : "inline-flex h-[22px] items-center justify-center rounded-full bg-neutral-30 px-3 text-[12px] font-medium leading-[14px] text-neutral-70"
                        }
                      >
                        {value}
                      </span>
                    ) : (
                      value
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
