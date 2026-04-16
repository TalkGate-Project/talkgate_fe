"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getSelectedProjectId } from "@/lib/project";
import { useMyMember } from "@/hooks/useMyMember";
import { hasAdminAccess } from "@/utils/permissions";
import { MembersService } from "@/services/members";
import type { MemberListItem, MemberRole } from "@/types/members";
import Pagination from "@/components/common/Pagination";
import InviteMemberModal from "@/components/common/InviteMemberModal";
import DeleteMemberModal from "@/components/common/DeleteMemberModal";
import ConfirmModal from "@/components/common/ConfirmModal";
import TeamMemberInfoModal from "./teamManagement/TeamMemberInfoModal";
import { showErrorModal } from "@/lib/errorModalEvents";
import { showConfirmModal } from "@/lib/confirmModalEvents";

const ROLE_LABELS: Record<string, string> = {
  admin: "총관리자",
  subAdmin: "부관리자",
  leader: "팀장",
  member: "멤버",
};

function getRoleChangeTargetRole(role?: MemberRole): "subAdmin" | "member" | null {
  if (role === "member" || role === "leader") {
    return "subAdmin";
  }

  if (role === "subAdmin") {
    return "member";
  }

  return null;
}

function getRoleChangeConfirmMessage(member: MemberListItem): string | null {
  if (member.role === "member") {
    return `${member.name} 멤버를 부관리자로 변경할까요?`;
  }

  if (member.role === "leader") {
    if (member.teamName) {
      return `${member.name} 멤버를 부관리자로 변경할까요? ${member.teamName}은 삭제됩니다.`;
    }

    return `${member.name} 멤버를 부관리자로 변경할까요? 현재 팀은 삭제됩니다.`;
  }

  if (member.role === "subAdmin") {
    return `${member.name} 멤버를 팀원으로 변경할까요?`;
  }

  return null;
}

function MemberRow({
  member,
  onDelete,
  onRoleChange,
  onInfoClick,
  canDelete,
  canManageRole,
  currentMemberId,
  isRoleChanging,
}: {
  member: MemberListItem;
  onDelete: (id: number) => void;
  onRoleChange: (member: MemberListItem) => void;
  onInfoClick: (id: number) => void;
  /** 현재 사용자가 삭제 권한이 있는지 (admin/subAdmin) */
  canDelete: boolean;
  /** 현재 사용자가 역할 변경 권한이 있는지 (admin) */
  canManageRole: boolean;
  /** 현재 로그인한 사용자의 멤버 id (본인 행에는 삭제 버튼 미표시) */
  currentMemberId: number | null;
  isRoleChanging: boolean;
}) {
  const isTargetAdmin = member.role === "admin";
  const isSelf = currentMemberId != null && member.id === currentMemberId;
  const avatar = member.name ? member.name[0] : "?";
  const nextRole = getRoleChangeTargetRole(member.role);
  const joinDate = new Date(member.createdAt)
    .toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })
    .replace(/\. /g, "-")
    .replace(".", "");

  // 삭제 버튼 표시 조건:
  // 1. 현재 사용자가 admin/subAdmin이어야 함 (canDelete)
  // 2. 삭제 대상이 admin이 아니어야 함 (admin은 삭제 불가)
  // 3. 삭제 대상이 본인이 아니어야 함 (본인은 삭제 불가)
  const showDeleteButton = canDelete && !isTargetAdmin && !isSelf;
  const showRoleChangeButton =
    canManageRole && !isTargetAdmin && !isSelf && nextRole !== null;

  return (
    <>
      {/* Desktop View */}
      <div className="hidden md:flex items-center py-3 px-10 h-[80px]">
        {/* Member Info */}
        <div
          className="flex items-center gap-4 w-[280px] min-w-[280px] flex-none cursor-pointer hover:opacity-80 transition-opacity"
          onClick={() => onInfoClick(member.id)}
        >
          {/* Avatar */}
          <div
            className={`w-12 h-12 rounded-full flex items-center justify-center text-neutral-0 font-semibold text-[18px] flex-shrink-0 ${isTargetAdmin ? "bg-primary-80" : "bg-neutral-60"
              }`}
          >
            {avatar}
          </div>

          {/* Name and Email */}
          <div className="overflow-hidden">
            <div className="flex items-center gap-2">
              <span className="text-[16px] font-semibold text-neutral-90 truncate">
                {member.name}
              </span>
              {isTargetAdmin && (
                <span className="px-2 py-1 bg-primary-10 text-primary-80 text-[12px] font-medium rounded-[5px] flex-shrink-0">
                  Admin
                </span>
              )}
            </div>
            <div className="text-[14px] text-neutral-60 font-medium truncate">
              {member.email || `ID: ${member.userId}`}
            </div>
          </div>
        </div>

        {/* Role */}
        <div className="flex-1 min-w-[120px] text-left">
          <div className="flex items-center gap-1.5">
            <span className="text-[14px] font-medium text-neutral-90">
              {member.role ? ROLE_LABELS[member.role] || member.role : "-"}
            </span>
            {showRoleChangeButton && (
              <button
                type="button"
                onClick={() => onRoleChange(member)}
                disabled={isRoleChanging}
                aria-label={`${member.name} 역할 변경`}
                className="cursor-pointer w-6 h-6 flex items-center justify-center hover:bg-neutral-10 rounded transition-colors disabled:cursor-not-allowed disabled:opacity-50"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M8 7L20 7M20 7L16 3M20 7L16 11M16 17L4 17M4 17L8 21M4 17L8 13" stroke="#B0B0B0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Affiliation */}
        <div
          className={`flex-1 min-w-[120px] text-[14px] font-medium text-left truncate ${member.teamName ? "text-neutral-90" : "text-neutral-60"
            }`}
        >
          {member.teamName || "소속없음"}
        </div>

        {/* Join Date */}
        <div className="flex-1 min-w-[100px] text-[14px] font-medium text-neutral-90 text-left">
          {joinDate}
        </div>

        {/* Delete Button - admin/subAdmin만 볼 수 있고, 대상이 admin이 아닐 때만 표시 */}
        <div className="flex items-center justify-end w-[80px] min-w-[80px] flex-none pr-[60px]">
          {showDeleteButton && (
            <button
              onClick={() => onDelete(member.id)}
              className="cursor-pointer w-6 h-6 flex items-center justify-center hover:bg-neutral-10 rounded transition-colors"
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M19 7L18.1327 19.1425C18.0579 20.1891 17.187 21 16.1378 21H7.86224C6.81296 21 5.94208 20.1891 5.86732 19.1425L5 7M10 11V17M14 11V17M15 7V4C15 3.44772 14.5523 3 14 3H10C9.44772 3 9 3.44772 9 4V7M4 7H20"
                  stroke="#B0B0B0"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Mobile View - 테이블 형식 3개 열 */}
      <div className="md:hidden flex items-center py-3 pl-0.5 pr-4">
        {/* 이메일 열 - 프로필 썸네일 + 이름 + 이메일 */}
        <div
          className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer hover:opacity-80 transition-opacity"
          onClick={() => onInfoClick(member.id)}
        >
          {/* Avatar */}
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center text-neutral-0 font-semibold text-[16px] flex-shrink-0 ${isTargetAdmin ? "bg-primary-80" : "bg-neutral-60"
              }`}
          >
            {avatar}
          </div>

          {/* Name and Email */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[14px] font-semibold text-neutral-90 truncate">
                {member.name}
              </span>
              {isTargetAdmin && (
                <span className="px-1.5 py-0.5 bg-primary-10 text-primary-80 text-[11px] font-medium rounded-[5px] flex-shrink-0">
                  Admin
                </span>
              )}
            </div>
            <div className="text-[12px] text-neutral-60 font-medium truncate">
              {member.email || `ID: ${member.userId}`}
            </div>
          </div>
        </div>

        {/* 역할 열 */}
        <div className="w-[88px] flex-none text-left">
          <div className="flex items-center gap-1">
            <span className="text-[14px] font-medium text-neutral-90">
              {member.role ? ROLE_LABELS[member.role] || member.role : "-"}
            </span>
            {showRoleChangeButton && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onRoleChange(member);
                }}
                disabled={isRoleChanging}
                aria-label={`${member.name} 역할 변경`}
                className="cursor-pointer w-5 h-5 flex items-center justify-center hover:bg-neutral-10 rounded transition-colors disabled:cursor-not-allowed disabled:opacity-50"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M8 7L20 7M20 7L16 3M20 7L16 11M16 17L4 17M4 17L8 21M4 17L8 13" stroke="#B0B0B0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* 삭제 버튼 열 */}
        <div className="w-8 flex-none flex items-center justify-center">
          {showDeleteButton && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(member.id);
              }}
              className="cursor-pointer w-6 h-6 flex items-center justify-center hover:bg-neutral-10 rounded transition-colors"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M19 7L18.1327 19.1425C18.0579 20.1891 17.187 21 16.1378 21H7.86224C6.81296 21 5.94208 20.1891 5.86732 19.1425L5 7M10 11V17M14 11V17M15 7V4C15 3.44772 14.5523 3 14 3H10C9.44772 3 9 3.44772 9 4V7M4 7H20"
                  stroke="#B0B0B0"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Divider */}
      <div className="w-full h-[1px] bg-neutral-30 opacity-50"></div>
    </>
  );
}

export default function MemberSettings() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const [projectId, setProjectId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [searchName, setSearchName] = useState("");
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [roleChangingMemberId, setRoleChangingMemberId] = useState<number | null>(null);
  const [selectedMember, setSelectedMember] = useState<MemberListItem | null>(
    null
  );
  const [selectedMemberIdForInfo, setSelectedMemberIdForInfo] = useState<number | null>(null);

  useEffect(() => {
    const id = getSelectedProjectId();
    setProjectId(id);
  }, []);

  // 쿼리스트링에서 openInvite 확인하여 모달 열기
  useEffect(() => {
    const openInvite = searchParams.get("openInvite");
    if (openInvite === "true") {
      setIsInviteModalOpen(true);
      // 쿼리스트링에서 openInvite 제거
      const params = new URLSearchParams(searchParams.toString());
      params.delete("openInvite");
      const newQuery = params.toString();
      router.replace(`/settings?tab=member${newQuery ? `&${newQuery}` : ""}`, { scroll: false });
    }
  }, [searchParams, router]);

  // 현재 사용자 정보 조회
  const { member: myMember } = useMyMember(projectId);
  const myRole = myMember?.role;

  // 권한 체크
  const isAdminOrSubAdmin = hasAdminAccess(myRole);
  const canManageRole = myRole === "admin";
  const canLeaveProject = !isAdminOrSubAdmin && myRole !== undefined;

  // 멤버 목록 조회
  const { data: membersData, isLoading } = useQuery({
    queryKey: ["members", "list", projectId, currentPage, searchName],
    queryFn: async () => {
      const response = await MembersService.list({
        page: currentPage,
        limit: 10,
        ...(searchName ? { name: searchName } : {}),
      });
      return response.data;
    },
    enabled: !!projectId,
  });

  const members = membersData?.data?.members || [];
  const totalPages = membersData?.data?.totalPages || 1;

  // 멤버 초대 mutation
  const inviteMutation = useMutation({
    mutationFn: (payload: { email: string; role: "subAdmin" | "member" }) =>
      MembersService.invite(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["members", "list", projectId],
      });
      setIsInviteModalOpen(false);
      showErrorModal({
        type: "success",
        headline: "멤버 초대가 완료되었습니다.",
        hideCancel: true,
      });
    },
    onError: (error: any) => {
      const errorCode = error?.data?.code;
      const errorStatus = error?.status;
      const errorMessage = error?.data?.message || "";

      // 403 + MEMBER_COUNT_LIMIT_EXCEEDED: 멤버 수 한도 초과
      if (errorStatus === 403 && errorCode === "MEMBER_COUNT_LIMIT_EXCEEDED") {
        showErrorModal({
          type: "error",
          headline: "현재 요금제의 멤버 수 한도에 도달했습니다.",
          hideCancel: true,
        });
        return;
      }

      if (
        errorCode === "INVITATION_ALREADY_EXISTS" ||
        errorMessage.includes("Invitation already exists")
      ) {
        showErrorModal({
          type: "error",
          headline: "이미 초대중인 이메일입니다.",
          hideCancel: true,
        });
      } else if (
        errorCode === "ALREADY_PROJECT_MEMBER" ||
        errorMessage.includes("already a member")
      ) {
        showErrorModal({
          type: "error",
          headline: "이미 등록된 멤버입니다.",
          hideCancel: true,
        });
      } else {
        showErrorModal({
          type: "error",
          headline: "멤버 초대에 실패했습니다. 잠시 후 다시 시도해주세요.",
          hideCancel: true,
        });
      }
    },
  });

  // 멤버 삭제 mutation
  const deleteMutation = useMutation({
    mutationFn: (memberId: number) =>
      MembersService.remove(memberId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["members", "list", projectId],
      });
      setIsDeleteModalOpen(false);
      setSelectedMember(null);
      showErrorModal({
        type: "success",
        headline: "멤버가 삭제되었습니다.",
        hideCancel: true,
      });
    },
    onError: () => {
      showErrorModal({
        type: "error",
        headline: "멤버 삭제에 실패했습니다. 잠시 후 다시 시도해주세요.",
        hideCancel: true,
      });
    },
  });

  const roleChangeMutation = useMutation({
    mutationFn: ({
      memberId,
      role,
    }: {
      memberId: number;
      role: "subAdmin" | "member";
    }) => MembersService.updateRole({ memberId, role }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["members"],
      });
      queryClient.invalidateQueries({
        queryKey: ["members-tree"],
      });
      setRoleChangingMemberId(null);
      showErrorModal({
        type: "success",
        headline: `${ROLE_LABELS[variables.role]}로 권한이 변경되었습니다.`,
        hideCancel: true,
      });
    },
    onError: (error: any) => {
      setRoleChangingMemberId(null);

      const errorCode = error?.data?.code;

      if (errorCode === "FORBIDDEN") {
        showErrorModal({
          type: "error",
          headline: "권한 변경 권한이 없습니다.",
          hideCancel: true,
        });
        return;
      }

      if (errorCode === "MEMBER_NOT_FOUND") {
        showErrorModal({
          type: "error",
          headline: "대상 멤버를 찾을 수 없습니다.",
          hideCancel: true,
        });
        return;
      }

      showErrorModal({
        type: "error",
        headline: "권한 변경에 실패했습니다. 잠시 후 다시 시도해주세요.",
        hideCancel: true,
      });
    },
  });

  const handleDelete = (id: number) => {
    const member = members.find((m: MemberListItem) => m.id === id);
    if (member) {
      setSelectedMember(member);
      setIsDeleteModalOpen(true);
    }
  };

  const handleInviteConfirm = (email: string, role: "subAdmin" | "member") => {
    inviteMutation.mutate({ email, role });
  };

  const handleDeleteConfirm = () => {
    if (selectedMember) {
      deleteMutation.mutate(selectedMember.id);
    }
  };

  const handleRoleChange = (member: MemberListItem) => {
    const nextRole = getRoleChangeTargetRole(member.role);
    const message = getRoleChangeConfirmMessage(member);

    if (!nextRole || !message) {
      return;
    }

    showConfirmModal({
      title: "권한 변경",
      message,
      confirmText: "변경하기",
      cancelText: "취소",
      onConfirm: () => {
        setRoleChangingMemberId(member.id);
        roleChangeMutation.mutate({
          memberId: member.id,
          role: nextRole,
        });
      },
    });
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // 페이지 변경 시 스크롤을 맨 위로 (부드럽게)
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSearchSubmit = () => {
    setSearchName(searchInput.trim());
    setCurrentPage(1);
  };

  if (!projectId) {
    return (
      <div className="bg-card rounded-[14px] p-6">
        <p className="text-neutral-60">프로젝트를 선택해주세요.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="bg-card rounded-[14px] p-6">
        <p className="text-neutral-60">멤버 목록을 불러오는 중...</p>
      </div>
    );
  }

  // 프로젝트 탈퇴 핸들러
  const handleLeaveProject = () => {
    setIsLeaveModalOpen(true);
  };

  const handleLeaveConfirm = () => {
    // TODO: 프로젝트 탈퇴 API 연동
    // - 현재 프로젝트에서 내 멤버십(leader/member) 해제
    // - 성공 시 프로젝트 목록 또는 대시보드 등으로 리다이렉트 처리
    setIsLeaveModalOpen(false);
  };

  return (
    <div className="bg-card rounded-[14px] rounded-t-none md:rounded-t-[14px] pb-4 md:pb-7">
      {/* Header */}
      <div className="flex items-center justify-between px-4 md:px-7 py-4 md:py-0 md:h-[76px] gap-3 md:gap-0">
        <h1 className="text-[18px] md:text-[24px] font-bold text-foreground leading-5">
          팀 멤버 관리
        </h1>

        {/* 버튼 영역 - 권한에 따라 다른 버튼 표시 */}
        <div className="flex items-center gap-2 md:gap-3">
          {/* 프로젝트 탈퇴 버튼 - leader/member만 표시 */}
          {canLeaveProject && (
            <button
              onClick={handleLeaveProject}
              className="cursor-pointer flex items-center justify-center px-3 py-1.5 gap-2.5 bg-neutral-90 text-neutral-0 rounded-[5px] text-[14px] font-semibold hover:opacity-90 transition-colors whitespace-nowrap"
            >
              프로젝트 탈퇴
            </button>
          )}
        </div>
      </div>

      {/* Divider */}
      <div className="w-full h-[1px] bg-neutral-30 opacity-70 mb-4 md:mb-6 px-4 md:px-7"></div>

      <div className="px-4 md:px-7">
        <div className="relative w-full md:w-[260px] mb-4 md:mb-6">
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleSearchSubmit();
              }
            }}
            placeholder="이름으로 검색..."
            className="w-full h-10 rounded-[5px] border border-neutral-30 bg-neutral-10 dark:bg-neutral-20 px-3 pr-10 text-[14px] text-foreground placeholder:text-neutral-50 focus:outline-none focus:border-primary-50"
          />
          <button
            type="button"
            onClick={handleSearchSubmit}
            className="absolute right-1 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-[5px] hover:bg-neutral-20 dark:hover:bg-neutral-30 transition-colors cursor-pointer"
            aria-label="멤버 이름 검색"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden
            >
              <circle cx="11" cy="11" r="7" stroke="#B0B0B0" strokeWidth="2" />
              <path d="M20 20L16.65 16.65" stroke="#B0B0B0" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Table Header - 모바일: 3개 열, 데스크탑: 5개 열 */}
        {/* Mobile Header */}
        <div className="md:hidden bg-neutral-20 dark:bg-neutral-20 rounded-[8px] px-4 h-[40px] flex items-center">
          <div className="flex items-center w-full">
            <div className="flex-1 text-[14px] font-medium text-neutral-60 dark:text-neutral-60 text-left">
              이메일
            </div>
            <div className="w-[88px] flex-none text-[14px] font-medium text-neutral-60 dark:text-neutral-60 text-left">
              역할
            </div>
            <div className="w-8 flex-none"></div>
          </div>
        </div>

        {/* Desktop Header */}
        <div className="hidden bg-neutral-20 dark:bg-neutral-20 rounded-[8px] px-10 h-10 leading-10 md:flex items-center">
          <div className="flex items-center w-full">
            <div className="w-[280px] min-w-[280px] flex-none text-[16px] font-medium text-neutral-60 dark:text-neutral-60 text-left">
              멤버
            </div>
            <div className="flex-1 min-w-[120px] text-[16px] font-medium text-neutral-60 dark:text-neutral-60 text-left">
              역할
            </div>
            <div className="flex-1 min-w-[120px] text-[16px] font-medium text-neutral-60 dark:text-neutral-60 text-left">
              소속
            </div>
            <div className="flex-1 min-w-[100px] text-[16px] font-medium text-neutral-60 dark:text-neutral-60 text-left">
              가입일
            </div>
            <div className="w-[80px] min-w-[80px] flex-none"></div>
          </div>
        </div>

        {/* Member List */}
        <div className="space-y-0">
          {members.length === 0 ? (
            <div className="py-8 text-center text-neutral-60 text-[14px]">
              {searchName ? "검색 결과가 없습니다." : "멤버가 없습니다."}
            </div>
          ) : (
            members.map((member: MemberListItem) => (
              <MemberRow
                key={member.id}
                member={member}
                onDelete={handleDelete}
                onRoleChange={handleRoleChange}
                onInfoClick={(id) => setSelectedMemberIdForInfo(id)}
                canDelete={isAdminOrSubAdmin}
                canManageRole={canManageRole}
                currentMemberId={myMember?.id ?? null}
                isRoleChanging={roleChangingMemberId === member.id}
              />
            ))
          )}
        </div>
      </div>

      {/* Pagination */}
      <div className="flex justify-center mt-4 md:mt-8">
        <Pagination
          page={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
      </div>

      {/* Invite Member Modal */}
      <InviteMemberModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        onInvite={handleInviteConfirm}
      />

      {/* Delete Member Modal */}
      <DeleteMemberModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        member={selectedMember}
      />

      {/* Leave Project Modal */}
      <ConfirmModal
        open={isLeaveModalOpen}
        onCancel={() => setIsLeaveModalOpen(false)}
        onConfirm={handleLeaveConfirm}
        title="프로젝트 탈퇴"
        headline="정말로 프로젝트를 탈퇴하시겠습니까?"
        description={
          "탈퇴 시 본 프로젝트에 대한 모든 접근 권한이 상실되며,\n재참여는 관리자의 승인을 통해서만 가능합니다."
        }
        confirmText="탈퇴하기"
        cancelText="취소"
      />

      {/* Team Member Info Modal */}
      {selectedMemberIdForInfo && (
        <TeamMemberInfoModal
          open={Boolean(selectedMemberIdForInfo)}
          memberId={selectedMemberIdForInfo}
          onClose={() => setSelectedMemberIdForInfo(null)}
          projectId={projectId}
        />
      )}
    </div>
  );
}
