"use client";

import { useState, useEffect } from "react";
import { useSelectedProjectId } from "@/hooks/useSelectedProjectId";
import { useMyMember } from "@/hooks/useMyMember";
import { MembersService } from "@/services/members";
import { AssetsService } from "@/services/assets";
import type { OrganizationTreeNode } from "@/types/members";

export default function ProfileSettings() {
  const [projectId] = useSelectedProjectId();
  const { member, loading, refetch } = useMyMember(projectId);
  
  // 프로필 정보 상태
  const [name, setName] = useState("");
  const [originalName, setOriginalName] = useState("");
  const [email, setEmail] = useState(""); // 읽기 전용
  const [phone, setPhone] = useState("");
  const [originalPhone, setOriginalPhone] = useState("");
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);
  const [originalProfileImageUrl, setOriginalProfileImageUrl] = useState<string | null>(null);
  
  // UI 상태
  const [isSaving, setIsSaving] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [expandedMember, setExpandedMember] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);
  
  // 조직 트리를 평탄화하여 목록으로 변환
  const [organizationMembers, setOrganizationMembers] = useState<OrganizationTreeNode[]>([]);

  // 클라이언트 마운트 감지
  useEffect(() => {
    setMounted(true);
  }, []);

  // 멤버 데이터 로드 시 상태 업데이트
  useEffect(() => {
    if (member) {
      setName(member.name || "");
      setOriginalName(member.name || "");
      setEmail(member.email || ""); // 읽기 전용
      setPhone(member.phone || "");
      setOriginalPhone(member.phone || "");
      setProfileImageUrl(member.profileImageUrl || null);
      setOriginalProfileImageUrl(member.profileImageUrl || null);
      
      // 조직 트리 평탄화
      if (member.organizationTree) {
        const flattenTree = (node: OrganizationTreeNode): OrganizationTreeNode[] => {
          const result: OrganizationTreeNode[] = [node];
          if (node.descendants && node.descendants.length > 0) {
            node.descendants.forEach(child => {
              result.push(...flattenTree(child));
            });
          }
          return result;
        };
        setOrganizationMembers(flattenTree(member.organizationTree));
      }
    }
  }, [member]);

  // 프로필 이미지 업로드
  const handleProfileImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !projectId) return;
    
    // 파일 크기 체크 (5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("파일 크기는 5MB를 초과할 수 없습니다.");
      return;
    }
    
    // 파일 타입 체크
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
      alert("PNG, JPG, WEBP 파일만 업로드 가능합니다.");
      return;
    }
    
    setIsSaving(true);
    try {
      // 1. Presigned URL 발급
      const presignResponse = await AssetsService.presignProfileImage({
        fileName: file.name,
        fileType: file.type,
      });
      
      const { uploadUrl, fileUrl } = presignResponse.data.data;
      
      // 2. S3에 업로드
      await AssetsService.uploadToS3(uploadUrl, file, file.type);
      
      // 3. 프로필 이미지 URL 업데이트
      setProfileImageUrl(fileUrl);
      
      alert("프로필 이미지가 업로드되었습니다.");
    } catch (error) {
      console.error("Failed to upload profile image:", error);
      alert("프로필 이미지 업로드에 실패했습니다.");
    } finally {
      setIsSaving(false);
    }
  };

  // 프로필 수정 저장
  const handleSaveProfile = async () => {
    if (!projectId) return;
    
    const hasChanges = 
      name !== originalName ||
      phone !== originalPhone ||
      profileImageUrl !== originalProfileImageUrl;
    
    if (!hasChanges) {
      setIsEditMode(false);
      return;
    }
    
    setIsSaving(true);
    try {
      await MembersService.updateSelf(
        {
          name,
          phone,
          profileImageUrl: profileImageUrl || undefined,
        },
        { "x-project-id": projectId }
      );
      
      setOriginalName(name);
      setOriginalPhone(phone);
      setOriginalProfileImageUrl(profileImageUrl);
      setIsEditMode(false);
      
      alert("프로필이 수정되었습니다.");
      refetch();
    } catch (error) {
      console.error("Failed to update profile:", error);
      alert("프로필 수정에 실패했습니다.");
    } finally {
      setIsSaving(false);
    }
  };

  // 수정 취소
  const handleCancelEdit = () => {
    setName(originalName);
    setPhone(originalPhone);
    setProfileImageUrl(originalProfileImageUrl);
    setIsEditMode(false);
  };

  // Hydration 에러 방지를 위해 클라이언트에서만 렌더링
  if (!mounted || loading) {
    return (
      <div className="bg-card rounded-[14px] shadow-sm p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-neutral-20 rounded w-1/4 mb-6"></div>
          <div className="h-40 bg-neutral-20 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-[14px] shadow-sm p-6">
      {/* 헤더 */}
      <div className="mb-6">
        <h1 className="text-[24px] font-bold text-foreground mb-2">프로필</h1>
        <div className="w-full h-[1px] bg-border opacity-50"></div>
      </div>

      {/* 프로필 정보 섹션 */}
      <div className="mb-8">
        {/* 프로필 정보 헤더 */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-[16px] font-semibold text-foreground mb-2">프로필 정보</h2>
            <p className="text-[14px] text-neutral-60">프로젝트에서 사용되는 프로필 정보를 설정합니다.</p>
          </div>
          {!isEditMode ? (
            <button 
              onClick={() => setIsEditMode(true)}
              className="cursor-pointer px-3 py-2 border border-border rounded-[5px] text-[14px] font-semibold text-foreground hover:bg-neutral-10 transition-colors"
            >
              프로필 수정
            </button>
          ) : (
            <div className="flex gap-2">
              <button 
                onClick={handleCancelEdit}
                disabled={isSaving}
                className="cursor-pointer px-3 py-2 border border-border rounded-[5px] text-[14px] font-semibold text-foreground hover:bg-neutral-10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                취소
              </button>
              <button 
                onClick={handleSaveProfile}
                disabled={isSaving}
                className="cursor-pointer px-3 py-2 bg-neutral-90 text-neutral-20 rounded-[5px] text-[14px] font-semibold hover:opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? "저장 중..." : "저장"}
              </button>
            </div>
          )}
        </div>
        
        <div className="w-full h-[1px] bg-border mb-6"></div>

        {/* 프로필 썸네일 - 중앙 정렬 */}
        <div className="flex justify-center mb-8">
          <div className="relative">
            <label 
              htmlFor="profile-image-upload"
              className={`block w-20 h-20 rounded-full overflow-hidden ${isEditMode ? "cursor-pointer" : "cursor-default"} ${isSaving ? "opacity-50" : ""}`}
            >
              {profileImageUrl ? (
                <img src={profileImageUrl} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-neutral-60 flex items-center justify-center">
                  <span className="text-[28px] font-semibold text-neutral-0">
                    {name ? name.charAt(0) : "?"}
                  </span>
                </div>
              )}
            </label>
            {isEditMode && (
              <input
                id="profile-image-upload"
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={handleProfileImageUpload}
                className="hidden"
                disabled={isSaving}
              />
            )}
          </div>
        </div>

        {/* 입력 필드들 - 2열 그리드 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 이름 */}
          <div>
            <label className="block text-[14px] font-medium text-neutral-60 mb-2">이름</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={!isEditMode || isSaving}
              className="w-full px-3 py-2 border border-border rounded-[5px] text-[14px] text-foreground bg-card focus:outline-none focus:border-foreground disabled:opacity-60 disabled:cursor-not-allowed"
            />
          </div>

          {/* 이메일 (읽기 전용) */}
          <div>
            <label className="block text-[14px] font-medium text-neutral-60 mb-2">
              이메일
              <span className="ml-2 text-[12px] text-neutral-50">(수정 불가)</span>
            </label>
            <input
              type="email"
              value={email}
              disabled={true}
              className="w-full px-3 py-2 border border-border rounded-[5px] text-[14px] text-neutral-60 bg-neutral-10 cursor-not-allowed"
              readOnly
            />
          </div>

          {/* 연락처 */}
          <div>
            <label className="block text-[14px] font-medium text-neutral-60 mb-2">연락처</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              disabled={!isEditMode || isSaving}
              className="w-full px-3 py-2 border border-border rounded-[5px] text-[14px] text-foreground bg-card focus:outline-none focus:border-foreground disabled:opacity-60 disabled:cursor-not-allowed"
            />
          </div>
        </div>
      </div>

      {/* 조직정보 섹션 */}
      <div>
        <h2 className="text-[16px] font-semibold text-foreground mb-2">조직정보</h2>
        <p className="text-[14px] text-neutral-60 mb-4">프로젝트 내 조직 구조를 확인할 수 있습니다.</p>
        
        {/* 조직 멤버 목록 - 컨테이너 너비의 절반 */}
        <div className="w-1/2 space-y-3">
          {organizationMembers.length === 0 ? (
            <div className="text-[14px] text-neutral-60 py-4 text-center">
              조직 정보가 없습니다.
            </div>
          ) : (
            organizationMembers.map((orgMember) => {
              const isCurrentUser = orgMember.id === member?.id;
              const isExpanded = expandedMember === orgMember.id;
              
              return (
                <div key={orgMember.id}>
                  <div
                    className={`flex items-center justify-between h-12 px-5 py-3 rounded-[12px] border border-border cursor-pointer hover:bg-neutral-10 transition-colors ${
                      isCurrentUser 
                        ? "bg-primary-10 bg-opacity-30" 
                        : "bg-neutral-10"
                    }`}
                    onClick={() => setExpandedMember(isExpanded ? null : orgMember.id)}
                  >
                    <div className="flex items-center gap-3">
                      {/* 아바타 */}
                      {orgMember.profileImageUrl ? (
                        <img 
                          src={orgMember.profileImageUrl} 
                          alt={orgMember.name}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          isCurrentUser ? "bg-primary-80" : "bg-neutral-60"
                        }`}>
                          <span className="text-[14px] font-semibold text-neutral-0">
                            {orgMember.name.charAt(0)}
                          </span>
                        </div>
                      )}
                      
                      {/* 이름 */}
                      <span className="text-[16px] font-semibold text-foreground">
                        {orgMember.name}
                      </span>
                      
                      {/* 역할 태그 */}
                      <span className={`px-3 py-1 text-[12px] font-medium rounded-[30px] ${
                        orgMember.role === "leader" 
                          ? "bg-secondary-10 text-secondary-40" 
                          : "bg-neutral-20 text-neutral-60"
                      }`}>
                        {orgMember.role === "leader" ? "리더" : "멤버"}
                      </span>
                      
                      {/* 팀 이름 */}
                      {orgMember.teamName && (
                        <span className="px-3 py-1 bg-neutral-20 text-neutral-60 text-[12px] font-medium rounded-[30px]">
                          {orgMember.teamName}
                        </span>
                      )}
                    </div>
                    
                    {/* 드롭다운 아이콘 */}
                    <div className={`w-6 h-6 flex items-center justify-center transition-transform ${isExpanded ? "rotate-180" : ""}`}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <path
                          d="M6 9L12 15L18 9"
                          stroke="var(--neutral-50)"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                  </div>
                  
                  {/* 확장된 상세 정보 */}
                  {isExpanded && (
                    <div className="mt-2 ml-12 p-4 bg-neutral-10 rounded-[8px] text-[14px]">
                      <div className="space-y-2">
                        <div><span className="font-semibold text-neutral-60">이메일:</span> {orgMember.email}</div>
                        <div><span className="font-semibold text-neutral-60">팀:</span> {orgMember.teamName}</div>
                        <div><span className="font-semibold text-neutral-60">역할:</span> {orgMember.role === "leader" ? "리더" : "멤버"}</div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
