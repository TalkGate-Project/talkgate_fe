"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { MembersService } from "@/services/members";
import { savePendingInviteToken, getPendingInviteToken, clearPendingInviteToken } from "@/lib/invite";

type VerifyResponse = any; // shape refined when backend spec finalized

// 3D 봉투 애니메이션 컴포넌트
function EnvelopeAnimation({ 
  isOpen, 
  onOpen, 
  inviteInfo, 
  onAccept, 
  onDecline 
}: {
  isOpen: boolean;
  onOpen: () => void;
  inviteInfo: any;
  onAccept: () => void;
  onDecline: () => void;
}) {
  return (
    <div className="relative" style={{ perspective: "1000px" }}>
      {/* 봉투 컨테이너 - 622px 너비로 확장 */}
      <div className="relative w-[622px] h-[620px] mx-auto">
        {/* 봉투 몸통 (하단 사각형) - 밝은 톤 */}
        <div
          className="absolute bottom-0 w-full h-[520px] rounded-b-lg shadow-lg"
          style={{
            background: "linear-gradient(180deg, #f8f9fa 0%, #e9ecef 100%)",
            border: "1px solid #dee2e6",
          }}
        />
        
        {/* 봉투 덮개 (상단 삼각형) - 밝은 톤, 간격 없이 연결 */}
        <motion.div
          className="absolute top-[100px] w-full h-[250px] cursor-pointer"
          style={{
            background: "linear-gradient(180deg, #ffffff 0%, #f8f9fa 100%)",
            clipPath: "polygon(0 0, 100% 0, 50% 100%)",
            transformOrigin: "top center",
            border: "1px solid #dee2e6",
            borderBottom: "none", // 몸통과 간격 없이 연결
          }}
          animate={{
            rotateX: isOpen ? -120 : 0,
          }}
          transition={{
            duration: 1.2,
            ease: [0.25, 0.46, 0.45, 0.94],
          }}
          onClick={onOpen}
        >
          {/* 덮개 위의 Talkgate 로고 */}
          <div className="absolute top-12 left-1/2 transform -translate-x-1/2 text-gray-600 text-3xl font-bold">
            Talkgate
          </div>
        </motion.div>

        {/* 초대장 (봉투 안에 숨겨져 있다가 올라오는 내용) */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              className="absolute inset-0 flex items-center justify-center"
              initial={{
                y: 80, // 봉투 안 깊숙이 숨겨진 상태
                opacity: 0,
                scale: 0.9,
              }}
              animate={{
                y: 0, // 위로 올라옴
                opacity: 1,
                scale: 1,
              }}
              exit={{
                y: 80,
                opacity: 0,
                scale: 0.9,
              }}
              transition={{
                delay: 0.8, // 덮개가 완전히 열린 후
                duration: 1.0,
                ease: [0.25, 0.46, 0.45, 0.94],
              }}
            >
              {/* 초대장 배경 */}
              <div 
                className="w-[480px] h-[448px] rounded-lg p-8 flex flex-col justify-center items-center text-center shadow-2xl"
                style={{
                  background: "linear-gradient(135deg, #1f2937 0%, #111827 100%)",
                  boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.1)",
                }}
              >
                {/* Talkgate 로고 */}
                <div className="text-white text-3xl font-bold mb-6">Talkgate</div>
                
                {/* 초대 메시지 */}
                <div className="text-white mb-6">
                  <div className="text-xl mb-3">
                    <span className="font-semibold">"{inviteInfo?.projectName || "프로젝트"}"</span>에 초대되었습니다.
                  </div>
                  <div className="text-lg text-gray-300 mb-2">
                    {new Date().toLocaleDateString('ko-KR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </div>
                  <div className="text-sm text-gray-400">
                    본 초대는 7일 후 자동 만료됩니다.
                  </div>
                </div>

                {/* 버튼들 */}
                <div className="flex flex-col items-center gap-3">
                  <button
                    className="px-8 py-3 bg-white text-gray-800 rounded-lg font-semibold text-lg hover:bg-gray-100 transition-colors"
                    onClick={onAccept}
                  >
                    프로젝트 가입하기
                  </button>
                  <button
                    className="px-6 py-2 text-gray-400 hover:text-white text-sm transition-colors"
                    onClick={onDecline}
                  >
                    거절
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
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
      className="min-h-screen relative flex items-center justify-center"
      style={{
        background: "linear-gradient(135deg, #0f0f0f 0%, #1a1a1a 100%)",
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
              onOpen={() => setIsEnvelopeOpen(true)}
              inviteInfo={inviteInfo}
              onAccept={onAccept}
              onDecline={onDecline}
            />

            {/* 봉투가 열리지 않았을 때 안내 메시지 */}
            {!isEnvelopeOpen && (
              <motion.div
                className="mt-8 text-center text-white text-lg"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.6 }}
              >
                봉투를 클릭하여 초대 내용을 확인하세요
              </motion.div>
            )}
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
          background: "linear-gradient(135deg, #0f0f0f 0%, #1a1a1a 100%)",
        }}
      >
        <div className="text-center text-white text-xl">초대 정보를 불러오는 중...</div>
      </main>
    }>
      <InviteLanding />
    </Suspense>
  );
}

