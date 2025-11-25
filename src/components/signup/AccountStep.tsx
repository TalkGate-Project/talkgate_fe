import { useEffect, useMemo, useState } from "react";
import { SignupService } from "@/services/signup";
import Checkbox from "@/components/common/Checkbox";
import EyeOffIcon from "@/components/common/icons/EyeOffIcon";
import EyeOnIcon from "@/components/common/icons/EyeOnIcon";

type AccountStepProps = {
  onSuccess: (params: { email: string; password: string }) => void;
};

export function AccountStep({ onSuccess }: AccountStepProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [invalid, setInvalid] = useState(false);
  const [emailChecked, setEmailChecked] = useState(false);
  const [verifiedEmail, setVerifiedEmail] = useState("");
  const [emailDuplicate, setEmailDuplicate] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreePrivacy, setAgreePrivacy] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [pwdTouched, setPwdTouched] = useState(false);
  const [confirmTouched, setConfirmTouched] = useState(false);

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

  useEffect(() => {
    setInvalid(false);
  }, [email, password, passwordConfirm, agreeTerms, agreePrivacy]);

  return (
    // 계정 생성 단계 폼 영역 시작
    <form
      className="mt-8 w-full"
      onSubmit={(e) => {
        e.preventDefault();
        setInvalid(false);
        if (
          !emailValid ||
          !passwordStrong ||
          !passwordMatch ||
          !emailChecked ||
          !agreeTerms ||
          !agreePrivacy
        ) {
          setInvalid(true);
          return;
        }
        SignupService.register({
          email,
          password,
          agreeTerms,
          agreePrivacy,
        }).then((res) => {
          if (res.success) {
            onSuccess({ email, password });
          }
        });
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
        <div className="flex gap-2">
          <input
            name="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setEmailChecked(false);
              setEmailDuplicate(false);
              setVerifiedEmail("");
            }}
            placeholder={
              invalid && !emailValid
                ? "이메일을 다시 입력하세요"
                : "이메일을 입력하세요"
            }
            className={`flex-1 h-[34px] rounded-[5px] border bg-transparent px-3 text-white ${
              (invalid && !emailValid) || emailDuplicate
                ? "border-[#FF5A5A] placeholder-[#FF5A5A]"
                : "border-[#555555]"
            }`}
            autoComplete="email"
          />
          <button
            type="button"
            className={`h-[34px] px-3 rounded-[5px] ${
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
        </div>
      </div>
      {emailDuplicate && (
        <div className="mt-3 text-[14px] text-[#FF5A5A]">
          이미 사용 중인 이메일입니다.
        </div>
      )}
      {emailChecked && !emailDuplicate && email === verifiedEmail && (
        <div className="mt-3 text-[14px] text-[#00E272]">
          사용 가능한 이메일입니다.
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
              checked={agreeTerms && agreePrivacy}
              onChange={(next) => {
                setAgreeTerms(next);
                setAgreePrivacy(next);
              }}
              ariaLabel="모두 동의합니다"
            />
            <span>모두 동의합니다</span>
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
                ariaLabel="이용약관 동의"
              />
              <span>이용약관에 동의합니다</span>
            </div>
            <div className="flex items-center gap-2 text-[14px] text-[#BFBFBF]">
              <Checkbox
                checked={agreePrivacy}
                onChange={setAgreePrivacy}
                ariaLabel="개인정보 처리방침 동의"
              />
              <span>개인정보처리방침에 동의합니다</span>
            </div>
          </div>
        )}
      </div>
      {invalid && (!agreeTerms || !agreePrivacy) && (
        <div className="mb-2 text-[12px] text-[#FF5A5A]">
          약관에 동의해주세요.
        </div>
      )}
      {/* 약관 동의 영역 끝 */}

      {/* 다음 버튼 영역 시작 */}
      <button
        type="submit"
        className="cursor-pointer mt-2 w-full h-[40px] rounded-[5px] bg-[#252525] text-[#D0D0D0] text-[14px] font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
        disabled={
          !emailChecked ||
          !emailValid ||
          !passwordStrong ||
          !passwordMatch ||
          !agreeTerms ||
          !agreePrivacy
        }
      >
        다음
      </button>
      {/* 다음 버튼 영역 끝 */}
    </form>
    // 계정 생성 단계 폼 영역 끝
  );
}


