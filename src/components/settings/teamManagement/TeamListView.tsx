"use client";

import { useCallback, useMemo, useState, useEffect } from "react";
import { TeamMember } from "@/data/mockTeamData";
import { DragHandlers, DragState, flattenTeamData } from "./useTeamTree";

type Props = {
  data: TeamMember[];
  dragHandlers: DragHandlers;
  dragState: DragState;
  tags?: string[];
  onMemberClick: (member: TeamMember) => void;
};

export default function TeamListView({ data, dragHandlers, dragState, tags = [], onMemberClick }: Props) {
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const lowerSearch = searchTerm.trim().toLowerCase();

  const matchingIds = useMemo(() => {
    if (!lowerSearch) return new Set<string>();
    return new Set(
      flattenTeamData(data)
        .filter((member) =>
          member.name.toLowerCase().includes(lowerSearch) ||
          (member.department ? member.department.toLowerCase().includes(lowerSearch) : false)
        )
        .map((member) => member.id)
    );
  }, [data, lowerSearch]);

  const ensureExpandedForMatches = useCallback(
    (items: TeamMember[], parents: string[] = []) => {
      if (!lowerSearch) return;
      const next = new Set<string>();
      const walk = (nodes: TeamMember[], chain: string[] = []) => {
        nodes.forEach((node) => {
          const nextChain = [...chain, node.id];
          if (matchingIds.has(node.id)) {
            nextChain.slice(0, -1).forEach((id) => next.add(id));
          }
          if (node.children && node.children.length) {
            walk(node.children, nextChain);
          }
        });
      };
      walk(items, parents);
      setExpandedItems(next);
    },
    [lowerSearch, matchingIds]
  );

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    if (!value) {
      setExpandedItems(new Set());
    } else {
      ensureExpandedForMatches(data);
    }
  };

  useEffect(() => {
    if (lowerSearch) {
      ensureExpandedForMatches(data);
    }
  }, [data, lowerSearch, ensureExpandedForMatches]);

  const toggleExpand = (id: string) => {
    setExpandedItems((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const renderItems = useCallback(
    (items: TeamMember[]) =>
      items.map((item) => {
        const hasChildren = Boolean(item.children && item.children.length);
        const isExpanded = expandedItems.has(item.id);
        const indent = (item.level ?? 0) * 24;
        const isMatch = matchingIds.has(item.id);
        const isDragOver = dragState.dragOverItemId === item.id;
        const isDragging = dragState.draggedItemId === item.id;

        return (
          <div key={item.id} className="relative mb-2">
            {item.level > 0 && (
              <>
                <div
                  className="absolute left-0 top-0 bottom-0 w-px"
                  style={{ left: `${indent - 12}px`, background: "#E2E2E2" }}
                />
                <div
                  className="absolute h-px"
                  style={{ left: `${indent - 12}px`, top: 34, width: 12, background: "#E2E2E2" }}
                />
              </>
            )}
            <div
              className={`flex items-center px-6 py-5 gap-4 border border-[#E2E2E2] rounded-[12px] cursor-move transition-all ${
                item.isLeader
                  ? "bg-gradient-to-r from-[rgba(214,250,232,0.3)] to-[rgba(214,250,232,0.3)]"
                  : "bg-white"
              } ${isMatch ? "ring-2 ring-blue-300" : ""} ${
                isDragOver ? "ring-2 ring-blue-400 bg-blue-50" : ""
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
                  className="w-6 h-6 flex items-center justify-center border border-[#E2E2E2] rounded-[5px] transform rotate-90 hover:bg-gray-50 transition-colors"
                >
                  <svg
                    className={`w-4 h-4 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <path
                      d="M9 18L15 12L9 6"
                      stroke="#B0B0B0"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              )}
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-[14px] font-semibold ${
                  item.isLeader ? "bg-[#00B55B]" : "bg-[#808080]"
                }`}
              >
                {item.avatar}
              </div>
              <button
                type="button"
                onClick={() => onMemberClick(item)}
                onMouseDown={(e) => e.stopPropagation()}
                className="text-left text-[16px] font-semibold text-[#000000] hover:underline focus:underline"
              >
                {item.name}
              </button>
              {item.department && (
                <div className="px-3 py-1 bg-[#D3E1FE] rounded-[30px]">
                  <span className="text-[12px] font-medium text-[#4D82F3]">{item.department}</span>
                </div>
              )}
            </div>
            {hasChildren && isExpanded && item.children && (
              <div>{renderItems(item.children)}</div>
            )}
          </div>
        );
      }),
    [dragHandlers, dragState, expandedItems, matchingIds]
  );

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <div className="flex-1 relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="직원 및 팀 이름을 검색하세요"
            className="w-full px-3 py-2 border border-[#E2E2E2] rounded-[5px] text-[14px] text-[#808080] focus:outline-none focus:border-[#252525]"
          />
        </div>
        <button className="px-4 py-2 bg-[#252525] text-[#D0D0D0] rounded-[5px] text-[14px] font-semibold">
          검색
        </button>
      </div>
      <div className="flex gap-2 mb-6">
        {tags.map((tag) => (
          <div key={tag} className="px-3 py-1 bg-[#E2E2E2] rounded-[30px]">
            <span className="text-[12px] font-medium text-[#595959]">{tag}</span>
          </div>
        ))}
      </div>
      <div>{renderItems(data)}</div>
    </div>
  );
}
