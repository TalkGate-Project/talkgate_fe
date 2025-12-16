"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getSelectedProjectId } from "@/lib/project";
import { useMyMember } from "@/hooks/useMyMember";
import { hasAdminAccess } from "@/utils/permissions";
import { MembersService } from "@/services/members";
import type { MemberListItem } from "@/types/members";
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

function MemberRow({
  member,
  onDelete,
  onInfoClick,
  canDelete,
}: {
  member: MemberListItem;
  onDelete: (id: number) => void;
  onInfoClick: (id: number) => void;
  /** 현재 사용자가 삭제 권한이 있는지 (admin/subAdmin) */
  canDelete: boolean;
}) {
  const isTargetAdmin = member.role === "admin";
  const avatar = member.name ? member.name[0] : "?";
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
  const showDeleteButton = canDelete && !isTargetAdmin;

  return (
    <>
      <div className="flex items-center py-3 px-10 h-[80px]">
        {/* Member Info */}
        <div 
          className="flex items-center gap-4 w-[280px] min-w-[280px] flex-none cursor-pointer hover:opacity-80 transition-opacity"
          onClick={() => onInfoClick(member.id)}
        >
          {/* Avatar */}
          <div
            className={`w-12 h-12 rounded-full flex items-center justify-center text-neutral-0 font-semibold text-[18px] flex-shrink-0 ${
              isTargetAdmin ? "bg-primary-80" : "bg-neutral-60"
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
        <div className="flex-1 min-w-[120px] text-[14px] font-medium text-neutral-90 text-left">
          {member.role ? ROLE_LABELS[member.role] || member.role : "-"}
        </div>

        {/* Affiliation */}
        <div
          className={`flex-1 min-w-[120px] text-[14px] font-medium text-left truncate ${
            member.teamName ? "text-neutral-90" : "text-neutral-60"
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
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
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
  const canLeaveProject = !isAdminOrSubAdmin && myRole !== undefined;

  // 멤버 목록 조회
  const { data: membersData, isLoading } = useQuery({
    queryKey: ["members", "list", projectId, currentPage],
    queryFn: async () => {
      const response = await MembersService.list({
        page: currentPage,
        limit: 10,
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
      const errorMessage = error?.data?.message || "";
      
      // 영어 에러 메시지를 한글로 변환
      let displayMessage = "잠시 후 다시 시도해 주세요.";
      if (errorMessage.includes("Invitation already exists")) {
        displayMessage = "이미 초대중인 이메일입니다.";
      } else if (errorMessage.includes("already a member")) {
        displayMessage = "이미 등록된 멤버입니다.";
      }
      
      showErrorModal({
        type: "error",
        headline: "멤버 초대에 실패했습니다.",
        description: displayMessage,
        hideCancel: true,
      });
    },
  });

  // 멤버 삭제 mutation
  const deleteMutation = useMutation({
    mutationFn: (payload: { memberIds: number[] }) =>
      MembersService.remove(payload),
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
        headline: "멤버 삭제에 실패했습니다.",
        description: "잠시 후 다시 시도해 주세요.",
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

  const handleInviteMember = () => {
    setIsInviteModalOpen(true);
  };

  const handleInviteConfirm = (email: string, role: "subAdmin" | "member") => {
    inviteMutation.mutate({ email, role });
  };

  const handleDeleteConfirm = () => {
    if (selectedMember) {
      deleteMutation.mutate({ memberIds: [selectedMember.id] });
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // 페이지 변경 시 스크롤을 맨 위로 (부드럽게)
    window.scrollTo({ top: 0, behavior: "smooth" });
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
    <div className="bg-card rounded-[14px] pb-7">
      {/* Header */}
      <div className="flex items-center justify-between px-7 h-[76px]">
        <h1 className="text-[24px] font-bold text-foreground leading-5">
          팀 멤버 관리
        </h1>
        
        {/* 버튼 영역 - 권한에 따라 다른 버튼 표시 */}
        <div className="flex items-center gap-3">
          {/* 프로젝트 탈퇴 버튼 - leader/member만 표시 */}
          {canLeaveProject && (
            <button
              onClick={handleLeaveProject}
              className="cursor-pointer flex items-center justify-center px-3 py-1.5 gap-2.5 bg-neutral-90 text-neutral-0 rounded-[5px] text-[14px] font-semibold hover:opacity-90 transition-colors"
            >
              프로젝트 탈퇴
            </button>
          )}
          
          {/* 멤버초대 버튼 - admin/subAdmin만 표시 */}
          {isAdminOrSubAdmin && (
            <button
              onClick={handleInviteMember}
              className="cursor-pointer flex items-center justify-center px-3 py-1.5 gap-2.5 bg-neutral-90 text-neutral-0 rounded-[5px] text-[14px] font-semibold hover:opacity-90 transition-colors"
            >
              멤버초대
            </button>
          )}
        </div>
      </div>

      {/* Divider */}
      <div className="w-full h-[1px] bg-neutral-30 opacity-70 mb-6 px-7"></div>

      <div className="px-7">
        {/* Table Header */}
        <div className="bg-neutral-20 dark:bg-neutral-20 rounded-[8px] px-10 h-[40px] flex items-center">
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
            <div className="py-8 text-center text-neutral-60">
              멤버가 없습니다.
            </div>
          ) : (
            members.map((member: MemberListItem) => (
              <MemberRow
                key={member.id}
                member={member}
                onDelete={handleDelete}
                onInfoClick={(id) => setSelectedMemberIdForInfo(id)}
                canDelete={isAdminOrSubAdmin}
              />
            ))
          )}
        </div>
      </div>

      {/* Pagination */}
      <div className="flex justify-center mt-8">
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
