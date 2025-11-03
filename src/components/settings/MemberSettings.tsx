"use client";

import { useState } from "react";
import Pagination from "@/components/common/Pagination";
import InviteMemberModal from "@/components/common/InviteMemberModal";
import DeleteMemberModal from "@/components/common/DeleteMemberModal";

interface Member {
  id: string;
  name: string;
  email: string;
  role: string;
  affiliation: string;
  joinDate: string;
  isAdmin: boolean;
  avatar: string;
  hasSubordinates: boolean; // 하위 조직/구성원 존재 여부
}

function MemberRow({ member, onDelete }: { member: Member; onDelete: (id: string) => void }) {
  return (
    <>
      <div className="flex items-center py-4">
        {/* Member Info */}
        <div className="flex items-center gap-4 w-[280px]">
          {/* Avatar */}
          <div className={`w-12 h-12 rounded-full flex items-center justify-center text-neutral-0 font-semibold text-[18px] ${
            member.isAdmin ? "bg-primary-80" : "bg-neutral-60"
          }`}>
            {member.avatar}
          </div>
          
          {/* Name and Email */}
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[16px] font-semibold text-foreground">
                {member.name}
              </span>
              {member.isAdmin && (
                <span className="px-2 py-1 bg-primary-10 text-primary-80 text-[12px] font-medium rounded-[5px]">
                  Admin
                </span>
              )}
            </div>
            <div className="text-[14px] text-neutral-60">
              {member.email}
            </div>
          </div>
        </div>

        {/* Role */}
        <div className="w-[120px] text-[14px] text-foreground">
          {member.role}
        </div>

        {/* Affiliation */}
        <div className="w-[120px] text-[14px] text-foreground">
          {member.affiliation}
        </div>

        {/* Join Date */}
        <div className="w-[100px] text-[14px] text-neutral-60">
          {member.joinDate}
        </div>

        {/* Delete Button */}
        <div className="flex justify-end flex-1">
          <button
            onClick={() => onDelete(member.id)}
            className="w-6 h-6 flex items-center justify-center hover:bg-neutral-10 rounded"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" stroke="var(--neutral-50)" strokeWidth="2" fill="none">
              <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
      
      {/* Divider */}
      <div className="w-full h-[1px] bg-border opacity-40"></div>
    </>
  );
}

export default function MemberSettings() {
  const [members] = useState<Member[]>([
    {
      id: "1",
      name: "김영업",
      email: "kim.sales@company.com",
      role: "총관리자",
      affiliation: "소속없음",
      joinDate: "2024-01-01",
      isAdmin: true,
      avatar: "김",
      hasSubordinates: true // 하위 조직/구성원 있음 (삭제 불가)
    },
    {
      id: "2",
      name: "이마케팅",
      email: "lee.marketing@company.com",
      role: "부관리자",
      affiliation: "소속없음",
      joinDate: "2024-01-01",
      isAdmin: false,
      avatar: "이",
      hasSubordinates: true // 하위 조직/구성원 있음 (삭제 불가)
    },
    {
      id: "3",
      name: "박개발",
      email: "park.dev@company.com",
      role: "팀장",
      affiliation: "소속없음",
      joinDate: "2024-01-01",
      isAdmin: false,
      avatar: "박",
      hasSubordinates: false // 하위 조직/구성원 없음 (삭제 가능)
    },
    {
      id: "4",
      name: "최디자인",
      email: "choi.design@company.com",
      role: "팀원",
      affiliation: "영업1지점",
      joinDate: "2024-01-01",
      isAdmin: false,
      avatar: "최",
      hasSubordinates: false // 하위 조직/구성원 없음 (삭제 가능)
    },
    {
      id: "5",
      name: "정운영",
      email: "jung.ops@company.com",
      role: "팀원",
      affiliation: "영업1지점",
      joinDate: "2024-01-01",
      isAdmin: false,
      avatar: "정",
      hasSubordinates: false // 하위 조직/구성원 없음 (삭제 가능)
    }
  ]);

  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = 10;
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);

  const handleDelete = (id: string) => {
    const member = members.find(m => m.id === id);
    if (member) {
      setSelectedMember(member);
      setIsDeleteModalOpen(true);
    }
  };

  const handleInviteMember = () => {
    setIsInviteModalOpen(true);
  };

  const handleInviteConfirm = (email: string, role: string) => {
    console.log("Invite member:", email, role);
    // 실제 구현에서는 멤버 초대 API 호출
  };

  const handleDeleteConfirm = () => {
    if (selectedMember) {
      console.log("Delete member:", selectedMember.id);
      // 실제 구현에서는 멤버 삭제 API 호출
    }
  };

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
          <div className="w-[280px] text-[16px] font-bold text-neutral-60">
            멤버
          </div>
          <div className="w-[120px] text-[16px] font-bold text-neutral-60">
            역할
          </div>
          <div className="w-[120px] text-[16px] font-bold text-neutral-60">
            소속
          </div>
          <div className="w-[100px] text-[16px] font-bold text-neutral-60">
            가입일
          </div>
        </div>
      </div>

      {/* Member List */}
      <div className="space-y-0">
        {members.map((member, index) => (
          <MemberRow
            key={member.id}
            member={member}
            onDelete={handleDelete}
          />
        ))}
      </div>

      {/* Pagination */}
      <div className="flex justify-center mt-8">
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
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
