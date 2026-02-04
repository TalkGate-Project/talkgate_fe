/**
 * 에러 메시지를 사용자 친화적인 메시지로 변환하는 유틸리티
 * 
 * 보안상의 이유로 내부 에러 메시지나 스택 트레이스를 사용자에게 직접 노출하지 않습니다.
 */

/**
 * API 에러를 사용자 친화적인 메시지로 변환
 */
export function getUserFriendlyErrorMessage(error: unknown): string {
  // 이미 사용자 친화적인 메시지인 경우 그대로 반환
  if (typeof error === "string") {
    return error;
  }

  // Error 객체인 경우
  if (error instanceof Error) {
    const message = error.message;

    // 이미 사용자 친화적인 메시지로 보이는 경우
    if (
      message.includes("잠시 후") ||
      message.includes("다시 시도") ||
      message.includes("실패") ||
      message.includes("오류")
    ) {
      return message;
    }

    if (message.includes("Network") || message.includes("fetch")) {
      return "네트워크 연결을 확인해주세요.";
    }

    if (message.includes("401") || message.includes("Unauthorized")) {
      return "인증에 실패했습니다. 다시 로그인해주세요.";
    }

    if (message.includes("403") || message.includes("Forbidden")) {
      return "접근 권한이 없습니다.";
    }

    if (message.includes("404") || message.includes("Not Found")) {
      return "요청한 정보를 찾을 수 없습니다.";
    }

    if (message.includes("429") || message.includes("Too Many Requests")) {
      return "요청이 너무 많습니다. 잠시 후 다시 시도해주세요.";
    }

    if (message.includes("500") || message.includes("Internal Server Error")) {
      return "서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.";
    }

    if (message.includes("timeout") || message.includes("Timeout")) {
      return "요청 시간이 초과되었습니다. 잠시 후 다시 시도해주세요.";
    }

    // 알 수 없는 에러는 일반적인 메시지 반환
    return "오류가 발생했습니다. 잠시 후 다시 시도해주세요.";
  }

  // 에러 객체에 response가 있는 경우 (API 에러)
  if (
    error &&
    typeof error === "object" &&
    "response" in error &&
    error.response &&
    typeof error.response === "object" &&
    "data" in error.response
  ) {
    const responseData = (error.response as { data?: unknown }).data;

    // 백엔드에서 제공한 사용자 친화적인 메시지가 있는 경우
    if (
      responseData &&
      typeof responseData === "object" &&
      "message" in responseData &&
      typeof responseData.message === "string"
    ) {
      return responseData.message;
    }

    // 에러 코드 기반 메시지 변환
    if (
      responseData &&
      typeof responseData === "object" &&
      "code" in responseData
    ) {
      const code = String(responseData.code);

      if (code.includes("UNAUTHORIZED") || code.includes("AUTH")) {
        return "인증에 실패했습니다. 다시 로그인해주세요.";
      }

      if (code.includes("FORBIDDEN") || code.includes("PERMISSION")) {
        return "접근 권한이 없습니다.";
      }

      if (code.includes("NOT_FOUND")) {
        return "요청한 정보를 찾을 수 없습니다.";
      }

      if (code.includes("VALIDATION") || code.includes("INVALID")) {
        return "입력한 정보를 확인해주세요.";
      }

      if (code.includes("RATE_LIMIT") || code.includes("TOO_MANY")) {
        return "요청이 너무 많습니다. 잠시 후 다시 시도해주세요.";
      }
    }
  }

  // 기본 메시지
  return "오류가 발생했습니다. 잠시 후 다시 시도해주세요.";
}

/**
 * 인증 관련 에러 메시지 변환
 */
export function getAuthErrorMessage(error: unknown): string {
  const generalMessage = getUserFriendlyErrorMessage(error);

  // 인증 관련 특수 처리
  if (error instanceof Error) {
    const message = error.message.toLowerCase();

    if (message.includes("login failed") || message.includes("social login failed")) {
      return "로그인에 실패했습니다. 아이디와 비밀번호를 확인해주세요.";
    }

    if (message.includes("2fa") || message.includes("two factor")) {
      return "2단계 인증에 실패했습니다. 인증 코드를 확인해주세요.";
    }

    if (message.includes("token") && message.includes("expired")) {
      return "세션이 만료되었습니다. 다시 로그인해주세요.";
    }
  }

  return generalMessage;
}

/**
 * 본인인증 관련 에러 메시지 변환
 */
export function getVerificationErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();

    if (message.includes("popup") || message.includes("blocked")) {
      return "팝업이 차단되었습니다. 브라우저 설정에서 팝업 차단을 해제해주세요.";
    }

    if (message.includes("timeout") || message.includes("expired")) {
      return "인증 시간이 초과되었습니다. 다시 시도해주세요.";
    }

    if (message.includes("invalid") || message.includes("failed")) {
      return "본인인증에 실패했습니다. 다시 시도해주세요.";
    }
  }

  return getUserFriendlyErrorMessage(error);
}

