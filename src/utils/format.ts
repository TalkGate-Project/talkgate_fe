export function formatCurrencyKR(value: number): string {
  if (value >= 100000000) {
    // 1억 이상
    const eok = Math.floor(value / 100000000);
    const man = Math.floor((value % 100000000) / 10000);
    if (man > 0) {
      return `${eok}억 ${man.toLocaleString("ko-KR")}만`;
    }
    return `${eok}억`;
  } else if (value >= 10000) {
    // 1만 이상
    const man = Math.floor(value / 10000);
    return `${man.toLocaleString("ko-KR")}만`;
  } else if (value > 0) {
    // 1만 미만
    return value.toLocaleString("ko-KR");
  }
  return "0";
}

/**
 * 모바일용 한글 단위 변환 (만, 억, 조 지원)
 * 예: 18,000,000 -> "1,800만", 1,000,000,000 -> "10억", 1,000,000,000,000 -> "1조"
 */
export function formatCurrencyKRMobile(value: number): string {
  if (value >= 1000000000000) {
    // 1조 이상
    const jo = Math.floor(value / 1000000000000);
    const eok = Math.floor((value % 1000000000000) / 100000000);
    if (eok > 0) {
      return `${jo}조 ${eok}억`;
    }
    return `${jo}조`;
  } else if (value >= 100000000) {
    // 1억 이상
    const eok = Math.floor(value / 100000000);
    const man = Math.floor((value % 100000000) / 10000);
    if (man > 0) {
      return `${eok}억 ${man.toLocaleString("ko-KR")}만`;
    }
    return `${eok}억`;
  } else if (value >= 10000) {
    // 1만 이상
    const man = Math.floor(value / 10000);
    return `${man.toLocaleString("ko-KR")}만`;
  } else if (value > 0) {
    // 1만 미만
    return value.toLocaleString("ko-KR");
  }
  return "0";
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
 * 금액 차이를 만원 단위로 포맷합니다.
 */
export function formatAmountChangeKR(current: number, previous: number | null | undefined): string {
  if (previous === null || previous === undefined) return "-";
  
  const diff = current - previous;
  if (diff === 0) return "유지";
  
  const absDiff = Math.abs(diff);
  const sign = diff > 0 ? "+" : "-";
  
  if (absDiff >= 10000) {
    // 1만 이상
    const man = Math.floor(absDiff / 10000);
    return `${sign}${man.toLocaleString("ko-KR")}만`;
  } else {
    // 1만 미만
    return `${sign}${absDiff.toLocaleString("ko-KR")}`;
  }
}

/**
 * 금액 차이를 만원 단위로 포맷하고 "원" 단위를 붙입니다.
 * 만원 이하는 "9,000원" 형식, 만원 이상은 "1만원", "30만원", "3000만원" 형식
 */
export function formatAmountChangeKRWithUnit(diff: number): string {
  if (diff === 0) return "0";
  
  const absDiff = Math.abs(diff);
  const sign = diff > 0 ? "+" : "-";
  
  if (absDiff >= 10000) {
    // 1만 이상: 쉼표 없이 "1만원", "30만원", "3000만원" 형식
    const man = Math.floor(absDiff / 10000);
    return `${sign}${man}만원`;
  } else {
    // 1만 미만: 쉼표 포함 "9,000원" 형식
    return `${sign}${absDiff.toLocaleString("ko-KR")}원`;
  }
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
 * 테이블용 날짜 포맷: MM.DD
 */
export function formatTableDateKR(input: string): string {
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) return input;
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${month}월 ${day}일`;
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

/**
 * 금액을 한국어 형식으로 포맷하고 "원" 단위를 붙입니다.
 * billing 등에서 사용하는 간단한 금액 표시 형식입니다.
 * @param amount - 금액 (숫자)
 * @returns 포맷된 금액 문자열 (예: "165,000원")
 */
export function formatAmountKR(amount: number): string {
  return new Intl.NumberFormat("ko-KR").format(amount) + "원";
}

/**
 * 전화번호를 하이픈이 포함된 형식으로 포맷합니다.
 * 숫자만 입력받아 자동으로 하이픈을 추가합니다.
 * @param value - 전화번호 (숫자만 포함된 문자열 또는 하이픈이 포함된 문자열)
 * @returns 포맷된 전화번호 문자열 (예: "010-1234-5678")
 */
export function formatPhoneNumber(value: string): string {
  if (!value) return "";
  // 숫자만 추출
  const numbers = value.replace(/\D/g, "");
  if (numbers.length <= 3) return numbers;
  if (numbers.length <= 7) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
  return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
}

/**
 * 전화번호 입력 핸들러에서 사용하는 함수입니다.
 * 숫자만 입력받아 하이픈이 포함된 형식으로 변환합니다.
 * @param value - 입력된 값
 * @returns 포맷된 전화번호 문자열 (최대 11자리)
 */
export function formatPhoneInput(value: string): string {
  // 숫자만 추출하고 최대 11자리로 제한
  const numbers = value.replace(/\D/g, "").slice(0, 11);
  return formatPhoneNumber(numbers);
}


