import type { MemberRole, MyMember } from "@/types/members";

/**
 * 총관리자(admin) 권한 확인
 */
export const isAdmin = (role?: MemberRole | null): boolean => role === "admin";

/**
 * 부관리자(subAdmin) 권한 확인
 */
export const isSubAdmin = (role?: MemberRole | null): boolean => role === "subAdmin";

/**
 * 팀장(leader) 권한 확인
 */
export const isLeader = (role?: MemberRole | null): boolean => role === "leader";

/**
 * 일반 멤버(member) 권한 확인
 */
export const isMember = (role?: MemberRole | null): boolean => role === "member";

/**
 * 관리자 권한 확인 (admin 또는 subAdmin)
 * - 대부분의 프로젝트 설정 변경 권한
 */
export const hasAdminAccess = (role?: MemberRole | null): boolean =>
  role === "admin" || role === "subAdmin";

/**
 * 일반 설정 탭 접근 권한
 *
 * - **총관리자(admin)만** 접근 가능
 * - my 멤버 정보가 없거나, 역할이 명확하지 않은 경우에도 차단
 *   (백엔드에서 내려주는 my API 데이터에 의존해 조금 더 보수적으로 체크)
 */
export const canAccessGeneralSettings = (member: MyMember | null | undefined): boolean => {
  if (!member) return false;
  return member.role === "admin";
};

/**
 * 리더 이상 권한 확인 (admin, subAdmin, leader)
 * - 팀원 관리 권한
 * - 고객 할당 권한
 */
export const hasLeaderAccess = (role?: MemberRole | null): boolean =>
  role === "admin" || role === "subAdmin" || role === "leader";

/**
 * 출퇴근 버튼 표시 여부
 * - admin, subAdmin은 출퇴근 기록 불필요
 */
export const shouldShowAttendanceButton = (role?: MemberRole | null): boolean =>
  role !== "admin" && role !== "subAdmin" && role !== undefined && role !== null;

/**
 * 역할 한글 라벨 반환
 */
export const getRoleLabel = (role?: MemberRole | null): string => {
  const labels: Record<MemberRole, string> = {
    admin: "총관리자",
    subAdmin: "부관리자",
    leader: "팀장",
    member: "멤버",
  };
  return role ? labels[role] : "-";
};

