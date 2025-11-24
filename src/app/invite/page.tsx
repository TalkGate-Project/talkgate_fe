"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { MembersService } from "@/services/members";
import { savePendingInviteToken, getPendingInviteToken, clearPendingInviteToken } from "@/lib/invite";
import loginBgImg from "@/assets/images/auth/login_bg.png";


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
  // 뚜껑 애니메이션 설정
  const flapVariants = {
    closed: {
      rotateX: 0,
      zIndex: 40, // 닫혀있을 땐 가장 위
      transition: { 
        rotateX: { duration: 0.8, ease: "easeInOut" },
        zIndex: { delay: 0.1 } // 닫힐 땐 즉시 앞으로 (약간 딜레이 줘서 뚫림 방지)
      }
    },
    open: {
      rotateX: 180,
      zIndex: 11, // 다 열리면 카드(20) 뒤, 바닥(10) 앞으로 보냄
      transition: { 
        rotateX: { duration: 0.8, ease: "easeInOut" },
        zIndex: { delay: 0.8 } // 회전이 끝나는 시점에 z-index 변경
      }
    }
  };

  // 카드 애니메이션 설정
  const cardVariants = {
    closed: {
      y: 100, // 닫혀있을 땐 봉투 깊숙이 숨김 (0 -> 100)
      transition: { duration: 0.5 }
    },
    open: {
      y: -220, 
      transition: { 
        delay: 0.9, 
        duration: 1.0, 
        ease: "easeInOut" 
      }
    }
  };

  return (
    <div className="relative" style={{ perspective: "1500px" }}>
      {/* 봉투 컨테이너 */}
      <div 
        className="relative w-[622px] h-[400px] mx-auto mt-[100px]"
        // 위쪽은 넉넉하게(-500px) 보여주고, 아래/좌/우는 컨테이너 크기에 딱 맞춰 자름(0px)
        style={{ clipPath: "inset(-500px -50px 0px -50px)" }} 
      >
        
        {/* 1. 봉투의 바깥, 바닥 (Back) - z-index: 10 */}
        <div
          className="absolute bottom-0 left-0 w-full h-full rounded-[12px] shadow-2xl"
          style={{
            backgroundColor: "#2A2A2A", 
            zIndex: 10,
          }}
        />

        {/* 2. 봉투의 내용물 (Card) - z-index: 20 */}
        <motion.div
          className="absolute left-0 right-0 mx-auto w-[580px]"
          style={{ 
            zIndex: 20,
            bottom: "10px", 
          }}
          variants={cardVariants}
          initial="closed"
          animate={isOpen ? "open" : "closed"}
        >
          <div
            className="w-full min-h-[420px] rounded-[12px] px-10 py-9 flex flex-col items-center text-center relative"
            style={{
              background: "#000000",
              boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
              border: "1px solid rgba(255,255,255,0.1)",
            }}
          >
             {/* 카드 내용 */}
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
        </motion.div>

        {/* 3. 봉투의 바깥, 겉으로 보이게 될 부분 (Front Body/Pocket) - z-index: 30 */}
        <div 
          className="absolute bottom-0 left-0 w-full h-full pointer-events-none rounded-b-[12px] overflow-hidden"
          style={{ zIndex: 30 }}
        >
           <div 
             className="w-full h-full"
             style={{
               backgroundColor: "#333333",
               clipPath: "polygon(0 0, 50% 40%, 100% 0, 100% 100%, 0 100%)",
               boxShadow: "inset 0 10px 20px rgba(0,0,0,0.2)"
             }}
           />
        </div>

        {/* 4. 열리고 접힐 봉투 뚜껑 부분 (Flap) */}
        <motion.div
          className="absolute top-0 left-0 w-full h-[200px]"
          style={{
            transformOrigin: "top",
          }}
          variants={flapVariants}
          initial="closed"
          animate={isOpen ? "open" : "closed"}
        >
          {/* 뚜껑 모양 Placeholder (역삼각형) */}
          <div 
            className="w-full h-full"
            style={{
               backgroundColor: "#3A3A3A", 
               clipPath: "polygon(0 0, 100% 0, 50% 100%)",
               borderTopLeftRadius: "12px",
               borderTopRightRadius: "12px",
            }}
          />
        </motion.div>

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
    try {
      const effectiveToken = token || getPendingInviteToken();
      if (!effectiveToken) throw new Error("유효하지 않은 초대 토큰입니다.");
      await MembersService.acceptInvitation({ token: effectiveToken });
      clearPendingInviteToken();
      router.replace("/projects");
    } catch (e: any) {
      const status = e?.status;
      if (status === 401 || status === 403) {
        // 인증 필요: 초대 토큰 보관 후 로그인으로 이동
        const effectiveToken = token || getPendingInviteToken();
        if (effectiveToken) savePendingInviteToken(effectiveToken);
        router.replace("/login");
        return;
      }
      alert(e?.data?.message || e?.message || "초대를 수락할 수 없습니다.");
    }
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

