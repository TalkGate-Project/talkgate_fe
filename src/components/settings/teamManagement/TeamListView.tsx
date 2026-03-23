"use client";

import { useCallback, useMemo, useState, useEffect } from "react";
import { TeamMember } from "@/types/teams";
import { DragHandlers, DragState, flattenTeamData } from "@/hooks/useTeamTree";
import { getIndent } from "./tokens";
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
  // level 0, 1까지만 기본적으로 열린 상태로 초기화 (2 depth)
  const collectItemsUpToDepth = useCallback((items: TeamMember[], maxDepth: number = 1): Set<string> => {
    const ids = new Set<string>();
    const traverse = (nodes: TeamMember[], currentDepth: number = 0) => {
      nodes.forEach((node) => {
        ids.add(node.id);
        // currentDepth가 maxDepth(1)보다 작을 때만 자식 노드를 재귀적으로 탐색
        // 즉, level 0, 1까지만 자동으로 열림
        if (currentDepth < maxDepth && node.children && node.children.length > 0) {
          traverse(node.children, currentDepth + 1);
        }
      });
    };
    traverse(items, 0);
    return ids;
  }, []);

  const [expandedItems, setExpandedItems] = useState<Set<string>>(() => {
    return collectItemsUpToDepth(data, 1);
  });

  // data가 변경되면 level 0, 1까지만 다시 열린 상태로 초기화
  useEffect(() => {
    if (data.length > 0) {
      const nodeIds = collectItemsUpToDepth(data, 1);
      setExpandedItems(nodeIds);
    }
  }, [data, collectItemsUpToDepth]);

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
    (items: TeamMember[], parentPath: string = "") => {
      // 검색 중일 때 visibleIds에 포함된 아이템만 필터링
      const filteredItems = visibleIds 
        ? items.filter((item) => visibleIds.has(item.id))
        : items;
      
      return filteredItems.map((item) => {
        // parentId를 포함한 경로로 고유성 보장 (같은 ID가 다른 부모 아래에 있을 수 있음)
        const itemPath = parentPath ? `${parentPath}/${item.id}` : item.id;
        const hasChildren = Boolean(item.children && item.children.length);
        // 자식들 중 표시될 것이 있는지 확인
        const visibleChildren = visibleIds && item.children
          ? item.children.filter((child) => visibleIds.has(child.id))
          : item.children;
        const hasVisibleChildren = Boolean(visibleChildren && visibleChildren.length);
        const isExpanded = currentExpanded.has(item.id);
        const level = item.level ?? 0;
        // 모바일에서 1rem(16px) 들여쓰기, 데스크탑에서 기존 값 사용
        const indent = level * 16; // 모바일: 16px per level
        const isDragOver = dragState.dragOverItemId === item.id;
        const isDragging = dragState.draggedItemId === item.id;

        return (
          <div key={itemPath} className="relative mb-2">
            <div
              className={`h-[60px] flex items-center px-6 gap-4 border border-border rounded-[12px] cursor-move transition-all md:!ml-[var(--desktop-indent)] ${
                item.isLeader
                  ? "bg-team-leader-highlight"
                  : "bg-card"
              } ${isDragOver ? "ring-2 ring-secondary-40 bg-secondary-10" : ""} ${isDragging ? "opacity-50" : ""}`}
              style={{ 
                marginLeft: `${indent}px`,
                '--desktop-indent': `${getIndent(level)}px`,
              } as React.CSSProperties}
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
              <div className="mt-2">{renderItems(item.children, itemPath)}</div>
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
