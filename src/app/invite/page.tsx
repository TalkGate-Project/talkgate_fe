"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { MembersService } from "@/services/members";
import { AuthService } from "@/services/auth";
import { savePendingInviteToken, getPendingInviteToken, clearPendingInviteToken } from "@/lib/invite";

type VerifyResponse = any; // shape refined when backend spec finalized

export default function InviteLanding() {
  const router = useRouter();
  const search = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [inviteInfo, setInviteInfo] = useState<any>(null);

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

        // 세션 확인: 이미 로그인되어 있으면 바로 수락/거절 플로우 유지
        try {
          await AuthService.me();
        } catch {
          // 비로그인 상태: 토큰 보관 후 로그인 화면으로 이동
          savePendingInviteToken(token);
          router.replace("/login");
          return;
        }
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
      alert(e?.data?.message || e?.message || "초대를 수락할 수 없습니다.");
    }
  }

  function onDecline() {
    clearPendingInviteToken();
    router.replace("/login");
  }

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
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-[640px] bg-white rounded-[12px] shadow-[0_13px_61px_rgba(0,0,0,0.25)] p-8">
          <div className="text-[#6B7280] text-[12px]">{new Date().toLocaleDateString()}</div>
          <h1 className="mt-1 text-[#111827] text-[20px] font-semibold">초대 대기</h1>

          {loading ? (
            <div className="mt-10 text-center text-[#6B7280]">초대 정보를 불러오는 중...</div>
          ) : error ? (
            <div className="mt-10 text-center text-[#EF4444]">{error}</div>
          ) : (
            <>
              <div className="mt-8 grid place-items-center">
                <div className="w-16 h-16 rounded-full bg-[#1D4ED8] text-white grid place-items-center text-[28px] font-semibold">
                  {String(inviteInfo?.inviterName || "").charAt(0) || "I"}
                </div>
              </div>
              <div className="mt-6 text-center">
                <div className="text-[18px] text-[#111827]">
                  <span className="font-semibold">{inviteInfo?.inviterName || "관리자"}</span>
                  <span> 님이 프로젝트 </span>
                  <span className="font-semibold">“{inviteInfo?.projectName || "프로젝트"}”</span>
                  <span> 에 초대했습니다</span>
                </div>
                <div className="mt-2 text-[#6B7280] text-[14px]">해당 프로젝트에 참여하시겠습니까?</div>
              </div>

              {/* already accepted preview chips / optional */}
              <div className="mt-6 text-center text-[#6B7280] text-[12px]">
                이미 초대를 수락한 팀원이 있을 수 있습니다.
              </div>

              <div className="mt-10 flex items-center justify-center gap-3">
                <button
                  className="h-10 px-5 rounded-[8px] border border-[#D1D5DB] text-[#374151]"
                  onClick={onDecline}
                >
                  거절
                </button>
                <button
                  className="h-10 px-5 rounded-[8px] bg-[#10B981] text-white font-semibold"
                  onClick={onAccept}
                >
                  초대 수락
                </button>
              </div>
              <div className="mt-6 text-center text-[#9CA3AF] text-[12px]">초대 링크는 유효기간이 있을 수 있습니다.</div>
            </>
          )}
        </div>
      </div>
    </main>
  );
}


