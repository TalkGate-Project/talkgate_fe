"use client";

import { useState } from "react";
import { useMe } from "@/hooks/useMe";
import Image from "next/image";

export default function ProfileTab() {
  const { user, refetch } = useMe();
  const [name, setName] = useState(user?.name || "김직원");
  const [email, setEmail] = useState(user?.email || "abcd@gmail.com");
  const [contact, setContact] = useState("010-1234-5678");
  const [saving, setSaving] = useState(false);

  const handleEditProfile = async () => {
    try {
      setSaving(true);
      const { AuthService } = await import("@/services/auth");
      await AuthService.updateProfile({ name, phone: contact });
      await refetch();
      alert("프로필이 업데이트되었습니다.");
    } catch (e: any) {
      alert(e?.data?.message || e?.message || "업데이트에 실패했습니다");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-card rounded-[14px] p-8">
      {/* Title */}
      <h1 className="text-[24px] font-bold text-foreground mb-4">
        개인 설정
      </h1>

      {/* Sub-title and Edit Button Row */}
      <div className="flex items-start justify-between mb-1">
        <div>
          <h2 className="text-[16px] font-semibold text-foreground mb-1">
            프로필 설정
          </h2>
          <p className="text-[14px] font-medium text-neutral-60">
            서비스에서 사용되는 프로필 정보를 설정합니다.
          </p>
        </div>
        <button
          onClick={handleEditProfile}
          disabled={saving}
          className="px-3 py-1.5 border border-border rounded-[5px] text-[14px] font-semibold text-foreground hover:bg-neutral-10 transition-colors disabled:opacity-60"
        >
          프로필 수정
        </button>
      </div>

      {/* Divider */}
      <div className="w-full h-[1px] bg-border mb-8"></div>

      {/* Avatar - Full width centered */}
      <div className="flex justify-center mb-8">
        <div className="w-20 h-20 rounded-full bg-neutral-60 flex items-center justify-center overflow-hidden">
          {user?.profileImageUrl ? (
            <Image
              src={user.profileImageUrl}
              alt="Profile"
              width={80}
              height={80}
              className="w-full h-full object-cover"
            />
          ) : (
            <Image
              src="/default_profile.png"
              alt="Default Profile"
              width={80}
              height={80}
              className="w-full h-full object-cover"
            />
          )}
        </div>
      </div>

        {/* Form Fields */}
        <div className="space-y-6">
        {/* 이름 */}
        <div>
          <label className="block text-[14px] font-medium text-neutral-60 mb-2">
            이름
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 border border-border rounded-[5px] text-[14px] text-foreground bg-card focus:outline-none focus:border-foreground"
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
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 border border-border rounded-[5px] text-[14px] text-foreground bg-card focus:outline-none focus:border-foreground"
            placeholder="이메일을 입력하세요"
          />
        </div>

        {/* 연락처 */}
        <div>
          <label className="block text-[14px] font-medium text-neutral-60 mb-2">
            연락처
          </label>
          <input
            type="tel"
            value={contact}
            onChange={(e) => setContact(e.target.value)}
            className="w-full px-3 py-2 border border-border rounded-[5px] text-[14px] text-foreground bg-card focus:outline-none focus:border-foreground"
            placeholder="연락처를 입력하세요"
          />
        </div>
      </div>
    </div>
  );
}