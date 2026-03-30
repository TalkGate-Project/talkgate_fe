"use client";

import { useEffect, useMemo, useState } from "react";
import { SignupService } from "@/services/signup";
import Checkbox from "@/components/common/Checkbox";
import AsyncButton from "@/components/common/AsyncButton";
import EyeOffIcon from "@/components/common/icons/EyeOffIcon";
import EyeOnIcon from "@/components/common/icons/EyeOnIcon";
import type { SignupTokens } from "@/types/signup";
import PrivacyConsignmentModal from "@/components/signup/PrivacyConsignmentModal";
import DataCollectionModal from "@/components/signup/DataCollectionModal";
import MarketingConsentModal from "@/components/signup/MarketingConsentModal";
import { savePendingSignupState } from "@/lib/signup";
import { LANDING_URLS } from "@/lib/constants";
import { showErrorModal } from "@/providers/ErrorFeedbackModalProvider";

type AccountStepProps = {
  onSuccess: (params: { email: string; password: string; tokens?: SignupTokens; agreeMarketing: boolean }) => void;
  invitationToken?: string;
  inviteEmail?: string; // 초대 플로우에서 이메일 고정
};

export function AccountStep({ onSuccess, invitationToken, inviteEmail }: AccountStepProps) {
  // 초대 플로우 여부 - 토큰이 있으면 초대 플로우
  const isInviteFlow = !!invitationToken;
  // 초대 이메일 고정 여부 - 토큰이 있고 이메일도 있을 때만 고정
  const isEmailLocked = isInviteFlow && !!inviteEmail;
  
  const [email, setEmail] = useState(inviteEmail || "");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [invalid, setInvalid] = useState(false);
  // 초대 이메일이 고정된 경우에만 이메일 중복 확인 스킵
  const [emailChecked, setEmailChecked] = useState(isEmailLocked);
  const [verifiedEmail, setVerifiedEmail] = useState(inviteEmail || "");
  const [emailDuplicate, setEmailDuplicate] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreePrivacy, setAgreePrivacy] = useState(false);
  const [agreeDataProcessing, setAgreeDataProcessing] = useState(false);
  const [agreeThirdParty, setAgreeThirdParty] = useState(false);
  const [agreeMarketing, setAgreeMarketing] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [pwdTouched, setPwdTouched] = useState(false);
  const [confirmTouched, setConfirmTouched] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPrivacyConsignmentModal, setShowPrivacyConsignmentModal] = useState(false);
  const [showDataCollectionModal, setShowDataCollectionModal] = useState(false);
  const [showMarketingConsentModal, setShowMarketingConsentModal] = useState(false);

  const emailValid = useMemo(() => /.+@.+\..+/.test(email), [email]);
  const passwordValid = useMemo(() => password.length >= 8, [password]);
  const passwordMatch = useMemo(
    () => password === passwordConfirm && password.length > 0,
    [password, passwordConfirm]
  );
  const passwordHasUpper = useMemo(() => /[A-Z]/.test(password), [password]);
  const passwordHasLower = useMemo(() => /[a-z]/.test(password), [password]);
  const passwordHasDigit = useMemo(() => /\d/.test(password), [password]);
  const passwordHasSpecial = useMemo(
    () => /[^A-Za-z0-9]/.test(password),
    [password]
  );
  const passwordStrong =
    passwordValid &&
    passwordHasUpper &&
    passwordHasLower &&
    passwordHasDigit &&
    passwordHasSpecial;

  // 이메일 검증 조건: 초대 이메일이 고정된 경우 통과, 아니면 기존 검증
  const isEmailConditionMet = useMemo(() => {
    // 초대 이메일이 고정된 경우 조건 충족
    if (isEmailLocked) return true;
    // 그 외에는 기존 검증 로직 (중복확인 완료 + 유효한 이메일)
    return emailChecked && emailValid;
  }, [isEmailLocked, emailChecked, emailValid]);

  useEffect(() => {
    setInvalid(false);
  }, [email, password, passwordConfirm, agreeTerms, agreePrivacy, agreeDataProcessing, agreeThirdParty, agreeMarketing]);

  return (
    // 계정 생성 단계 폼 영역 시작
    <form
      className="w-full"
      onSubmit={async (e) => {
        e.preventDefault();
        setInvalid(false);
        if (
          !isEmailConditionMet ||
          !passwordStrong ||
          !passwordMatch ||
          !agreeTerms ||
          !agreePrivacy ||
          !agreeDataProcessing ||
          !agreeThirdParty
        ) {
          setInvalid(true);
          return;
        }
        
        setIsSubmitting(true);
        try {
          const res = await SignupService.register({
            email,
            password,
            agreeTerms,
            agreePrivacy,
            agreeDataProcessing,
            agreeThirdParty,
            agreeMarketing,
            invitationToken,
          });
          
          if (res.success) {
            // 초대 플로우인 경우: 백엔드에서 토큰을 반환할 수 있음
            // QA 요구사항: invitationToken을 넘겼다면 이메일 인증 절차는 필요 없음
            if (isInviteFlow && res.tokens) {
              // 초대 플로우 - 토큰 반환됨, 이메일 인증 스킵
              onSuccess({ email, password, tokens: res.tokens, agreeMarketing });
            } else if (isInviteFlow) {
              // 토큰이 없어도 초대 플로우면 임시 토큰으로 진행 (백엔드 구현에 따라)
              // 백엔드가 토큰을 반환하지 않는 경우, 로그인 후 진행해야 함
              // 이 경우 프로필 스텝 대신 바로 /invite/accept로 리다이렉트
              onSuccess({ email, password, agreeMarketing });
            } else {
              // 일반 플로우: 이메일 인증 단계로
              // 페이지 이탈 시 복귀할 수 있도록 상태 저장
              savePendingSignupState({
                email,
                step: "verify",
              });
              onSuccess({ email, password, agreeMarketing });
            }
          }
        } catch (err) {
          console.error("[AccountStep] 회원가입 실패:", err);
          showErrorModal({
            title: "오류 발생",
            headline: "처리에 실패했습니다. 잠시 후 다시 시도해주세요.",
            confirmText: "확인",
            hideCancel: true,
          });
        } finally {
          setIsSubmitting(false);
        }
      }}
    >
      {/* 안내 문구 영역 시작 */}
      <div className="text-[#FDFDFD] text-[14px] leading-[1] text-center tracking-[-0.02em] mb-[30px]">
        회원가입을 진행해주세요.
      </div>
      {/* 안내 문구 영역 끝 */}

      {/* 이메일 입력 영역 시작 */}
      <div
        className={`${
          emailDuplicate || (emailChecked && email === verifiedEmail)
            ? "mb-3"
            : "mb-5"
        }`}
      >
        <label
          className={`block text-[14px] mb-1 ${
            (invalid && !emailValid) || emailDuplicate
              ? "text-[#FF5A5A]"
              : "text-[#CECECE]"
          }`}
        >
          이메일
        </label>
        <div className="flex gap-2 w-full max-w-[364px]">
          <input
            name="email"
            value={email}
            onChange={(e) => {
              // 초대 이메일이 고정된 경우 변경 불가
              if (isEmailLocked) return;
              
              setEmail(e.target.value);
              setEmailChecked(false);
              setEmailDuplicate(false);
              setVerifiedEmail("");
            }}
            placeholder={
              invalid && !emailValid
                ? "이메일을 다시 입력하세요"
                : "email@email.com"
            }
            className={`flex-1 min-w-0 h-[34px] rounded-[5px] border bg-transparent pl-3 text-white ${
              (invalid && !emailValid) || emailDuplicate
                ? "border-[#FF5A5A] placeholder-[#FF5A5A]"
                : isEmailLocked
                ? "border-[#00E272]/50 bg-[#1a3a2a]/30"
                : "border-[#555555]"
            }`}
            autoComplete="email"
            readOnly={isEmailLocked}
            disabled={isEmailLocked}
          />
          {/* 초대 이메일이 고정된 경우 중복확인 버튼 숨김 */}
          {!isEmailLocked && (
            <button
              type="button"
              className={`cursor-pointer min-w-[72px] h-[34px] rounded-[5px] ${
                email === verifiedEmail && emailChecked
                  ? "bg-[#2F2F2F] text-[#555555]"
                  : "bg-[#2F2F2F] text-[#D0D0D0]"
              } text-[13px]`}
              disabled={email === verifiedEmail && emailChecked}
              onClick={() => {
                if (!emailValid) {
                  setInvalid(true);
                  return;
                }
                SignupService.checkEmailAvailable({ email }).then((res) => {
                  if (res.available) {
                    setEmailChecked(true);
                    setVerifiedEmail(email);
                    setEmailDuplicate(false);
                  } else {
                    setEmailChecked(false);
                    setVerifiedEmail("");
                    setEmailDuplicate(true);
                  }
                });
              }}
            >
              중복확인
            </button>
          )}
        </div>
      </div>
      {emailDuplicate && (
        <div className="mt-3 mb-3 text-[14px] text-[#FF5A5A]">
          이미 사용 중인 이메일입니다.
        </div>
      )}
      {/* 이메일 고정되지 않은 경우에만 이메일 확인 메시지 표시 */}
      {!isEmailLocked && emailChecked && !emailDuplicate && email === verifiedEmail && (
        <div className="mt-3 mb-3 text-[14px] text-[#00E272]">
          사용 가능한 이메일입니다.
        </div>
      )}
      {/* 초대 이메일이 고정된 경우 안내 */}
      {isEmailLocked && (
        <div className="mt-3 mb-3 text-[14px] text-[#00E272]">
          초대받은 이메일로 가입됩니다.
        </div>
      )}
      {/* 이메일 입력 영역 끝 */}

      {/* 비밀번호 입력 영역 시작 */}
      <div className="mb-5">
        <label
          className={`block text-[14px] mb-1 ${
            invalid && !passwordValid ? "text-[#FF5A5A]" : "text-[#CECECE]"
          }`}
        >
          비밀번호
        </label>
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="영문/숫자/특수문자 포함 8자 이상"
            className={`w-full h-[34px] rounded-[5px] border bg-transparent px-3 pr-12 text-white ${
              invalid && !passwordValid ? "border-[#FF5A5A]" : "border-[#555555]"
            }`}
            autoComplete="new-password"
            onBlur={() => setPwdTouched(true)}
          />
          <button
            type="button"
            className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center"
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? "비밀번호 숨기기" : "비밀번호 보기"}
          >
            {showPassword ? <EyeOnIcon /> : <EyeOffIcon />}
          </button>
        </div>
      </div>

      {/* 비밀번호 확인 입력 영역 시작 */}
      <div className="mb-1">
        <label
          className={`block text-[14px] mb-1 ${
            invalid && !passwordMatch ? "text-[#FF5A5A]" : "text-[#CECECE]"
          }`}
        >
          비밀번호 확인
        </label>
        <div className="relative">
          <input
            type={showPasswordConfirm ? "text" : "password"}
            value={passwordConfirm}
            onChange={(e) => setPasswordConfirm(e.target.value)}
            placeholder="비밀번호를 다시 입력하세요"
            className={`w-full h-[34px] rounded-[5px] border bg-transparent px-3 pr-12 text-white ${
              invalid && !passwordMatch ? "border-[#FF5A5A]" : "border-[#555555]"
            }`}
            autoComplete="new-password"
            onBlur={() => setConfirmTouched(true)}
          />
          <button
            type="button"
            className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center"
            onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
            aria-label={showPasswordConfirm ? "비밀번호 숨기기" : "비밀번호 보기"}
          >
            {showPasswordConfirm ? <EyeOnIcon /> : <EyeOffIcon />}
          </button>
        </div>
        {(confirmTouched || invalid) && password !== passwordConfirm && (
          <div className="mt-3 text-[14px] text-[#FF5A5A]">
            비밀번호가 일치하지 않습니다.
          </div>
        )}
      </div>
      {/* 비밀번호 확인 입력 영역 끝 */}

      {/* 비밀번호 규칙 안내 영역 시작 */}
      <div className="mt-3 space-y-1">
        <div
          className={`text-[14px] flex items-center gap-1.5 ${
            passwordValid
              ? "text-[#4CAF50]"
              : pwdTouched || invalid
              ? "text-[#FF5A5A]"
              : "text-[#808080]"
          }`}
        >
          <div className="w-1 h-1 rounded-full bg-current" />
          비밀번호는 최소 8자 이상이어야 합니다.
        </div>
        <div
          className={`text-[14px] flex items-center gap-1.5 ${
            passwordHasUpper &&
            passwordHasLower &&
            passwordHasDigit &&
            passwordHasSpecial
              ? "text-[#4CAF50]"
              : pwdTouched || invalid
              ? "text-[#FF5A5A]"
              : "text-[#808080]"
          }`}
        >
          <div className="w-1 h-1 rounded-full bg-current" />
          대문자, 소문자, 숫자, 특수문자를 모두 포함하여 입력해 주세요.
        </div>
      </div>
      {/* 비밀번호 규칙 안내 영역 끝 */}

      {/* 약관 동의 영역 시작 */}
      <div className="mt-6 mb-4">
        <div className="flex items-center text-[14px] text-[#BFBFBF]">
          <div className="flex items-center gap-2">
            <Checkbox
              checked={agreeTerms && agreePrivacy && agreeDataProcessing && agreeThirdParty && agreeMarketing}
              onChange={(next) => {
                setAgreeTerms(next);
                setAgreePrivacy(next);
                setAgreeDataProcessing(next);
                setAgreeThirdParty(next);
                setAgreeMarketing(next);
              }}
              ariaLabel="모두 동의합니다"
            />
            <span 
              className="cursor-pointer"
              onClick={() => {
                const next = !(agreeTerms && agreePrivacy && agreeDataProcessing && agreeThirdParty && agreeMarketing);
                setAgreeTerms(next);
                setAgreePrivacy(next);
                setAgreeDataProcessing(next);
                setAgreeThirdParty(next);
                setAgreeMarketing(next);
              }}
            >
              모두 동의합니다
            </span>
          </div>
          <button
            type="button"
            className="cursor-pointer ml-[12px] flex items-center justify-center"
            onClick={() => setShowTerms(!showTerms)}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className={`transition-transform duration-200 ${
                showTerms ? "rotate-180" : ""
              }`}
            >
              <path
                d="M15.8337 7.5L10.0003 13.3333L4.16699 7.5"
                stroke="#959595"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
        {showTerms && (
          <div className="mt-2 pl-6 space-y-2">
            <div className="flex items-center gap-2 text-[14px] text-[#BFBFBF]">
              <Checkbox
                checked={agreeTerms}
                onChange={setAgreeTerms}
                ariaLabel="Talkgate 서비스 이용약관 동의"
              />
              <span 
                className="cursor-pointer"
                onClick={() => setAgreeTerms(!agreeTerms)}
              >
                <a
                  href={LANDING_URLS.TERMS}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="text-sky-400 underline"
                >
                  Talkgate 서비스 이용약관
                </a>
                {" 동의 (필수)"}
              </span>
            </div>
            <div className="flex items-center gap-2 text-[14px] text-[#BFBFBF]">
              <Checkbox
                checked={agreePrivacy}
                onChange={setAgreePrivacy}
                ariaLabel="개인정보처리방침 동의"
              />
              <span 
                className="cursor-pointer"
                onClick={() => setAgreePrivacy(!agreePrivacy)}
              >
                <a
                  href={LANDING_URLS.PRIVACY}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="text-sky-400 underline"
                >
                  개인정보처리방침
                </a>
                {" 동의 (필수)"}
              </span>
            </div>
            <div className="flex items-center gap-2 text-[14px] text-[#BFBFBF]">
              <Checkbox
                checked={agreeDataProcessing}
                onChange={setAgreeDataProcessing}
                ariaLabel="개인정보 처리위탁에 대한 동의"
              />
              <span 
                className="cursor-pointer"
                onClick={() => setAgreeDataProcessing(!agreeDataProcessing)}
              >
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowPrivacyConsignmentModal(true);
                  }}
                  className="text-sky-400 underline"
                >
                  개인정보 처리위탁
                </button>
                {"에 대한 동의 (필수)"}
              </span>
            </div>
            <div className="flex items-center gap-2 text-[14px] text-[#BFBFBF]">
              <Checkbox
                checked={agreeThirdParty}
                onChange={setAgreeThirdParty}
                ariaLabel="고객정보 적법 수집 및 제3자 제공 책임 확인"
              />
              <span 
                className="cursor-pointer"
                onClick={() => setAgreeThirdParty(!agreeThirdParty)}
              >
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowDataCollectionModal(true);
                  }}
                  className="text-sky-400 underline"
                >
                  고객정보 적법 수집 및 제3자 제공
                </button>
                {" 책임 확인 (필수)"}
              </span>
            </div>
            <div className="flex items-center gap-2 text-[14px] text-[#BFBFBF]">
              <Checkbox
                checked={agreeMarketing}
                onChange={setAgreeMarketing}
                ariaLabel="Talkgate 마케팅 정보 수신 동의"
              />
              <span 
                className="cursor-pointer"
                onClick={() => setAgreeMarketing(!agreeMarketing)}
              >
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowMarketingConsentModal(true);
                  }}
                  className="text-sky-400 underline"
                >
                  Talkgate 마케팅 정보 수신 동의
                </button>
                {" (선택)"}
              </span>
            </div>
          </div>
        )}
      </div>
      {invalid && (!agreeTerms || !agreePrivacy || !agreeDataProcessing || !agreeThirdParty) && (
        <div className="mb-2 text-[12px] text-[#FF5A5A]">
          약관에 동의해주세요.
        </div>
      )}
      {/* 약관 동의 영역 끝 */}

      {/* 다음 버튼 영역 시작 */}
      <AsyncButton
        type="submit"
        variant="auth"
        size="md"
        fullWidth
        loading={isSubmitting}
        loadingText="처리 중..."
        disabled={
          !isEmailConditionMet ||
          !passwordStrong ||
          !passwordMatch ||
          !agreeTerms ||
          !agreePrivacy ||
          !agreeDataProcessing ||
          !agreeThirdParty
        }
        className="mt-2"
      >
        다음
      </AsyncButton>
      {/* 다음 버튼 영역 끝 */}

      {/* 약관 모달들 */}
      <PrivacyConsignmentModal
        open={showPrivacyConsignmentModal}
        onClose={() => setShowPrivacyConsignmentModal(false)}
      />
      <DataCollectionModal
        open={showDataCollectionModal}
        onClose={() => setShowDataCollectionModal(false)}
      />
      <MarketingConsentModal
        open={showMarketingConsentModal}
        onClose={() => setShowMarketingConsentModal(false)}
      />
    </form>
    // 계정 생성 단계 폼 영역 끝
  );
}


