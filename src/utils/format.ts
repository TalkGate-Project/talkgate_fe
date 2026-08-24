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

/** 서울 지역번호 (2자리). 9자리: 02-XXX-XXXX, 10자리: 02-XXXX-XXXX */
const SEOUL_PREFIX = "02";
/** 지역번호 (3자리, 10자리). 0XX-XXX-XXXX */
const REGIONAL_PREFIXES = [
  "031", "032", "033", "041", "042", "043", "044",
  "051", "052", "053", "054", "055", "061", "062", "063", "064",
];
/** 휴대/인터넷전화 (3자리, 11자리). 010-XXXX-YYYY, 070-XXXX-YYYY */
const MOBILE_PREFIXES = ["010", "070"];
/** 구 이동통신 등 (3자리, 10자리). 0XX-XXX-XXXX */
const LEGACY_10_PREFIXES = ["011", "016", "017", "018", "019"];

/**
 * 고객 목록 필터·검색용: 연락처 문자열에서 숫자(0–9)만 남깁니다.
 * 자리수 상한 없음(부분 검색·URL 공유 유지).
 */
export function sanitizeContactFilterInput(value: string): string {
  return value.replace(/\D/g, "");
}

/**
 * 전화번호를 하이픈이 포함된 형식으로 포맷합니다.
 * 대한민국 번호 체계(02, 지역번호, 010/070)에 맞춰 접두사·자리수별로 하이픈을 넣습니다.
 * 인식 불가 번호는 하이픈 없이 숫자만 반환합니다.
 * @param value - 전화번호 (숫자만 포함된 문자열 또는 하이픈이 포함된 문자열)
 * @returns 포맷된 전화번호 문자열 (예: "02-1234-5678", "010-1234-5678")
 */
export function formatPhoneNumber(value: string): string {
  if (!value) return "";
  const numbers = value.replace(/\D/g, "");
  const len = numbers.length;
  if (len <= 2) return numbers;

  // 서울: 02 — 9자리(2-3-4), 10자리(2-4-4)
  if (numbers.startsWith(SEOUL_PREFIX)) {
    if (len <= 5) return `${numbers.slice(0, 2)}-${numbers.slice(2)}`;
    if (len <= 9) return `${numbers.slice(0, 2)}-${numbers.slice(2, 5)}-${numbers.slice(5, 9)}`;
    return `${numbers.slice(0, 2)}-${numbers.slice(2, 6)}-${numbers.slice(6, 10)}`;
  }

  // 휴대/인터넷: 010, 070 — 11자리(3-4-4)
  const mobilePrefix = MOBILE_PREFIXES.find((p) => numbers.startsWith(p));
  if (mobilePrefix && len >= 3) {
    if (len <= 7) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
  }

  // 지역번호·구 이동통신: 031~064, 011/016/017/018/019 — 10자리(3-3-4)
  const regionalPrefix =
    REGIONAL_PREFIXES.find((p) => numbers.startsWith(p)) ??
    LEGACY_10_PREFIXES.find((p) => numbers.startsWith(p));
  if (regionalPrefix && len >= 3) {
    if (len <= 6) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 6)}-${numbers.slice(6, 10)}`;
  }

  // 인식 불가: 하이픈 없이 숫자만
  return numbers;
}

/**
 * 전화번호 입력 핸들러에서 사용하는 함수입니다.
 * 숫자만 입력받아 대한민국 번호 체계에 맞게 하이픈을 넣습니다.
 * @param value - 입력된 값
 * @returns 포맷된 전화번호 문자열 (최대 11자리)
 */
export function formatPhoneInput(value: string): string {
  const numbers = value.replace(/\D/g, "").slice(0, 11);
  return formatPhoneNumber(numbers);
}

/**
 * 연락처 문자열에서 전화번호를 추출하여 하이픈 포맷으로 반환합니다.
 * 통신사명 등 접두 텍스트가 포함되어 있어도 끝부분의 전화번호만 추출합니다.
 * 유효한 한국 전화번호(9~11자리, 0으로 시작)를 인식할 수 없으면 원본을 그대로 반환합니다.
 * @param value - 연락처 문자열 (예: "LG 알뜰폰 01012345678", "010-1234-5678", "01012345678")
 * @returns 포맷된 전화번호 또는 원본 문자열
 */
export function formatContactForDisplay(value: string): string {
  if (!value) return "";
  const trimmed = value.trim();
  const phoneMatch = trimmed.match(/(0[\d-]{8,14})$/);
  if (!phoneMatch) return value;
  const digits = phoneMatch[1].replace(/\D/g, "");
  if (digits.length < 9 || digits.length > 11) return value;
  return formatPhoneNumber(digits);
}

/**
 * 포맷된 전화번호 문자열에서, "커서 앞에 있는 숫자 개수"에 해당하는 커서 위치를 구합니다.
 * 입력 필드에서 백스페이스 등 후 포맷을 다시 적용했을 때 커서를 올바른 자리에 두기 위해 사용합니다.
 * @param formatted - 하이픈이 포함된 전화번호 문자열
 * @param digitsBeforeCursor - 커서 앞에 있어야 할 숫자(0-9)의 개수
 * @returns 커서를 둘 위치 (0 ~ formatted.length)
 */
export function getPhoneFormatCursorPosition(
  formatted: string,
  digitsBeforeCursor: number
): number {
  if (digitsBeforeCursor <= 0) return 0;

  let digits = 0;
  for (let i = 0; i < formatted.length; i++) {
    if (/\d/.test(formatted[i])) {
      digits++;
      if (digits === digitsBeforeCursor) return i + 1;
    }
  }
  return formatted.length;
}

/**
 * 쿠폰 코드를 유저 노출용으로 포맷합니다.
 * 영문은 대문자로, 숫자/기타 문자는 그대로 유지합니다. (예: basic1 → BASIC1)
 * @param code - 쿠폰 코드 문자열
 * @returns 노출용 쿠폰 코드
 */
export function formatCouponCodeForDisplay(code: string): string {
  if (code == null || typeof code !== "string") return "";
  return code.toUpperCase();
}


