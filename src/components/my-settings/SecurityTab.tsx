"use client";

import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useMe } from "@/hooks/useMe";
import { performLogout } from "@/lib/logout";
import ChangePasswordModal from "./ChangePasswordModal";
import DeleteAccountModal from "./DeleteAccountModal";
import TwoFactorSetupModal from "./TwoFactorSetupModal";
import TwoFactorDisableModal from "./TwoFactorDisableModal";
import { showErrorModal } from "@/providers/ErrorFeedbackModalProvider";

export default function SecurityTab() {
  const queryClient = useQueryClient();
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
        showErrorModal({
          title: "알림",
          headline: "2단계 인증이 이미 활성화되어 있습니다.",
          confirmText: "확인",
          cancelText: null,
          hideCancel: true,
        });
        setTwoFactorEnabled(true);
      } else {
        showErrorModal({
          title: "오류 발생",
          headline: "2FA 설정에 실패했습니다.",
          confirmText: "확인",
          cancelText: null,
          hideCancel: true,
        });
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
      showErrorModal({
        title: "알림",
        headline: "2단계 인증이 성공적으로 활성화되었습니다!",
        confirmText: "확인",
        cancelText: null,
        hideCancel: true,
        onConfirm: () => {
          setShowSetupModal(false);
          setTwoFactorEnabled(true);
          refetch();
        },
      });
    } catch (e: any) {
      const errorCode = e?.response?.data?.code;
      if (errorCode === "INVALID_TWO_FACTOR_CODE") {
        showErrorModal({
          title: "오류 발생",
          headline: "잘못된 인증 코드입니다.",
          confirmText: "확인",
          cancelText: null,
          hideCancel: true,
        });
      } else {
        showErrorModal({
          title: "오류 발생",
          headline: "인증에 실패했습니다.",
          confirmText: "확인",
          cancelText: null,
          hideCancel: true,
        });
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
      showErrorModal({
        title: "알림",
        headline: "인증 코드가 이메일로 발송되었습니다.",
        confirmText: "확인",
        cancelText: null,
        hideCancel: true,
      });
    } catch (e: any) {
      showErrorModal({
        title: "오류 발생",
        headline: "인증 코드 발송에 실패했습니다.",
        confirmText: "확인",
        cancelText: null,
        hideCancel: true,
      });
      throw e;
    } finally {
      setLoading(false);
    }
  };

  // 2FA 해제 완료
  const handleDisable = async (emailCode: string, totpCode: string) => {
    try {
      setLoading(true);
      const { AuthService } = await import("@/services/auth");
      await AuthService.twoFactorDisable({ emailCode, totpCode });
      showErrorModal({
        title: "알림",
        headline: "2단계 인증이 해제되었습니다.",
        confirmText: "확인",
        cancelText: null,
        hideCancel: true,
        onConfirm: () => {
          setShowDisableModal(false);
          setTwoFactorEnabled(false);
          refetch();
        },
      });
    } catch (e: any) {
      const errorCode = e?.response?.data?.code;
      if (errorCode === "TWO_FACTOR_NOT_ENABLED") {
        showErrorModal({
          title: "알림",
          headline: "2단계 인증이 활성화되어 있지 않습니다.",
          confirmText: "확인",
          cancelText: null,
          hideCancel: true,
          onConfirm: () => {
            setTwoFactorEnabled(false);
            setShowDisableModal(false);
          },
        });
      } else if (errorCode === "INVALID_TWO_FACTOR_CODE") {
        showErrorModal({
          title: "오류 발생",
          headline: "잘못된 인증 코드입니다.",
          confirmText: "확인",
          cancelText: null,
          hideCancel: true,
        });
      } else {
        showErrorModal({
          title: "오류 발생",
          headline: "2FA 해제에 실패했습니다.",
          confirmText: "확인",
          cancelText: null,
          hideCancel: true,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (currentPassword: string, newPassword: string) => {
    try {
      const { AuthService } = await import("@/services/auth");
      await AuthService.changePassword({ currentPassword, newPassword });
      showErrorModal({
        title: "알림",
        headline: "비밀번호가 변경되었습니다.",
        confirmText: "확인",
        cancelText: null,
        hideCancel: true,
      });
    } catch (e: any) {
      const code = e?.data?.code ?? e?.response?.data?.code;
      if (code === "PASSWORD_MISMATCH") {
        showErrorModal({
          title: "알림",
          headline: "현재 비밀번호가 일치하지 않습니다.",
          confirmText: "확인",
          cancelText: null,
          hideCancel: true,
        });
        return;
      }
      if (code === "NEW_PASSWORD_CANNOT_BE_SAME") {
        showErrorModal({
          title: "알림",
          headline: "새 비밀번호는 현재 비밀번호와 같을 수 없습니다.",
          confirmText: "확인",
          cancelText: null,
          hideCancel: true,
        });
        return;
      }
      const isSocialUser = code === "SOCIAL_USER_CANNOT_USE_PASSWORD";
      showErrorModal({
        title: isSocialUser ? "알림" : "오류 발생",
        headline: isSocialUser ? "소셜 계정으로 가입된 이메일입니다." : "비밀번호 변경에 실패했습니다.",
        confirmText: "확인",
        cancelText: null,
        hideCancel: true,
      });
    }
  };

  const handleDeleteAccount = async () => {
    try {
      const { AuthService } = await import("@/services/auth");
      await AuthService.withdraw();
      performLogout({ queryClient });
    } catch (e: unknown) {
      console.error("Account withdraw failed:", e);
      const err = e as { data?: { code?: string } };
      const code = err?.data?.code;
      if (code === "CANNOT_WITHDRAW_WITH_SUBORDINATES") {
        showErrorModal({
          title: "알림",
          headline: "지금은 계정을 삭제할 수 없습니다.",
          description:
            "조직에서 관리 중인 하위 멤버나 팀이 있어 탈퇴가 제한될 수 있습니다. 정리 후 다시 시도하거나 관리자에게 문의해주세요.",
          confirmText: "확인",
          cancelText: null,
          hideCancel: true,
        });
      } else {
        showErrorModal({
          title: "오류 발생",
          headline: "계정 삭제에 실패했습니다. 잠시 후 다시 시도해주세요.",
          confirmText: "확인",
          cancelText: null,
          hideCancel: true,
        });
      }
      throw e;
    }
  };

  return (
    <div className="bg-card md:bg-transparent min-h-[calc(100vh-54px)] md:min-h-0">
      {/* First Box - 2-Step Verification */}
      <div className="bg-card rounded-none md:rounded-[14px] md:mb-6">
        {/* Title */}
        <h1 className="px-6 md:px-7 py-4 md:py-7 text-[20px] md:text-[24px] font-bold text-foreground">
          보안 설정
        </h1>

        <div className="w-full h-[1px] bg-[#e9e9e9] dark:bg-[#44444455]"></div>

        <div className="px-4 md:px-7 py-6 md:py-9 md:h-auto">
          <h2 className="hidden md:block text-[14px] md:text-[16px] font-semibold text-foreground mb-1">
            2단계 인증
          </h2>
          
          {/* Divider */}
          <div className="w-full h-[1px] bg-border my-3 hidden md:block"></div>

          <div className="flex items-center justify-between h-full md:h-auto py-0 md:py-3 pl-2 md:pl-6 pr-0 gap-3">
            <div className="flex-1 min-w-0">
              <div className="text-[16px] leading-[1] font-semibold text-foreground mb-1">
                2단계 인증 (2FA)
              </div>
              <div className="text-[14px] leading-[1] font-medium text-neutral-60">
                로그인 시 추가 보안 인증을 사용합니다.
              </div>
            </div>
            <div className="flex-shrink-0">
              {twoFactorEnabled ? (
                <button
                  onClick={() => setShowDisableModal(true)}
                  className="w-[70px] md:w-[72px] h-[34px] bg-neutral-90 text-white dark:text-neutral-0 text-[12px] md:text-[14px] font-semibold rounded-[5px] hover:bg-neutral-80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  disabled={loading}
                >
                  연결해제
                </button>
              ) : (
                <button
                  onClick={handleStartSetup}
                  className="w-[70px] md:w-[72px] h-[34px] bg-neutral-90 text-white dark:text-neutral-0 text-[12px] md:text-[14px] font-semibold rounded-[5px] hover:bg-neutral-80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  disabled={loading}
                >
                  {loading ? "로딩 중..." : "연결하기"}
                </button>
              )}
            </div>
          </div>
        </div>
        <div className="border-b border-[#e9e9e9] dark:!border-[#44444455] mx-4 md:mx-0"></div>
      </div>

      {/* Second Box - Change Password */}
      <div className="bg-card rounded-none md:rounded-[14px] md:mb-6">
        <div className="px-4 md:px-7 py-6 md:h-auto">
          <h2 className="hidden md:block text-[16px] font-semibold text-foreground mb-1">
            비밀번호 변경
          </h2>
          <p className="hidden md:block text-[12px] md:text-[14px] font-medium text-neutral-60 mb-3">
            비밀번호를 안전하게 관리하여 계정을 보호하세요.
          </p>

          {/* Divider */}
          <div className="w-full h-[1px] bg-border mb-3 hidden md:block"></div>

          <div className="flex items-center justify-between h-full md:h-auto pt-0 md:pt-2 pl-2 md:pl-6 gap-3">
            <div className="text-[14px] md:text-[16px] font-semibold text-foreground flex-1 min-w-0">
              비밀번호 변경
            </div>
            <button 
              onClick={() => setShowChangePwModal(true)} 
              className="cursor-pointer px-2 md:px-3 py-1 md:py-1.5 bg-neutral-90 text-white text-[12px] md:text-[14px] font-semibold dark:text-neutral-0 rounded-[5px] hover:opacity-90 transition-colors whitespace-nowrap flex-shrink-0 h-[34px]"
            >
              비밀번호 변경
            </button>
          </div>
        </div>
        <div className="border-b border-[#e9e9e9] dark:!border-[#44444455] mx-4 md:mx-0"></div>
      </div>

      {/* Third Box - Delete Account */}
      <div className="bg-card rounded-none md:rounded-[14px] md:shadow-sm pb-[140px] md:pb-0">
        {/* Mobile Layout */}
        <div className="block md:hidden px-4 py-6">
          <div className="flex items-center justify-between h-full gap-3">
            {/* Left side: Title + Badge and Description */}
            <div className="pl-2 md:pl-0 flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-[16px] font-semibold text-danger-40 tracking-[0.2px] leading-[19px]">계정 삭제</h2>
                <span className="inline-flex items-center justify-center px-3 py-1 bg-danger-10 dark:bg-danger-10/30 text-[12px] font-medium text-danger-40 dark:text-danger-40 rounded-[30px] h-[22px] opacity-80 flex-shrink-0">
                  주의
                </span>
              </div>
              <p className="text-[14px] text-danger-40 dark:text-danger-40 font-medium tracking-[0.2px] leading-[17px]">
                계정을 삭제하면 모든 데이터가 영구적으로 삭제되며 복구할 수 없습니다.
              </p>
            </div>
            {/* Right side: Button */}
            <div className="flex-shrink-0">
              <button 
                onClick={() => setShowDeleteAccountModal(true)}
                className="cursor-pointer px-3 py-1.5 bg-danger-40 dark:bg-danger-40 text-neutral-0 dark:text-neutral-100 text-[12px] font-semibold rounded-[5px] hover:opacity-90 transition-colors tracking-[-0.02em] h-[34px] whitespace-nowrap"
              >
                계정 삭제
              </button>
            </div>
          </div>
        </div>

        {/* Desktop Layout - Figma Design */}
        <div className="hidden md:block px-7 py-6">
          {/* Top Section: Title, Badge, and Warning Message */}
          <div className="mb-3">
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-[16px] font-semibold text-danger-40 dark:text-danger-40 tracking-[0.2px] leading-[19px]">
                계정 삭제
              </h2>
              <span className="inline-flex items-center justify-center px-3 py-1 bg-danger-10 dark:bg-danger-10/30 text-[12px] font-medium text-danger-40 dark:text-danger-40 rounded-[30px] h-[22px] opacity-80 flex-shrink-0">
                주의
              </span>
            </div>
            <p className="text-[14px] text-danger-40 dark:text-danger-40 font-medium tracking-[0.2px] leading-[17px]">
              계정을 삭제하면 모든 데이터가 영구적으로 삭제되며 복구할 수 없습니다.
            </p>
          </div>

          {/* Divider */}
          <div className="w-full h-[1px] border-t border-neutral-30 dark:border-neutral-30 mb-3"></div>

          {/* Bottom Action Section */}
          <div className="flex items-center justify-between px-6 py-3 bg-[rgba(255,235,235,0.5)] dark:bg-neutral-20 rounded-[5px] min-h-[48px]">
            <span className="text-[16px] font-semibold text-danger-40 dark:text-danger-40 leading-[19px]">
              계정 삭제
            </span>
            <button 
              onClick={() => setShowDeleteAccountModal(true)}
              className="cursor-pointer px-3 py-1.5 bg-danger-40 dark:bg-danger-40 text-neutral-0 dark:text-neutral-100 text-[14px] font-semibold rounded-[5px] hover:opacity-90 transition-colors tracking-[-0.02em] leading-[17px] h-[34px] whitespace-nowrap"
            >
              계정 삭제
            </button>
          </div>
        </div>

        <div className="block md:hidden border-b border-[#E2E2E2] dark:border-neutral-30 opacity-60 mx-4"></div>
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
    </div>
  );
}
