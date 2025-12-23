"use client";

import { useState } from "react";

interface InviteMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInvite: (email: string, role: "subAdmin" | "member") => void;
}

// 이메일 형식 validation 함수
const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export default function InviteMemberModal({
  isOpen,
  onClose,
  onInvite,
}: InviteMemberModalProps) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"subAdmin" | "member">("member");
  const [emailTouched, setEmailTouched] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);

  // 이메일 validation 체크
  const validateEmail = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) {
      setEmailError("이메일을 입력해주세요.");
      return false;
    }
    if (!isValidEmail(trimmed)) {
      setEmailError("올바른 이메일 형식이 아닙니다.");
      return false;
    }
    setEmailError(null);
    return true;
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmail(value);
    // 이미 touched 상태이고 값이 있으면 실시간 validation
    if (emailTouched && value.trim()) {
      validateEmail(value);
    } else if (emailTouched && !value.trim()) {
      setEmailError("이메일을 입력해주세요.");
    } else {
      setEmailError(null);
    }
  };

  const handleEmailBlur = () => {
    setEmailTouched(true);
    validateEmail(email);
  };

  const handleInvite = () => {
    const trimmedEmail = email.trim();
    if (trimmedEmail && isValidEmail(trimmedEmail)) {
      onInvite(trimmedEmail, role);
      handleClose();
    }
  };

  const handleClose = () => {
    setEmail("");
    setRole("member");
    setEmailTouched(false);
    setEmailError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/30 dark:bg-[#000000CC]" onClick={handleClose} />

      {/* Modal */}
      <div className="relative w-[440px] bg-card dark:bg-neutral-10 rounded-[14px]">
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="cursor-pointer absolute top-5 right-6 w-6 h-6 flex items-center justify-center"
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
              stroke="currentColor"
              className="text-neutral-60 dark:text-neutral-60"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        {/* Content */}
        <div className="px-7 py-6">
          {/* Header */}
          <div className="text-[18px] font-semibold text-foreground dark:text-neutral-80 mb-[30px] leading-[1]">
            멤버 초대
          </div>

          {/* Email Input */}
          <div className="mb-5">
            <label className="block text-[14px] font-medium text-neutral-60 dark:text-neutral-60 mb-2">
              이메일 주소
            </label>
            <input
              type="email"
              value={email}
              onChange={handleEmailChange}
              onBlur={handleEmailBlur}
              placeholder="초대할 멤버의 이메일을 입력하세요"
              className={`w-full px-3 py-2 border rounded-[5px] text-[14px] bg-card dark:bg-neutral-10 text-ink dark:text-neutral-80 placeholder:text-neutral-40 dark:placeholder:text-neutral-50 focus:outline-none transition-colors ${
                emailError
                  ? "border-red-500 dark:border-red-500 focus:border-red-500 dark:focus:border-red-500"
                  : "border-neutral-30 dark:border-neutral-30 focus:border-foreground dark:focus:border-neutral-80"
              }`}
            />
            {emailError && (
              <p className="mt-2 text-[13px] text-red-500 dark:text-red-400">
                {emailError}
              </p>
            )}
          </div>

          {/* Role Selection */}
          <div className="mb-[6px]">
            <label className="block text-[14px] font-medium text-neutral-60 dark:text-neutral-60 mb-2">
              역할
            </label>
            <div className="relative">
              <select
                value={role}
                onChange={(e) =>
                  setRole(e.target.value as "subAdmin" | "member")
                }
                className="w-full px-3 py-2 border border-neutral-30 dark:border-neutral-30 rounded-[5px] text-[14px] bg-card dark:bg-neutral-10 text-ink dark:text-neutral-80 focus:outline-none focus:border-foreground dark:focus:border-neutral-80 appearance-none"
              >
                <option value="member">멤버</option>
                <option value="subAdmin">부관리자</option>
              </select>
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                <svg
                  className="w-4 h-4 text-neutral-50 dark:text-neutral-50"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* divider */}
        <div className="w-full h-[1px] bg-neutral-30 dark:bg-neutral-30 opacity-70"></div>

        {/* footer */}
        <div className="flex justify-end gap-3 px-7 py-3">
          {/* Action Buttons */}
          <button
            onClick={handleClose}
            className="cursor-pointer px-4 py-2 bg-card dark:bg-neutral-10 border border-neutral-30 dark:border-neutral-30 rounded-[5px] text-[14px] font-semibold text-ink dark:text-neutral-80 hover:bg-neutral-10 dark:hover:bg-neutral-20 transition-colors"
          >
            취소
          </button>
          <button
            onClick={handleInvite}
            disabled={!email.trim() || !!emailError || !isValidEmail(email.trim())}
            className={`cursor-pointer px-4 py-2 rounded-[5px] text-[14px] font-semibold transition-colors ${
              email.trim() && !emailError && isValidEmail(email.trim())
                ? "bg-neutral-90 dark:bg-neutral-80 text-neutral-0 dark:text-neutral-0 hover:bg-neutral-80 dark:hover:bg-neutral-70"
                : "bg-gray-300 dark:bg-neutral-20 text-gray-500 dark:text-neutral-50 cursor-not-allowed"
            }`}
          >
            초대 보내기
          </button>
        </div>
      </div>
    </div>
  );
}
