"use client";

import DatePicker from "@/components/common/DatePicker";
import TrashIcon from "@/components/common/icons/TrashIcon";
import { SelectField } from "@/components/customers/detail/SelectField";
import { useHorizontalDragScroll } from "@/hooks/useHorizontalDragScroll";
import { calculateDebtItemAmortization } from "@/services/debtRelief";
import {
  DEBT_ITEM_TYPE_OPTIONS,
  REPAYMENT_METHOD_OPTIONS,
  createEmptyDebtItem,
  type DebtItemFormState,
} from "@/types/debtRelief";
import { PercentInput, TextInput, WonInput } from "./FormControls";

type Props = {
  debts: DebtItemFormState[];
  onChange: (debts: DebtItemFormState[]) => void;
};

// "YYYY-MM-DD" ↔ 로컬 Date. new Date(isoString)은 UTC로 해석돼 시간대에 따라 하루 밀릴 수
// 있어 직접 분해해서 로컬 Date를 만들고, 되돌릴 때도 로컬 getter로만 조립한다.
function parseDateOnly(iso?: string): Date | null {
  if (!iso) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) return null;
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}

function formatDateOnly(date: Date | null): string {
  if (!date) return "";
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatWon(value: number): string {
  return `${value.toLocaleString("ko-KR")}원`;
}

const OVERDUE_MAX_DIGITS = 3;

function OverdueMonthsInput({
  value,
  onChange,
}: {
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <input
      inputMode="numeric"
      value={value ? String(value) : ""}
      onChange={(e) => {
        const digits = e.target.value.replace(/[^0-9]/g, "").slice(0, OVERDUE_MAX_DIGITS);
        onChange(digits ? parseInt(digits, 10) : 0);
      }}
      placeholder="0"
      className="w-full h-[34px] px-3 py-2 rounded-[5px] border border-neutral-30 bg-card text-[14px] font-medium tracking-[-0.02em] text-foreground text-right placeholder:text-neutral-50 focus:outline-none focus:border-neutral-50"
    />
  );
}

// 열 순서·너비 단일 소스. thead/tbody/tfoot이 각자 셀 너비를 반복 지정하면 스크롤 중
// 어긋날 수 있어 colgroup 하나로 세 영역 모두를 맞춘다.
const COLUMN_WIDTHS = [
  116, // 채무종류
  128, // 채권처
  128, // 상환방식
  92, // 연체(개월)
  156, // 대출일
  156, // 만기일
  168, // 금액(원)
  100, // 금리(%)
  92, // 기간
  132, // 월불입
  132, // 총이자
  132, // 총상환
  48, // 삭제
];
const TABLE_WIDTH = COLUMN_WIDTHS.reduce((sum, width) => sum + width, 0);

const HEADER_CELL = "h-11 px-2 text-[12px] font-semibold text-neutral-60 text-left whitespace-nowrap";
const BODY_CELL = "px-2 py-2 align-middle";
const READONLY_CELL =
  "px-2 py-2 align-middle text-right text-[13px] font-medium text-foreground whitespace-nowrap";

export default function DebtItemsTable({ debts, onChange }: Props) {
  const { containerRef, dragScrollHandlers } = useHorizontalDragScroll<HTMLDivElement>();

  const updateItem = (id: string, patch: Partial<DebtItemFormState>) => {
    onChange(
      debts.map((debt) => {
        if (debt.id !== id) return debt;
        const merged = { ...debt, ...patch };
        return { ...merged, ...calculateDebtItemAmortization(merged) };
      })
    );
  };

  const addRow = () => {
    onChange([...debts, createEmptyDebtItem(crypto.randomUUID())]);
  };

  const removeRow = (id: string) => {
    onChange(debts.filter((debt) => debt.id !== id));
  };

  const totals = debts.reduce(
    (acc, debt) => ({
      principalWon: acc.principalWon + debt.principalWon,
      monthlyPaymentWon: acc.monthlyPaymentWon + debt.monthlyPaymentWon,
      totalInterestWon: acc.totalInterestWon + debt.totalInterestWon,
      totalRepaymentWon: acc.totalRepaymentWon + debt.totalRepaymentWon,
    }),
    { principalWon: 0, monthlyPaymentWon: 0, totalInterestWon: 0, totalRepaymentWon: 0 }
  );

  return (
    <div className="rounded-[10px] border border-neutral-30 overflow-hidden">
      <div className="overflow-x-auto" ref={containerRef} {...dragScrollHandlers}>
        <table
          className="border-collapse table-fixed"
          style={{ width: TABLE_WIDTH, minWidth: TABLE_WIDTH }}
          aria-label="채무 상세 내역"
        >
          <colgroup>
            {COLUMN_WIDTHS.map((width, index) => (
              <col key={index} style={{ width }} />
            ))}
          </colgroup>
          <thead>
            <tr className="bg-neutral-10 border-b border-neutral-30">
              <th className={HEADER_CELL}>채무종류</th>
              <th className={HEADER_CELL}>채권처</th>
              <th className={HEADER_CELL}>상환방식</th>
              <th className={HEADER_CELL}>연체(개월)</th>
              <th className={HEADER_CELL}>대출일</th>
              <th className={HEADER_CELL}>만기일</th>
              <th className={`${HEADER_CELL} text-right`}>금액 (원)</th>
              <th className={`${HEADER_CELL} text-right`}>금리(%)</th>
              <th className={`${HEADER_CELL} text-right`}>기간</th>
              <th className={`${HEADER_CELL} text-right`}>월불입</th>
              <th className={`${HEADER_CELL} text-right`}>총이자</th>
              <th className={`${HEADER_CELL} text-right`}>총상환</th>
              <th className={HEADER_CELL} aria-label="삭제" />
            </tr>
          </thead>
          <tbody>
            {debts.map((debt) => (
              <tr key={debt.id} className="border-b border-neutral-30 last:border-b-0">
                <td className={BODY_CELL}>
                  <SelectField
                    className="h-[34px] text-[13px]"
                    value={debt.debtType}
                    onChange={(e) =>
                      updateItem(debt.id, { debtType: e.target.value as DebtItemFormState["debtType"] })
                    }
                  >
                    {DEBT_ITEM_TYPE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </SelectField>
                </td>
                <td className={BODY_CELL}>
                  <TextInput
                    value={debt.creditorName}
                    onChange={(value) => updateItem(debt.id, { creditorName: value })}
                    placeholder="채권처"
                  />
                </td>
                <td className={BODY_CELL}>
                  <SelectField
                    className="h-[34px] text-[13px]"
                    value={debt.repaymentMethod}
                    onChange={(e) =>
                      updateItem(debt.id, {
                        repaymentMethod: e.target.value as DebtItemFormState["repaymentMethod"],
                      })
                    }
                  >
                    {REPAYMENT_METHOD_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </SelectField>
                </td>
                <td className={BODY_CELL}>
                  <OverdueMonthsInput
                    value={debt.overdueMonths}
                    onChange={(value) => updateItem(debt.id, { overdueMonths: value })}
                  />
                </td>
                <td className={BODY_CELL}>
                  <DatePicker
                    value={parseDateOnly(debt.loanDate)}
                    onChange={(date) => updateItem(debt.id, { loanDate: formatDateOnly(date) })}
                    allowTextInput
                  />
                </td>
                <td className={BODY_CELL}>
                  <DatePicker
                    value={parseDateOnly(debt.maturityDate)}
                    onChange={(date) => updateItem(debt.id, { maturityDate: formatDateOnly(date) })}
                    allowTextInput
                  />
                </td>
                <td className={BODY_CELL}>
                  <WonInput
                    value={debt.principalWon}
                    onChange={(value) => updateItem(debt.id, { principalWon: value })}
                  />
                </td>
                <td className={BODY_CELL}>
                  <PercentInput
                    value={debt.interestRate}
                    onChange={(value) => updateItem(debt.id, { interestRate: value })}
                  />
                </td>
                <td className={READONLY_CELL}>{debt.termMonths ? `${debt.termMonths}개월` : "-"}</td>
                <td className={READONLY_CELL}>{formatWon(debt.monthlyPaymentWon)}</td>
                <td className={READONLY_CELL}>{formatWon(debt.totalInterestWon)}</td>
                <td className={READONLY_CELL}>{formatWon(debt.totalRepaymentWon)}</td>
                <td className={`${BODY_CELL} text-center`}>
                  <button
                    type="button"
                    onClick={() => removeRow(debt.id)}
                    aria-label="행 삭제"
                    className="cursor-pointer inline-flex items-center justify-center w-6 h-6 hover:opacity-70"
                  >
                    <TrashIcon />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-neutral-30">
              <td colSpan={13} className="px-2 py-2.5">
                <button
                  type="button"
                  onClick={addRow}
                  className="cursor-pointer inline-flex items-center gap-1.5 text-[13px] font-medium text-neutral-60 hover:text-foreground"
                >
                  <span aria-hidden>+</span>
                  행 추가
                </button>
              </td>
            </tr>
            <tr className="bg-neutral-10 border-t border-neutral-30">
              <td colSpan={6} className="px-2 h-11 align-middle text-[13px] font-semibold text-foreground">
                합계
              </td>
              <td className="px-2 h-11 align-middle text-right text-[14px] font-semibold text-foreground whitespace-nowrap">
                {formatWon(totals.principalWon)}
              </td>
              <td />
              <td />
              <td className="px-2 h-11 align-middle text-right text-[14px] font-semibold text-foreground whitespace-nowrap">
                {formatWon(totals.monthlyPaymentWon)}
              </td>
              <td className="px-2 h-11 align-middle text-right text-[14px] font-semibold text-foreground whitespace-nowrap">
                {formatWon(totals.totalInterestWon)}
              </td>
              <td className="px-2 h-11 align-middle text-right text-[14px] font-semibold text-foreground whitespace-nowrap">
                {formatWon(totals.totalRepaymentWon)}
              </td>
              <td />
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
