"use client";

import { useState, useEffect, useCallback } from "react";
import { useSelectedProjectId } from "@/hooks/useSelectedProjectId";
import { useMyMember } from "@/hooks/useMyMember";
import { MembersService } from "@/services/members";
import { AssetsService } from "@/services/assets";
import type { OrganizationTreeNode, UpdateProfilePayload } from "@/types/members";
import { showErrorModal } from "@/providers/ErrorFeedbackModalProvider";
import AsyncButton from "@/components/common/AsyncButton";
import TeamNameBadge from "@/components/common/TeamNameBadge";
import TeamMemberInfoModal from "@/components/settings/teamManagement/TeamMemberInfoModal";
import { HIERARCHY_LIST_TOKENS, getIndent, getConnectorLeft } from "@/components/settings/teamManagement/tokens";

export default function ProfileSettings() {
  const [projectId] = useSelectedProjectId();
  const { member, loading, refetch } = useMyMember(projectId);
  const [selectedMemberId, setSelectedMemberId] = useState<number | null>(null);
  
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
  const [mounted, setMounted] = useState(false);
  
  // Root node of the organization tree
  const [orgRoot, setOrgRoot] = useState<OrganizationTreeNode | null>(null);
  const [expandedNodes, setExpandedNodes] = useState<Set<number>>(new Set());

  // level 0, 1까지만 노드 ID를 수집하는 헬퍼 함수 (2 depth)
  const collectNodesUpToDepth = useCallback((node: OrganizationTreeNode | null, maxDepth: number = 1): Set<number> => {
    const ids = new Set<number>();
    if (!node) return ids;
    const walk = (current: OrganizationTreeNode, currentDepth: number = 0) => {
      ids.add(current.id);
      // currentDepth가 maxDepth(1)보다 작을 때만 자식 노드를 재귀적으로 탐색
      // 즉, level 0, 1까지만 자동으로 열림
      if (currentDepth < maxDepth && current.descendants) {
        current.descendants.forEach((child) => walk(child, currentDepth + 1));
      }
    };
    walk(node, 0);
    return ids;
  }, []);

  // 클라이언트 마운트 감지
  useEffect(() => {
    setMounted(true);
  }, []);

  // 멤버 데이터 로드 시 상태 업데이트
  useEffect(() => {
    if (!member) return;
    setName(member.name || "");
    setOriginalName(member.name || "");
    setEmail(member.email || "");
    setPhone(member.phone || "");
    setOriginalPhone(member.phone || "");
    setProfileImageUrl(member.profileImageUrl || null);
    setOriginalProfileImageUrl(member.profileImageUrl || null);

    if (member.organizationTree) {
      setOrgRoot(member.organizationTree);
      setExpandedNodes(collectNodesUpToDepth(member.organizationTree, 1));
    } else {
      setOrgRoot(null);
      setExpandedNodes(new Set());
    }
  }, [collectNodesUpToDepth, member]);

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
      const payload: UpdateProfilePayload = {
        name,
      };
      // 연락처: 값이 있으면 전달, 기존에 값이 있었다가 삭제한 경우 null로 전달해 서버에서 삭제 반영
      if (phone.trim()) {
        payload.phone = phone.trim();
      } else if (originalPhone !== "") {
        payload.phone = null;
      }
      // 프로필 이미지: 값이 있으면 전달, 기존에 있었다가 삭제한 경우 null로 전달
      if (profileImageUrl) {
        payload.profileImageUrl = profileImageUrl;
      } else if (originalProfileImageUrl !== null && originalProfileImageUrl !== "") {
        payload.profileImageUrl = null;
      }
      await MembersService.updateSelf(
        payload,
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

  const toggleNode = useCallback((nodeId: number) => {
    setExpandedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  }, []);

  const handleMemberClick = useCallback((memberId: number) => {
    setSelectedMemberId(memberId);
  }, []);

  const handleCloseModal = useCallback(() => {
    setSelectedMemberId(null);
  }, []);

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
  const renderOrgNode = (node: OrganizationTreeNode, level: number = 0, index: number = 0) => {
    const hasChildren = node.descendants && node.descendants.length > 0;
    const isExpanded = expandedNodes.has(node.id);
    const isLeader = node.role === "leader";
    
    // 다른 tree 구조와 동일한 토큰 사용
    const indent = level * 16; // 모바일: 16px per level
    const connectorLeft = (level - 1) * 16; // 모바일: 16px per level

    const containerBaseClass = `flex items-center justify-between h-[48px] px-[24px] rounded-[12px] border border-neutral-30 dark:border-neutral-30 md:!ml-[var(--desktop-indent)] ${
      isLeader
        ? "bg-primary-10/30 dark:bg-primary-10/20"
        : "bg-neutral-10 dark:bg-neutral-20"
    }`;

    const avatarBgClass = isLeader ? "bg-primary-80" : "bg-neutral-60";
    const avatarTextClass = isLeader ? "text-primary-10" : "text-white";

    return (
      <div key={node.id} className="relative mb-2">
        {level > 0 && (
          <>
            <div
              className="absolute left-0 top-0 bottom-0 w-px bg-border md:!left-[var(--desktop-connector-left)]"
              style={{
                left: `${connectorLeft}px`,
                "--desktop-connector-left": `${getConnectorLeft(level)}px`,
                top:
                  index === 0
                    ? HIERARCHY_LIST_TOKENS.connector.firstItemTopOffset
                    : 0,
              } as React.CSSProperties}
            />
            <div
              className="absolute h-px bg-border md:!left-[var(--desktop-connector-left)] md:!w-[var(--desktop-horizontal-width)]"
              style={{
                left: `${connectorLeft}px`,
                "--desktop-connector-left": `${getConnectorLeft(level)}px`,
                "--desktop-horizontal-width": `${HIERARCHY_LIST_TOKENS.connector.horizontalWidth}px`,
                top: HIERARCHY_LIST_TOKENS.connector.horizontalTop,
                width: "16px", // 모바일: 16px
              } as React.CSSProperties}
            />
          </>
        )}
        <div
          className={containerBaseClass}
          style={{
            marginLeft: `${indent}px`,
            "--desktop-indent": `${getIndent(level)}px`,
          } as React.CSSProperties}
        >
          <div className="flex items-center gap-[16px]">
            {/* Avatar */}
            <div className={`w-[32px] h-[32px] rounded-full flex items-center justify-center ${avatarBgClass} flex-shrink-0`}>
              {node.profileImageUrl ? (
                <img src={node.profileImageUrl} alt={node.name} className="w-full h-full rounded-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <span className={`text-[14px] font-semibold ${avatarTextClass}`}>
                  {node.name.charAt(0)}
                </span>
              )}
            </div>

            {/* Name */}
            {node.id !== member?.id ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleMemberClick(node.id);
                }}
                className="text-[16px] font-semibold text-ink dark:text-neutral-80 leading-[24px] hover:underline cursor-pointer text-left bg-transparent border-none p-0"
              >
                {node.name}
              </button>
            ) : (
              <span className="text-[16px] font-semibold text-ink dark:text-neutral-80 leading-[24px]">
                {node.name}
              </span>
            )}

            {/* Team Badge (Leader only) */}
            {isLeader && node.teamName && (
              <TeamNameBadge label={node.teamName} />
            )}
          </div>

          {/* Toggle Arrow */}
          {hasChildren && (
            <button
              onClick={() => toggleNode(node.id)}
              className="w-[26px] h-[26px] flex items-center justify-center flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
              aria-label={isExpanded ? "접기" : "펼치기"}
            >
              {isExpanded ? (
                // 열렸을 때: 아래쪽 화살표 (v)
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 26 26"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <rect
                    x="25.5"
                    y="0.5"
                    width="25"
                    height="25"
                    rx="5.5"
                    transform="rotate(90 25.5 0.5)"
                    stroke="#E2E2E2"
                  />
                  <path
                    d="M7.16536 10.5L12.9987 16.3333L18.832 10.5"
                    stroke="#B0B0B0"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              ) : (
                // 닫혔을 때: 오른쪽 화살표 (>)
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 26 26"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <rect
                    x="0.5"
                    y="0.5"
                    width="25"
                    height="25"
                    rx="5.5"
                    transform="matrix(0 -1 -1 0 26 26)"
                    stroke="#E2E2E2"
                  />
                  <path
                    d="M10.5 18.8332L16.3333 12.9998L10.5 7.1665"
                    stroke="#B0B0B0"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </button>
          )}
        </div>

        {hasChildren && isExpanded && (
          <div className="mt-2">
            {node.descendants!.map((child, childIndex) =>
              renderOrgNode(child, level + 1, childIndex)
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-card dark:bg-neutral-0 md:rounded-[14px] lg:rounded-[14px] rounded-t-none lg:rounded-t-[14px] shadow-sm pb-6.5 md:min-h-[728px] relative">
      {/* 헤더 */}
      <div className="px-6 md:px-7 flex items-center justify-between py-4.5 md:py-0 md:h-[76px]">
         <h1 className="text-[18px] md:text-[24px] font-bold text-ink dark:text-neutral-80 leading-[20px]">프로필</h1>
         <div className="block md:hidden">
           {!isEditMode ? (
              <button 
                onClick={() => setIsEditMode(true)}
                className="cursor-pointer flex items-center justify-center px-[12px] border border-neutral-30 dark:border-neutral-30 rounded-[5px] text-[14px] font-semibold text-ink dark:text-neutral-80 bg-card dark:bg-neutral-10 hover:bg-neutral-10 dark:hover:bg-neutral-20 transition-colors h-[34px]"
              >
                수정
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
      </div>

      {/* Divider */}
      <div className="w-full h-[1px] bg-neutral-30/40 dark:bg-neutral-30/40 mb-4.5 md:mb-6.5"></div>

      {/* 프로필 정보 섹션 */}
      <div className="mb-5">
        {/* 프로필 정보 헤더 */}
        <div className="flex items-center justify-between px-6 md:px-7 mb-1 md:mb-6.5">
          <div>
            <h2 className="text-[16px] font-semibold text-ink dark:text-neutral-80 mb-[6px]">프로필 정보</h2>
            <p className="hidden md:block text-[14px] text-neutral-60 dark:text-neutral-60">프로젝트에서 사용되는 프로필 정보를 설정합니다.</p>
          </div>
          <div className="hidden md:block">
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
        </div>
        
        <div className="mx-6 md:mx-7 h-[1px] bg-neutral-30 dark:bg-neutral-30 mb-5 md:mb-[54px]"></div>

        {/* 프로필 썸네일 - 중앙 정렬 */}
        <div className="flex justify-center mb-5 md:mb-[54px]">
          <div className="relative flex flex-col items-center gap-[24px]">
            <label 
              htmlFor="profile-image-upload"
              className={`block w-[80px] h-[80px] rounded-full overflow-hidden ${isEditMode ? "cursor-pointer" : "cursor-default"} ${isSaving ? "opacity-50" : ""}`}
            >
              {profileImageUrl ? (
                <img src={profileImageUrl} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 md:gap-y-5 max-w-[792px] mx-auto px-4">
          {/* 이름 */}
          <div className="flex flex-col">
            <label className="text-[14px] font-medium text-neutral-60 dark:text-neutral-60 mb-2">이름</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={!isEditMode || isSaving}
              className="w-full h-[34px] px-3 border border-neutral-30 rounded-[5px] text-[14px] text-foreground bg-card focus:outline-none focus:border-foreground disabled:opacity-60 disabled:cursor-not-allowed"
            />
          </div>

          {/* 이메일 (읽기 전용) */}
          <div className="flex flex-col">
            <label className="text-[14px] font-medium text-neutral-60 dark:text-neutral-60 mb-2">
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
          <div className="flex flex-col">
            <label className="text-[14px] font-medium text-neutral-60 dark:text-neutral-60 mb-2">연락처</label>
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
      <div className="max-w-[792px] mx-auto px-4 md:mt-[45px]">
        <h2 className="text-[14px] font-medium text-neutral-60 dark:text-neutral-60 mb-[10px]">조직정보</h2>
        
        {/* 조직 트리 렌더링 */}
        <div className="w-full">
            {orgRoot ? (
                renderOrgNode(orgRoot, 0)
            ) : (
                <div className="w-full h-[48px] px-[24px] rounded-[12px] border border-neutral-30 dark:border-neutral-30 bg-card dark:bg-neutral-10 flex items-center text-[14px] text-neutral-60 dark:text-neutral-60">
                    조직 정보가 없습니다.
                </div>
            )}
        </div>
      </div>

      {/* 멤버 정보 모달 */}
      {selectedMemberId && (
        <TeamMemberInfoModal
          open={Boolean(selectedMemberId)}
          memberId={selectedMemberId}
          onClose={handleCloseModal}
          projectId={projectId}
          onMemberClick={handleMemberClick}
        />
      )}
    </div>
  );
}
