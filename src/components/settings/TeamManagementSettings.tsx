"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import TeamManagementHeader from "./teamManagement/TeamManagementHeader";
import TeamListView from "./teamManagement/TeamListView";
import TeamTreeView from "./teamManagement/TeamTreeView";
import TeamMemberInfoModal from "./teamManagement/TeamMemberInfoModal";
import UnassignedMembersList from "./teamManagement/UnassignedMembersList";
import TeamSearchBar from "./teamManagement/TeamSearchBar";
import DepartmentTags from "./teamManagement/DepartmentTags";
import TeamMoveConfirmModal from "./teamManagement/TeamMoveConfirmModal";
import UnassignedMembersDrawer from "./teamManagement/UnassignedMembersDrawer";
import TeamManagementLoading from "./teamManagement/TeamManagementLoading";
import TeamManagementError from "./teamManagement/TeamManagementError";
import TeamTreeNavigator from "./teamManagement/TeamTreeNavigator";
import TeamCanvasControls from "./teamManagement/TeamCanvasControls";
import { TeamMember } from "@/types/teams";
import { getSelectedProjectId } from "@/lib/project";
import {
  useMembersTreeWithoutParent,
  useTeams,
  useMoveTeamMutation,
  useRemoveParentMutation,
} from "@/hooks/useMembersTree";
import { useMyMember } from "@/hooks/useMyMember";
import { showErrorModal } from "@/lib/errorModalEvents";
import { useTeamMembers } from "@/hooks/useTeamMembers";
import { useTeamDragAndDrop } from "@/hooks/useTeamDragAndDrop";
import { useTeamSearch } from "@/hooks/useTeamSearch";
import { useDepartmentFilter } from "@/hooks/useDepartmentFilter";
import { ViewMode } from "@/types/teamManagement";

const APP_HEADER_SCREEN_HEIGHT = 54;

type FullscreenViewport = {
  top: number;
  width: number;
  height: number;
};

function getBodyZoom(): number {
  if (typeof document === "undefined") return 1;
  const bodyZoom = Number.parseFloat(window.getComputedStyle(document.body).zoom);
  return Number.isFinite(bodyZoom) && bodyZoom > 0 ? bodyZoom : 1;
}

function getFullscreenViewport(): FullscreenViewport {
  const bodyZoom = getBodyZoom();
  const headerScreenBottom =
    document.querySelector("header")?.getBoundingClientRect().bottom ?? APP_HEADER_SCREEN_HEIGHT;
  return {
    top: headerScreenBottom / bodyZoom,
    width: window.innerWidth / bodyZoom,
    height: Math.max(0, window.innerHeight - headerScreenBottom) / bodyZoom,
  };
}

export default function TeamManagementSettings() {
  const router = useRouter();
  const [projectId, setProjectId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("tree");
  const [selectedMemberId, setSelectedMemberId] = useState<number | null>(null);
  const [isUnassignedDrawerOpen, setIsUnassignedDrawerOpen] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fullscreenViewport, setFullscreenViewport] = useState<FullscreenViewport | null>(null);
  const zoomBeforeFullscreenRef = useRef(1);
  const [treeNavigationTarget, setTreeNavigationTarget] = useState<{
    memberId: string;
    requestId: number;
  } | null>(null);

  useEffect(() => {
    const selected = getSelectedProjectId();
    if (!selected) {
      router.replace("/projects");
      return;
    }
    setProjectId(selected);
  }, [router]);

  useEffect(() => {
    if (!isFullscreen) {
      setFullscreenViewport(null);
      return;
    }

    const updateFullscreenViewport = () => {
      setFullscreenViewport(getFullscreenViewport());
    };

    const previousBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    updateFullscreenViewport();
    window.addEventListener("resize", updateFullscreenViewport);

    return () => {
      window.removeEventListener("resize", updateFullscreenViewport);
      document.body.style.overflow = previousBodyOverflow;
    };
  }, [isFullscreen]);

  useEffect(() => {
    if (!isFullscreen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setIsFullscreen(false);
      setZoom(zoomBeforeFullscreenRef.current);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFullscreen]);

  const { data: treeData, isLoading: treeLoading, error: treeError } = useMembersTreeWithoutParent(projectId);
  const { data: teamsData, isLoading: teamsLoading, error: teamsError } = useTeams(projectId);
  const moveMutation = useMoveTeamMutation(projectId);
  const removeParentMutation = useRemoveParentMutation(projectId);
  const { isAdminOrSubAdmin } = useMyMember(projectId);

  const { teamMembers, assignedMembers, unassignedMembers } = useTeamMembers(treeData, teamsData);
  const assignableMembers = useMemo(
    () => unassignedMembers.filter((member) => Boolean(member.id && member.name.trim())),
    [unassignedMembers]
  );

  const canDrag = !moveMutation.isPending && !removeParentMutation.isPending;

  const handleMove = useCallback(
    async (sourceId: string, targetId: string) => {
      try {
        await moveMutation.mutateAsync({
          memberId: Number(sourceId),
          newParentId: Number(targetId),
        });
      } catch (err) {
        console.error(err);
        showErrorModal({
          type: "error",
          headline: "조직 이동에 실패했습니다. 잠시 후 다시 시도해주세요.",
          hideCancel: true,
        });
      }
    },
    [moveMutation]
  );

  const {
    dragHandlers,
    dragState,
    pendingMove,
    pendingMoveInfo,
    confirmMove,
    cancelMove,
  } = useTeamDragAndDrop(teamMembers, canDrag, handleMove);

  const { inputValue, setInputValue, searchTerm, executeSearch, matchingIds, expandedForSearch } =
    useTeamSearch(assignedMembers);

  const allDepartments = useMemo(() => {
    if (!teamsData) return [];
    return teamsData.map((team) => team.name);
  }, [teamsData]);

  const { selectedDepartment, filteredByDepartment, handleDepartmentClick } = useDepartmentFilter(
    assignedMembers,
    allDepartments
  );

  const handleRemoveParentDrop = useCallback(
    async (memberId: string) => {
      if (!canDrag) return;
      try {
        await removeParentMutation.mutateAsync({
          memberId: Number(memberId),
        });
      } catch (err) {
        console.error(err);
        showErrorModal({
          type: "error",
          headline: "소속 해제에 실패했습니다. 잠시 후 다시 시도해주세요.",
          hideCancel: true,
        });
      }
    },
    [canDrag, removeParentMutation]
  );

  const handleMemberClick = useCallback((member: TeamMember) => {
    setSelectedMemberId(Number(member.id));
  }, []);

  const handleMemberClickFromOrg = useCallback((memberId: number) => {
    // 조직도에서 멤버 클릭 시 현재 모달을 닫고 새로운 멤버의 모달을 엽니다
    setSelectedMemberId(memberId);
  }, []);

  const closeMemberModal = useCallback(() => {
    setSelectedMemberId(null);
  }, []);

  const handleTreeNavigate = useCallback((memberId: string) => {
    setTreeNavigationTarget((currentTarget) => ({
      memberId,
      requestId: (currentTarget?.requestId ?? 0) + 1,
    }));
  }, []);

  const exitFullscreen = useCallback(() => {
    setIsFullscreen(false);
    setZoom(zoomBeforeFullscreenRef.current);
  }, []);

  const handleFullscreenToggle = useCallback(() => {
    if (isFullscreen) {
      exitFullscreen();
      return;
    }

    const bodyZoom = getBodyZoom();
    zoomBeforeFullscreenRef.current = zoom;
    setFullscreenViewport(getFullscreenViewport());
    setZoom(Math.min(2, Math.max(zoom, bodyZoom < 1 ? 1 / bodyZoom : 1.1)));
    setIsFullscreen(true);
  }, [exitFullscreen, isFullscreen, zoom]);

  const handleViewModeChange = useCallback((nextViewMode: ViewMode) => {
    if (nextViewMode === "list" && isFullscreen) {
      exitFullscreen();
    }
    setViewMode(nextViewMode);
  }, [exitFullscreen, isFullscreen]);

  if (!projectId) return null;

  if (treeLoading || teamsLoading) {
    return <TeamManagementLoading />;
  }

  if (treeError || teamsError) {
    return <TeamManagementError />;
  }

  const unassignedMembersArea = assignableMembers.length > 0 && (
    <>
      <div className="hidden min-h-0 w-[218px] flex-shrink-0 self-stretch flex-col overflow-hidden border-l border-[#E2E2E2] bg-neutral-10/50 dark:!border-[#44444455] lg:flex">
        <div
          className={
            viewMode === "list"
              ? "h-[540px] flex-none overflow-y-auto"
              : "min-h-0 flex-1 overflow-y-auto"
          }
        >
          <UnassignedMembersList
            data={assignableMembers}
            dragHandlers={dragHandlers}
            dragState={dragState}
            onMemberClick={handleMemberClick}
            layout="panel"
          />
        </div>
      </div>

      <UnassignedMembersDrawer
        isOpen={isUnassignedDrawerOpen}
        onOpen={() => setIsUnassignedDrawerOpen(true)}
        onClose={() => setIsUnassignedDrawerOpen(false)}
        members={assignableMembers}
        dragHandlers={dragHandlers}
        dragState={dragState}
        onMemberClick={handleMemberClick}
      />
    </>
  );

  return (
    <div
      className={`w-full h-full bg-card overflow-hidden flex flex-col ${
        isFullscreen
          ? "fixed left-0 z-40 rounded-none pb-0"
          : "rounded-[14px] rounded-t-none md:rounded-t-[14px] pb-7"
      }`}
      style={
        isFullscreen && fullscreenViewport
          ? {
              top: fullscreenViewport.top,
              width: fullscreenViewport.width,
              height: fullscreenViewport.height,
            }
          : undefined
      }
    >
      <TeamManagementHeader
        viewMode={viewMode}
        onChange={handleViewModeChange}
      />
      <div className={`mx-4 h-px bg-neutral-30 md:mx-7 ${viewMode === "list" ? "mb-3" : "mb-[2px]"}`} />

      {/* 검색 및 태그 영역 (스크롤되지 않는 상단 고정 영역) */}
      {viewMode === "list" && (
        <div className="px-4 md:px-7 mb-4 md:mb-[30px] flex-shrink-0">
          <TeamSearchBar inputValue={inputValue} onInputChange={setInputValue} onSearch={executeSearch} />
          <DepartmentTags
            departments={allDepartments}
            selectedDepartment={selectedDepartment}
            onDepartmentClick={handleDepartmentClick}
          />
        </div>
      )}

      {/* 스크롤 가능한 리스트 영역 */}
      {viewMode === "list" ? (
        <div className="flex-1 mx-4 md:mx-7 overflow-hidden flex gap-4 border-b border-[#E2E2E2] dark:!border-[#444444] relative min-h-0">
          <div className="flex-1 min-w-0 overflow-y-auto max-h-[538px]">
            <TeamListView
              data={filteredByDepartment}
              dragHandlers={dragHandlers}
              dragState={dragState}
              tags={[]}
              onMemberClick={handleMemberClick}
              searchTerm={searchTerm}
              matchingIds={matchingIds}
              expandedForSearch={expandedForSearch}
            />
          </div>
          {unassignedMembersArea}
        </div>
      ) : (
        <div
          className={`relative mx-4 flex gap-4 overflow-hidden border-b border-[#E2E2E2] dark:!border-[#444444] md:mx-7 ${
            isFullscreen
              ? "h-0 min-h-0 flex-1"
              : "h-0 flex-1 lg:h-[618px] lg:flex-none"
          }`}
        >
          {/* 트리 뷰 영역 - 스크롤은 TeamTreeView 내부에서만 처리 */}
          <div
            className="relative flex flex-1 min-w-0 overflow-hidden flex-col bg-card"
            style={{
              backgroundImage: "radial-gradient(circle at 1px 1px, var(--neutral-40) 1px, transparent 1px)",
              backgroundSize: "30px 30px",
            }}
          >
            <TeamCanvasControls
              zoom={zoom}
              isFullscreen={isFullscreen}
              onZoomChange={setZoom}
              onFullscreenToggle={handleFullscreenToggle}
            />
            <TeamTreeNavigator
              teams={teamsData ?? []}
              members={assignedMembers}
              onNavigate={handleTreeNavigate}
            />
            <TeamTreeView
              data={assignedMembers}
              dragHandlers={dragHandlers}
              dragState={dragState}
              onMemberClick={handleMemberClick}
              zoom={zoom}
              onZoomChange={setZoom}
              onRemoveParentDrop={handleRemoveParentDrop}
              canRemoveParent={isAdminOrSubAdmin}
              navigationTarget={treeNavigationTarget}
              isFullscreen={isFullscreen}
            />
          </div>

          {/* 미배정 멤버 리스트 영역 */}
          {unassignedMembersArea}
        </div>
      )}

      {/* 조직 이동 확인 모달 */}
      {pendingMove && pendingMoveInfo && (
        <TeamMoveConfirmModal
          source={pendingMoveInfo.source}
          currentParent={pendingMoveInfo.currentParent}
          target={pendingMoveInfo.target}
          isPending={moveMutation.isPending}
          onConfirm={confirmMove}
          onCancel={cancelMove}
        />
      )}

      {/* 멤버 정보 모달 */}
      {selectedMemberId && (
        <TeamMemberInfoModal
          open={Boolean(selectedMemberId)}
          memberId={selectedMemberId}
          onClose={closeMemberModal}
          projectId={projectId}
          onMemberClick={handleMemberClickFromOrg}
        />
      )}
    </div>
  );
}
