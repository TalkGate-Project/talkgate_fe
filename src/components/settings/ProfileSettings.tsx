"use client";

import { useState } from "react";

interface OrganizationMember {
  id: number;
  name: string;
  initial: string;
  department?: string;
  isActive?: boolean;
}

export default function ProfileSettings() {
  const [name, setName] = useState("김직원");
  const [email, setEmail] = useState("abcd@gmail.com");
  const [contact, setContact] = useState("010-1234-5678");
  const [selectedDepartment, setSelectedDepartment] = useState("영업본부");
  const [selectedPosition, setSelectedPosition] = useState("본부장");
  const [selectedTeam, setSelectedTeam] = useState("영업팀");

  const organizationMembers: OrganizationMember[] = [
    {
      id: 1,
      name: "박본부장",
      initial: "박",
      department: "영업본부",
      isActive: true,
    },
    {
      id: 2,
      name: "김신규",
      initial: "김",
    },
    {
      id: 3,
      name: "이개발",
      initial: "이",
    },
    {
      id: 4,
      name: "오과장",
      initial: "오",
    },
  ];

  return (
    <div className="bg-white rounded-[14px] shadow-sm p-6">
      {/* 헤더 */}
      <div className="mb-6">
        <h1 className="text-[24px] font-bold text-[#252525] mb-2">프로필</h1>
        <div className="w-full h-[1px] bg-[#E2E2E2] opacity-50"></div>
      </div>

      {/* 프로필 정보 섹션 */}
      <div className="mb-8">
        {/* 프로필 정보 헤더 */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-[16px] font-semibold text-[#252525] mb-2">프로필 정보</h2>
            <p className="text-[14px] text-[#808080]">서비스에서 사용되는 프로필 정보를 설정합니다.</p>
          </div>
          <button className="px-3 py-2 border border-[#E2E2E2] rounded-[5px] text-[14px] font-semibold text-[#252525] hover:bg-[#F5F5F5] transition-colors">
            프로필 수정
          </button>
        </div>
        
        <div className="w-full h-[1px] bg-[#E2E2E2] mb-6"></div>

        {/* 프로필 썸네일 - 중앙 정렬 */}
        <div className="flex justify-center mb-8">
          <div className="w-20 h-20 bg-[#808080] rounded-full flex items-center justify-center">
            <span className="text-[28px] font-semibold text-white">김</span>
          </div>
        </div>

        {/* 입력 필드들 - 2열 그리드 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 이름 */}
          <div>
            <label className="block text-[14px] font-medium text-[#808080] mb-2">이름</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-[#E2E2E2] rounded-[5px] text-[14px] text-[#252525] focus:outline-none focus:border-[#252525]"
            />
          </div>

          {/* 이메일 */}
          <div>
            <label className="block text-[14px] font-medium text-[#808080] mb-2">이메일</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-[#E2E2E2] rounded-[5px] text-[14px] text-[#252525] focus:outline-none focus:border-[#252525]"
            />
          </div>

          {/* 연락처 */}
          <div>
            <label className="block text-[14px] font-medium text-[#808080] mb-2">연락처</label>
            <input
              type="tel"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              className="w-full px-3 py-2 border border-[#E2E2E2] rounded-[5px] text-[14px] text-[#252525] focus:outline-none focus:border-[#252525]"
            />
          </div>
        </div>
      </div>

      {/* 조직정보 섹션 */}
      <div>
        <h2 className="text-[16px] font-semibold text-[#252525] mb-4">조직정보</h2>
        
        {/* 조직 멤버 목록 - 컨테이너 너비의 절반 */}
        <div className="w-1/2 space-y-3">
          {organizationMembers.map((member) => (
            <div
              key={member.id}
              className={`flex items-center justify-between h-12 px-5 py-3 rounded-[12px] border border-[#E2E2E2] ${
                member.isActive 
                  ? "bg-gradient-to-r from-[#D6FAE8] to-[#D6FAE8] bg-opacity-30" 
                  : "bg-[#F8F8F8]"
              }`}
            >
              <div className="flex items-center gap-3">
                {/* 아바타 */}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  member.isActive ? "bg-[#00B55B]" : "bg-[#808080]"
                }`}>
                  <span className="text-[14px] font-semibold text-white">
                    {member.initial}
                  </span>
                </div>
                
                {/* 이름 */}
                <span className="text-[16px] font-semibold text-[#252525]">
                  {member.name}
                </span>
                
                {/* 부서 태그 */}
                {member.department && (
                  <span className="px-3 py-1 bg-[#D3E1FE] text-[#4D82F3] text-[12px] font-medium rounded-[30px]">
                    {member.department}
                  </span>
                )}
              </div>
              
              {/* 드롭다운 아이콘 */}
              {member.isActive && (
                <div className="w-6 h-6 flex items-center justify-center">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M6 9L12 15L18 9"
                      stroke="#B0B0B0"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
