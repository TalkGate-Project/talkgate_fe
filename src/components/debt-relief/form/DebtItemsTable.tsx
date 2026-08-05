"use client";

import DatePicker from "@/components/common/DatePicker";
import CalendarInlineIcon from "@/components/common/icons/CalendarInlineIcon";
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

// Figma 상세 테이블: 셀 안 입력요소는 기본 테두리 없이 배경에 묻어가고, 행 사이 구분선
// (tr의 border-b)만 남는다. 포커스 시에만 테두리를 보여줘 편집 중임을 알린다.
// 아래 공유 컨트롤(SelectField/TextInput/DatePicker/WonInput/PercentInput)의 기본 테두리는
// 다른 화면(표 밖 폼)에서는 그대로 필요하므로, 테이블 셀에서만 이 클래스로 덮어쓴다.
const CELL_INPUT_BORDERLESS = "!border-transparent focus:!border-neutral-30";

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
      className={`w-full h-[34px] px-3 py-2 rounded-[5px] border border-transparent focus:border-neutral-30 bg-card text-[14px] font-medium tracking-[-0.02em] text-foreground text-right placeholder:text-neutral-50 focus:outline-none`}
    />
  );
}

// 열 순서·너비 단일 소스. thead/tbody/tfoot이 각자 셀 너비를 반복 지정하면 스크롤 중
// 어긋날 수 있어 colgroup 하나로 세 영역 모두를 맞춘다.
const COLUMN_WIDTHS = [
  116, // 채무종류
  88, // 담보
  128, // 채권처
  128, // 상환방식
  104, // 연체(개월) — Figma 헤더 폰트(16px)로 "연체(개월)" 텍스트가 92px에서 겹쳐 여유를 둠
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

// 헤더는 텍스트만이라 th 패딩이 그대로 시작 위치가 되지만, 바디 셀은 그 안의 input/select가
// 자체 좌우 패딩(px-2~px-3)을 또 갖고 있어서 td 패딩과 겹쳐 헤더 라벨이 실제 값보다 왼쪽으로
// 치우쳐 보인다. td 패딩을 줄이고 th 패딩을 늘려 그 격차를 좁힌다(완전한 픽셀 일치보단
// "표답게 보이는" 수준으로 절충).
const HEADER_CELL = "h-10 px-3 text-[16px] font-medium text-neutral-60 text-left whitespace-nowrap";
const BODY_CELL = "px-1 py-2 align-middle";
const READONLY_CELL =
  "px-3 py-2 align-middle text-right text-[14px] font-medium text-neutral-90/80 whitespace-nowrap";

function PlusIcon({ className = "" }: { className?: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className={className} aria-hidden>
      <path
        d="M8 3.33333V12.6667M3.33333 8H12.6667"
        stroke="#B0B0B0"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function RemoveRowIcon({ className = "" }: { className?: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className={className} aria-hidden>
      <path
        d="M5 5L15 15M5 15L15 5"
        stroke="#B0B0B0"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

type DebtSums = {
  principalWon: number;
  monthlyPaymentWon: number;
  totalInterestWon: number;
  totalRepaymentWon: number;
};

function sumDebtItems(items: DebtItemFormState[]): DebtSums {
  return items.reduce(
    (acc, debt) => ({
      principalWon: acc.principalWon + debt.principalWon,
      monthlyPaymentWon: acc.monthlyPaymentWon + debt.monthlyPaymentWon,
      totalInterestWon: acc.totalInterestWon + debt.totalInterestWon,
      totalRepaymentWon: acc.totalRepaymentWon + debt.totalRepaymentWon,
    }),
    { principalWon: 0, monthlyPaymentWon: 0, totalInterestWon: 0, totalRepaymentWon: 0 }
  );
}

function DebtSumCard({
  label,
  sums,
  highlight = false,
}: {
  label: string;
  sums: DebtSums;
  highlight?: boolean;
}) {
  return (
    <div className={`rounded-xl px-4 py-3.5 flex flex-col gap-2 ${highlight ? "bg-neutral-90" : "bg-neutral-10"}`}>
      <div className="flex items-baseline justify-between gap-2">
        <span className={`text-[14px] font-medium tracking-[0.2px] ${highlight ? "text-neutral-50" : "text-neutral-60"}`}>
          {label}
        </span>
        <span
          className={`text-[16px] font-bold tracking-[-0.04em] whitespace-nowrap ${
            highlight ? "text-neutral-20" : "text-foreground"
          }`}
        >
          {formatWon(sums.principalWon)}
        </span>
      </div>
      <div className="flex items-center justify-between gap-2">
        <span className="text-[14px] font-medium tracking-[0.2px] text-neutral-50">월불입</span>
        <span className={`text-[14px] font-medium tracking-[0.2px] text-right whitespace-nowrap ${highlight ? "text-neutral-50" : "text-neutral-60"}`}>
          {formatWon(sums.monthlyPaymentWon)}
        </span>
      </div>
      <div className="flex items-center justify-between gap-2">
        <span className="text-[14px] font-medium tracking-[0.2px] text-neutral-50">총이자</span>
        <span className={`text-[14px] font-medium tracking-[0.2px] text-right whitespace-nowrap ${highlight ? "text-neutral-50" : "text-neutral-60"}`}>
          {formatWon(sums.totalInterestWon)}
        </span>
      </div>
    </div>
  );
}

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

  const totals = sumDebtItems(debts);
  const collateralTotals = sumDebtItems(debts.filter((debt) => debt.isCollateralLoan));
  const unsecuredTotals = sumDebtItems(debts.filter((debt) => !debt.isCollateralLoan));

  return (
    <div className="rounded-t-[10px] border-t border-neutral-30 overflow-hidden">
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
            <tr className="bg-neutral-20 border-b border-neutral-30">
              <th className={HEADER_CELL}>채무종류</th>
              <th className={HEADER_CELL}>담보</th>
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
              <tr key={debt.id} className="border-b-[0.4px] border-neutral-30 last:border-b-0">
                <td className={BODY_CELL}>
                  <SelectField
                    className={`h-[34px] text-[13px] ${CELL_INPUT_BORDERLESS}`}
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
                  <SelectField
                    className={`h-[34px] text-[13px] ${CELL_INPUT_BORDERLESS}`}
                    value={debt.isCollateralLoan ? "true" : "false"}
                    onChange={(e) =>
                      updateItem(debt.id, { isCollateralLoan: e.target.value === "true" })
                    }
                  >
                    <option value="false">무담보</option>
                    <option value="true">담보</option>
                  </SelectField>
                </td>
                <td className={BODY_CELL}>
                  <TextInput
                    value={debt.creditorName}
                    onChange={(value) => updateItem(debt.id, { creditorName: value })}
                    placeholder="채권처"
                    className={CELL_INPUT_BORDERLESS}
                  />
                </td>
                <td className={BODY_CELL}>
                  <SelectField
                    className={`h-[34px] text-[13px] ${CELL_INPUT_BORDERLESS}`}
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
                  <div className="relative">
                    <DatePicker
                      value={parseDateOnly(debt.loanDate)}
                      onChange={(date) => updateItem(debt.id, { loanDate: formatDateOnly(date) })}
                      allowTextInput
                      className={`pr-8 ${CELL_INPUT_BORDERLESS}`}
                    />
                    <CalendarInlineIcon className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" />
                  </div>
                </td>
                <td className={BODY_CELL}>
                  <div className="relative">
                    <DatePicker
                      value={parseDateOnly(debt.maturityDate)}
                      onChange={(date) => updateItem(debt.id, { maturityDate: formatDateOnly(date) })}
                      allowTextInput
                      className={`pr-8 ${CELL_INPUT_BORDERLESS}`}
                    />
                    <CalendarInlineIcon className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" />
                  </div>
                </td>
                <td className={BODY_CELL}>
                  <WonInput
                    value={debt.principalWon}
                    onChange={(value) => updateItem(debt.id, { principalWon: value })}
                    className={CELL_INPUT_BORDERLESS}
                  />
                </td>
                <td className={BODY_CELL}>
                  <PercentInput
                    value={debt.interestRate}
                    onChange={(value) => updateItem(debt.id, { interestRate: value })}
                    className={CELL_INPUT_BORDERLESS}
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
                    <RemoveRowIcon />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-neutral-30">
              <td colSpan={14} className="p-2">
                <button
                  type="button"
                  onClick={addRow}
                  className="cursor-pointer w-full h-10 rounded-lg bg-neutral-10 inline-flex items-center gap-1.5 px-3 text-[14px] font-medium text-neutral-50 hover:text-neutral-60"
                >
                  <PlusIcon />
                  행 추가
                </button>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 border-t border-neutral-30">
        <DebtSumCard label="담보대출 합산" sums={collateralTotals} />
        <DebtSumCard label="무담보대출 합산" sums={unsecuredTotals} />
        <DebtSumCard label="총 합산" sums={totals} highlight />
      </div>
    </div>
  );
}
