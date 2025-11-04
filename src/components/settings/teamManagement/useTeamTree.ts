import { useCallback, useMemo, useState } from "react";
import { TeamMember } from "@/data/mockTeamData";

export type DragHandlers = {
  handleDragStart: (e: React.DragEvent, item: TeamMember) => void;
  handleDragOver: (e: React.DragEvent, targetId: string) => void;
  handleDragLeave: (e: React.DragEvent) => void;
  handleDrop: (e: React.DragEvent, targetId: string) => void;
  handleDragEnd: () => void;
};

export type DragState = {
  draggedItemId: string | null;
  dragOverItemId: string | null;
};

function cloneTree(items: TeamMember[]): TeamMember[] {
  return items.map((node) => ({
    ...node,
    children: node.children ? cloneTree(node.children) : undefined,
  }));
}

function updateLevels(node: TeamMember, baseLevel: number, parentId?: string) {
  node.level = baseLevel;
  node.parentId = parentId;
  if (node.children && node.children.length) {
    node.children = node.children.map((child) => {
      const cloned = { ...child };
      updateLevels(cloned, baseLevel + 1, node.id);
      return cloned;
    });
  }
}

function removeNodeById(items: TeamMember[], targetId: string) {
  let removed: TeamMember | null = null;
  function walk(nodes: TeamMember[]): TeamMember[] {
    const next: TeamMember[] = [];
    nodes.forEach((node) => {
      if (node.id === targetId) {
        removed = { ...node };
        return;
      }
      if (node.children && node.children.length) {
        node = {
          ...node,
          children: walk(node.children),
        };
      }
      next.push(node);
    });
    return next;
  }
  const nextTree = walk(cloneTree(items));
  return { nextTree, removed };
}

function findNodeInfo(
  items: TeamMember[],
  targetId: string,
  parentId?: string,
  level: number = 0
): { node: TeamMember; parentId?: string; level: number } | null {
  for (const node of items) {
    if (node.id === targetId) {
      return { node, parentId, level };
    }
    if (node.children) {
      const found = findNodeInfo(node.children, targetId, node.id, level + 1);
      if (found) return found;
    }
  }
  return null;
}

function insertAfterSibling(
  items: TeamMember[],
  targetId: string,
  node: TeamMember,
  newParentId?: string,
  newLevel: number = 0
): TeamMember[] {
  function walk(nodes: TeamMember[]): TeamMember[] {
    const next: TeamMember[] = [];
    nodes.forEach((current) => {
      let cloned = { ...current };
      if (cloned.children) {
        cloned = { ...cloned, children: walk(cloned.children) };
      }
      next.push(cloned);
      if (cloned.id === targetId) {
        const toInsert = { ...node };
        updateLevels(toInsert, newLevel, newParentId);
        next.push(toInsert);
      }
    });
    return next;
  }
  return walk(items);
}

export function isDescendant(tree: TeamMember[], ancestorId: string, targetId: string): boolean {
  function walk(nodes: TeamMember[], foundAncestor: boolean): boolean {
    for (const node of nodes) {
      const nextFoundAncestor = foundAncestor || node.id === ancestorId;
      if (nextFoundAncestor && node.id === targetId) {
        return true;
      }
      if (node.children && node.children.length) {
        if (walk(node.children, nextFoundAncestor)) return true;
      }
    }
    return false;
  }
  return walk(tree, false);
}

export function flattenTeamData(items: TeamMember[], level = 0): TeamMember[] {
  return items.flatMap((item) => {
    const current = { ...item, level };
    if (!item.children || item.children.length === 0) return [current];
    return [current, ...flattenTeamData(item.children, level + 1)];
  });
}

export function useTeamTree(initialData: TeamMember[]) {
  const [teamData, setTeamData] = useState<TeamMember[]>(() => cloneTree(initialData));
  const [draggedItem, setDraggedItem] = useState<TeamMember | null>(null);
  const [dragOverItemId, setDragOverItemId] = useState<string | null>(null);

  const handleDragStart = useCallback((e: React.DragEvent, item: TeamMember) => {
    setDraggedItem(item);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", item.id);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverItemId(targetId);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOverItemId((prev) => (prev ? null : prev));
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent, targetId: string) => {
      e.preventDefault();
      setDragOverItemId(null);

      if (!draggedItem || draggedItem.id === targetId) {
        setDraggedItem(null);
        return;
      }

      if (isDescendant(teamData, draggedItem.id, targetId)) {
        // Avoid creating cycles by dropping onto a descendant
        setDraggedItem(null);
        return;
      }

      const { nextTree, removed } = removeNodeById(teamData, draggedItem.id);
      if (!removed) {
        setDraggedItem(null);
        return;
      }

      const info = findNodeInfo(nextTree, targetId);
      if (!info) {
        setDraggedItem(null);
        return;
      }

      const reordered = insertAfterSibling(nextTree, targetId, removed, info.parentId, info.level);
      setTeamData(reordered);
      setDraggedItem(null);
    },
    [draggedItem, teamData]
  );

  const handleDragEnd = useCallback(() => {
    setDraggedItem(null);
    setDragOverItemId(null);
  }, []);

  const dragHandlers: DragHandlers = useMemo(
    () => ({ handleDragStart, handleDragOver, handleDragLeave, handleDrop, handleDragEnd }),
    [handleDragStart, handleDragOver, handleDragLeave, handleDrop, handleDragEnd]
  );

  const dragState: DragState = useMemo(
    () => ({ draggedItemId: draggedItem ? draggedItem.id : null, dragOverItemId }),
    [draggedItem, dragOverItemId]
  );

  return {
    teamData,
    setTeamData,
    dragHandlers,
    dragState,
  };
}
