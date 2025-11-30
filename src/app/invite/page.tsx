"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, easeInOut } from "framer-motion";
import { MembersService } from "@/services/members";
import { savePendingInviteToken, getPendingInviteToken, clearPendingInviteToken } from "@/lib/invite";
import loginBgImg from "@/assets/images/auth/login_bg.png";

// 개발용 토큰 - 백엔드 없이 UI 테스트용
const DEV_TOKEN = "developmentmastertoken";
const DEV_INVITE_INFO = {
  projectName: "테스트 프로젝트",
  projectId: "dev-project-123",
  inviterName: "홍길동",
  inviterEmail: "test@example.com",
  role: "MEMBER",
  expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
};

/**
 * 봉투 이미지 매핑:
 * - envelope-base.jpg: 봉투 바닥 배경 (회색 노이즈 텍스처)
 * - envelope-cover.jpg: 뚜껑 앞면 (역삼각형, Talkgate 로고)
 * - envelope-inner.jpg: 카드 배경 (검정색)
 * - envelope-outer.jpg: 봉투 앞면 V자 (흰 배경에 V자 모양)
 */

// 3D 봉투 애니메이션 컴포넌트
function EnvelopeAnimation({ 
  isOpen, 
  inviteInfo, 
  onAccept, 
  onDecline 
}: {
  isOpen: boolean;
  inviteInfo: any;
  onAccept: () => void;
  onDecline: () => void;
}) {
  /**
   * 레이어 순서 (z-index):
   * 1. 봉투 바닥 (base): 10
   * 2. 열린 뚜껑: 11 (뒤로 접힌 상태)
   * 3. 카드: 20
   * 4. 봉투 앞면 (outer): 30 - 카드보다 앞, V자 움푹 파인 부분은 투명
   * 5. 닫힌 뚜껑: 40
   */

  return (
    <div className="relative" style={{ perspective: "1200px" }}>
      {/* 봉투 컨테이너 */}
      <div 
        className="relative w-[622px] h-[400px] mx-auto mt-[120px]"
        style={{ clipPath: "inset(-500px -50px 0px -50px)" }} 
      >
        
        {/* 1. 봉투 바닥 (Back) - envelope-base.jpg */}
        <div
          className="absolute bottom-0 left-0 w-full h-full rounded-[12px] shadow-2xl overflow-hidden"
          style={{ zIndex: 10 }}
        >
          <img 
            src="/envelope-base.jpg" 
            alt=""
            className="w-full h-full object-cover"
            draggable={false}
          />
        </div>

        {/* 2. 뚜껑 - envelope-cover.jpg
            180도 회전하면 역삼각형 → 삼각형으로 변환 */}
        <motion.div
          className="absolute top-0 left-0 w-full"
          style={{
            transformOrigin: "top center",
            height: "200px",
            clipPath: "polygon(0 0, 100% 0, 50% 100%)", // 역삼각형
          }}
          initial={{ rotateX: 0 }}
          animate={{ 
            rotateX: isOpen ? 180 : 0,
            zIndex: isOpen ? 11 : 40, // 열리면 바닥 위로, 닫히면 가장 앞
          }}
          transition={{ 
            rotateX: { duration: 1.0, ease: easeInOut },
            zIndex: { delay: isOpen ? 0.5 : 0 },
          }}
        >
          <img 
            src="/envelope-cover.jpg" 
            alt=""
            className="w-full h-full object-fill"
            draggable={false}
          />
        </motion.div>

        {/* 3. 카드 (초대장) - envelope-inner.jpg 배경 */}
        <motion.div
          className="absolute left-0 right-0 mx-auto w-[580px]"
          style={{ 
            bottom: "10px",
            zIndex: 20, // outer(30)보다 뒤
          }}
          initial={{ y: 80, opacity: 0 }}
          animate={{ 
            y: isOpen ? -240 : 80,
            opacity: isOpen ? 1 : 0,
          }}
          transition={{ 
            y: { delay: 0.7, duration: 1.0, ease: easeInOut },
            opacity: { delay: 0.7, duration: 0.3 },
          }}
        >
          <div
            className="w-full min-h-[420px] rounded-[12px] px-10 py-9 flex flex-col items-center text-center relative overflow-hidden"
            style={{
              boxShadow: "0 10px 40px rgba(0,0,0,0.6)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            {/* 카드 배경 이미지 */}
            <img 
              src="/envelope-inner.jpg" 
              alt=""
              className="absolute inset-0 w-full h-full object-cover"
              draggable={false}
            />
            {/* 카드 내용 */}
            <div className="relative z-10 flex flex-col items-center w-full h-full min-h-[380px]">
              <div className="text-white text-[40px] leading-none font-bold mb-6">Talkgate</div>
              <div className="text-white/95 mb-5 flex-1">
                <div className="text-[18px] mb-2">
                  <span className="font-semibold">"{inviteInfo?.projectName || "프로젝트"}"</span>에 초대되었습니다.
                </div>
                <div className="text-[14px] text-white/70 mb-2">
                  {new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
                <div className="text-[12px] text-white/50">본 초대는 7일 후 자동 만료됩니다.</div>
              </div>

              <div className="flex flex-col items-center gap-3 w-full mt-auto">
                <button
                  className="w-full h-[48px] rounded-[8px] bg-white text-[#0F0F0F] text-[16px] font-bold hover:bg-white/90 transition-colors"
                  onClick={onAccept}
                >
                  프로젝트 가입하기
                </button>
                <button
                  className="text-white/40 hover:text-white/70 text-[13px] transition-colors"
                  onClick={onDecline}
                >
                  거절
                </button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* 4. 봉투 앞면 (V자 포켓) - envelope-outer.jpg 
            V자 위쪽 움푹 파인 부분은 투명 (흰색)
            카드보다 앞에 있어서 카드의 하단을 감싸듯이 보임 */}
        <div 
          className="absolute bottom-0 left-0 w-full h-full pointer-events-none overflow-hidden rounded-b-[12px]"
          style={{ zIndex: 30 }}
        >
          <img 
            src="/envelope-outer.jpg" 
            alt=""
            className="w-full h-full object-fill"
            draggable={false}
          />
        </div>

      </div>
    </div>
  );
}

function InviteLanding() {
  const router = useRouter();
  const search = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [inviteInfo, setInviteInfo] = useState<any>(null);
  const [isEnvelopeOpen, setIsEnvelopeOpen] = useState(false);
  const [isTokenValid, setIsTokenValid] = useState(false);

  const token = useMemo(() => search.get("token") || "", [search]);

  useEffect(() => {
    document.title = "TalkGate - 초대";
  }, []);

  useEffect(() => {
    let mounted = true;
    async function init() {
      setLoading(true);
      setError(null);
      try {
        if (!token) throw new Error("초대 토큰이 없습니다.");

        // 개발용 토큰 체크 - 백엔드 호출 없이 UI 테스트
        if (token === DEV_TOKEN) {
          console.log("[DEV MODE] 개발용 토큰으로 UI 테스트 모드 진입");
          setInviteInfo(DEV_INVITE_INFO);
          setIsTokenValid(true);
          if (mounted) setLoading(false);
          return;
        }

        // 토큰 검증
        const res = await MembersService.verifyInvitation({ token });
        const payload: any = (res as any)?.data;
        setInviteInfo(payload?.data ?? payload ?? {});
        setIsTokenValid(true);
      } catch (e: any) {
        setError(e?.data?.message || e?.message || "초대 정보를 확인할 수 없습니다.");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    init();
    return () => {
      mounted = false;
    };
  }, [token, router]);

  // 토큰이 유효하고 로딩이 끝나면 자동으로 봉투 열기
  useEffect(() => {
    if (!loading && isTokenValid) {
      const timer = setTimeout(() => {
        setIsEnvelopeOpen(true);
      }, 500); // 0.5초 후 오픈
      return () => clearTimeout(timer);
    }
  }, [loading, isTokenValid]);

  async function onAccept() {
    const effectiveToken = token || getPendingInviteToken();
    if (!effectiveToken) {
      alert("유효하지 않은 초대 토큰입니다.");
      return;
    }
    
    // 개발용 토큰인 경우
    if (effectiveToken === DEV_TOKEN) {
      console.log("[DEV MODE] 초대 수락 - 회원가입 페이지로 이동");
      router.replace(`/signup?invite=${effectiveToken}`);
      return;
    }

    // 초대 토큰을 localStorage에 저장하고 회원가입 페이지로 이동
    savePendingInviteToken(effectiveToken);
    router.replace(`/signup?invite=${effectiveToken}`);
  }

  function onDecline() {
    clearPendingInviteToken();
    router.replace("/login");
  }

  return (
    <main
      className="min-h-screen relative flex items-center justify-center overflow-hidden"
      style={{
        // 로그인 페이지와 동일한 톤의 그라데이션 배경
        backgroundImage: `url('${loginBgImg.src}')`,
        backgroundRepeat: "no-repeat",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="w-full max-w-4xl mx-auto px-4">
        {loading ? (
          <div className="text-center text-white text-xl">초대 정보를 불러오는 중...</div>
        ) : error ? (
          <div className="text-center text-red-300 text-xl">{error}</div>
        ) : isTokenValid ? (
          <div className="flex flex-col items-center">
            {/* 3D 봉투 애니메이션 컴포넌트 */}
            <EnvelopeAnimation
              isOpen={isEnvelopeOpen}
              inviteInfo={inviteInfo}
              onAccept={onAccept}
              onDecline={onDecline}
            />
          </div>
        ) : null}
      </div>
    </main>
  );
}

export default function InvitePage() {
  return (
    <Suspense fallback={
      <main
        className="min-h-screen relative flex items-center justify-center"
        style={{
          backgroundImage: "url('/login_bg.png')",
          backgroundRepeat: "no-repeat",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="text-center text-white text-xl">초대 정보를 불러오는 중...</div>
      </main>
    }>
      <InviteLanding />
    </Suspense>
  );
}

