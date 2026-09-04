"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { DragEvent, MouseEvent, WheelEvent, TouchEvent, ReactElement } from "react";
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
  zoom?: number;
  onZoomChange?: (zoom: number) => void;
  onRemoveParentDrop?: (memberId: string) => void;
  canRemoveParent?: boolean;
  navigationTarget?: { memberId: string; requestId: number } | null;
  isFullscreen?: boolean;
};

type EdgePanDirection = "left" | "right";

type ChildBranch =
  | { type: "members"; key: string; members: TeamMember[] }
  | { type: "team"; key: string; child: TeamMember };

const EDGE_PAN_BASE_SPEED = 8;

export default function TeamTreeView({ data, dragHandlers, dragState, onMemberClick, zoom: externalZoom, onZoomChange, onRemoveParentDrop, canRemoveParent = false, navigationTarget, isFullscreen = false }: Props) {
  const [internalZoom, setInternalZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const panRef = useRef(pan);
  const [isGrabbing, setIsGrabbing] = useState(false);
  const isPanningRef = useRef(false);
  const panStartRef = useRef({ x: 0, y: 0 });
  const touchStartRef = useRef<{ x: number; y: number; panX: number; panY: number; target: EventTarget | null } | null>(null);
  const lastTouchDistanceRef = useRef<number | null>(null);
  const isNodeDraggingRef = useRef(false);
  const [isDragOverRemoveParent, setIsDragOverRemoveParent] = useState(false);
  const [focusedMemberId, setFocusedMemberId] = useState<string | null>(null);
  const [isNavigating, setIsNavigating] = useState(false);
  const viewportRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const nodeRefs = useRef(new Map<string, HTMLDivElement>());
  const navigationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const focusTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const edgePanFrameRef = useRef<number | null>(null);
  const edgePanDirectionRef = useRef<EdgePanDirection | null>(null);
  const edgePanDidMoveRef = useRef(false);
  const [activeEdgePanDirection, setActiveEdgePanDirection] = useState<EdgePanDirection | null>(null);

  // 외부 zoom이 제공되면 그것을 사용, 아니면 내부 상태 사용
  const zoom = externalZoom ?? internalZoom;
  const setZoom = onZoomChange ?? setInternalZoom;
  
  const isDragging = Boolean(dragState.draggedItemId);

  useEffect(() => {
    panRef.current = pan;
  }, [pan]);

  const stopEdgePan = useCallback(() => {
    edgePanDirectionRef.current = null;
    setActiveEdgePanDirection((currentDirection) =>
      currentDirection === null ? currentDirection : null
    );
    if (edgePanFrameRef.current === null) return;
    window.cancelAnimationFrame(edgePanFrameRef.current);
    edgePanFrameRef.current = null;
    if (edgePanDidMoveRef.current) {
      edgePanDidMoveRef.current = false;
      setPan(panRef.current);
    }
  }, []);

  const startEdgePan = useCallback((direction: EdgePanDirection) => {
    const edgePanSpeed = EDGE_PAN_BASE_SPEED * (isFullscreen ? 3 : 2.5);
    edgePanDirectionRef.current = direction;
    setActiveEdgePanDirection((currentDirection) =>
      currentDirection === direction ? currentDirection : direction
    );
    if (edgePanFrameRef.current !== null) return;

    const moveCanvas = () => {
      const activeDirection = edgePanDirectionRef.current;
      if (!activeDirection) {
        edgePanFrameRef.current = null;
        return;
      }

      panRef.current = {
        x: panRef.current.x + (activeDirection === "left" ? edgePanSpeed : -edgePanSpeed),
        y: panRef.current.y,
      };
      edgePanDidMoveRef.current = true;
      if (canvasRef.current) {
        canvasRef.current.style.transform = `translate(${panRef.current.x}px, ${panRef.current.y}px) scale(${zoom})`;
      }
      edgePanFrameRef.current = window.requestAnimationFrame(moveCanvas);
    };

    edgePanFrameRef.current = window.requestAnimationFrame(moveCanvas);
  }, [isFullscreen, zoom]);

  useEffect(() => {
    const draggedNode = dragState.draggedItemId
      ? nodeRefs.current.get(dragState.draggedItemId)
      : null;
    const dragOverNode = dragState.dragOverItemId
      ? nodeRefs.current.get(dragState.dragOverItemId)
      : null;

    draggedNode?.classList.add("opacity-50");
    dragOverNode?.classList.add("ring-2", "ring-secondary-40", "bg-secondary-10");

    return () => {
      draggedNode?.classList.remove("opacity-50");
      dragOverNode?.classList.remove("ring-2", "ring-secondary-40", "bg-secondary-10");
    };
  }, [dragState.draggedItemId, dragState.dragOverItemId]);

  useEffect(() => {
    if (!navigationTarget) return;

    const viewportElement = viewportRef.current;
    const nodeElement = nodeRefs.current.get(navigationTarget.memberId);
    if (!viewportElement || !nodeElement) return;

    const viewportRect = viewportElement.getBoundingClientRect();
    const nodeRect = nodeElement.getBoundingClientRect();
    const layoutToScreenScale = viewportElement.offsetWidth > 0
      ? viewportRect.width / viewportElement.offsetWidth
      : 1;
    const horizontalScreenDelta = viewportRect.left + viewportRect.width / 2 - (nodeRect.left + nodeRect.width / 2);
    const verticalScreenDelta = viewportRect.top + viewportRect.height / 2 - (nodeRect.top + nodeRect.height / 2);

    setIsNavigating(true);
    setFocusedMemberId(navigationTarget.memberId);
    setPan((currentPan) => ({
      x: currentPan.x + horizontalScreenDelta / layoutToScreenScale,
      y: currentPan.y + verticalScreenDelta / layoutToScreenScale,
    }));

    if (navigationTimeoutRef.current) clearTimeout(navigationTimeoutRef.current);
    if (focusTimeoutRef.current) clearTimeout(focusTimeoutRef.current);
    navigationTimeoutRef.current = setTimeout(() => setIsNavigating(false), 320);
    focusTimeoutRef.current = setTimeout(() => setFocusedMemberId(null), 1400);
  }, [navigationTarget]);

  useEffect(() => {
    return () => {
      if (navigationTimeoutRef.current) clearTimeout(navigationTimeoutRef.current);
      if (focusTimeoutRef.current) clearTimeout(focusTimeoutRef.current);
      if (edgePanFrameRef.current !== null) {
        window.cancelAnimationFrame(edgePanFrameRef.current);
      }
    };
  }, []);

  // 드래그가 종료되면 가이드 영역 상태 리셋
  useEffect(() => {
    if (!isDragging) {
      setIsDragOverRemoveParent(false);
      stopEdgePan();
    }
  }, [isDragging, stopEdgePan]);

  useEffect(() => {
    window.addEventListener("dragend", stopEdgePan);
    window.addEventListener("drop", stopEdgePan);
    return () => {
      window.removeEventListener("dragend", stopEdgePan);
      window.removeEventListener("drop", stopEdgePan);
    };
  }, [stopEdgePan]);

  const onWheel = useCallback((e: WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    const next = Math.min(2, Math.max(0.6, zoom - e.deltaY * 0.0015));
    setZoom(Number(next.toFixed(2)));
  }, [zoom, setZoom]);

  const onMouseDown = useCallback((e: MouseEvent<HTMLDivElement>) => {
    // 노드 카드나 버튼을 클릭한 경우 팬 비활성화
    const target = e.target as HTMLElement;
    const isNodeElement = target.closest('[draggable="true"]') || target.closest('button') || target.closest('[role="button"]');
    
    if (isNodeElement) {
      isNodeDraggingRef.current = true;
      return;
    }

    // 왼쪽 마우스 버튼으로 빈 공간을 드래그하면 팬 시작
    if (e.button === 0) {
      isPanningRef.current = true;
      isNodeDraggingRef.current = false;
      setIsGrabbing(true);
      panStartRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
      e.preventDefault(); // 텍스트 선택 방지
    } else if (e.button === 1 || e.shiftKey) {
      // 중간 버튼이나 Shift 키는 기존 동작 유지
      isPanningRef.current = true;
      setIsGrabbing(true);
      panStartRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
    }
  }, [pan.x, pan.y]);

  const onMouseMove = useCallback((e: MouseEvent<HTMLDivElement>) => {
    if (!isPanningRef.current || isNodeDraggingRef.current) return;
    setPan({ x: e.clientX - panStartRef.current.x, y: e.clientY - panStartRef.current.y });
    e.preventDefault(); // 드래그 중 텍스트 선택 방지
  }, []);

  const onMouseUp = useCallback(() => {
    isPanningRef.current = false;
    setIsGrabbing(false);
    // 약간의 지연 후 리셋하여 드래그 앤 드롭 완료 후 리셋
    setTimeout(() => {
      isNodeDraggingRef.current = false;
    }, 100);
  }, []);

  // 모바일 터치 핸들러
  const onTouchStart = useCallback((e: TouchEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    // 노드 카드나 버튼을 터치한 경우 팬 비활성화
    const isNodeElement = target.closest('[draggable="true"]') || target.closest('button') || target.closest('[role="button"]');
    
    if (isNodeElement) {
      isNodeDraggingRef.current = true;
      touchStartRef.current = null;
      return;
    }
    
    isNodeDraggingRef.current = false;

    if (e.touches.length === 1) {
      // 단일 터치: 팬 시작
      const touch = e.touches[0];
      touchStartRef.current = {
        x: touch.clientX,
        y: touch.clientY,
        panX: pan.x,
        panY: pan.y,
        target: e.target,
      };
      lastTouchDistanceRef.current = null;
    } else if (e.touches.length === 2) {
      // 두 손가락: 줌 시작
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.hypot(touch2.clientX - touch1.clientX, touch2.clientY - touch1.clientY);
      lastTouchDistanceRef.current = distance;
      touchStartRef.current = null;
    }
  }, [pan.x, pan.y]);

  const onTouchMove = useCallback((e: TouchEvent<HTMLDivElement>) => {
    // 노드 드래그 중이면 기본 동작 허용 (드래그 앤 드롭)
    if (isNodeDraggingRef.current) {
      return;
    }

    // 팬 또는 줌 모드일 때만 preventDefault
    if (touchStartRef.current || lastTouchDistanceRef.current !== null) {
      e.preventDefault();
    }

    if (e.touches.length === 1 && touchStartRef.current && !isNodeDraggingRef.current) {
      // 단일 터치: 팬
      const touch = e.touches[0];
      const deltaX = touch.clientX - touchStartRef.current.x;
      const deltaY = touch.clientY - touchStartRef.current.y;
      setPan({
        x: touchStartRef.current.panX + deltaX,
        y: touchStartRef.current.panY + deltaY,
      });
    } else if (e.touches.length === 2 && lastTouchDistanceRef.current !== null) {
      // 두 손가락: 줌
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.hypot(touch2.clientX - touch1.clientX, touch2.clientY - touch1.clientY);
      const scale = distance / lastTouchDistanceRef.current;
      const next = Math.min(2, Math.max(0.6, zoom * scale));
      lastTouchDistanceRef.current = distance;
      setZoom(Number(next.toFixed(2)));
    }
  }, [zoom, setZoom]);

  const onTouchEnd = useCallback(() => {
    touchStartRef.current = null;
    lastTouchDistanceRef.current = null;
    // 약간의 지연 후 리셋하여 드래그 앤 드롭 완료 후 리셋
    setTimeout(() => {
      isNodeDraggingRef.current = false;
    }, 100);
  }, []);

  // 노드 카드만 렌더링 (배지 + 카드)
  const renderNodeCard = useCallback(
    (item: TeamMember, isCompactMember: boolean = false) => {
      const isLeader = item.isLeader;

      return (
        <div className="flex flex-col items-center">
          {/* 팀/부서 배지 (리더일 경우) 또는 높이 맞춤용 빈 공간 */}
          {isLeader ? (
            <TeamNameBadge
              label={item.department ?? ""}
              className="mb-2"
              style={{
                minWidth: `${TOKENS.node.badge.w}px`,
                height: `${TOKENS.node.badge.h}px`,
              }}
              title={item.department}
            />
          ) : isCompactMember ? null : (
            <div
              className="mb-2 flex justify-center"
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
            ref={(element) => {
              if (element) {
                nodeRefs.current.set(item.id, element);
              } else {
                nodeRefs.current.delete(item.id);
              }
            }}
            className={`group relative flex flex-none items-center gap-2 rounded-[12px] border border-border px-4 shadow-[0px_2px_6px_0px_rgba(0,0,0,0.12)] transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-secondary-40/40 ${
              isLeader ? "bg-team-leader-highlight" : "bg-neutral-10"
            } ${focusedMemberId === item.id ? "ring-2 ring-[var(--primary-60)] ring-offset-2 ring-offset-card" : ""}`}
            style={{
              width: `${TOKENS.node.leader.w}px`,
              height: `${TOKENS.node.leader.h}px`,
              touchAction: 'manipulation', // 노드 카드는 터치 조작 허용 (드래그 앤 드롭용)
              cursor: 'move', // 노드 카드는 항상 move 커서
            } as React.CSSProperties}
            draggable
            onDragStart={(e: DragEvent<HTMLDivElement>) => {
              isNodeDraggingRef.current = true;
              dragHandlers.handleDragStart(e, item);
            }}
            onDragOver={(e: DragEvent<HTMLDivElement>) => dragHandlers.handleDragOver(e, item.id)}
            onDragLeave={dragHandlers.handleDragLeave}
            onDrop={(e: DragEvent<HTMLDivElement>) => dragHandlers.handleDrop(e, item.id)}
            onDragEnd={() => {
              isNodeDraggingRef.current = false;
              dragHandlers.handleDragEnd();
            }}
          >
            <div
              className={`flex flex-shrink-0 items-center justify-center rounded-full text-[14px] font-semibold leading-[12px] text-neutral-0 ${
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
              className="min-w-0 flex-1 cursor-pointer truncate text-center text-[16px] font-semibold leading-6 tracking-[0.2px] text-foreground hover:underline focus:underline"
            >
              {item.name}
            </button>
          </div>
        </div>
      );
    },
    [dragHandlers, focusedMemberId, onMemberClick]
  );

  // 트리 노드 렌더링: 하위 팀은 가로 분기, 같은 팀의 일반 구성원은 세로 목록으로 배치
  const renderNode = useCallback(
    (item: TeamMember, path: string = "", isCompactMember: boolean = false): ReactElement => {
      const children = item.children ?? [];
      const hasChildren = children.length > 0;
      // parentId를 포함한 경로로 고유성 보장 (같은 ID가 다른 부모 아래에 있을 수 있음)
      const nodePath = path ? `${path}/${item.id}` : item.id;
      const memberChildren = children.filter((child) => !child.isLeader);
      const hasChildTeams = children.some((child) => child.isLeader);
      const childBranches: ChildBranch[] = [];
      let hasAddedMemberBranch = false;

      children.forEach((child) => {
        if (child.isLeader) {
          childBranches.push({ type: "team", key: `${nodePath}/team/${child.id}`, child });
          return;
        }
        if (hasAddedMemberBranch) return;
        hasAddedMemberBranch = true;
        childBranches.push({
          type: "members",
          key: `${nodePath}/members`,
          members: memberChildren,
        });
      });
      return (
        <div key={nodePath} className="flex flex-col items-center">
          {/* 현재 노드 카드 */}
          {renderNodeCard(item, isCompactMember)}

          {/* 자식 노드들 */}
          <AnimatePresence initial={false}>
            {hasChildren && (
              <motion.div
                key={`${nodePath}-children`}
                className="flex flex-col items-center"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.18 }}
              >
                {/* 부모에서 내려오는 수직 연결선 */}
                <div
                  className="bg-border md:h-[20px] h-[12px]"
                  style={{
                    width: `${TOKENS.connector.width}px`,
                  }}
                />

                {!hasChildTeams ? (
                  <div className="flex flex-col items-center gap-2">
                    {memberChildren.map((child) => renderNode(child, nodePath, true))}
                  </div>
                ) : (
                  <div className="relative flex flex-col items-center">
                    <div className="flex items-start gap-6">
                      {childBranches.map((branch, branchIndex) => (
                        <div key={branch.key} className="relative flex flex-col items-center">
                          {childBranches.length > 1 && (
                            <>
                              {branchIndex > 0 && (
                                <div
                                  className="absolute left-[-12px] right-[50%] top-0 bg-border"
                                  style={{
                                    height: `${TOKENS.connector.width}px`,
                                  }}
                                />
                              )}
                              {branchIndex < childBranches.length - 1 && (
                                <div
                                  className="absolute left-[50%] right-[-12px] top-0 bg-border"
                                  style={{
                                    height: `${TOKENS.connector.width}px`,
                                  }}
                                />
                              )}
                            </>
                          )}

                          <div
                            className="h-[12px] bg-border md:h-[20px]"
                            style={{
                              width: `${TOKENS.connector.width}px`,
                            }}
                          />
                          {branch.type === "members" ? (
                            <div className="flex flex-col items-center gap-2">
                              {branch.members.map((member) => renderNode(member, nodePath, true))}
                            </div>
                          ) : (
                            renderNode(branch.child, nodePath)
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      );
    },
    [renderNodeCard]
  );

  const tree = useMemo(
    () => data.map((item) => <div key={`root/${item.id}`}>{renderNode(item)}</div>),
    [data, renderNode]
  );

  const handleRemoveParentDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    e.preventDefault();
    e.stopPropagation();
    setIsDragOverRemoveParent(true);
  }, [isDragging]);

  const handleRemoveParentDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
    // 자식 요소로 이동하는 경우는 무시
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;
    if (
      x >= rect.left &&
      x <= rect.right &&
      y >= rect.top &&
      y <= rect.bottom
    ) {
      return;
    }
    setIsDragOverRemoveParent(false);
  }, []);

  const handleRemoveParentDrop = useCallback((e: DragEvent<HTMLDivElement>) => {
    if (!isDragging || !dragState.draggedItemId || !onRemoveParentDrop) return;
    e.preventDefault();
    e.stopPropagation();
    setIsDragOverRemoveParent(false);
    onRemoveParentDrop(dragState.draggedItemId);
  }, [isDragging, dragState.draggedItemId, onRemoveParentDrop]);

  const handleEdgeDragOver = useCallback(
    (event: DragEvent<HTMLDivElement>, direction: EdgePanDirection) => {
      if (!isDragging) return;
      event.preventDefault();
      event.stopPropagation();
      startEdgePan(direction);
    },
    [isDragging, startEdgePan]
  );

  const handleEdgeDrop = useCallback((event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    stopEdgePan();
  }, [stopEdgePan]);

  // 빈 상태 처리
  if (data.length === 0) {
    return (
      <div
        className={`relative flex-1 min-h-40 min-w-0 max-w-full h-full overflow-hidden flex items-center justify-center md:min-w-[400px] ${isFullscreen ? "w-full" : "md:max-w-[712px]"}`}
        role="tree"
        aria-label="조직도 트리"
      >
        <div className="text-center text-neutral-60 text-[13px] md:text-[14px]">
          <p className="">표시할 조직 정보가 없습니다.</p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={viewportRef}
      className={`relative flex-1 min-h-0 min-w-0 max-w-full overflow-hidden md:min-w-[400px] md:cursor-grab ${isFullscreen ? "w-full" : "md:max-w-[712px]"} ${isGrabbing ? 'md:cursor-grabbing' : ''}`}
      style={{ 
        touchAction: 'none', 
        userSelect: 'none',
      } as React.CSSProperties}
      onWheel={onWheel}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      role="tree"
      aria-label="조직도 트리"
    >
      <AnimatePresence>
        {isDragging && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className={`absolute inset-y-0 left-0 z-[8] flex items-center justify-center bg-gradient-to-r from-card via-card/80 to-transparent ${isFullscreen ? "w-20" : "w-16"}`}
              onDragEnter={(event) => handleEdgeDragOver(event, "left")}
              onDragOver={(event) => handleEdgeDragOver(event, "left")}
              onDragLeave={stopEdgePan}
              onDrop={handleEdgeDrop}
              aria-hidden="true"
            >
              <div
                className={`pointer-events-none flex items-center justify-center rounded-full border shadow-sm transition-all ${
                  isFullscreen ? "h-12 w-12" : "h-10 w-10"
                } ${
                  activeEdgePanDirection === "left"
                    ? "border-secondary-40 bg-secondary-40 text-neutral-0"
                    : "border-border bg-card text-foreground"
                }`}
              >
                <svg width={isFullscreen ? 22 : 18} height={isFullscreen ? 22 : 18} viewBox="0 0 18 18" fill="none">
                  <path d="M11 4L6 9L11 14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className={`absolute inset-y-0 right-0 z-[8] flex items-center justify-center bg-gradient-to-l from-card via-card/80 to-transparent ${isFullscreen ? "w-20" : "w-16"}`}
              onDragEnter={(event) => handleEdgeDragOver(event, "right")}
              onDragOver={(event) => handleEdgeDragOver(event, "right")}
              onDragLeave={stopEdgePan}
              onDrop={handleEdgeDrop}
              aria-hidden="true"
            >
              <div
                className={`pointer-events-none flex items-center justify-center rounded-full border shadow-sm transition-all ${
                  isFullscreen ? "h-12 w-12" : "h-10 w-10"
                } ${
                  activeEdgePanDirection === "right"
                    ? "border-secondary-40 bg-secondary-40 text-neutral-0"
                    : "border-border bg-card text-foreground"
                }`}
              >
                <svg width={isFullscreen ? 22 : 18} height={isFullscreen ? 22 : 18} viewBox="0 0 18 18" fill="none">
                  <path d="M7 4L12 9L7 14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* 드래그 중일 때만 표시되는 루트 해제 가이드 영역 (admin/subAdmin 권한 필요) */}
      <AnimatePresence>
        {isDragging && canRemoveParent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute top-4 right-4 z-10"
            onDragOver={handleRemoveParentDragOver}
            onDragLeave={handleRemoveParentDragLeave}
            onDrop={handleRemoveParentDrop}
          >
            <div
              className={`w-[100px] h-[100px] rounded-full border-2 border-dashed flex items-center justify-center transition-colors ${
                isDragOverRemoveParent
                  ? "border-secondary-40 bg-secondary-10"
                  : "border-neutral-40 bg-neutral-10/50"
              }`}
            >
              <div className="text-center px-2">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className={`mx-auto mb-1 ${
                    isDragOverRemoveParent ? "stroke-secondary-40" : "stroke-neutral-60"
                  }`}
                >
                  <path
                    d="M12 5V19M5 12H19"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span
                  className={`text-[10px] font-medium leading-tight block ${
                    isDragOverRemoveParent ? "text-secondary-40" : "text-neutral-60"
                  }`}
                >
                  소속 해제
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      <div className="p-4 md:p-8 inline-block min-w-max">
        <div
          ref={canvasRef}
          className="relative"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: "center top",
            width: "max-content",
            transition: isNavigating ? "transform 300ms ease-out" : "none",
          }}
        >
          <div className="flex flex-nowrap items-start gap-[28px]" style={{ width: "max-content" }}>
            {tree}
          </div>
        </div>
      </div>
    </div>
  );
}
