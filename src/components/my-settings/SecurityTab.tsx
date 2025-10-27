"use client";

import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";

interface ToggleProps {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
}

function Toggle({ enabled, onChange }: ToggleProps) {
  return (
    <button
      onClick={() => onChange(!enabled)}
      className={`w-10 h-6 rounded-full transition-colors flex items-center p-0.5 ${
        enabled ? "bg-[#00E272]" : "bg-[#D0D0D0]"
      }`}
    >
      <div
        className={`w-4 h-4 rounded-full bg-white transition-transform ${
          enabled ? "translate-x-4" : "translate-x-0"
        }`}
      />
    </button>
  );
}

export default function SecurityTab() {
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [showSetup, setShowSetup] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  
  // Mock QR code data
  const qrCodeValue = "otpauth://totp/YourApp:user@example.com?secret=JBSWY3DPEHPK3PXP&issuer=YourApp";
  const secretCode = "JBSWY3DPEHPK3PXP";

  const handleToggleTwoFactor = (enabled: boolean) => {
    setTwoFactorEnabled(enabled);
    if (enabled) {
      setShowSetup(true);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(secretCode);
  };

  const handleVerify = () => {
    console.log("Verify code:", verificationCode);
    // TODO: Implement verification logic
  };

  return (
    <div className="bg-white rounded-[14px] p-8">
      {/* Title */}
      <h1 className="text-[24px] font-bold text-[#252525] mb-4">
        보안 설정
      </h1>

      {/* Divider */}
      <div className="w-full h-[1px] bg-[#E2E2E2] mb-6"></div>

      {/* 2-Step Verification Section */}
      <div className="bg-white rounded-[5px] border border-[#E2E2E2] p-6 mb-6">
        <div className="text-[16px] font-semibold text-[#000000] mb-4">2단계 인증</div>
        
        {/* Divider */}
        <div className="w-full h-[1px] bg-[#E2E2E2] opacity-50 mb-4"></div>

        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="text-[16px] font-semibold text-[#000000] mb-1">
              2단계 인증 (2FA)
            </div>
            <div className="text-[14px] font-medium text-[#808080]">
              로그인 시 추가 보안 인증을 사용합니다.
            </div>
          </div>
          <Toggle
            enabled={twoFactorEnabled}
            onChange={handleToggleTwoFactor}
          />
        </div>

        {/* Setup Steps (shown when enabled) */}
        {twoFactorEnabled && showSetup && (
          <div className="mt-8 space-y-8">
            {/* Step 1: QR Code */}
            <div>
              <div className="text-[16px] font-semibold text-[#000000] mb-1">
                1단계: 인증 앱 설정
              </div>
              <div className="text-[14px] font-medium text-[#808080] mb-4">
                Google Authenticator, Authy 등의 인증 앱으로 아래 QR 코드를 스캔하세요.
              </div>
              
              {/* QR Code Container */}
              <div className="w-[200px] h-[200px] bg-[#F8F8F8] rounded-[12px] p-4 mb-4">
                <QRCodeSVG
                  value={qrCodeValue}
                  size={168}
                  level="H"
                  includeMargin={false}
                />
              </div>

              {/* Manual Input */}
              <div className="flex items-start gap-4 mb-4">
                <div>
                  <div className="text-[14px] font-medium text-[#808080] mb-2">
                    수동 입력 코드
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={secretCode}
                      readOnly
                      className="px-3 py-2 border border-[#E2E2E2] rounded-[5px] text-[14px] text-[#000000]"
                    />
                    <button
                      onClick={handleCopy}
                      className="px-3 py-2 bg-[#252525] text-[#D0D0D0] text-[14px] font-semibold rounded-[5px] hover:bg-[#404040] transition-colors"
                    >
                      복사
                    </button>
                  </div>
                  <div className="text-[14px] font-medium text-[#808080] mt-2">
                    QR 코드를 스캔할 수 없는 경우 위 코드를 수동으로 입력하세요.
                  </div>
                </div>
              </div>
            </div>

            {/* Step 2: Verification */}
            <div>
              <div className="text-[16px] font-semibold text-[#000000] mb-1">
                2단계: 인증 코드 입력
              </div>
              <div className="text-[14px] font-medium text-[#808080] mb-4">
                인증 앱에서 생성된 6자리 코드를 입력하세요.
              </div>
              
              <div className="flex gap-3">
                <input
                  type="text"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  placeholder="______"
                  maxLength={6}
                  className="w-[137px] px-3 py-2 border border-[#E2E2E2] rounded-[5px] text-[14px] text-center tracking-[0.2em] text-[#000000]"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowSetup(false)}
                    className="px-3 py-2 border border-[#E2E2E2] rounded-[5px] text-[14px] font-semibold text-[#000000] hover:bg-gray-50 transition-colors"
                  >
                    취소
                  </button>
                  <button
                    onClick={handleVerify}
                    className="px-3 py-2 bg-[#252525] text-[#D0D0D0] text-[14px] font-semibold rounded-[5px] hover:bg-[#404040] transition-colors"
                  >
                    인증
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Change Password Section */}
      <div className="bg-white rounded-[14px] border border-[#E2E2E2] p-6 mb-6">
        <div className="text-[16px] font-semibold text-[#000000] mb-4">비밀번호 변경</div>
        
        {/* Divider */}
        <div className="w-full h-[1px] bg-[#E2E2E2] mb-4"></div>

        <div className="flex items-center justify-between">
          <div className="text-[14px] font-medium text-[#808080]">
            비밀번호를 안전하게 관리하여 계정을 보호하세요.
          </div>
          <button className="px-4 py-2 bg-[#252525] text-[#D0D0D0] text-[14px] font-semibold rounded-[5px] hover:bg-[#404040] transition-colors">
            비밀번호 변경
          </button>
        </div>
      </div>

      {/* Delete Account Section */}
      <div className="bg-white rounded-[14px] border border-[#FFEBEB] p-6">
        <div className="flex items-center gap-2 mb-1">
          <div className="text-[16px] font-semibold text-[#D83232]">계정 삭제</div>
          <div className="px-3 py-0.5 bg-[#FFEBEB] text-[#D83232] text-[12px] font-medium rounded-[30px]">
            주의
          </div>
        </div>
        
        {/* Divider */}
        <div className="w-full h-[1px] bg-[#E2E2E2] mb-4"></div>

        <div className="flex items-center justify-between mb-4">
          <div className="text-[14px] font-medium text-[#D83232]">
            계정을 삭제하면 모든 데이터가 영구적으로 삭제되며 복수할 수 없습니다.
          </div>
          <button className="px-4 py-2 bg-[#D83232] text-white text-[14px] font-semibold rounded-[5px] hover:bg-[#C72E2E] transition-colors">
            계정 삭제
          </button>
        </div>
      </div>
    </div>
  );
}
