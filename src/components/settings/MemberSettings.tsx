"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getSelectedProjectId } from "@/lib/project";
import { MembersService } from "@/services/members";
import type { MemberListItem } from "@/types/members";
import Pagination from "@/components/common/Pagination";
import InviteMemberModal from "@/components/common/InviteMemberModal";
import DeleteMemberModal from "@/components/common/DeleteMemberModal";

const ROLE_LABELS: Record<string, string> = {
  admin: "총관리자",
  subAdmin: "부관리자",
  leader: "팀장",
  member: "멤버",
};

function MemberRow({ member, onDelete }: { member: MemberListItem; onDelete: (id: number) => void }) {
  const isAdmin = member.role === "admin";
  const avatar = member.name ? member.name[0] : "?";
  const joinDate = new Date(member.createdAt).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).replace(/\. /g, "-").replace(".", "");

  return (
    <>
      <div className="flex items-center py-4 px-6">
        {/* Member Info */}
        <div className="flex items-center gap-4 w-[280px] min-w-[280px]">
          {/* Avatar */}
          <div className={`w-12 h-12 rounded-full flex items-center justify-center text-neutral-0 font-semibold text-[18px] flex-shrink-0 ${
            isAdmin ? "bg-primary-80" : "bg-neutral-60"
          }`}>
            {avatar}
          </div>
          
          {/* Name and Email */}
          <div className="overflow-hidden">
            <div className="flex items-center gap-2">
              <span className="text-[16px] font-semibold text-neutral-90 truncate">
                {member.name}
              </span>
              {isAdmin && (
                <span className="px-2 py-1 bg-primary-10 text-primary-80 text-[12px] font-medium rounded-[5px] flex-shrink-0">
                  Admin
                </span>
              )}
            </div>
            <div className="text-[14px] text-neutral-60 truncate">
              {member.email || `ID: ${member.userId}`}
            </div>
          </div>
        </div>

        {/* Role */}
        <div className="w-[120px] min-w-[120px] text-[14px] text-neutral-90 text-left">
          {member.role ? ROLE_LABELS[member.role] || member.role : "-"}
        </div>

        {/* Affiliation */}
        <div className={`w-[120px] min-w-[120px] text-[14px] text-left truncate ${
          member.teamName ? "text-neutral-90" : "text-neutral-60"
        }`}>
          {member.teamName || "소속없음"}
        </div>

        {/* Join Date */}
        <div className="w-[100px] min-w-[100px] text-[14px] text-neutral-90 text-left">
          {joinDate}
        </div>

        {/* Delete Button - admin만 삭제 버튼 숨김 */}
        <div className="flex justify-end flex-1 min-w-[110px] pr-[110px]">
          {!isAdmin && (
            <button
              onClick={() => onDelete(member.id)}
              className="w-6 h-6 flex items-center justify-center hover:bg-neutral-10 rounded transition-colors"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M19 7L18.1327 19.1425C18.0579 20.1891 17.187 21 16.1378 21H7.86224C6.81296 21 5.94208 20.1891 5.86732 19.1425L5 7M10 11V17M14 11V17M15 7V4C15 3.44772 14.5523 3 14 3H10C9.44772 3 9 3.44772 9 4V7M4 7H20" stroke="#B0B0B0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          )}
        </div>
      </div>
      
      {/* Divider */}
      <div className="w-full h-[1px] bg-border opacity-40"></div>
    </>
  );
}

export default function MemberSettings() {
  const queryClient = useQueryClient();
  const [projectId, setProjectId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<MemberListItem | null>(null);

  useEffect(() => {
    const id = getSelectedProjectId();
    setProjectId(id);
  }, []);

  // 멤버 목록 조회
  const { data: membersData, isLoading } = useQuery({
    queryKey: ["members", "list", projectId, currentPage],
    queryFn: async () => {
      const response = await MembersService.list({ page: currentPage, limit: 10 });
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
      queryClient.invalidateQueries({ queryKey: ["members", "list", projectId] });
      setIsInviteModalOpen(false);
      alert("멤버 초대가 완료되었습니다.");
    },
    onError: (error: any) => {
      const errorMessage = error?.data?.message || "멤버 초대에 실패했습니다.";
      alert(errorMessage);
    },
  });

  // 멤버 삭제 mutation
  const deleteMutation = useMutation({
    mutationFn: (payload: { memberIds: number[] }) =>
      MembersService.remove(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["members", "list", projectId] });
      setIsDeleteModalOpen(false);
      setSelectedMember(null);
      alert("멤버가 삭제되었습니다.");
    },
    onError: (error: any) => {
      const errorMessage = error?.data?.message || "멤버 삭제에 실패했습니다.";
      alert(errorMessage);
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
    window.scrollTo({ top: 0, behavior: 'smooth' });
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

  return (
    <div className="bg-card rounded-[14px] p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-[24px] font-bold text-foreground leading-5">
          팀 멤버 관리
        </h1>
        <button
          onClick={handleInviteMember}
          className="flex items-center justify-center px-3 py-1.5 gap-2.5 bg-neutral-90 text-neutral-0 rounded-[5px] text-[14px] font-semibold hover:opacity-90 transition-colors"
        >
          멤버초대
        </button>
      </div>

      {/* Divider */}
      <div className="w-full h-[1px] bg-border opacity-50 mb-6"></div>

      {/* Table Header */}
      <div className="bg-neutral-20 rounded-[12px] px-6 py-3 mb-4">
        <div className="flex items-center">
          <div className="w-[280px] min-w-[280px] text-[16px] font-bold text-neutral-60 text-left">
            멤버
          </div>
          <div className="w-[120px] min-w-[120px] text-[16px] font-bold text-neutral-60 text-left">
            역할
          </div>
          <div className="w-[120px] min-w-[120px] text-[16px] font-bold text-neutral-60 text-left">
            소속
          </div>
          <div className="w-[100px] min-w-[100px] text-[16px] font-bold text-neutral-60 text-left">
            가입일
          </div>
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
            />
          ))
        )}
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
    </div>
  );
}
