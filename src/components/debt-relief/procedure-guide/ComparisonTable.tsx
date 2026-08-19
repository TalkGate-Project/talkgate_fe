"use client";

import type { RecommendedProcedure } from "@/types/debtRelief";
import { PROCEDURE_GUIDE_COMPARISON_ROWS, PROCEDURE_GUIDE_DETAILS } from "./procedureGuideData";

interface ComparisonTableProps {
  onSelectProcedure: (key: RecommendedProcedure) => void;
}

export default function ComparisonTable({ onSelectProcedure }: ComparisonTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[860px] border-collapse text-left">
        <thead>
          <tr className="border-b border-neutral-30">
            <th className="w-[120px] py-3 pr-4 text-[13px] font-medium leading-4 text-neutral-50">
              항목
            </th>
            {PROCEDURE_GUIDE_DETAILS.map((item) => (
              <th key={item.key} className="py-3 px-4 text-center">
                <button
                  type="button"
                  onClick={() => onSelectProcedure(item.key)}
                  className="cursor-pointer text-[14px] font-semibold leading-[17px] text-foreground hover:underline"
                >
                  {item.tabLabel}
                </button>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {PROCEDURE_GUIDE_COMPARISON_ROWS.map((row) => (
            <tr key={row.label} className="border-b border-neutral-30 last:border-b-0">
              <th
                scope="row"
                className="py-4 pr-4 align-top text-[14px] font-semibold leading-5 text-foreground whitespace-nowrap"
              >
                {row.label}
              </th>
              {PROCEDURE_GUIDE_DETAILS.map((item) => {
                const value = row.getValue(item);
                return (
                  <td
                    key={item.key}
                    className="py-4 px-4 align-top text-center text-[13px] font-medium leading-5 text-neutral-80"
                  >
                    {row.isIncomeRow ? (
                      <span
                        className={
                          value === "필요"
                            ? "inline-flex items-center justify-center rounded-full bg-primary-10 px-2.5 py-1 text-[13px] font-semibold leading-4 text-primary-100"
                            : "text-[13px] font-semibold leading-5 text-neutral-70"
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
