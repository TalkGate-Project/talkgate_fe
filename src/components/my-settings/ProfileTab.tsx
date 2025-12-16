"use client";

import { useState, useEffect } from "react";
import { useMe } from "@/hooks/useMe";
import { useMyMember } from "@/hooks/useMyMember";
import Image from "next/image";
import defaultProfileImg from "@/assets/images/common/default_profile.png";
import { showErrorModal } from "@/lib/errorModalEvents";

export default function ProfileTab() {
  const { user, refetch } = useMe();
  const { member } = useMyMember();
  const [isEditing, setIsEditing] = useState(false);
  
  // 직원 정보의 이름을 우선 사용, 없으면 user.name 사용
  const displayName = member?.name || user?.name || "김직원";
  
  const [name, setName] = useState(displayName);
  const [email, setEmail] = useState(user?.email || "abcd@gmail.com");
  const [contact, setContact] = useState("010-1234-5678");
  const [saving, setSaving] = useState(false);

  // displayName이 변경되면 name state 업데이트
  useEffect(() => {
    if (displayName && !isEditing) {
      setName(displayName);
    }
  }, [displayName, isEditing]);

  // 초기화용 ref
  const initialData = {
    name: displayName,
    email: user?.email || "abcd@gmail.com",
    contact: "010-1234-5678"
  };

  const handleEditStart = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setName(initialData.name);
    setEmail(initialData.email);
    setContact(initialData.contact);
    setIsEditing(false);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const { AuthService } = await import("@/services/auth");
      await AuthService.updateProfile({ name, phone: contact });
      await refetch();
      setIsEditing(false);
      showErrorModal({
        type: "success",
        headline: "프로필이 업데이트되었습니다.",
        hideCancel: true,
      });
    } catch (e: any) {
      showErrorModal({
        type: "error",
        headline: "업데이트에 실패했습니다",
        description: "프로필 업데이트 중 오류가 발생했습니다.",
        hideCancel: true,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // TODO: 이미지 업로드 API 연동 필요
    console.log("File selected:", file);
    showErrorModal({
      type: "info",
      headline: "사진 업로드 기능은 준비 중입니다.",
      hideCancel: true,
    });
  };

  return (
    <div className="bg-card rounded-[14px] pb-[140px]">
      {/* Title */}
      <h1 className="px-7 py-7 text-[24px] font-bold text-foreground">
        프로필
      </h1>

      <div className="border-b border-[#E2E2E266]"></div>

      {/* Sub-title and Edit Button Row */}
      <div className="px-7 py-6 flex items-start justify-between mb-1">
        <div>
          <h2 className="text-[16px] font-semibold text-foreground mb-1">
            프로필 정보
          </h2>
          <p className="text-[14px] font-medium text-neutral-60">
            프로젝트에서 사용되는 프로필 정보를 설정합니다.
          </p>
        </div>
        {/* TODO: 프로필 수정 버튼 삭제, 개발 완료 후 삭제 예정 */}
        {/* <div className="flex gap-2">
          {isEditing ? (
            <>
              <button
                onClick={handleCancel}
                disabled={saving}
                className="cursor-pointer px-3 py-1.5 border border-border rounded-[5px] text-[14px] font-semibold text-foreground hover:bg-neutral-10 transition-colors disabled:opacity-60"
              >
                취소
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="cursor-pointer px-3 py-1.5 bg-[#1C1C1C] text-white rounded-[5px] text-[14px] font-semibold hover:bg-black/90 transition-colors disabled:opacity-60"
              >
                저장
              </button>
            </>
          ) : (
            <button
              onClick={handleEditStart}
              className="cursor-pointer px-3 py-1.5 border border-border rounded-[5px] text-[14px] font-semibold text-foreground hover:bg-neutral-10 transition-colors"
            >
              프로필 수정
            </button>
          )}
        </div> */}
      </div>

      {/* Divider */}
      <div className="mx-7 h-[1px] bg-border mb-8"></div>

      {/* Avatar - Full width centered */}
      <div className="flex flex-col items-center justify-center mb-8 gap-3">
        <div className="w-[100px] h-[100px] rounded-full bg-neutral-60 flex items-center justify-center overflow-hidden relative">
          {user?.profileImageUrl ? (
            <img
              src={user.profileImageUrl}
              alt="Profile"
              width={100}
              height={100}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-[#7C7C7C] flex items-center justify-center text-white text-[36px] font-medium">
               {/* 텍스트 기반 아바타 (예: 이름 첫 글자) */}
               {user?.name ? user.name.charAt(0) : "김"}
            </div>
          )}
        </div>
        
        {isEditing && (
          <div>
            <input
              type="file"
              id="profile-upload"
              className="hidden"
              accept="image/*"
              onChange={handleFileChange}
            />
            <label 
              htmlFor="profile-upload"
              className="text-[14px] text-[#5D5D5D] underline cursor-pointer hover:text-black transition-colors"
            >
              사진 업로드
            </label>
          </div>
        )}
      </div>

      {/* Form Fields */}
      <div className="grid grid-cols-2 gap-5 max-w-[788px] mx-auto">
        {/* 이름 */}
        <div>
          <label className="block text-[14px] font-medium text-neutral-60 mb-2">
            이름
          </label>
          <input
            type="text"
            value={name}
            readOnly={!isEditing}
            onChange={(e) => setName(e.target.value)}
            className={`w-full px-3 py-2 border rounded-[5px] text-[14px] text-foreground focus:outline-none transition-colors ${
              isEditing 
                ? "border-border bg-card focus:border-foreground" 
                : "border-border bg-neutral-10 text-neutral-60 cursor-default"
            }`}
            placeholder="이름을 입력하세요"
          />
        </div>

        {/* 이메일 */}
        <div>
          <label className="block text-[14px] font-medium text-neutral-60 mb-2">
            이메일
          </label>
          <input
            type="email"
            value={email}
            readOnly={!isEditing}
            onChange={(e) => setEmail(e.target.value)}
            className={`w-full px-3 py-2 border rounded-[5px] text-[14px] text-foreground focus:outline-none transition-colors ${
              isEditing 
                ? "border-border bg-card focus:border-foreground" 
                : "border-border bg-neutral-10 text-neutral-60 cursor-default"
            }`}
            placeholder="이메일을 입력하세요"
          />
        </div>

        {/* 휴대폰 번호 */}
        <div>
          <label className="block text-[14px] font-medium text-neutral-60 mb-2">
            휴대폰 번호
          </label>
          <input
            type="tel"
            value={contact}
            readOnly={!isEditing}
            onChange={(e) => setContact(e.target.value)}
            className={`w-full px-3 py-2 border rounded-[5px] text-[14px] text-foreground focus:outline-none transition-colors ${
              isEditing 
                ? "border-border bg-card focus:border-foreground" 
                : "border-border bg-neutral-10 text-neutral-60 cursor-default"
            }`}
            placeholder="휴대폰 번호를 입력하세요"
          />
        </div>
      </div>
    </div>
  );
}
