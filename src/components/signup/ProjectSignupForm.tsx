"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import AuthLayout from "@/components/auth/AuthLayout";
import AsyncButton from "@/components/common/AsyncButton";
import { MembersService } from "@/services/members";
import { AuthService } from "@/services/auth";
import type { UpdateProfilePayload } from "@/types/members";
import { getPendingInviteInfo, clearPendingInviteInfo, type PendingInviteInfo } from "@/lib/invite";
import { clearTokens } from "@/lib/token";
import { showErrorModal } from "@/providers/ErrorFeedbackModalProvider";
import { WrongAccountModal } from "@/components/invite/WrongAccountModal";

// 지연 함수
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export function ProjectSignupForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  
  // 로그인 사용자 정보
  const [userEmail, setUserEmail] = useState<string | null>(null);
  
  // 잘못된 계정 모달
  const [showWrongAccountModal, setShowWrongAccountModal] = useState(false);

  // 초대 정보를 상태로 관리 (SSR 호환)
  const [pendingInvite, setPendingInvite] = useState<PendingInviteInfo | null>(null);
  const isInviteFlow = !!pendingInvite?.token;

  // 마운트 시 초대 정보 로드
  useEffect(() => {
    setIsMounted(true);
    const invite = getPendingInviteInfo();
    if (invite) {
      console.log("[ProjectSignup] 📋 초대 정보 로드됨:", invite);
      setPendingInvite(invite);
    }
  }, []);

  // 뒤로가기 감지 및 처리
  useEffect(() => {
    if (!isMounted || isLoading) return;

    const handlePopState = (event: PopStateEvent) => {
      // 뒤로가기 감지 시 즉시 현재 페이지로 복원
      window.history.pushState(null, "", window.location.href);
      
      // 안내 모달 표시
      console.log("[ProjectSignup] ⬅️ 뒤로가기 감지 - 안내 모달 표시");
      
      showErrorModal({
        type: "info",
        title: "프로필 입력 페이지",
        headline: "프로필 정보를 입력 중인 페이지입니다.",
        description: "이 페이지를 나가시면 나중에 프로필 설정에서 정보를 입력하실 수 있습니다. 프로젝트 선택 페이지로 이동하시겠습니까?",
        confirmText: "프로젝트 선택으로 이동",
        cancelText: "취소",
        hideCancel: false,
        onConfirm: () => {
          // 초대 정보는 유지 (나중에 프로필에서 수정 가능)
          // 프로젝트 선택 페이지로 이동
          router.replace("/projects");
        },
      });
    };

    // 히스토리에 현재 상태 추가 (뒤로가기 감지용)
    window.history.pushState(null, "", window.location.href);

    // popstate 이벤트 리스너 등록
    window.addEventListener("popstate", handlePopState);

    // 컴포넌트 언마운트 시 리스너 제거
    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [isMounted, isLoading, router]);

  // 사용자 정보 확인 (재시도 로직 포함)
  const checkUserEmail = useCallback(async (retryCount = 0): Promise<boolean> => {
    const MAX_RETRIES = 3;
    const RETRY_DELAY = 500;
    
    try {
      const meRes = await AuthService.me();
      const userData = (meRes as any)?.data?.data ?? (meRes as any)?.data;
      const email = userData?.email;
      
      if (!email && retryCount < MAX_RETRIES) {
        console.log(`[ProjectSignup] ⏳ 사용자 정보 없음, 재시도 ${retryCount + 1}/${MAX_RETRIES}`);
        await delay(RETRY_DELAY);
        return checkUserEmail(retryCount + 1);
      }
      
      setUserEmail(email);
      return true;
    } catch (err) {
      if (retryCount < MAX_RETRIES) {
        console.log(`[ProjectSignup] ⏳ API 호출 실패, 재시도 ${retryCount + 1}/${MAX_RETRIES}`);
        await delay(RETRY_DELAY);
        return checkUserEmail(retryCount + 1);
      }
      return false;
    }
  }, []);

  // 초대 수락 상태 확인 (이미 수락된 경우 프로젝트로 리다이렉트)
  // ⚠️ verifyInvitation을 사용하여 실제 초대 수락 없이 상태만 확인
  const checkInvitationStatus = useCallback(async (): Promise<boolean> => {
    const invite = getPendingInviteInfo();
    if (!invite?.token) return false;

    try {
      // verifyInvitation으로 초대 상태 확인 (실제 수락은 하지 않음)
      const res = await MembersService.verifyInvitation({
        token: invite.token,
      });
      const payload: any = (res as any)?.data;
      // 백엔드 응답: { result, data: { isValid, invitation: {...} } }
      const inviteData = payload?.data?.invitation ?? payload?.invitation ?? payload?.data ?? payload ?? {};
      const status = inviteData?.status;
      
      // 이미 수락된 초대인 경우
      if (status === "accepted") {
        console.log("[ProjectSignup] ℹ️ 이미 수락된 초대 감지 - 프로젝트로 리다이렉트");
        // 초대 정보 정리 후 프로젝트로 이동
        clearPendingInviteInfo();
        router.replace("/projects");
        return true; // 이미 수락됨
      }
      
      // 아직 수락되지 않은 초대 (pending 또는 기타 상태)
      return false;
    } catch (err: any) {
      // verifyInvitation 실패 시 에러 처리
      const errorCode = err?.data?.code;
      
      // 초대가 만료되었거나 유효하지 않은 경우
      if (errorCode === "INVITATION_EXPIRED" || errorCode === "INVITATION_INVALID") {
        console.log("[ProjectSignup] ⚠️ 유효하지 않은 초대 - 초대 정보 정리");
        clearPendingInviteInfo();
        // 프로젝트로 이동 (또는 에러 메시지 표시 후 이동)
        router.replace("/projects");
        return true; // 처리 완료
      }
      
      // 그 외 에러는 로깅하고 아직 수락되지 않은 것으로 간주
      console.error("[ProjectSignup] verifyInvitation 실패:", err);
      return false;
    }
  }, [router]);

  useEffect(() => {
    // 클라이언트에서만 실행
    if (!isMounted) return;
    
    window.scrollTo(0, 0);
    
    async function init() {
      console.log("[ProjectSignup] 🚀 초기화 시작");
      
      // 초대 플로우가 아닌 경우 프로젝트 선택 페이지로 리다이렉트
      const invite = getPendingInviteInfo();
      if (!invite?.token) {
        console.log("[ProjectSignup] ⚠️ 초대 플로우가 아님 - 프로젝트 선택 페이지로 이동");
        router.replace("/projects");
        return;
      }
      
      // 사용자 정보 확인 (재시도 포함)
      const success = await checkUserEmail();
      
      if (!success) {
        console.log("[ProjectSignup] ❌ 로그인 필요 - 로그인 페이지로 이동");
        router.replace("/login");
        return;
      }
      
      // 초대 수락 상태 확인 (이미 수락된 경우 프로젝트로 리다이렉트)
      const alreadyAccepted = await checkInvitationStatus();
      if (alreadyAccepted) {
        // 이미 리다이렉트됨
        return;
      }
      
      setIsLoading(false);
      console.log("[ProjectSignup] ✅ 초기화 완료");
    }
    
    init();
  }, [isMounted, checkUserEmail, checkInvitationStatus, router]);

  // 이메일 비교 (userEmail과 pendingInvite가 모두 설정된 후)
  useEffect(() => {
    if (isLoading || !userEmail) return;
    
    if (isInviteFlow && pendingInvite?.email) {
      const inviteEmail = pendingInvite.email.toLowerCase();
      const loggedInEmail = userEmail.toLowerCase();
      
      if (inviteEmail !== loggedInEmail) {
        console.log("[ProjectSignup] ⚠️ 이메일 불일치:", { inviteEmail, loggedInEmail });
        setShowWrongAccountModal(true);
      } else {
        console.log("[ProjectSignup] ✅ 이메일 일치:", userEmail);
      }
    }
  }, [isLoading, userEmail, isInviteFlow, pendingInvite?.email]);

  // 초대 수락 API 호출
  // ⚠️ 주의: clearPendingInviteInfo()는 여기서 호출하지 않음 (프로필 업데이트에서 projectId 필요)
  const acceptInvitation = async () => {
    if (!pendingInvite?.token) return;

    try {
      await MembersService.acceptInvitation({
        token: pendingInvite.token,
      });
      console.log("[ProjectSignup] ✅ 초대 수락 완료");
      // clearPendingInviteInfo()는 handleComplete 끝에서 호출
    } catch (err: any) {
      const errorCode = err?.data?.code;
      
      // 이미 수락된 초대인 경우 - 정상 처리
      if (errorCode === "INVITATION_ALREADY_ACCEPTED") {
        console.log("[ProjectSignup] ℹ️ 이미 수락된 초대 - 정상 진행");
        return;
      }
      
      // 그 외 에러는 throw
      throw err;
    }
  };

  // 완료 버튼 클릭
  const handleComplete = async () => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      // 초대 플로우인 경우 → 먼저 초대 수락 API 호출 (멤버로 편입)
      // ⚠️ 중요: 프로필 업데이트 전에 멤버로 편입되어야 함
      if (isInviteFlow) {
        console.log("[ProjectSignup] 🎉 초대 플로우 - 먼저 초대 수락 API 호출");
        await acceptInvitation();
      }

      // 멤버 프로필 업데이트 (이름/전화번호가 입력된 경우에만)
      // 초대 수락 후에 호출해야 프로젝트 멤버로서 업데이트 가능
      if (name.trim() || phone.trim()) {
        // 초대 플로우인 경우 projectId를 헤더로 전달
        const headers: Record<string, string> = {};
        if (isInviteFlow && pendingInvite?.projectId) {
          headers["x-project-id"] = String(pendingInvite.projectId);
          console.log("[ProjectSignup] 📌 x-project-id 헤더 설정:", pendingInvite.projectId);
        }
        
        // PATCH 메서드 특성상 빈 문자열은 필드를 제외해야 함
        const payload: UpdateProfilePayload = {};
        
        if (name.trim()) {
          payload.name = name.trim();
        }
        
        if (phone.trim()) {
          payload.phone = phone.trim();
        }
        
        await MembersService.updateSelf(
          payload,
          Object.keys(headers).length > 0 ? headers : undefined
        );
        console.log("[ProjectSignup] ✅ 프로필 업데이트 완료");
      }

      // 초대 정보 정리 (모든 작업 완료 후)
      if (isInviteFlow) {
        clearPendingInviteInfo();
        console.log("[ProjectSignup] 🧹 초대 정보 정리 완료");
      }

      // 프로젝트 선택 페이지로 이동 (zoom 적용을 위해 전체 페이지 새로고침)
      console.log("[ProjectSignup] 🎉 완료 - 프로젝트 선택으로 이동");
      window.location.replace("/projects");
    } catch (error: any) {
      console.error("[ProjectSignup] 처리 실패:", error);
      showErrorModal({
        title: "오류 발생",
        headline: "처리에 실패했습니다. 잠시 후 다시 시도해주세요.",
        confirmText: "확인",
        cancelText: null,
        hideCancel: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // 다른 계정 모달 - 취소 (프로젝트 선택으로)
  const handleCancelWrongAccount = () => {
    clearPendingInviteInfo();
    // 모달을 닫지 않고 바로 페이지 이동 (페이지 새로고침으로 모달도 자연스럽게 사라짐)
    // zoom 적용을 위해 전체 페이지 새로고침
    window.location.replace("/projects");
  };
  
  // 다른 계정 모달 - 로그아웃
  const handleLogoutAndRedirect = () => {
    // 초대 정보는 유지한 채로 로그아웃
    // 클라이언트에서 먼저 토큰 쿠키 삭제 (서버 삭제와 병행)
    clearTokens();
    // /logout route는 'redirect' 파라미터를 사용
    window.location.href = "/logout?redirect=" + encodeURIComponent("/login");
  };

  // AuthLayout을 한 번만 렌더링하여 zoom 설정이 유지되도록 함
  // (조건부로 여러 AuthLayout을 렌더링하면 언마운트/마운트 시 zoom이 복원됨)
  return (
    <AuthLayout ariaLabel="project-signup-area">
      {/* 로딩 중 (클라이언트 마운트 전 또는 초기화 중) */}
      {(!isMounted || isLoading) && (
        <div className="flex flex-col items-center justify-center gap-4">
          <div className="text-white text-[14px]">잠시만 기다려주세요...</div>
          <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        </div>
      )}

      {/* 잘못된 계정 모달 표시 중 */}
      {isMounted && !isLoading && showWrongAccountModal && (
        <WrongAccountModal
          loggedInEmail={userEmail}
          inviteEmail={pendingInvite?.email ?? null}
          socialProvider={
            typeof window !== "undefined"
              ? (sessionStorage.getItem("tg_last_social_provider") as "naver" | "kakao" | "google" | null)
              : null
          }
          onCancel={handleCancelWrongAccount}
          onLogout={handleLogoutAndRedirect}
        />
      )}

      {/* 메인 폼 */}
      {isMounted && !isLoading && !showWrongAccountModal && (
        <>
          <h1 className="sr-only">프로젝트 가입</h1>

          <div className="w-full space-y-6">
            {/* 안내 문구 */}
            <div className="text-center">
              <p className="text-white text-[14px] mb-1">
                프로젝트에서 사용할 정보를 입력해주세요
              </p>
            </div>
            

            {/* 이름 입력 */}
            <div>
              <label className="block text-[12px] mb-1 text-[#CECECE]">이름</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="이름을 입력하세요"
                className="w-full h-[40px] rounded-[5px] border border-[#555555] bg-transparent px-3 text-white placeholder-[#808080] focus:outline-none focus:border-[#00E272]"
                autoComplete="name"
              />
            </div>

            {/* 전화번호 입력 */}
            <div>
              <label className="block text-[12px] mb-1 text-[#CECECE]">핸드폰 번호</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="핸드폰 번호를 입력하세요"
                className="w-full h-[40px] rounded-[5px] border border-[#555555] bg-transparent px-3 text-white placeholder-[#808080] focus:outline-none focus:border-[#00E272]"
                autoComplete="tel"
              />
            </div>

            {/* 버튼 영역 */}
            <div className="flex gap-3 pt-2">
              <AsyncButton
                type="button"
                variant="auth"
                size="md"
                onClick={handleComplete}
                loading={isSubmitting}
                loadingText="처리 중..."
                className="w-full"
              >
                완료
              </AsyncButton>
            </div>
          </div>
        </>
      )}
    </AuthLayout>
  );
}

