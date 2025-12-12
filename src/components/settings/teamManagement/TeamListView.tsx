"use client";

import { useCallback, useMemo, useState, useEffect } from "react";
import { TeamMember } from "@/types/teams";
import { DragHandlers, DragState, flattenTeamData } from "@/hooks/useTeamTree";
import { HIERARCHY_LIST_TOKENS, getIndent, getConnectorLeft } from "./tokens";
import TeamNameBadge from "@/components/common/TeamNameBadge";

type Props = {
  data: TeamMember[];
  dragHandlers: DragHandlers;
  dragState: DragState;
  tags?: string[];
  onMemberClick: (member: TeamMember) => void;
  searchTerm?: string;
  matchingIds?: Set<string>;
  expandedForSearch?: Set<string>;
};

// 매칭되는 노드와 그 자손들의 ID를 수집
function collectMatchingAndDescendants(items: TeamMember[], matchingIds: Set<string>): Set<string> {
  const result = new Set<string>();
  
  const collectDescendants = (node: TeamMember) => {
    result.add(node.id);
    if (node.children) {
      node.children.forEach(collectDescendants);
    }
  };
  
  const walk = (nodes: TeamMember[]) => {
    nodes.forEach((node) => {
      if (matchingIds.has(node.id)) {
        collectDescendants(node);
      }
      if (node.children) {
        walk(node.children);
      }
    });
  };
  
  walk(items);
  return result;
}

export default function TeamListView({
  data,
  dragHandlers,
  dragState,
  tags = [],
  onMemberClick,
  searchTerm = "",
  matchingIds = new Set(),
  expandedForSearch = new Set(),
}: Props) {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  // 검색어 유무에 따라 확장 상태 결정
  const currentExpanded = useMemo(() => {
    if (searchTerm) return expandedForSearch;
    return expandedItems;
  }, [searchTerm, expandedForSearch, expandedItems]);

  // 검색 중일 때 표시해야 할 노드들 (매칭 + 조상 + 자손)
  const visibleIds = useMemo(() => {
    if (!searchTerm || matchingIds.size === 0) return null; // null이면 모두 표시
    const matchingAndDescendants = collectMatchingAndDescendants(data, matchingIds);
    // expandedForSearch = 조상들, matchingAndDescendants = 매칭 노드 + 자손들
    return new Set([...expandedForSearch, ...matchingAndDescendants]);
  }, [searchTerm, matchingIds, expandedForSearch, data]);

  const toggleExpand = useCallback((id: string) => {
    if (searchTerm) return; // 검색 중에는 토글 비활성화 (또는 필요시 별도 처리)
    setExpandedItems((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, [searchTerm]);

  const renderItems = useCallback(
    (items: TeamMember[], parentIndex: number = 0) => {
      // 검색 중일 때 visibleIds에 포함된 아이템만 필터링
      const filteredItems = visibleIds 
        ? items.filter((item) => visibleIds.has(item.id))
        : items;
      
      return filteredItems.map((item, index) => {
        const hasChildren = Boolean(item.children && item.children.length);
        // 자식들 중 표시될 것이 있는지 확인
        const visibleChildren = visibleIds && item.children
          ? item.children.filter((child) => visibleIds.has(child.id))
          : item.children;
        const hasVisibleChildren = Boolean(visibleChildren && visibleChildren.length);
        const isExpanded = currentExpanded.has(item.id);
        const level = item.level ?? 0;
        const indent = getIndent(level);
        const connectorLeft = getConnectorLeft(level);
        const isDragOver = dragState.dragOverItemId === item.id;
        const isDragging = dragState.draggedItemId === item.id;

        return (
          <div key={item.id} className="relative mb-2">
            {level > 0 && (
              <>
                <div
                  className="absolute left-0 top-0 bottom-0 w-px bg-border"
                  style={{ 
                    left: `${connectorLeft}px`,
                    // 첫 번째 아이템은 상단 여백(mt-2)만큼 선을 위로 올려서 연결
                    top: index === 0 ? HIERARCHY_LIST_TOKENS.connector.firstItemTopOffset : 0 
                  }}
                />
                <div
                  className="absolute h-px bg-border"
                  style={{ 
                    left: `${connectorLeft}px`, 
                    top: HIERARCHY_LIST_TOKENS.connector.horizontalTop, 
                    width: HIERARCHY_LIST_TOKENS.connector.horizontalWidth 
                  }}
                />
              </>
            )}
            <div
              className={`h-[60px] flex items-center px-6 gap-4 border border-neutral-30 rounded-[12px] cursor-move transition-all ${
                item.isLeader
                  ? "bg-team-leader-highlight"
                  : "bg-card"
              } ${isDragOver ? "ring-2 ring-secondary-40 bg-secondary-10" : ""} ${isDragging ? "opacity-50" : ""}`}
              style={{ marginLeft: `${indent}px` }}
              draggable
              onDragStart={(e) => dragHandlers.handleDragStart(e, item)}
              onDragOver={(e) => dragHandlers.handleDragOver(e, item.id)}
              onDragLeave={dragHandlers.handleDragLeave}
              onDrop={(e) => dragHandlers.handleDrop(e, item.id)}
              onDragEnd={dragHandlers.handleDragEnd}
            >
              {hasVisibleChildren && (
                <button
                  onClick={() => toggleExpand(item.id)}
                  className={`w-6 h-6 flex items-center justify-center border border-border rounded-[5px] hover:bg-neutral-10 transition-colors ${
                    isExpanded ? "" : "rotate-[-90deg]"
                  }`}
                >
                  <svg
                    className="w-6 h-6"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <path
                      d="M9 18L15 12L9 6"
                      stroke="var(--neutral-60)"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              )}
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-neutral-0 text-[14px] font-semibold ${
                  item.isLeader ? "bg-primary-80" : "bg-neutral-60"
                }`}
              >
                {item.avatar}
              </div>
              <button
                type="button"
                onClick={() => onMemberClick(item)}
                onMouseDown={(e) => e.stopPropagation()}
                className="cursor-pointer text-left text-[16px] font-semibold text-foreground hover:underline focus:underline"
              >
                {item.name}
              </button>
              {item.department && item.department !== "팀원" && (
                <TeamNameBadge label={item.department} />
              )}
            </div>
            {hasVisibleChildren && isExpanded && item.children && (
              <div className="mt-2">{renderItems(item.children, index)}</div>
            )}
          </div>
        );
      });
    },
    [dragHandlers, dragState, currentExpanded, onMemberClick, toggleExpand, visibleIds]
  );

  return (
    <div>
      {/* 검색바 및 태그 영역 제거됨 (상위 컴포넌트로 이동) */}
      <div>{renderItems(data)}</div>
    </div>
  );
}
