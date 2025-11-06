/**
 * API 에러 객체에서 사용자에게 표시할 메시지를 추출합니다.
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  const data = (error as any)?.data;
  if (typeof data?.message === "string") return data.message;
  if (typeof data?.code === "string") return data.code;
  return "요청 처리 중 오류가 발생했습니다.";
}

/**
 * API 응답 에러를 사용자 친화적 메시지로 변환합니다.
 */
export function formatErrorMessage(error: unknown, fallbackMessage: string): string {
  if (!error) return fallbackMessage;
  if (error instanceof Error) return error.message;
  const errData = (error as any)?.data;
  if (typeof errData?.message === "string") return errData.message;
  if (typeof errData?.code === "string") return errData.code;
  return fallbackMessage;
}

