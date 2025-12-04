"use client";

import { useState, useEffect } from "react";
import { useMe } from "@/hooks/useMe";
import ChangePasswordModal from "./ChangePasswordModal";
import DeleteAccountModal from "./DeleteAccountModal";
import TwoFactorSetupModal from "./TwoFactorSetupModal";
import TwoFactorDisableModal from "./TwoFactorDisableModal";

export default function SecurityTab() {
  const { user, refetch } = useMe();
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [showDisableModal, setShowDisableModal] = useState(false);
  const [showChangePwModal, setShowChangePwModal] = useState(false);
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState("");
  const [secretCode, setSecretCode] = useState("");
  const [loading, setLoading] = useState(false);

  // 사용자의 2FA 상태 확인
  useEffect(() => {
    if (user) {
      setTwoFactorEnabled(user.twoFactorEnabled ?? false);
    }
  }, [user]);

  // 2FA 설정 시작 (연결하기 버튼 클릭)
  const handleStartSetup = async () => {
    try {
      setLoading(true);
      const { AuthService } = await import("@/services/auth");
      const response = await AuthService.twoFactorSetup();
      const data = (response.data as any)?.data;

      if (data) {
        setQrCodeDataUrl(data.qrCodeDataUrl);
        setSecretCode(data.secret);
        setShowSetupModal(true);
      }
    } catch (e: any) {
      const errorCode = e?.response?.data?.code;
      if (errorCode === "TWO_FACTOR_ALREADY_ENABLED") {
        alert("2단계 인증이 이미 활성화되어 있습니다.");
        setTwoFactorEnabled(true);
      } else {
        alert(e?.response?.data?.message || "2FA 설정에 실패했습니다.");
      }
    } finally {
      setLoading(false);
    }
  };

  // 2FA 인증 코드 확인 및 활성화
  const handleVerifySetup = async (totpCode: string) => {
    try {
      setLoading(true);
      const { AuthService } = await import("@/services/auth");
      await AuthService.twoFactorEnable({ totpCode });
      alert("2단계 인증이 성공적으로 활성화되었습니다!");
      setShowSetupModal(false);
      setTwoFactorEnabled(true);
      await refetch();
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

  // 2FA 해제 - 이메일 코드 발송
  const handleSendDisableCode = async () => {
    try {
      setLoading(true);
      const { AuthService } = await import("@/services/auth");
      await AuthService.twoFactorDisableSendCode();
      alert("인증 코드가 이메일로 발송되었습니다.");
    } catch (e: any) {
      alert(e?.response?.data?.message || "인증 코드 발송에 실패했습니다.");
      throw e;
    } finally {
      setLoading(false);
    }
  };

  // 2FA 해제 완료
  const handleDisable = async (emailCode: string) => {
    try {
      setLoading(true);
      const { AuthService } = await import("@/services/auth");
      await AuthService.twoFactorDisable({ emailCode, totpCode: "" });
      alert("2단계 인증이 해제되었습니다.");
      setShowDisableModal(false);
      setTwoFactorEnabled(false);
      await refetch();
    } catch (e: any) {
      const errorCode = e?.response?.data?.code;
      if (errorCode === "TWO_FACTOR_NOT_ENABLED") {
        alert("2단계 인증이 활성화되어 있지 않습니다.");
        setTwoFactorEnabled(false);
        setShowDisableModal(false);
      } else if (errorCode === "INVALID_TWO_FACTOR_CODE") {
        alert("잘못된 인증 코드입니다.");
      } else {
        alert(e?.response?.data?.message || "2FA 해제에 실패했습니다.");
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
            {twoFactorEnabled ? (
              <button
                onClick={() => setShowDisableModal(true)}
                className="w-[72px] h-[34px] bg-neutral-90 text-white text-[14px] font-semibold rounded-[5px] hover:bg-neutral-80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                disabled={loading}
              >
                연결해제
              </button>
            ) : (
              <button
                onClick={handleStartSetup}
                className="w-[72px] h-[34px] bg-neutral-90 text-white text-[14px] font-semibold rounded-[5px] hover:bg-neutral-80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                disabled={loading}
              >
                {loading ? "로딩 중..." : "연결하기"}
              </button>
            )}
          </div>
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
      <TwoFactorSetupModal
        isOpen={showSetupModal}
        onClose={() => setShowSetupModal(false)}
        qrCodeDataUrl={qrCodeDataUrl}
        secretCode={secretCode}
        onVerify={handleVerifySetup}
        loading={loading}
      />
      <TwoFactorDisableModal
        isOpen={showDisableModal}
        onClose={() => setShowDisableModal(false)}
        email={user?.email || ""}
        onSendCode={handleSendDisableCode}
        onDisable={handleDisable}
        loading={loading}
      />
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
