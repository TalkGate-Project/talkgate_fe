"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthService } from "@/services/auth";
import { buildOAuthAuthorizeUrl } from "@/lib/oauth";
import Checkbox from "@/components/common/Checkbox";
import { getRememberMePreference, setRememberMePreference } from "@/lib/token";

export default function LoginPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [autoLogin, setAutoLogin] = useState(getRememberMePreference());
  const [invalid, setInvalid] = useState(false);

  useEffect(() => {
    document.title = "TalkGate - 로그인";
  }, []);

  useEffect(() => {
    let mounted = true;
    // 인증 유효성 실제 확인 후에만 이동 (쿠키 존재만으로는 리다이렉트하지 않음)
    AuthService.me()
      .then(() => {
        if (mounted) router.replace("/dashboard");
      })
      .catch(() => {
        if (mounted) setChecking(false);
      });
    return () => {
      mounted = false;
    };
  }, [router]);

  if (checking) return null;

  return (
    <main
      className="min-h-screen relative"
      style={{
        backgroundImage: "url('/login_bg.png')",
        backgroundRepeat: "no-repeat",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* Left half: brand logo + subtitle */}
      <div className="absolute left-0 top-0 h-screen w-[58vw] hidden lg:flex items-center pointer-events-none select-none">
        <div className="pl-[10vw] text-white flex flex-col items-center">
          <svg width="403" height="96" viewBox="0 0 403 96" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
            <path d="M241.3 16.8643V71.5657C241.3 82.1281 230.484 96 219.465 96H200.661V83.2439L201.308 82.686C201.485 82.6733 201.637 83.0284 201.739 83.0284H227.251L227.897 82.3817V30.4826L227.251 29.8359H195.906V59.6719H222.927L223.574 60.3186V72.4279L222.927 73.0746H207.356C179.65 73.0746 172.308 29.7091 198.074 18.817C199.329 18.2845 203.21 16.8516 204.325 16.8516H241.3V16.8643Z" fill="#FFFFFF"/>
            <path d="M100.324 37.1903C100.425 35.0728 100.489 32.6889 98.8276 31.1293C98.5994 30.9137 96.7861 29.8486 96.6593 29.8486H66.1767V16.877H96.6593C104.61 16.877 113.739 27.9973 113.739 35.6814V72.4406C113.739 73.5311 111.191 72.6562 110.519 72.6308C98.7135 72.3138 84.7401 73.7847 73.3155 72.6435C59.1393 71.236 53.3572 51.6582 63.349 41.92C65.2003 40.1194 70.3611 37.1776 72.8844 37.1776H100.349L100.324 37.1903ZM100.324 50.1619H72.859C68.5859 50.1619 69.2452 59.6085 72.9351 59.6085C75.3316 59.6085 77.7154 59.6592 79.7696 59.6592C83.954 59.6592 88.1764 59.6592 92.3481 59.6592C94.9095 59.6592 98.0161 59.469 100.324 59.469V50.1746V50.1619Z" fill="#FFFFFF"/>
            <path d="M283.461 16.8643C290.752 17.8533 300.109 26.8688 300.109 34.3753V72.4279C299.792 72.8717 299.729 72.8971 299.222 72.8971C286.06 72.9351 272.847 72.3392 259.673 72.6435C243.329 69.9427 239.525 45.6478 254.842 38.8387C256.008 38.3188 258.988 37.1776 260.104 37.1776H287.125C287.544 35.0854 285.908 29.8232 283.448 29.8232H252.965V16.8516H283.448L283.461 16.8643ZM287.125 50.1619H259.66C257.961 50.1619 257.492 57.6558 259.115 59.1266C259.255 59.2534 261.258 60.103 261.385 60.103H286.466L287.112 59.4563V50.1619H287.125Z" fill="#FFFFFF"/>
            <path d="M402.589 51.4553H360.428L359.781 50.8086V38.4837H388.755V29.836H356.104C355.483 30.2164 355.508 30.6982 355.432 31.3322C354.697 37.5961 355.584 46.5609 355.901 52.9516C356.015 55.1832 355.787 57.453 355.876 59.672L396.097 60.3186V72.428C395.501 73.3917 394.715 72.5802 393.738 72.6309C373.628 73.658 346.543 76.7899 342.144 50.2761C337.744 23.7623 362.127 10.4103 384.647 18.1577C392.901 20.998 402.576 31.8775 402.576 40.8802V51.4807L402.589 51.4553Z" fill="#FFFFFF"/>
            <path d="M150.917 0V36.3281L152.223 35.6814L171.028 16.8644H189.401L162.139 44.7603L189.186 72.2124L188.742 73.0873L170.812 72.428L152.223 53.8392L150.917 53.1925V72.6435H137.515V0.646678L138.161 0H150.917Z" fill="#FFFFFF"/>
            <path d="M66.1641 0V12.7561L65.5174 13.4027H40.2209V72.428L39.4981 73.0113L27.4395 72.9732L26.8055 72.428V13.4027H0.646679L0 12.7561V0.646679L0.646679 0H66.1641Z" fill="#FFFFFF"/>
            <path d="M318.267 4.755V16.8644H340.318V29.836H318.267V59.672H339.671L340.318 60.3186V72.428C338.999 73.8608 336.983 72.6816 335.36 72.6309C327.701 72.39 323.2 73.1888 316.403 68.6747C311.078 65.137 304.865 56.502 304.865 49.9464V4.755H318.267Z" fill="#FFFFFF"/>
            <path d="M132.328 0V72.428L131.681 72.9859C131.504 72.9986 131.352 72.6435 131.25 72.6435H118.925V0H132.328Z" fill="#FFFFFF"/>
          </svg>
          <div className="mt-4 text-white text-[32px] leading-[38px] font-medium">“Your Gateway to Smarter Sales”</div>
        </div>
      </div>
      {/* Right-side transparent container with card as background */}
      <div
        className="
          absolute top-0 h-screen flex justify-center w-[594px]
          md:left-1/2 md:-translate-x-1/2
          lg:left-auto lg:translate-x-0 lg:right-[8vw]
          xl:right-[12vw]
        "
        style={{
          backgroundImage: "url('/login_card.png')",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "center",
          backgroundSize: "594px auto",
        }}
      >
        {/* Logo + form column. Top -> logo at 337px from top of screen */}
        <div
          className="mx-auto flex flex-col items-center pt-[330px] w-[340px]"
          aria-label="login-form-area"
        >
          {/* Wordmark logo */}
          <svg width="203" height="48" viewBox="0 0 203 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
            <path d="M121.672 8.43212V35.7828C121.672 41.064 116.218 48 110.662 48H101.18V41.622L101.507 41.343C101.596 41.3367 101.673 41.5142 101.724 41.5142H114.588L114.914 41.1908V15.2413L114.588 14.9179H98.7828V29.8359H112.408L112.734 30.1593V36.2139L112.408 36.5373H104.556C90.5861 36.5373 86.8841 14.8545 99.8761 9.40848C100.509 9.1422 102.466 8.42578 103.028 8.42578H121.672V8.43212Z" fill="#FDFDFD"/>
            <path d="M50.5871 18.5952C50.6383 17.5364 50.6702 16.3445 49.8326 15.5647C49.7176 15.4569 48.8033 14.9243 48.7393 14.9243H33.3689V8.43854H48.7393C52.7482 8.43854 57.3516 13.9987 57.3516 17.8407V36.2204C57.3516 36.7656 56.0665 36.3281 55.7276 36.3155C49.7751 36.157 42.7292 36.8924 36.9685 36.3218C29.8204 35.6181 26.9048 25.8291 31.9431 20.96C32.8765 20.0597 35.4788 18.5889 36.7511 18.5889H50.5999L50.5871 18.5952ZM50.5871 25.081H36.7383C34.5837 25.081 34.9161 29.8043 36.7767 29.8043C37.9851 29.8043 39.1871 29.8297 40.2229 29.8297C42.3328 29.8297 44.4619 29.8297 46.5655 29.8297C47.857 29.8297 49.4235 29.7346 50.5871 29.7346V25.0873V25.081Z" fill="#FDFDFD"/>
            <path d="M142.931 8.43212C146.608 8.92664 151.326 13.4344 151.326 17.1876V36.2139C151.166 36.4358 151.134 36.4485 150.878 36.4485C144.242 36.4675 137.58 36.1696 130.937 36.3217C122.695 34.9713 120.777 22.8239 128.501 19.4193C129.089 19.1594 130.591 18.5888 131.154 18.5888H144.779C144.99 17.5427 144.165 14.9116 142.925 14.9116H127.554V8.42578H142.925L142.931 8.43212ZM144.779 25.0809H130.93C130.073 25.0809 129.837 28.8279 130.655 29.5633C130.726 29.6267 131.736 30.0515 131.8 30.0515H144.446L144.773 29.7281V25.0809H144.779Z" fill="#FDFDFD"/>
            <path d="M203 25.7277H181.741L181.415 25.4043V19.2419H196.024V14.918H179.561C179.247 15.1082 179.26 15.3491 179.222 15.6661C178.851 18.7981 179.299 23.2804 179.458 26.4758C179.516 27.5916 179.401 28.7265 179.446 29.836L199.726 30.1593V36.214C199.426 36.6959 199.03 36.2901 198.537 36.3155C188.397 36.829 174.74 38.395 172.521 25.1381C170.303 11.8811 182.598 5.20513 193.953 9.07886C198.115 10.499 202.994 15.9387 202.994 20.4401V25.7404L203 25.7277Z" fill="#FDFDFD"/>
            <path d="M76.098 0V18.1641L76.7565 17.8407L86.2384 8.43218H95.5029L81.7564 22.3802L95.3942 36.1062L95.1704 36.5437L86.1297 36.214L76.7565 26.9196L76.098 26.5962V36.3218H69.3398V0.323339L69.6659 0H76.098Z" fill="#FDFDFD"/>
            <path d="M33.3623 0V6.37803L33.0363 6.70137H20.2808V36.214L19.9164 36.5057L13.836 36.4866L13.5163 36.214V6.70137H0.326079L0 6.37803V0.323339L0.326079 0H33.3623Z" fill="#FDFDFD"/>
            <path d="M160.482 2.3775V8.43219H171.6V14.918H160.482V29.836H171.274L171.6 30.1593V36.214C170.935 36.9304 169.919 36.3408 169.1 36.3155C165.239 36.195 162.969 36.5944 159.542 34.3374C156.857 32.5685 153.724 28.251 153.724 24.9732V2.3775H160.482Z" fill="#FDFDFD"/>
            <path d="M66.7247 0V36.214L66.3986 36.493C66.3091 36.4993 66.2324 36.3218 66.1812 36.3218H59.9666V0H66.7247Z" fill="#FDFDFD"/>
          </svg>

          <h1 className="sr-only">로그인</h1>
          <form
            className="mt-6 w-full space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              setInvalid(false);
              setRememberMePreference(autoLogin);
              AuthService.login({ email, password })
                .then(() => router.replace("/projects"))
                .catch((err: any) => {
                  const status = err?.status;
                  const code = err?.data?.code;
                  const msg = String(err?.data?.message || "").toUpperCase();
                  if (status === 401 && code === "UNAUTHORIZED") {
                    setInvalid(true);
                  } else if (status === 401 && (msg.includes("INVALID") || msg.includes("UNAUTHORIZED"))) {
                    setInvalid(true);
                  } else {
                    alert("로그인에 실패했습니다.");
                  }
                });
            }}
          >
            <label className={`block text-[12px] mb-1 ${invalid ? "text-[#FF5A5A]" : "text-[#CECECE]"}`}>이메일</label>
            <input
              name="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (invalid) setInvalid(false);
              }}
              placeholder={invalid ? "이메일을 다시 입력하세요" : "이메일을 입력하세요"}
              className={`w-full h-[40px] rounded-[5px] border bg-transparent px-3 text-white ${invalid ? "border-[#FF5A5A] placeholder-[#FF5A5A]" : "border-[#555555]"}`}
              autoComplete="username"
            />
            <label className={`block text-[12px] mt-3 mb-1 ${invalid ? "text-[#FF5A5A]" : "text-[#CECECE]"}`}>비밀번호</label>
            <input
              name="password"
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (invalid) setInvalid(false);
              }}
              placeholder={invalid ? "비밀번호를 다시 입력하세요" : "비밀번호를 입력하세요"}
              className={`w-full h-[40px] rounded-[5px] border bg-transparent px-3 text-white ${invalid ? "border-[#FF5A5A] placeholder-[#FF5A5A]" : "border-[#555555]"}`}
              autoComplete="current-password"
            />

            {/* Options row */}
            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-2 text-[13px] text-[#BFBFBF]">
                <Checkbox
                  ariaLabel="자동 로그인 저장"
                  checked={autoLogin}
                  onChange={(next) => {
                    setAutoLogin(next);
                    setRememberMePreference(next);
                  }}
                  size={18}
                />
                <span>자동 로그인 저장</span>
              </div>
              <button
                type="button"
                className="text-[12px] text-[#BFBFBF] underline-offset-2 hover:underline"
                onClick={() => router.push("/forgot-password")}
              >
                비밀번호 찾기
              </button>
            </div>

            <button type="submit" className="mt-2 w-full h-[40px] rounded-[5px] bg-[#252525] text-[#D0D0D0] text-[14px] font-semibold">로그인</button>
          </form>

          {/* Social buttons */}
          <div className="mt-5 w-full flex items-center gap-3 text-white/90">
            <div className="h-px flex-1 bg-white/20" />
            <div className="text-center text-[13px]">또는</div>
            <div className="h-px flex-1 bg-white/20" />
          </div>
          <div className="mt-3 flex items-center justify-center gap-4">
            <button
              aria-label="kakao"
              className="w-11 h-11 rounded-full"
              style={{ background: "#FEE500" }}
              onClick={() => {
                const url = buildOAuthAuthorizeUrl("kakao");
                window.location.href = url;
              }}
            >
              <img src="/kakao.png" alt="" width={24} height={24} />
            </button>
            <button
              aria-label="naver"
              className="w-11 h-11 rounded-full"
              style={{ background: "#03C75A" }}
              onClick={() => {
                const url = buildOAuthAuthorizeUrl("naver");
                window.location.href = url;
              }}
            >
              <img src="/naver.png" alt="" width={24} height={24} />
            </button>
            <button
              aria-label="google"
              className="w-11 h-11 rounded-full bg-[#353535]"
              onClick={() => {
                const url = buildOAuthAuthorizeUrl("google");
                window.location.href = url;
              }}
            >
              <img src="/google.png" alt="" width={24} height={24} />
            </button>
          </div>

          {/* Signup link */}
          <div className="mt-6 text-[13px] text-[#BFBFBF]">
            계정이 없으신가요?{' '}
            <button
              type="button"
              className="underline underline-offset-2 hover:text-white"
              onClick={() => router.push("/signup")}
            >
              회원가입
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}


