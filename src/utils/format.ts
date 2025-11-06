export function formatCurrencyKR(value: number): string {
  return value.toLocaleString("ko-KR");
}

export function formatRankChange(change: number | null | undefined): string {
  if (change === null || change === undefined) return "-";
  if (change === 0) return "유지";
  return `${change > 0 ? "+" : ""}${change}`;
}

export function parseFloatSafe(value: string | number | null | undefined): number {
  if (value === null || value === undefined) return 0;
  if (typeof value === "number") return value;
  const parsed = Number.parseFloat(value);
  return Number.isNaN(parsed) ? 0 : parsed;
}

export function formatPercentChange(value: string | number | null | undefined): string {
  const parsed = parseFloatSafe(value);
  if (parsed === 0) return "0%";
  const display = Math.round(parsed * 10) / 10;
  return `${display > 0 ? "+" : ""}${display}%`;
}

/**
 * 차트용 날짜 포맷: MM.DD
 */
export function formatChartDay(input: string): string {
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) return input;
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${month}.${day}`;
}

/**
 * 차트용 월 포맷: YY.MM
 */
export function formatChartMonth(input: string): string {
  const [year, month] = input.split("-");
  if (!year || !month) return input;
  return `${year.slice(-2)}.${month}`;
}

/**
 * 테이블용 날짜 포맷: YYYY.MM.DD
 */
export function formatTableDate(input: string): string {
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) return input;
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}.${month}.${day}`;
}

/**
 * 양수 정수로 파싱합니다. 유효하지 않은 값은 fallback으로 대체됩니다.
 */
export function parsePositiveInt(value: string | null | undefined, fallback: number): number {
  if (!value) return fallback;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return Math.floor(parsed);
}


