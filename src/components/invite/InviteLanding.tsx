"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { MembersService } from "@/services/members";
import { AuthService } from "@/services/auth";
import {
  savePendingInviteInfo,
  clearPendingInviteInfo,
  type PendingInviteInfo,
} from "@/lib/invite";
import { performLogout } from "@/lib/logout";
import loginBgImg from "@/assets/images/auth/login_bg.webp";
import { showErrorModal } from "@/providers/ErrorFeedbackModalProvider";
import { EnvelopeAnimation } from "./EnvelopeAnimation";
import { WrongAccountModal } from "./WrongAccountModal";
import { getUserFriendlyErrorMessage } from "@/utils/errorMessages";

// 개발용 토큰 - 백엔드 없이 UI 테스트용
const DEV_TOKEN = "developmentmastertoken";

// 컴팩트 모드 zoom 값 (AuthLayout과 동일)
const COMPACT_ZOOM = 0.8;

const DEV_INVITE_INFO = {
  projectName: "테스트 프로젝트",
  projectId: "dev-project-123",
  inviterName: "홍길동",
  inviterEmail: "test@example.com",
  role: "MEMBER",
  expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
};

export function InviteLanding() {
  const router = useRouter();
  const search = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [inviteInfo, setInviteInfo] = useState<any>(null);
  const [isEnvelopeOpen, setIsEnvelopeOpen] = useState(false);
  const [isTokenValid, setIsTokenValid] = useState(false);
  
  // 로그인 상태 관련
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loggedInEmail, setLoggedInEmail] = useState<string | null>(null);
  const [showWrongAccountModal, setShowWrongAccountModal] = useState(false);

  const token = useMemo(() => search.get("token") || "", [search]);

  // Auth 페이지와 동일하게 zoom을 1로 강제 설정
  useEffect(() => {
    if (typeof document === "undefined") return;

    const body = document.body;
    // 현재 zoom 값 저장 (복원용)
    const originalZoom = (body.style as any).zoom || String(COMPACT_ZOOM);
    const originalTransform = body.style.transform || "";
    const originalTransformOrigin = body.style.transformOrigin || "";
    const originalMinHeight = body.style.minHeight || "";

    // zoom을 1로 강제 설정
    (body.style as any).zoom = "1";
    body.style.transform = "";
    body.style.transformOrigin = "";
    body.style.minHeight = "";

    // cleanup: 원래 zoom 값으로 복원
    return () => {
      (body.style as any).zoom = originalZoom;
      body.style.transform = originalTransform;
      body.style.transformOrigin = originalTransformOrigin;
      body.style.minHeight = originalMinHeight;
    };
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
          // 개발용 토큰으로 UI 테스트 모드 진입
          setInviteInfo(DEV_INVITE_INFO);
          setIsTokenValid(true);
          if (mounted) setLoading(false);
          return;
        }

        // 토큰 검증
        const res = await MembersService.verifyInvitation({ token });
        const payload: any = (res as any)?.data;
        // 백엔드 응답: { result, data: { isValid, invitation: {...} } }
        const inviteData = payload?.data?.invitation ?? payload?.invitation ?? payload?.data ?? payload ?? {};
        setInviteInfo(inviteData);
        setIsTokenValid(true);

        // 로그인 상태 확인 (401 시 자동 로그아웃 방지)
        try {
          const meRes = await AuthService.me({ suppressAutoLogout: true });
          const userData = (meRes as any)?.data?.data ?? (meRes as any)?.data;
          if (userData?.email) {
            setIsLoggedIn(true);
            setLoggedInEmail(userData.email);
            
            // 이메일 비교: 초대 이메일과 로그인 이메일이 다른 경우
            const inviteEmail = inviteData?.email?.toLowerCase();
            const userEmail = userData.email?.toLowerCase();
            
            if (inviteEmail && userEmail && inviteEmail !== userEmail) {
              // 다른 계정으로 로그인된 경우 - 모달 표시
              setShowWrongAccountModal(true);
            }
          }
        } catch {
          // 로그인되지 않은 상태
          setIsLoggedIn(false);
          setLoggedInEmail(null);
        }
      } catch (e: any) {
        // 사용자 친화적인 에러 메시지로 변환
        const userFriendlyMessage = getUserFriendlyErrorMessage(e);
        setError(userFriendlyMessage || "초대 정보를 확인할 수 없습니다. 잠시 후 다시 시도해주세요.");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    init();
    return () => {
      mounted = false;
    };
  }, [token, router]);

  // 토큰이 유효하고 로딩이 끝나면 자동으로 봉투 열기 (잘못된 계정 모달이 없을 때만)
  useEffect(() => {
    if (!loading && isTokenValid && !showWrongAccountModal) {
      const timer = setTimeout(() => {
        setIsEnvelopeOpen(true);
      }, 500); // 0.5초 후 오픈
      return () => clearTimeout(timer);
    }
  }, [loading, isTokenValid, showWrongAccountModal]);

  async function onAccept() {
    if (!token) {
      showErrorModal({
        title: "오류 발생",
        headline: "유효하지 않은 초대 토큰입니다.",
        confirmText: "확인",
        cancelText: null,
        hideCancel: true,
      });
      return;
    }

    // 초대 정보를 localStorage에 저장 (invitation 객체 전체)
    // /v1/members/invitations/verify 응답 스키마:
    // { id, projectId, projectName, role, email, token, expiresAt, status, createdAt, updatedAt }
    const inviteInfoToSave: PendingInviteInfo = {
      // 필수 필드
      token,
      email: inviteInfo?.email || "",
      projectName: inviteInfo?.projectName || "",
      projectId: inviteInfo?.projectId || 0,
      // invitation 객체의 모든 필드
      id: inviteInfo?.id,
      role: inviteInfo?.role,
      status: inviteInfo?.status,
      expiresAt: inviteInfo?.expiresAt,
      createdAt: inviteInfo?.createdAt,
      updatedAt: inviteInfo?.updatedAt,
      // 초대자 정보 (있는 경우)
      inviterName: inviteInfo?.inviterName,
    };
    savePendingInviteInfo(inviteInfoToSave);

    // 개발용 토큰인 경우
    if (token === DEV_TOKEN) {
      router.replace("/login");
      return;
    }

    // 로그인된 상태이고 이메일이 일치하는 경우 → 프로젝트 가입 페이지로 이동 (이름/연락처 입력)
    if (isLoggedIn && loggedInEmail) {
      const inviteEmail = inviteInfo?.email?.toLowerCase();
      const userEmail = loggedInEmail?.toLowerCase();
      
      if (inviteEmail === userEmail) {
        // 이메일 일치 - 프로젝트 가입 페이지로 이동
        router.replace("/project-signup");
        return;
      }
    }

    // 로그인되지 않은 경우 → 로그인 페이지로 이동
    // QA 요구사항: 로그인 또는 회원가입 후 초대 수락 진행
    router.replace("/login");
  }

  function onDecline() {
    clearPendingInviteInfo();
    router.replace("/login");
  }

  // 로그아웃 후 로그인 페이지로 이동
  function handleLogoutAndRedirect() {
    // 초대 정보는 유지 (invitation 객체 전체)
    const inviteInfoToSave: PendingInviteInfo = {
      token,
      email: inviteInfo?.email || "",
      projectName: inviteInfo?.projectName || "",
      projectId: inviteInfo?.projectId || 0,
      id: inviteInfo?.id,
      role: inviteInfo?.role,
      status: inviteInfo?.status,
      expiresAt: inviteInfo?.expiresAt,
      createdAt: inviteInfo?.createdAt,
      updatedAt: inviteInfo?.updatedAt,
      inviterName: inviteInfo?.inviterName,
    };
    savePendingInviteInfo(inviteInfoToSave);
    
    // 통합 로그아웃 함수 사용 (초대 정보 유지)
    performLogout({
      redirectUrl: "/login",
      preserveInviteInfo: true,
    });
  }

  function handleCancelWrongAccount() {
    clearPendingInviteInfo();
    // 모달을 닫지 않고 바로 페이지 이동 (페이지 새로고침으로 모달도 자연스럽게 사라짐)
    // zoom 적용을 위해 전체 페이지 새로고침
    window.location.replace("/projects");
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
      {/* 다른 계정으로 로그인된 경우 모달 */}
      {showWrongAccountModal && (
        <WrongAccountModal
          loggedInEmail={loggedInEmail}
          inviteEmail={inviteInfo?.email}
          socialProvider={
            typeof window !== "undefined"
              ? (sessionStorage.getItem("tg_last_social_provider") as "naver" | "kakao" | "google" | null)
              : null
          }
          onCancel={handleCancelWrongAccount}
          onLogout={handleLogoutAndRedirect}
        />
      )}
      
      <div className="w-full max-w-4xl mx-auto px-4">
        {loading ? (
          <div className="text-center text-white text-xl">
            초대 정보를 불러오는 중...
          </div>
        ) : error ? (
          <div className="text-center text-red-300 text-xl">{error}</div>
        ) : isTokenValid && !showWrongAccountModal ? (
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

