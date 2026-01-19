import { useCallback, useMemo, useState } from "react";
import { TeamMember } from "@/types/teams";
import { DragHandlers, DragState, isDescendant } from "@/hooks/useTeamTree";
import { findNodeWithParent } from "@/utils/teamManagement";
import { MoveContext } from "@/types/teamManagement";

export function useTeamDragAndDrop(
  teamMembers: TeamMember[],
  canDrag: boolean,
  onMove: (sourceId: string, targetId: string) => void
) {
  const [draggedItem, setDraggedItem] = useState<TeamMember | null>(null);
  const [dragOverItemId, setDragOverItemId] = useState<string | null>(null);
  const [pendingMove, setPendingMove] = useState<MoveContext | null>(null);

  const dragHandlers: DragHandlers = useMemo(
    () => ({
      handleDragStart: (e, item) => {
        if (!canDrag) return;
        setDraggedItem(item);
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", item.id);
      },
      handleDragOver: (e, targetId) => {
        if (!canDrag) return;
        e.preventDefault();
        if (draggedItem?.id === targetId) return;
        setDragOverItemId(targetId);
      },
      handleDragLeave: () => {
        if (!canDrag) return;
        setDragOverItemId(null);
      },
      handleDrop: (e, targetId) => {
        if (!canDrag) return;
        e.preventDefault();
        setDragOverItemId(null);
        if (!draggedItem || draggedItem.id === targetId) {
          setDraggedItem(null);
          return;
        }
        if (isDescendant(teamMembers, draggedItem.id, targetId)) {
          setDraggedItem(null);
          return;
        }
        setPendingMove({ sourceId: draggedItem.id, targetId });
      },
      handleDragEnd: () => {
        setDraggedItem(null);
        setDragOverItemId(null);
      },
    }),
    [canDrag, draggedItem, teamMembers]
  );

  const dragState: DragState = useMemo(
    () => ({
      draggedItemId: draggedItem ? draggedItem.id : null,
      dragOverItemId,
    }),
    [dragOverItemId, draggedItem]
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

  const clearDragState = useCallback(() => {
    setDraggedItem(null);
    setDragOverItemId(null);
    setPendingMove(null);
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

  return {
    dragHandlers,
    dragState,
    pendingMove,
    pendingMoveInfo,
    confirmMove,
    cancelMove,
    clearDragState,
  };
}
