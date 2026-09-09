import { useCallback, useMemo, useRef, useState } from "react";
import { TeamMember } from "@/types/teams";
import { DragHandlers, DragState, isDescendant } from "@/hooks/useTeamTree";
import { findNodeWithParent } from "@/utils/teamManagement";
import { LeaderChangeContext, MoveContext } from "@/types/teamManagement";

export function useTeamDragAndDrop(
  teamMembers: TeamMember[],
  canDrag: boolean,
  onMove: (sourceId: string, targetId: string) => void,
  onInvalidMemberDrop: () => void
) {
  const draggedItemRef = useRef<TeamMember | null>(null);
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);
  const [dragOverItemId, setDragOverItemId] = useState<string | null>(null);
  const [pendingMove, setPendingMove] = useState<MoveContext | null>(null);
  const [pendingLeaderChange, setPendingLeaderChange] = useState<LeaderChangeContext | null>(null);

  const dragHandlers: DragHandlers = useMemo(
    () => ({
      handleDragStart: (e, item) => {
        if (!canDrag) return;
        draggedItemRef.current = item;
        setDraggedItemId(item.id);
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", item.id);
      },
      handleDragOver: (e, targetId) => {
        if (!canDrag) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        if (draggedItemRef.current?.id === targetId) return;
        setDragOverItemId((currentTargetId) =>
          currentTargetId === targetId ? currentTargetId : targetId
        );
      },
      handleDragLeave: (e) => {
        if (!canDrag) return;
        if (e.currentTarget.contains(e.relatedTarget as Node | null)) return;
        setDragOverItemId(null);
      },
      handleDrop: (e, targetId) => {
        if (!canDrag) return;
        e.preventDefault();
        setDragOverItemId(null);
        const draggedItem = draggedItemRef.current;
        if (!draggedItem || draggedItem.id === targetId) {
          draggedItemRef.current = null;
          setDraggedItemId(null);
          return;
        }
        const target = findNodeWithParent(teamMembers, targetId)?.node;
        if (target && !target.isLeader) {
          draggedItemRef.current = null;
          setDraggedItemId(null);
          onInvalidMemberDrop();
          return;
        }
        if (!draggedItem.isLeader && target?.isLeader && draggedItem.parentId === target.id) {
          setPendingLeaderChange({
            memberId: draggedItem.id,
            currentLeaderId: target.id,
          });
          draggedItemRef.current = null;
          setDraggedItemId(null);
          return;
        }
        if (isDescendant(teamMembers, draggedItem.id, targetId)) {
          draggedItemRef.current = null;
          setDraggedItemId(null);
          return;
        }
        setPendingMove({ sourceId: draggedItem.id, targetId });
        draggedItemRef.current = null;
        setDraggedItemId(null);
      },
      handleDragEnd: () => {
        draggedItemRef.current = null;
        setDraggedItemId(null);
        setDragOverItemId(null);
      },
    }),
    [canDrag, onInvalidMemberDrop, teamMembers]
  );

  const dragState: DragState = useMemo(
    () => ({
      draggedItemId,
      dragOverItemId,
    }),
    [dragOverItemId, draggedItemId]
  );

  const pendingMoveInfo = useMemo(() => {
    if (!pendingMove) return null;
    const sourceInfo = findNodeWithParent(teamMembers, pendingMove.sourceId);
    const targetInfo = findNodeWithParent(teamMembers, pendingMove.targetId);
    if (!sourceInfo || !targetInfo) return null;
    return {
      source: sourceInfo.node,
      currentParent: sourceInfo.parent,
      target: targetInfo.node,
    };
  }, [pendingMove, teamMembers]);

  const pendingLeaderChangeInfo = useMemo(() => {
    if (!pendingLeaderChange) return null;
    const memberInfo = findNodeWithParent(teamMembers, pendingLeaderChange.memberId);
    const currentLeaderInfo = findNodeWithParent(teamMembers, pendingLeaderChange.currentLeaderId);
    if (!memberInfo || !currentLeaderInfo) return null;
    return {
      member: memberInfo.node,
      currentLeader: currentLeaderInfo.node,
    };
  }, [pendingLeaderChange, teamMembers]);

  const clearDragState = useCallback(() => {
    draggedItemRef.current = null;
    setDraggedItemId(null);
    setDragOverItemId(null);
    setPendingMove(null);
    setPendingLeaderChange(null);
  }, []);

  const confirmMove = useCallback(async () => {
    if (!pendingMove) return;
    try {
      await onMove(pendingMove.sourceId, pendingMove.targetId);
      clearDragState();
    } catch (error) {
      // 에러는 onMove에서 처리하므로 여기서는 상태만 유지
      console.error("Move failed:", error);
    }
  }, [pendingMove, onMove, clearDragState]);

  const cancelMove = useCallback(() => {
    clearDragState();
  }, [clearDragState]);

  const cancelLeaderChange = useCallback(() => {
    clearDragState();
  }, [clearDragState]);

  return {
    dragHandlers,
    dragState,
    pendingMove,
    pendingMoveInfo,
    pendingLeaderChange,
    pendingLeaderChangeInfo,
    confirmMove,
    cancelMove,
    cancelLeaderChange,
    clearDragState,
  };
}
