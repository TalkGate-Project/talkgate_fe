"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useMe } from "@/hooks/useMe";
import ChangePasswordModal from "./ChangePasswordModal";
import DeleteAccountModal from "./DeleteAccountModal";

interface ToggleProps {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
}

function Toggle({ enabled, onChange }: ToggleProps) {
  return (
    <button
      onClick={() => onChange(!enabled)}
      className={`cursor-pointer w-10 h-6 rounded-full transition-colors flex items-center p-0.5 ${
        enabled ? "bg-primary-60" : "bg-neutral-30"
      }`}
    >
      <div
        className={`w-4 h-4 rounded-full bg-neutral-0 transition-transform ${
          enabled ? "translate-x-4" : "translate-x-0"
        }`}
      />
    </button>
  );
}

export default function SecurityTab() {
  const { user, refetch } = useMe();
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [showSetup, setShowSetup] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [showChangePwModal, setShowChangePwModal] = useState(false);
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState("");
  const [secretCode, setSecretCode] = useState("");
  const [loading, setLoading] = useState(false);

  // 사용자의 2FA 상태 확인 (user 데이터에서 가져올 수 있다면)
  useEffect(() => {
    if (user) {
      const userAny = user as any;
      // 백엔드에서 user 객체에 twoFactorEnabled 필드가 있다고 가정
      if (userAny.twoFactorEnabled || userAny.isTwoFactorEnabled) {
        setTwoFactorEnabled(true);
      }
    }
  }, [user]);

  const handleToggleTwoFactor = async (enabled: boolean) => {
    if (enabled) {
      // 2FA 활성화 시도 - QR 코드 생성
      try {
        setLoading(true);
        const { AuthService } = await import("@/services/auth");
        const response = await AuthService.twoFactorSetup();
        const data = (response.data as any)?.data;
        
        if (data) {
          setQrCodeDataUrl(data.qrCodeDataUrl);
          setSecretCode(data.secret);
          setTwoFactorEnabled(true);
          setShowSetup(true);
        }
      } catch (e: any) {
        const errorCode = e?.response?.data?.code;
        if (errorCode === "TWO_FACTOR_ALREADY_ENABLED") {
          alert("2단계 인증이 이미 활성화되어 있습니다.");
          setTwoFactorEnabled(true);
        } else {
          alert(e?.response?.data?.message || "2FA 설정에 실패했습니다.");
          setTwoFactorEnabled(false);
        }
      } finally {
        setLoading(false);
      }
    } else {
      // 2FA 비활성화는 별도 프로세스 필요 (이메일 인증 코드 + TOTP)
      const confirmed = confirm(
        "2단계 인증을 비활성화하시겠습니까?\n이메일 인증 코드와 TOTP 코드가 필요합니다."
      );
      if (!confirmed) {
        setTwoFactorEnabled(true);
        return;
      }

      try {
        setLoading(true);
        const { AuthService } = await import("@/services/auth");
        
        // 1. 이메일 인증 코드 발송
        await AuthService.twoFactorDisableSendCode();
        const emailCode = prompt("이메일로 전송된 인증 코드를 입력하세요:");
        if (!emailCode) {
          setTwoFactorEnabled(true);
          setLoading(false);
          return;
        }

        // 2. TOTP 코드 입력
        const totpCode = prompt("인증 앱의 6자리 코드를 입력하세요:");
        if (!totpCode) {
          setTwoFactorEnabled(true);
          setLoading(false);
          return;
        }

        // 3. 2FA 비활성화
        await AuthService.twoFactorDisable({ emailCode, totpCode });
        alert("2단계 인증이 비활성화되었습니다.");
        setTwoFactorEnabled(false);
        setShowSetup(false);
        await refetch();
      } catch (e: any) {
        const errorCode = e?.response?.data?.code;
        if (errorCode === "TWO_FACTOR_NOT_ENABLED") {
          alert("2단계 인증이 활성화되어 있지 않습니다.");
          setTwoFactorEnabled(false);
        } else if (errorCode === "INVALID_TWO_FACTOR_CODE") {
          alert("잘못된 인증 코드입니다.");
          setTwoFactorEnabled(true);
        } else {
          alert(e?.response?.data?.message || "2FA 비활성화에 실패했습니다.");
          setTwoFactorEnabled(true);
        }
      } finally {
        setLoading(false);
      }
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(secretCode);
    alert("시크릿 코드가 복사되었습니다.");
  };

  const handleVerify = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      alert("6자리 인증 코드를 입력하세요.");
      return;
    }

    try {
      setLoading(true);
      const { AuthService } = await import("@/services/auth");
      await AuthService.twoFactorEnable({ totpCode: verificationCode });
      alert("2단계 인증이 성공적으로 활성화되었습니다!");
      setShowSetup(false);
      setVerificationCode("");
      await refetch(); // 사용자 정보 업데이트
    } catch (e: any) {
      const errorCode = e?.response?.data?.code;
      if (errorCode === "INVALID_TWO_FACTOR_CODE") {
        alert("잘못된 인증 코드입니다. 다시 시도해주세요.");
      } else {
        alert(e?.response?.data?.message || "인증에 실패했습니다.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (currentPassword: string, newPassword: string) => {
    try {
      const { AuthService } = await import("@/services/auth");
      await AuthService.changePassword({ currentPassword, newPassword });
      alert("비밀번호가 변경되었습니다.");
    } catch (e: any) {
      alert(e?.data?.message || e?.message || "변경에 실패했습니다");
    }
  };

  const handleDeleteAccount = async () => {
    try {
      // TODO: Implement account deletion logic
      console.log("계정 삭제 실행");
      alert("계정이 삭제되었습니다.");
    } catch (e: any) {
      alert(e?.data?.message || e?.message || "삭제에 실패했습니다");
    }
  };

  return (
    <>
      {/* First Box - 2-Step Verification */}
      <div className="bg-card rounded-[14px] mb-6">
        {/* Title */}
        <h1 className="px-7 py-7 text-[24px] font-bold text-foreground">
          보안 설정
        </h1>

        <div className="border-b border-[#E2E2E266]"></div>

        <div className="px-7 py-[30px]">
          <h2 className="text-[16px] font-semibold text-foreground mb-1">
            2단계 인증
          </h2>
          
          {/* Divider */}
          <div className="w-full h-[1px] bg-border my-3"></div>

          <div className="flex items-center justify-between py-3 pl-6 pr-4">
            <div className="flex-1">
              <div className="text-[16px] font-semibold text-foreground mb-1">
                2단계 인증 (2FA)
              </div>
              <div className="text-[14px] font-medium text-neutral-60">
                로그인 시 추가 보안 인증을 사용합니다.
              </div>
            </div>
            <Toggle
              enabled={twoFactorEnabled}
              onChange={handleToggleTwoFactor}
            />
          </div>

          {/* Divider */}
          {twoFactorEnabled && <div className="w-full border-b border-[#E2E2E266] my-4"></div>}

          {/* Setup Steps (shown when enabled) */}
          {twoFactorEnabled && showSetup && (
            <div className="space-y-8">
            {/* Step 1: QR Code */}
            <div>
              <div className="text-[16px] font-semibold text-foreground mb-1">
                1단계: 인증 앱 설정
              </div>
              <div className="text-[14px] font-medium text-neutral-60 mb-4">
                Google Authenticator, Authy 등의 인증 앱으로 아래 QR 코드를 스캔하세요.
              </div>

              {/* QR Code Container */}
              <div className="w-full bg-neutral-10 rounded-[12px] p-4 mb-4 flex items-center justify-start">
                <div className="w-[200px] h-[200px] flex items-center justify-center relative">
                  {qrCodeDataUrl ? (
                    <Image 
                      src={qrCodeDataUrl} 
                      alt="QR Code" 
                      fill
                      className="object-contain"
                      unoptimized
                    />
                  ) : (
                    <div className="text-neutral-60">QR 코드를 불러오는 중...</div>
                  )}
                </div>

                {/* Manual Input */}
                <div className="flex items-start gap-4 mb-4">
                  <div>
                    <div className="text-[14px] font-medium text-neutral-60 mb-2">
                      수동 입력 코드
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={secretCode}
                        readOnly
                        className="px-3 py-2 border border-border rounded-[5px] text-[14px] text-foreground bg-card"
                      />
                      <button
                        onClick={handleCopy}
                        className="px-3 py-2 bg-neutral-90 text-neutral-0 text-[14px] font-semibold rounded-[5px] hover:opacity-90 transition-colors"
                      >
                        복사
                      </button>
                    </div>
                    <div className="text-[14px] font-medium text-neutral-60 mt-2">
                      QR 코드를 스캔할 수 없는 경우 위 코드를 수동으로 입력하세요.
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 2: Verification */}
            <div>
              <div className="text-[16px] font-semibold text-foreground mb-1">
                2단계: 인증 코드 입력
              </div>
              <div className="text-[14px] font-medium text-neutral-60 mb-4">
                인증 앱에서 생성된 6자리 코드를 입력하세요.
              </div>

              <div className="flex gap-3">
                <input
                  type="text"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  placeholder="______"
                  maxLength={6}
                  className="w-[137px] px-3 py-2 border border-border rounded-[5px] text-[14px] text-center tracking-[0.2em] text-foreground bg-card"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setShowSetup(false);
                      setTwoFactorEnabled(false);
                      setVerificationCode("");
                    }}
                    className="px-3 py-2 border border-border rounded-[5px] text-[14px] font-semibold text-foreground hover:bg-neutral-10 transition-colors"
                    disabled={loading}
                  >
                    취소
                  </button>
                  <button
                    onClick={handleVerify}
                    className="px-3 py-2 bg-neutral-90 text-neutral-0 text-[14px] font-semibold rounded-[5px] hover:opacity-90 transition-colors disabled:opacity-50"
                    disabled={loading || verificationCode.length !== 6}
                  >
                    {loading ? "인증 중..." : "인증"}
                  </button>
                </div>
              </div>
            </div>
          </div>
          )}
        </div>
      </div>

      {/* Second Box - Change Password */}
      <div className="bg-white rounded-[14px] border border-border mb-6">
        <div className="px-7 py-6">
          <h2 className="text-[16px] font-semibold text-foreground mb-1">
            비밀번호 변경
          </h2>
          <p className="text-[14px] font-medium text-neutral-60 mb-3">
            비밀번호를 안전하게 관리하여 계정을 보호하세요.
          </p>

          {/* Divider */}
          <div className="w-full h-[1px] bg-border mb-3"></div>

          <div className="flex items-center justify-between pt-2 px-6">
            <div className="text-[16px] font-semibold text-foreground">
              비밀번호 변경
            </div>
            <button 
              onClick={() => setShowChangePwModal(true)} 
              className="px-3 py-1.5 bg-neutral-90 text-[#EDEDED] text-[14px] font-semibold rounded-[5px] hover:opacity-90 transition-colors whitespace-nowrap"
            >
              비밀번호 변경
            </button>
          </div>
        </div>
      </div>

      {/* Third Box - Delete Account */}
      <div className="bg-white rounded-[14px] border border-danger-10">
        <div className="px-7 py-6">
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-[16px] font-semibold text-danger-40">계정 삭제</h2>
            <div className="px-3 py-1 bg-danger-10 text-danger-40 text-[12px] font-medium rounded-[30px]">
              주의
            </div>
          </div>
          <p className="text-[14px] font-medium text-danger-40 mb-3">
            계정을 삭제하면 모든 데이터가 영구적으로 삭제되며 복구할 수 없습니다.
          </p>

          {/* Divider */}
          <div className="w-full h-[1px] bg-border mb-3"></div>

          <div className="flex items-center justify-between py-2 bg-[#FFEBEB80] px-6">
            <div className="text-[16px] font-semibold text-danger-40">
              계정 삭제
            </div>
            <button 
              onClick={() => setShowDeleteAccountModal(true)}
              className="px-3 py-1.5 bg-danger-40 text-white text-[14px] font-semibold rounded-[5px] hover:opacity-90 transition-colors whitespace-nowrap"
            >
              계정 삭제
            </button>
          </div>
        </div>
      </div>

      {/* Modals */}
      <ChangePasswordModal
        isOpen={showChangePwModal}
        onClose={() => setShowChangePwModal(false)}
        onConfirm={handleChangePassword}
      />
      <DeleteAccountModal
        isOpen={showDeleteAccountModal}
        onClose={() => setShowDeleteAccountModal(false)}
        onConfirm={handleDeleteAccount}
      />
    </>
  );
}