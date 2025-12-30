"use client";

import { useState, useEffect } from "react";
import { useSelectedProjectId } from "@/hooks/useSelectedProjectId";
import { useMyMember } from "@/hooks/useMyMember";
import { MembersService } from "@/services/members";
import { AssetsService } from "@/services/assets";
import type { OrganizationTreeNode } from "@/types/members";
import { showErrorModal } from "@/providers/ErrorFeedbackModalProvider";
import AsyncButton from "@/components/common/AsyncButton";

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
  const [isOrgExpanded, setIsOrgExpanded] = useState(true); // Default expanded per screenshot? Or collapsed? Screenshot shows root expanded.
  const [mounted, setMounted] = useState(false);
  
  // Root node of the organization tree
  const [orgRoot, setOrgRoot] = useState<OrganizationTreeNode | null>(null);

  // 클라이언트 마운트 감지
  useEffect(() => {
    setMounted(true);
  }, []);

  // 멤버 데이터 로드 시 상태 업데이트
  useEffect(() => {
    if (member) {
      setName(member.name || "");
      setOriginalName(member.name || "");
      setEmail(member.email || "");
      setPhone(member.phone || "");
      setOriginalPhone(member.phone || "");
      setProfileImageUrl(member.profileImageUrl || null);
      setOriginalProfileImageUrl(member.profileImageUrl || null);
      
      if (member.organizationTree) {
        setOrgRoot(member.organizationTree);
      }
    }
  }, [member]);

  // 프로필 이미지 업로드
  const handleProfileImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !projectId) return;
    
    if (file.size > 5 * 1024 * 1024) {
      showErrorModal({
        type: "error",
        headline: "파일 크기 초과",
        description: "파일 크기는 5MB를 초과할 수 없습니다.",
        hideCancel: true,
        confirmText: "확인",
      });
      return;
    }
    
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
      showErrorModal({
        type: "error",
        headline: "지원하지 않는 파일 형식",
        hideCancel: true,
        confirmText: "확인",
      });
      return;
    }
    
    setIsSaving(true);
    try {
      const presignResponse = await AssetsService.presignProfileImage({
        fileName: file.name,
        fileType: file.type,
      });
      
      const { uploadUrl, fileUrl } = presignResponse.data.data;
      await AssetsService.uploadToS3(uploadUrl, file, file.type);
      setProfileImageUrl(fileUrl);
      showErrorModal({
        type: "success",
        headline: "프로필 이미지가 업로드되었습니다.",
        hideCancel: true,
        confirmText: "확인",
      });
    } catch (error: any) {
      console.error("Failed to upload profile image:", error);
      showErrorModal({
        type: "error",
        headline: "일시적인 오류가 발생했습니다.",
        hideCancel: true,
        confirmText: "확인",
      });
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
      
      showErrorModal({
        type: "success",
        headline: "프로필이 수정되었습니다.",
        hideCancel: true,
        confirmText: "확인",
        onConfirm: () => {
          refetch();
        },
      });
    } catch (error: any) {
      console.error("Failed to update profile:", error);
      showErrorModal({
        type: "error",
        headline: "일시적인 오류가 발생했습니다.",
        hideCancel: true,
        confirmText: "확인",
      });
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

  // 렌더링 로직
  const renderOrgNode = (node: OrganizationTreeNode, isRoot: boolean = false) => {
    const hasChildren = node.descendants && node.descendants.length > 0;
    
    // Root (Leader) Style
    // background: linear-gradient(0deg, rgba(214, 250, 232, 0.3), rgba(214, 250, 232, 0.3)), #FFFFFF; -> This is basically a light green tint
    // height: 48px
    // padding: 20px 24px -> Actually flex container is 48px height.
    
    // Child (Member) Style
    // background: #F8F8F8;
    
    // Avatar styles
    // Root: bg-[#00B55B] (Primary-80), text-[#D6FAE8] (Primary-10)
    // Child: bg-[#808080] (Light-60), text-[#FFFFFF] (Light-0)
    
    const containerBaseClass = `flex items-center justify-between h-[48px] px-[24px] rounded-[12px] border border-neutral-30 dark:border-neutral-30 mb-[8px] ${
      isRoot 
        ? "bg-primary-10/30 dark:bg-primary-10/20" 
        : "bg-neutral-10 dark:bg-neutral-20"
    }`;

    const avatarBgClass = isRoot ? "bg-primary-80" : "bg-neutral-60";
    const avatarTextClass = isRoot ? "text-primary-10" : "text-white";
    
    // Team badge for Root
    // bg-[#D3E1FE] text-[#4D82F3]
    
    return (
        <div className="w-full">
            <div className={containerBaseClass}>
                <div className="flex items-center gap-[16px]">
                     {/* Avatar */}
                     <div className={`w-[32px] h-[32px] rounded-full flex items-center justify-center ${avatarBgClass} flex-shrink-0`}>
                        {node.profileImageUrl ? (
                            <img src={node.profileImageUrl} alt={node.name} className="w-full h-full rounded-full object-cover"/>
                        ) : (
                             <span className={`text-[14px] font-semibold ${avatarTextClass}`}>
                                 {node.name.charAt(0)}
                             </span>
                        )}
                     </div>
                     
                     {/* Name */}
                     <span className="text-[16px] font-semibold text-ink dark:text-neutral-80 leading-[24px]">
                         {node.name}
                     </span>
                     
                     {/* Team Badge (Only for Root/Leader in the example) */}
                     {isRoot && node.teamName && (
                         <div className="flex items-center justify-center px-[12px] py-[4px] bg-secondary-10 dark:bg-secondary-10 rounded-[30px] h-[22px]">
                             <span className="text-[12px] font-medium text-secondary-40 dark:text-secondary-40 opacity-80 leading-[14px]">
                                 {node.teamName}
                             </span>
                         </div>
                     )}
                </div>

                {/* Toggle Arrow (Only for Root) */}
                {isRoot && hasChildren && (
                    <button 
                        onClick={() => setIsOrgExpanded(!isOrgExpanded)}
                        className="w-[24px] h-[24px] flex items-center justify-center cursor-pointer"
                    >
                         <svg 
                            width="24" 
                            height="24" 
                            viewBox="0 0 24 24" 
                            fill="none" 
                            xmlns="http://www.w3.org/2000/svg"
                            className={`transform transition-transform ${isOrgExpanded ? "" : "rotate-180"}`}
                        >
                             <path d="M6 9L12 15L18 9" stroke="currentColor" className="text-neutral-50 dark:text-neutral-50" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                         </svg>
                    </button>
                )}
            </div>
            
            {/* Children (Descendants) - No indentation in visual, just stacked below */}
            {isRoot && isOrgExpanded && hasChildren && (
                <div className="flex flex-col gap-[8px]">
                    {node.descendants!.map(child => (
                        <div key={child.id}>
                            {renderOrgNode(child, false)}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
  };

  return (
    <div className="bg-card dark:bg-neutral-0 rounded-[14px] shadow-sm pb-[26px] min-h-[728px] relative">
      {/* 헤더 */}
      <div className="px-7 flex items-center justify-between h-[76px]">
         <h1 className="text-[24px] font-bold text-ink dark:text-neutral-80 leading-[20px]">프로필</h1>
      </div>

      {/* Divider */}
      <div className="w-full h-[1px] bg-neutral-30/40 dark:bg-neutral-30/40 mb-[26px]"></div>

      {/* 프로필 정보 섹션 */}
      <div className="mb-5">
        {/* 프로필 정보 헤더 */}
        <div className="flex items-center justify-between px-7 mb-[26px]">
          <div>
            <h2 className="text-[16px] font-semibold text-ink dark:text-neutral-80 mb-[6px]">프로필 정보</h2>
            <p className="text-[14px] text-neutral-60 dark:text-neutral-60">프로젝트에서 사용되는 프로필 정보를 설정합니다.</p>
          </div>
          {!isEditMode ? (
            <button 
              onClick={() => setIsEditMode(true)}
              className="cursor-pointer flex items-center justify-center px-[12px] py-[6px] border border-neutral-30 dark:border-neutral-30 rounded-[5px] text-[14px] font-semibold text-ink dark:text-neutral-80 bg-card dark:bg-neutral-10 hover:bg-neutral-10 dark:hover:bg-neutral-20 transition-colors h-[34px]"
            >
              프로필 수정
            </button>
          ) : (
            <div className="flex gap-2">
              <button 
                onClick={handleCancelEdit}
                disabled={isSaving}
                className="cursor-pointer flex items-center justify-center px-[12px] py-[6px] border border-neutral-30 dark:border-neutral-30 rounded-[5px] text-[14px] font-semibold text-ink dark:text-neutral-80 bg-card dark:bg-neutral-10 hover:bg-neutral-10 dark:hover:bg-neutral-20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed h-[34px]"
              >
                취소
              </button>
              <AsyncButton
                variant="secondary"
                size="sm"
                onClick={handleSaveProfile}
                loading={isSaving}
                className="bg-neutral-90 dark:bg-neutral-80 text-white dark:text-neutral-10 hover:bg-neutral-80 dark:hover:bg-neutral-70"
              >
                저장
              </AsyncButton>
            </div>
          )}
        </div>
        
        <div className="mx-7 h-[1px] bg-neutral-30 dark:bg-neutral-30 mb-[54px]"></div>

        {/* 프로필 썸네일 - 중앙 정렬 */}
        <div className="flex justify-center mb-[54px]">
          <div className="relative flex flex-col items-center gap-[24px]">
            <label 
              htmlFor="profile-image-upload"
              className={`block w-[80px] h-[80px] rounded-full overflow-hidden ${isEditMode ? "cursor-pointer" : "cursor-default"} ${isSaving ? "opacity-50" : ""}`}
            >
              {profileImageUrl ? (
                <img src={profileImageUrl} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-neutral-60 dark:bg-neutral-60 flex items-center justify-center">
                  <span className="text-[28px] font-semibold text-white leading-[33px] tracking-[-0.02em]">
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-[20px] max-w-[792px] mx-auto px-4">
          {/* 이름 */}
          <div className="relative">
            <label className="absolute left-0 top-[-25px] text-[14px] font-medium text-neutral-60 dark:text-neutral-60 mb-2">이름</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={!isEditMode || isSaving}
              className="w-full h-[34px] px-3 border border-neutral-30 rounded-[5px] text-[14px] text-foreground bg-card focus:outline-none focus:border-foreground disabled:opacity-60 disabled:cursor-not-allowed"
            />
          </div>

          {/* 이메일 (읽기 전용) */}
          <div className="relative">
            <label className="absolute left-0 top-[-25px] text-[14px] font-medium text-neutral-60 dark:text-neutral-60 mb-2">
              이메일
            </label>
            <input
              type="email"
              value={email}
              disabled={true}
              className="w-full h-[34px] px-3 border border-neutral-30 dark:border-neutral-30 rounded-[5px] text-[14px] text-neutral-60 dark:text-neutral-60 bg-neutral-10 dark:bg-neutral-20 cursor-not-allowed"
              readOnly
            />
          </div>

          {/* 연락처 */}
          <div className="relative mt-[25px]">
            <label className="absolute left-0 top-[-25px] text-[14px] font-medium text-neutral-60 dark:text-neutral-60 mb-2">연락처</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              disabled={!isEditMode || isSaving}
              className="w-full h-[34px] px-3 border border-neutral-30 rounded-[5px] text-[14px] text-foreground bg-card focus:outline-none focus:border-foreground disabled:opacity-60 disabled:cursor-not-allowed"
            />
          </div>
        </div>
      </div>

      {/* 조직정보 섹션 */}
      <div className="max-w-[792px] mx-auto px-4 mt-[45px]">
        <h2 className="text-[14px] font-medium text-neutral-60 dark:text-neutral-60 mb-[10px]">조직정보</h2>
        
        {/* 조직 트리 렌더링 */}
        <div className="w-full md:w-1/2">
            {orgRoot ? (
                renderOrgNode(orgRoot, true)
            ) : (
                <div className="w-full h-[48px] px-[24px] rounded-[12px] border border-neutral-30 dark:border-neutral-30 bg-card dark:bg-neutral-10 flex items-center text-[14px] text-neutral-60 dark:text-neutral-60">
                    조직 정보가 없습니다.
                </div>
            )}
        </div>
      </div>
    </div>
  );
}
