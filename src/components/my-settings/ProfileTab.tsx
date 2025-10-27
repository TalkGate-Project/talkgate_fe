"use client";

import { useState } from "react";
import { useMe } from "@/hooks/useMe";

export default function ProfileTab() {
  const { user } = useMe();
  const [name, setName] = useState("김직원");
  const [email, setEmail] = useState("abcd@gmail.com");
  const [contact, setContact] = useState("010-1234-5678");
  const [role, setRole] = useState("상담원");
  const [affiliation, setAffiliation] = useState("영업1지점");
  const [team, setTeam] = useState("A팀");

  const handleEditProfile = () => {
    console.log("프로필 수정");
    // TODO: Implement profile edit logic
  };

  return (
    <div className="bg-white rounded-[14px] p-8">
      {/* Title */}
      <h1 className="text-[24px] font-bold text-[#252525] mb-4">
        개인 설정
      </h1>

      {/* Sub-title */}
      <h2 className="text-[16px] font-semibold text-[#000000] mb-1">
        프로필 설정
      </h2>

      {/* Description */}
      <p className="text-[14px] font-medium text-[#808080] mb-6">
        서비스에서 사용되는 프로필 정보를 설정합니다.
      </p>

      {/* Divider */}
      <div className="w-full h-[1px] bg-[#E2E2E2] mb-8"></div>

      {/* Content */}
      <div className="flex items-start gap-8">
        {/* Left: Form Fields */}
        <div className="flex-1 space-y-6">
          {/* 이름 */}
          <div>
            <label className="block text-[14px] font-medium text-[#808080] mb-2">
              이름
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-[#E2E2E2] rounded-[5px] text-[14px] text-[#000000] focus:outline-none focus:border-[#252525]"
              placeholder="이름을 입력하세요"
            />
          </div>

          {/* 이메일 */}
          <div>
            <label className="block text-[14px] font-medium text-[#808080] mb-2">
              이메일
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-[#E2E2E2] rounded-[5px] text-[14px] text-[#000000] focus:outline-none focus:border-[#252525]"
              placeholder="이메일을 입력하세요"
            />
          </div>

          {/* 연락처 */}
          <div>
            <label className="block text-[14px] font-medium text-[#808080] mb-2">
              연락처
            </label>
            <input
              type="tel"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              className="w-full px-3 py-2 border border-[#E2E2E2] rounded-[5px] text-[14px] text-[#000000] focus:outline-none focus:border-[#252525]"
              placeholder="연락처를 입력하세요"
            />
          </div>

          {/* 역할 */}
          <div>
            <label className="block text-[14px] font-medium text-[#808080] mb-2">
              역할
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full px-3 py-2 border border-[#E2E2E2] rounded-[5px] text-[14px] text-[#000000] focus:outline-none focus:border-[#252525]"
            >
              <option value="상담원">상담원</option>
              <option value="팀장">팀장</option>
              <option value="부관리자">부관리자</option>
              <option value="총관리자">총관리자</option>
            </select>
          </div>

          {/* 소속 */}
          <div>
            <label className="block text-[14px] font-medium text-[#808080] mb-2">
              소속
            </label>
            <select
              value={affiliation}
              onChange={(e) => setAffiliation(e.target.value)}
              className="w-full px-3 py-2 border border-[#E2E2E2] rounded-[5px] text-[14px] text-[#000000] focus:outline-none focus:border-[#252525]"
            >
              <option value="영업1지점">영업1지점</option>
              <option value="영업2지점">영업2지점</option>
              <option value="마케팅부서">마케팅부서</option>
              <option value="소속없음">소속없음</option>
            </select>
          </div>

          {/* 팀 */}
          <div>
            <label className="block text-[14px] font-medium text-[#808080] mb-2">
              팀
            </label>
            <select
              value={team}
              onChange={(e) => setTeam(e.target.value)}
              className="w-full px-3 py-2 border border-[#E2E2E2] rounded-[5px] text-[14px] text-[#000000] focus:outline-none focus:border-[#252525]"
            >
              <option value="A팀">A팀</option>
              <option value="B팀">B팀</option>
              <option value="C팀">C팀</option>
            </select>
          </div>
        </div>

        {/* Right: Avatar */}
        <div className="flex flex-col items-center gap-4">
          <button
            onClick={handleEditProfile}
            className="px-3 py-1.5 border border-[#E2E2E2] rounded-[5px] text-[14px] font-semibold text-[#000000] hover:bg-gray-50 transition-colors"
          >
            프로필 수정
          </button>
          <div className="w-20 h-20 rounded-full bg-[#808080] flex items-center justify-center">
            <span className="text-white text-[28px] font-semibold leading-8 tracking-[-0.02em]">
              {user?.name ? user.name.charAt(0) : "김"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

