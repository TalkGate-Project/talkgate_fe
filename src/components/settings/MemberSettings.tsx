"use client";

import { useState } from "react";
import Pagination from "@/components/common/Pagination";

interface Member {
  id: string;
  name: string;
  email: string;
  role: string;
  affiliation: string;
  joinDate: string;
  isAdmin: boolean;
  avatar: string;
}

function MemberRow({ member, onDelete }: { member: Member; onDelete: (id: string) => void }) {
  return (
    <>
      <div className="flex items-center py-4">
        {/* Member Info */}
        <div className="flex items-center gap-4 w-[280px]">
          {/* Avatar */}
          <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold text-[18px] ${
            member.isAdmin ? "bg-[#00B55B]" : "bg-[#808080]"
          }`}>
            {member.avatar}
          </div>
          
          {/* Name and Email */}
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[16px] font-semibold text-[#000000]">
                {member.name}
              </span>
              {member.isAdmin && (
                <span className="px-2 py-1 bg-[#D6FAE8] text-[#00B55B] text-[12px] font-medium rounded-[5px]">
                  Admin
                </span>
              )}
            </div>
            <div className="text-[14px] text-[#808080]">
              {member.email}
            </div>
          </div>
        </div>

        {/* Role */}
        <div className="w-[120px] text-[14px] text-[#252525]">
          {member.role}
        </div>

        {/* Affiliation */}
        <div className="w-[120px] text-[14px] text-[#252525]">
          {member.affiliation}
        </div>

        {/* Join Date */}
        <div className="w-[100px] text-[14px] text-[#808080]">
          {member.joinDate}
        </div>

        {/* Delete Button */}
        <div className="flex justify-end flex-1">
          <button
            onClick={() => onDelete(member.id)}
            className="w-6 h-6 flex items-center justify-center hover:bg-gray-100 rounded"
          >
            <svg className="w-4 h-4 border-2 border-[#B0B0B0]" viewBox="0 0 24 24">
              <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" stroke="currentColor" strokeWidth="2" fill="none" />
            </svg>
          </button>
        </div>
      </div>
      
      {/* Divider */}
      <div className="w-full h-[1px] bg-[#E2E2E2] opacity-40"></div>
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
      avatar: "김"
    },
    {
      id: "2",
      name: "이마케팅",
      email: "lee.marketing@company.com",
      role: "부관리자",
      affiliation: "소속없음",
      joinDate: "2024-01-01",
      isAdmin: false,
      avatar: "이"
    },
    {
      id: "3",
      name: "박개발",
      email: "park.dev@company.com",
      role: "팀장",
      affiliation: "소속없음",
      joinDate: "2024-01-01",
      isAdmin: false,
      avatar: "박"
    },
    {
      id: "4",
      name: "최디자인",
      email: "choi.design@company.com",
      role: "팀원",
      affiliation: "영업1지점",
      joinDate: "2024-01-01",
      isAdmin: false,
      avatar: "최"
    },
    {
      id: "5",
      name: "정운영",
      email: "jung.ops@company.com",
      role: "팀원",
      affiliation: "영업1지점",
      joinDate: "2024-01-01",
      isAdmin: false,
      avatar: "정"
    }
  ]);

  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = 10;

  const handleDelete = (id: string) => {
    console.log("Delete member:", id);
    // 실제 구현에서는 API 호출로 멤버 삭제
  };

  const handleInviteMember = () => {
    console.log("Invite member");
    // 실제 구현에서는 멤버 초대 모달 열기
  };

  return (
    <div className="bg-white rounded-[14px] p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-[24px] font-bold text-[#252525] leading-5">
          팀 멤버 관리
        </h1>
        <button
          onClick={handleInviteMember}
          className="flex items-center justify-center px-3 py-1.5 gap-2.5 bg-[#252525] text-[#D0D0D0] rounded-[5px] text-[14px] font-semibold hover:bg-[#333333] transition-colors"
        >
          멤버초대
        </button>
      </div>

      {/* Divider */}
      <div className="w-full h-[1px] bg-[#E2E2E2] opacity-50 mb-6"></div>

      {/* Table Header */}
      <div className="bg-[#EDEDED] rounded-[12px] px-6 py-3 mb-4">
        <div className="flex items-center">
          <div className="w-[280px] text-[16px] font-bold text-[#808080]">
            멤버
          </div>
          <div className="w-[120px] text-[16px] font-bold text-[#808080]">
            역할
          </div>
          <div className="w-[120px] text-[16px] font-bold text-[#808080]">
            소속
          </div>
          <div className="w-[100px] text-[16px] font-bold text-[#808080]">
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
    </div>
  );
}
