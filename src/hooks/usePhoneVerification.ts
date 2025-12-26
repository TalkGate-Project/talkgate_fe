"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { VerificationService } from "@/services/verification";
import type { VerificationFormData } from "@/types/verification";
import { getVerificationErrorMessage } from "@/utils/errorMessages";

type VerificationType = "account" | "sms-sender";

type VerificationResult = {
  success: boolean;
  code?: string;
  message?: string;
};

type UsePhoneVerificationOptions = {
  type: VerificationType;
  /** 회원가입 직후 아직 쿠키에 저장되지 않은 경우 직접 전달 */
  accessToken?: string;
  onSuccess?: (result: VerificationResult) => void;
  onError?: (result: VerificationResult) => void;
};

/**
 * 본인인증 Form HTML 생성 함수
 */
function createVerificationFormHtml(
  certViewUrl: string,
  formData: VerificationFormData
): string {
  let formFields = "";
  for (const [key, value] of Object.entries(formData)) {
    formFields += `    <input type="hidden" name="${key}" value="${value}"/>\n`;
  }

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>본인인증</title>
</head>
<body>
  <form id="cert_form" method="post" action="${certViewUrl}" target="_self">
${formFields}
  </form>
  <script type="text/javascript">
    document.getElementById('cert_form').submit();
  <\/script>
</body>
</html>
`;
}

/**
 * 휴대폰 본인인증 Hook
 *
 * @example
 * ```tsx
 * const { startVerification, isVerifying } = usePhoneVerification({
 *   type: "account",
 *   onSuccess: (result) => console.log("인증 성공", result),
 *   onError: (result) => console.log("인증 실패", result),
 * });
 * ```
 */
export function usePhoneVerification({
  type,
  accessToken,
  onSuccess,
  onError,
}: UsePhoneVerificationOptions) {
  const [isVerifying, setIsVerifying] = useState(false);
  const authWindowRef = useRef<Window | null>(null);

  // postMessage 리스너
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      console.log("[usePhoneVerification] Received message:", event.data);

      if (event.data?.type === "PHONE_VERIFICATION_RESULT") {
        const result = event.data.data as VerificationResult;
        setIsVerifying(false);

        if (result.success) {
          onSuccess?.(result);
        } else {
          onError?.(result);
        }
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [onSuccess, onError]);

  /**
   * 본인인증 시작
   */
  const startVerification = useCallback(async () => {
    if (isVerifying) return;

    // 사용자 인터랙션 직후 창을 먼저 열어야 팝업 차단 우회 가능
    // PC: 팝업 창으로 열기 (크기 지정)
    const width = 410;
    const height = 500;
    const leftpos = window.screen.width / 2 - width / 2;
    const toppos = window.screen.height / 2 - height / 2;
    const winopts = `width=${width},height=${height},toolbar=no,status=no,statusbar=no,menubar=no,scrollbars=no,resizable=no,left=${leftpos},top=${toppos}`;

    const authWindow = window.open("about:blank", "auth_popup", winopts);

    if (!authWindow) {
      onError?.({
        success: false,
        code: "POPUP_BLOCKED",
        message: "팝업이 차단되었습니다. 팝업 차단을 해제해주세요.",
      });
      return;
    }

    authWindowRef.current = authWindow;
    setIsVerifying(true);

    try {
      // 본인인증 시작 API 호출
      let response;
      if (type === "account") {
        // 회원가입 직후에는 아직 토큰이 쿠키에 없으므로 accessToken을 직접 전달
        response =
          await VerificationService.startPhoneVerificationForAccount(
            accessToken
          );
      } else if (type === "sms-sender") {
        // x-project-id 헤더는 apiClient가 쿠키에서 자동으로 추가
        response =
          await VerificationService.startPhoneVerificationForSmsSenderNumber();
      } else {
        throw new Error("Invalid verification type");
      }

      const { certViewUrl, formData } = response.data.data;

      // 미리 열어둔 창에 form HTML 작성 후 자동 submit
      const formHtml = createVerificationFormHtml(certViewUrl, formData);
      authWindow.document.open();
      authWindow.document.write(formHtml);
      authWindow.document.close();

      // 팝업 창이 닫혔는지 주기적으로 체크
      const checkClosed = setInterval(() => {
        if (authWindow.closed) {
          clearInterval(checkClosed);
          // 팝업이 닫혔지만 결과 메시지를 받지 못한 경우
          // 사용자가 직접 닫은 것으로 간주
          setIsVerifying(false);
        }
      }, 500);
    } catch (error) {
      console.error("[usePhoneVerification] Error:", error);
      authWindow.close();
      setIsVerifying(false);

      // 사용자 친화적인 에러 메시지로 변환
      const userFriendlyMessage = getVerificationErrorMessage(error);

      onError?.({
        success: false,
        code: "API_ERROR",
        message: userFriendlyMessage,
      });
    }
  }, [isVerifying, type, accessToken, onError]);

  /**
   * 본인인증 취소 (팝업 닫기)
   */
  const cancelVerification = useCallback(() => {
    if (authWindowRef.current && !authWindowRef.current.closed) {
      authWindowRef.current.close();
    }
    setIsVerifying(false);
  }, []);

  return {
    startVerification,
    cancelVerification,
    isVerifying,
  };
}

export type { VerificationResult, VerificationType };

