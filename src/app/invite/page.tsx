"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { MembersService } from "@/services/members";
import { savePendingInviteToken, getPendingInviteToken, clearPendingInviteToken } from "@/lib/invite";


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
      {/* 봉투 컨테이너 */}
      <div className="relative w-[622px] h-[620px] mx-auto">
        {/* 1) 봉투 바닥(뒤쪽): 단색 화이트 10% 오퍼시티 */}
        <div
          className="absolute bottom-0 w-full h-[520px] rounded-b-[12px] shadow-[0_10px_30px_rgba(0,0,0,0.35)]"
          style={{
            backgroundColor: "#7B7F84", // 불투명 고정 색상
            border: "1px solid rgba(255,255,255,0.08)",
            zIndex: 10,
          }}
        />

        {/* 3) 봉투 덮개: 단색 화이트 10% 오퍼시티, 삼각형 (최상단 레이어) */}
        <motion.div
          className="absolute top-[96px] w-full h-[252px] cursor-pointer"
          style={{
            backgroundColor: "#5D5D5D", // 뚜껑 겉면 색상(접힌 상태의 역삼각형)
            clipPath: "polygon(0 0, 100% 0, 50% 100%)",
            transformOrigin: "top center",
            border: "none",
            borderBottom: "none",
            // 카드(20)보다 뒤, 바닥(10)보다는 앞
            zIndex: 12,
          }}
          animate={{ rotateX: isOpen ? -118 : 0 }}
          transition={{ duration: 1.0, ease: [0.25, 0.46, 0.45, 0.94] }}
          onClick={onOpen}
        >
          {/* 상단 워드마크 위치 보정 */}
          <div className="absolute top-9 left-1/2 -translate-x-1/2 text-white/80 text-3xl font-semibold tracking-tight">
            Talkgate
          </div>
        </motion.div>

        {/* 2) 초대장 내용물: 중앙 카드 */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              className="absolute inset-0 flex items-center justify-center"
              style={{ zIndex: 20 }}
              initial={{ y: 80, opacity: 0, scale: 0.95 }}
              animate={{ y: -130, opacity: 1, scale: 1 }}
              exit={{ y: 80, opacity: 0, scale: 0.95 }}
              transition={{ delay: 0.7, duration: 0.9, ease: [0.25, 0.46, 0.45, 0.94] }}
            >
              <div
                className="w-[520px] min-h-[420px] rounded-[12px] px-10 py-9 flex flex-col items-center text-center"
                style={{
                  background: "linear-gradient(180deg, rgba(20,20,20,0.98) 0%, rgba(12,12,12,0.98) 100%)",
                  boxShadow: "0 24px 40px rgba(0,0,0,0.45)",
                  border: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                <div className="text-white text-[40px] leading-none font-bold mb-6">Talkgate</div>
                <div className="text-white/95 mb-5">
                  <div className="text-[18px] mb-2">
                    <span className="font-semibold">"{inviteInfo?.projectName || "프로젝트"}"</span>에 초대되었습니다.
                  </div>
                  <div className="text-[14px] text-white/70 mb-2">
                    {new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </div>
                  <div className="text-[12px] text-white/50">본 초대는 7일 후 자동 만료됩니다.</div>
                </div>

                <div className="flex flex-col items-center gap-3">
                  <button
                    className="px-7 h-[40px] rounded-[8px] bg-white text-[#0F0F0F] text-[15px] font-semibold hover:bg-white/90 transition-colors"
                    onClick={onAccept}
                  >
                    프로젝트 가입하기
                  </button>
                  <button
                    className="px-4 h-[32px] text-white/60 hover:text-white/85 text-[13px] transition-colors"
                    onClick={onDecline}
                  >
                    거절
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 3) 앞면(겉면): 직사각형 + 두 개의 직각삼각형 조합. 객체 opacity는 사용하지 않음 */}
        {(() => {
          // 투명도 없는 고정 색상으로 내용물이 비치지 않도록 처리
          const envelopeColor = "#7B7F84";
          const borderColor = "rgba(255,255,255,0.08)";
          const baseHeight = 160; // 받침 직사각형 높이(상단 역삼각형과 맞닿도록 상향)
          const triHeight = 160; // 삼각형 높이(상단 각도와 시각적으로 맞추기 위해 증가)
          const halfWidth = 311; // 컨테이너 절반 (622px / 2)
          return (
            <div className="absolute bottom-0 left-0 w-full pointer-events-none" style={{ height: baseHeight + triHeight, zIndex: 30 }}>
              {/* 받침 직사각형 */}
              <div
                className="absolute left-0 bottom-0 w-full"
                style={{ height: baseHeight, backgroundColor: envelopeColor }}
              />
              {/* 좌측 직각삼각형 (왼쪽 하단이 직각) */}
              <div
                className="absolute left-0"
                style={{
                  bottom: baseHeight,
                  width: 0,
                  height: 0,
                  borderRight: `${halfWidth}px solid transparent`,
                  borderBottom: `${triHeight}px solid ${envelopeColor}`,
                }}
              />
              {/* 우측 직각삼각형 (오른쪽 하단이 직각) */}
              <div
                className="absolute right-0"
                style={{
                  bottom: baseHeight,
                  width: 0,
                  height: 0,
                  borderLeft: `${halfWidth}px solid transparent`,
                  borderBottom: `${triHeight}px solid ${envelopeColor}`,
                }}
              />
            </div>
          );
        })()}
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
        // 로그인 페이지와 동일한 톤의 그라데이션 배경
        backgroundImage: "url('/login_bg.png')",
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

