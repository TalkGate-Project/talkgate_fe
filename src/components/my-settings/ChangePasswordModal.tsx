"use client";

import { useState } from "react";
import EyeOnIcon from "@/components/common/icons/EyeOnIcon";
import EyeOffIcon from "@/components/common/icons/EyeOffIcon";

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (currentPassword: string, newPassword: string) => void;
}

export default function ChangePasswordModal({
  isOpen,
  onClose,
  onConfirm,
}: ChangePasswordModalProps) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [touched, setTouched] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  // Validation
  const hasMinLength = newPassword.length >= 8;
  const hasUpperCase = /[A-Z]/.test(newPassword);
  const hasLowerCase = /[a-z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(newPassword);
  const passwordsMatch = newPassword === confirmPassword && confirmPassword !== "";
  const isPasswordValid = hasMinLength && hasUpperCase && hasLowerCase && hasNumber && hasSpecialChar;

  const handleClose = () => {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setShowCurrentPassword(false);
    setShowNewPassword(false);
    setShowConfirmPassword(false);
    setTouched({ current: false, new: false, confirm: false });
    onClose();
  };

  const handleConfirm = () => {
    if (!currentPassword) {
      alert("현재 비밀번호를 입력하세요.");
      return;
    }
    if (!isPasswordValid) {
      alert("비밀번호 요구사항을 충족하지 않습니다.");
      return;
    }
    if (!passwordsMatch) {
      alert("새 비밀번호가 일치하지 않습니다.");
      return;
    }
    onConfirm(currentPassword, newPassword);
    handleClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/30" onClick={handleClose} />

      {/* Modal */}
      <div className="relative w-[440px] bg-white rounded-[14px] shadow-[0px_13px_61px_rgba(169,169,169,0.37)]">
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-6 right-6 w-6 h-6 flex items-center justify-center"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M6 18L18 6M6 6L18 18"
              stroke="#B0B0B0"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        {/* Content */}
        <div className="p-8">
          {/* Header */}
          <div className="text-[18px] font-semibold text-foreground mb-6">
            비밀번호 변경
          </div>

          {/* Input Fields */}
          <div className="space-y-4 mb-6">
            {/* 현재 비밀번호 */}
            <div>
              <label className="block text-[14px] font-medium text-foreground mb-2">
                현재 비밀번호
              </label>
              <div className="relative">
                <input
                  type={showCurrentPassword ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  onBlur={() => setTouched({ ...touched, current: true })}
                  className="w-full px-3 py-2 pr-12 bg-white border border-[#E2E2E2] rounded-[5px] text-[14px] text-foreground focus:outline-none focus:border-foreground"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  aria-label={showCurrentPassword ? "비밀번호 숨기기" : "비밀번호 보기"}
                >
                  {showCurrentPassword ? <EyeOnIcon /> : <EyeOffIcon />}
                </button>
              </div>
              {touched.current && !currentPassword && (
                <p className="mt-1 text-[12px] text-danger-40">현재 비밀번호를 입력하세요.</p>
              )}
            </div>

            {/* 새 비밀번호 */}
            <div>
              <label className="block text-[14px] font-medium text-foreground mb-2">
                새 비밀번호
              </label>
              <div className="relative">
                <input
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  onBlur={() => setTouched({ ...touched, new: true })}
                  className="w-full px-3 py-2 pr-12 bg-white border border-[#E2E2E2] rounded-[5px] text-[14px] text-foreground focus:outline-none focus:border-foreground"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  aria-label={showNewPassword ? "비밀번호 숨기기" : "비밀번호 보기"}
                >
                  {showNewPassword ? <EyeOnIcon /> : <EyeOffIcon />}
                </button>
              </div>
              {touched.new && newPassword && !isPasswordValid && (
                <div className="mt-1 text-[12px] text-danger-40 space-y-0.5">
                  {!hasMinLength && <p>• 최소 8자 이상</p>}
                  {!hasUpperCase && <p>• 대문자 포함</p>}
                  {!hasLowerCase && <p>• 소문자 포함</p>}
                  {!hasNumber && <p>• 숫자 포함</p>}
                  {!hasSpecialChar && <p>• 특수문자 포함</p>}
                </div>
              )}
              {touched.new && newPassword && isPasswordValid && (
                <p className="mt-1 text-[12px] text-primary-60">✓ 안전한 비밀번호입니다.</p>
              )}
            </div>

            {/* 새 비밀번호 확인 */}
            <div>
              <label className="block text-[14px] font-medium text-foreground mb-2">
                새 비밀번호 확인
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  onBlur={() => setTouched({ ...touched, confirm: true })}
                  className="w-full px-3 py-2 pr-12 bg-white border border-[#E2E2E2] rounded-[5px] text-[14px] text-foreground focus:outline-none focus:border-foreground"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  aria-label={showConfirmPassword ? "비밀번호 숨기기" : "비밀번호 보기"}
                >
                  {showConfirmPassword ? <EyeOnIcon /> : <EyeOffIcon />}
                </button>
              </div>
              {touched.confirm && confirmPassword && !passwordsMatch && (
                <p className="mt-1 text-[12px] text-danger-40">비밀번호가 일치하지 않습니다.</p>
              )}
              {touched.confirm && passwordsMatch && (
                <p className="mt-1 text-[12px] text-primary-60">✓ 비밀번호가 일치합니다.</p>
              )}
            </div>
          </div>

          {/* Password Requirements */}
          <div className="bg-[#F8F8F8] rounded-[5px] p-4 mb-6">
            <div className="text-[12px] text-neutral-60 space-y-1">
              <div>• 비밀번호는 최소 8자 이상이어야 합니다.</div>
              <div>• 대문자, 소문자, 숫자, 특수문자를 모두 포함하여 입력해 주세요.</div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3">
            <button
              onClick={handleClose}
              className="px-4 py-2 bg-white border border-[#E2E2E2] rounded-[5px] text-[14px] font-semibold text-foreground hover:bg-gray-50"
            >
              취소
            </button>
            <button
              onClick={handleConfirm}
              className="px-4 py-2 bg-neutral-90 text-white rounded-[5px] text-[14px] font-semibold hover:opacity-90"
            >
              비밀번호 변경
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

