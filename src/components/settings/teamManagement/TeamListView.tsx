"use client";

import { useCallback, useMemo, useState, useEffect } from "react";
import { TeamMember } from "@/data/mockTeamData";
import { DragHandlers, DragState, flattenTeamData } from "@/hooks/useTeamTree";

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
    (items: TeamMember[]) =>
      items.map((item) => {
        const hasChildren = Boolean(item.children && item.children.length);
        const isExpanded = currentExpanded.has(item.id);
        const indent = (item.level ?? 0) * 24;
        const isMatch = matchingIds.has(item.id);
        const isDragOver = dragState.dragOverItemId === item.id;
        const isDragging = dragState.draggedItemId === item.id;

        return (
          <div key={item.id} className="relative mb-2">
            {item.level > 0 && (
              <>
                <div
                  className="absolute left-0 top-0 bottom-0 w-px bg-border"
                  style={{ left: `${indent - 12}px` }}
                />
                <div
                  className="absolute h-px bg-border"
                  style={{ left: `${indent - 12}px`, top: 34, width: 12 }}
                />
              </>
            )}
            <div
              className={`h-[60px] flex items-center px-6 gap-4 border border-border rounded-[12px] cursor-move transition-all ${
                item.isLeader
                  ? "bg-primary-10/30"
                  : "bg-card"
              } ${isMatch ? "ring-2 ring-secondary-40" : ""} ${
                isDragOver ? "ring-2 ring-secondary-40 bg-secondary-10" : ""
              } ${isDragging ? "opacity-50" : ""}`}
              style={{ marginLeft: `${indent}px` }}
              draggable
              onDragStart={(e) => dragHandlers.handleDragStart(e, item)}
              onDragOver={(e) => dragHandlers.handleDragOver(e, item.id)}
              onDragLeave={dragHandlers.handleDragLeave}
              onDrop={(e) => dragHandlers.handleDrop(e, item.id)}
              onDragEnd={dragHandlers.handleDragEnd}
            >
              {hasChildren && (
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
                className="text-left text-[16px] font-semibold text-foreground hover:underline focus:underline"
              >
                {item.name}
              </button>
              {item.department && item.department !== "팀원" && (
                <div className="px-3 bg-secondary-10 rounded-[30px] max-h-[22px] flex items-center justify-center">
                  <span className="text-[12px] font-medium text-secondary-40 leading-[22px]">{item.department}</span>
                </div>
              )}
            </div>
            {hasChildren && isExpanded && item.children && (
              <div>{renderItems(item.children)}</div>
            )}
          </div>
        );
      }),
    [dragHandlers, dragState, currentExpanded, matchingIds, onMemberClick, toggleExpand]
  );

  return (
    <div>
      {/* 검색바 및 태그 영역 제거됨 (상위 컴포넌트로 이동) */}
      <div>{renderItems(data)}</div>
    </div>
  );
}
