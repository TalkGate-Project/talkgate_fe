"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import type { DragEvent, MouseEvent, WheelEvent, ReactElement } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { TeamMember } from "@/types/teams";
import { DragHandlers, DragState } from "@/hooks/useTeamTree";
import { TOKENS } from "./tokens";
import TeamNameBadge from "@/components/common/TeamNameBadge";

type Props = {
  data: TeamMember[];
  dragHandlers: DragHandlers;
  dragState: DragState;
  onMemberClick: (member: TeamMember) => void;
};

// 노드 간 가로 간격
const HORIZONTAL_GAP = 32;

export default function TeamTreeView({ data, dragHandlers, dragState, onMemberClick }: Props) {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const isPanningRef = useRef(false);
  const panStartRef = useRef({ x: 0, y: 0 });

  const onWheel = useCallback((e: WheelEvent<HTMLDivElement>) => {
    if (!e.ctrlKey) return;
    e.preventDefault();
    setZoom((prev) => {
      const next = Math.min(2, Math.max(0.6, prev - e.deltaY * 0.0015));
      return Number(next.toFixed(2));
    });
  }, []);

  const onMouseDown = useCallback((e: MouseEvent<HTMLDivElement>) => {
    if (e.button !== 1 && !e.shiftKey) return;
    isPanningRef.current = true;
    panStartRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
  }, [pan.x, pan.y]);

  const onMouseMove = useCallback((e: MouseEvent<HTMLDivElement>) => {
    if (!isPanningRef.current) return;
    setPan({ x: e.clientX - panStartRef.current.x, y: e.clientY - panStartRef.current.y });
  }, []);

  const onMouseUp = useCallback(() => {
    isPanningRef.current = false;
  }, []);

  // 노드 카드만 렌더링 (배지 + 카드)
  const renderNodeCard = useCallback(
    (item: TeamMember) => {
      const isDragOver = dragState.dragOverItemId === item.id;
      const isDragging = dragState.draggedItemId === item.id;
      const isLeader = item.isLeader;

      return (
        <div className="flex flex-col items-center">
          {/* 팀/부서 배지 (리더일 경우) 또는 높이 맞춤용 빈 공간 */}
          {isLeader ? (
            <TeamNameBadge
              label={item.department ?? ""}
              className="mb-1"
              style={{
                minWidth: `${TOKENS.node.badge.w}px`,
                height: `${TOKENS.node.badge.h}px`,
              }}
              title={item.department}
            />
          ) : (
            <div
              className="mb-1 flex justify-center"
              style={{
                height: `${TOKENS.node.badge.h}px`,
                minWidth: `${TOKENS.node.badge.w}px`,
              }}
            >
              <div
                className="bg-border"
                style={{
                  width: `${TOKENS.connector.width}px`,
                  height: "100%",
                }}
              />
            </div>
          )}

          {/* 노드 카드 */}
          <div
            className={`group relative flex items-center px-6 gap-4 border border-border rounded-[12px] cursor-move transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-secondary-40/40 ${
              isLeader ? "bg-team-leader-highlight" : "bg-neutral-10"
            } ${isDragOver ? "ring-2 ring-secondary-40 bg-secondary-10" : ""} ${isDragging ? "opacity-50" : ""}`}
            style={{
              minWidth: `${TOKENS.node.leader.w}px`,
              height: `${TOKENS.node.leader.h}px`,
            }}
            draggable
            onDragStart={(e: DragEvent<HTMLDivElement>) => dragHandlers.handleDragStart(e, item)}
            onDragOver={(e: DragEvent<HTMLDivElement>) => dragHandlers.handleDragOver(e, item.id)}
            onDragLeave={dragHandlers.handleDragLeave}
            onDrop={(e: DragEvent<HTMLDivElement>) => dragHandlers.handleDrop(e, item.id)}
            onDragEnd={dragHandlers.handleDragEnd}
          >
            <div
              className={`rounded-full flex items-center justify-center text-neutral-0 font-semibold text-[14px] ${
                isLeader ? "bg-primary-80" : "bg-neutral-60"
              }`}
              style={{
                width: `${TOKENS.node.leader.avatar}px`,
                height: `${TOKENS.node.leader.avatar}px`,
              }}
            >
              {item.avatar}
            </div>
            <button
              type="button"
              title={item.name}
              onClick={(e) => {
                e.stopPropagation();
                onMemberClick(item);
              }}
              className="cursor-pointer font-semibold text-left text-[16px] leading-6 tracking-[0.2px] text-foreground hover:underline focus:underline truncate max-w-[120px]"
            >
              {item.name}
            </button>
          </div>
        </div>
      );
    },
    [dragHandlers, dragState, onMemberClick]
  );

  // 트리 노드 렌더링 (재귀) - 모든 자식을 가로로 배치
  const renderNode = useCallback(
    (item: TeamMember): ReactElement => {
      const children = item.children ?? [];
      const hasChildren = children.length > 0;

      return (
        <div key={item.id} className="flex flex-col items-center">
          {/* 현재 노드 카드 */}
          {renderNodeCard(item)}

          {/* 자식 노드들 */}
          <AnimatePresence initial={false}>
            {hasChildren && (
              <motion.div
                key={`${item.id}-children`}
                className="flex flex-col items-center"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.18 }}
              >
                {/* 부모에서 내려오는 수직 연결선 */}
                <div
                  className="bg-border"
                  style={{
                    width: `${TOKENS.connector.width}px`,
                    height: `${TOKENS.spacing.vertical}px`,
                  }}
                />

                {/* 자식 노드들 컨테이너 */}
                <div className="relative flex flex-col items-center">
                  {/* 자식 노드들 (가로 배치) */}
                  <div
                    className="flex items-start"
                    style={{ gap: `${HORIZONTAL_GAP}px` }}
                  >
                    {children.map((child, index) => (
                      <div key={child.id} className="flex flex-col items-center relative">
                        {/* 수평 연결선 (각 자식이 자신의 영역 위로 그림) */}
                        {children.length > 1 && (
                          <>
                            {/* 왼쪽 라인 (첫번째 자식 제외) */}
                            {index > 0 && (
                              <div
                                className="absolute bg-border top-0"
                                style={{
                                  height: `${TOKENS.connector.width}px`,
                                  left: `-${HORIZONTAL_GAP / 2}px`,
                                  right: "50%",
                                }}
                              />
                            )}
                            {/* 오른쪽 라인 (마지막 자식 제외) */}
                            {index < children.length - 1 && (
                              <div
                                className="absolute bg-border top-0"
                                style={{
                                  height: `${TOKENS.connector.width}px`,
                                  left: "50%",
                                  right: `-${HORIZONTAL_GAP / 2}px`,
                                }}
                              />
                            )}
                          </>
                        )}

                        {/* 수평선에서 자식으로 내려오는 수직 연결선 */}
                        <div
                          className="bg-border"
                          style={{
                            width: `${TOKENS.connector.width}px`,
                            height: `${TOKENS.spacing.vertical}px`,
                          }}
                        />
                        {/* 자식 노드 (재귀) */}
                        {renderNode(child)}
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      );
    },
    [renderNodeCard]
  );

  const tree = useMemo(
    () => data.map((item) => <div key={item.id}>{renderNode(item)}</div>),
    [data, renderNode]
  );

  // 빈 상태 처리
  if (data.length === 0) {
    return (
      <div
        className="relative min-h-[500px] min-w-[400px] max-w-[712px] overflow-auto flex items-center justify-center"
        role="tree"
        aria-label="조직도 트리"
      >
        <div className="text-center text-neutral-60 text-[14px]">
          <p className="">표시할 조직 정보가 없습니다.</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="relative min-h-[500px] min-w-[400px] max-w-[712px] overflow-auto"
      onWheel={onWheel}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      role="tree"
      aria-label="조직도 트리"
    >
      <div className="p-8 inline-block min-w-max">
        <div
          className="relative"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: "center top",
            width: "max-content",
          }}
        >
          <div className="flex flex-nowrap gap-16 items-start" style={{ width: "max-content" }}>
            {tree}
          </div>
        </div>
      </div>
    </div>
  );
}
