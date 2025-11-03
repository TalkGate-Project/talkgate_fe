"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import type { DragEvent, MouseEvent, WheelEvent, ReactElement } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { TeamMember } from "@/data/mockTeamData";
import { DragHandlers, DragState } from "./useTeamTree";
import { TOKENS } from "./tokens";

type Props = {
  data: TeamMember[];
  dragHandlers: DragHandlers;
  dragState: DragState;
  onMemberClick: (member: TeamMember) => void;
};

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

  const renderNode = useCallback(
    (item: TeamMember): ReactElement => {
      const leaderChildren = item.children?.filter((child) => child.isLeader) ?? [];
      const memberChildren = item.children?.filter((child) => !child.isLeader) ?? [];
      const isDragOver = dragState.dragOverItemId === item.id;
      const isDragging = dragState.draggedItemId === item.id;

      return (
        <div key={item.id} className="relative flex flex-col items-center">
          {item.isLeader && (
            <div
              className="absolute left-1/2 -translate-x-1/2 flex justify-center items-center px-3 py-1 rounded-[30px] shadow-sm bg-secondary-10"
              style={{
                top: `-${TOKENS.spacing.badgeOffset}px`,
                width: `${TOKENS.node.badge.w}px`,
                height: `${TOKENS.node.badge.h}px`,
              }}
            >
              <span
                className="text-[12px] font-medium truncate text-secondary-40 opacity-80"
                title={item.department}
              >
                {item.department}
              </span>
            </div>
          )}

          <div
            className={`group relative flex items-center px-6 gap-4 border border-border rounded-[12px] cursor-move transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-secondary-40/40 ${
              item.isLeader
                ? "bg-primary-10 bg-opacity-30"
                : "bg-card"
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
                item.isLeader ? "bg-primary-80" : "bg-neutral-60"
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
              onClick={(e) => {
                e.stopPropagation();
                onMemberClick(item);
              }}
              className="font-semibold text-left text-[16px] leading-6 tracking-[0.2px] text-foreground hover:underline focus:underline"
            >
              {item.name}
            </button>
          </div>

          <AnimatePresence initial={false}>
            {leaderChildren.length > 0 && (
              <motion.div
                key={`${item.id}-leaders`}
                className="relative"
                style={{ marginTop: `${TOKENS.spacing.vertical}px` }}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.18 }}
              >
                <div
                  className="absolute left-1/2 -translate-x-1/2"
                  style={{
                    width: `${TOKENS.connector.width}px`,
                    height: `${TOKENS.spacing.vertical}px`,
                    background: TOKENS.connector.color,
                    borderRadius: TOKENS.connector.borderRadius,
                    top: 0,
                  }}
                />

                <div
                  className="relative flex justify-center gap-8"
                  style={{ paddingTop: `${TOKENS.spacing.vertical}px` }}
                >
                  <div
                    className="absolute top-0"
                    style={{
                      left: `${TOKENS.node.leader.w / 2}px`,
                      right: `${TOKENS.node.leader.w / 2}px`,
                      height: 1,
                      background: TOKENS.connector.color,
                    }}
                  />

                  {leaderChildren.map((child) => (
                    <div key={child.id} className="relative flex flex-col items-center" style={{ paddingTop: `${TOKENS.spacing.vertical}px` }}>
                      <div
                        className="absolute top-0 left-1/2 -translate-x-1/2"
                        style={{
                          width: `${TOKENS.connector.width}px`,
                          height: `${TOKENS.spacing.vertical}px`,
                          background: TOKENS.connector.color,
                          borderRadius: TOKENS.connector.borderRadius,
                        }}
                      />
                      {renderNode(child)}
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {memberChildren.length > 0 && (
              <motion.div
                key={`${item.id}-members`}
                className="relative"
                style={{ marginTop: `${TOKENS.spacing.vertical}px` }}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.18 }}
              >
                <div
                  className="absolute left-1/2 -translate-x-1/2"
                  style={{
                    width: `${TOKENS.connector.width}px`,
                    height: `${TOKENS.spacing.vertical}px`,
                    background: TOKENS.connector.color,
                    borderRadius: TOKENS.connector.borderRadius,
                    top: 0,
                  }}
                />

                <div
                  className="flex flex-col items-center"
                  style={{ paddingTop: `${TOKENS.spacing.vertical}px`, gap: `${TOKENS.spacing.vertical}px` }}
                >
                  {memberChildren.map((member, index) => {
                    const memberDragOver = dragState.dragOverItemId === member.id;
                    const memberDragging = dragState.draggedItemId === member.id;
                    return (
                      <div key={member.id} className="flex flex-col items-center">
                        {index > 0 && (
                          <div
                            style={{
                              width: `${TOKENS.connector.width}px`,
                              height: `${TOKENS.spacing.vertical}px`,
                              background: TOKENS.connector.color,
                              borderRadius: TOKENS.connector.borderRadius,
                            }}
                          />
                        )}
                        <div
                          className={`flex items-center px-6 gap-4 border rounded-[12px] bg-white transition-all ${
                            memberDragOver ? "ring-2 ring-blue-400 bg-blue-50" : ""
                          } ${memberDragging ? "opacity-50" : ""}`}
                          style={{
                            minWidth: `${TOKENS.node.member.w}px`,
                            height: `${TOKENS.node.member.h}px`,
                            borderColor: TOKENS.colors.light[30],
                          }}
                          draggable
                          onDragStart={(e) => dragHandlers.handleDragStart(e, member)}
                          onDragOver={(e) => dragHandlers.handleDragOver(e, member.id)}
                          onDragLeave={dragHandlers.handleDragLeave}
                          onDrop={(e) => dragHandlers.handleDrop(e, member.id)}
                          onDragEnd={dragHandlers.handleDragEnd}
                        >
                          <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[14px] font-semibold bg-[#808080]">
                            {member.avatar}
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onMemberClick(member);
                            }}
                            className="text-left text-[16px] font-semibold text-[#000000] hover:underline focus:underline"
                          >
                            {member.name}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      );
    },
    [dragHandlers, dragState, onMemberClick]
  );

  const tree = useMemo(
    () => data.map((item) => <div key={item.id}>{renderNode(item)}</div>),
    [data, renderNode]
  );

  return (
    <div
      className="relative min-h-[500px] max-w-[950px] overflow-x-auto overflow-y-visible"
      onWheel={onWheel}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      role="tree"
      aria-label="조직도 트리"
    >
      <div className="p-8 inline-block">
        <div
          className="relative"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: "center top",
            width: "max-content",
          }}
        >
          <div className="flex flex-nowrap gap-8 items-start mb-8" style={{ width: "max-content" }}>
            {tree}
          </div>
        </div>
      </div>
    </div>
  );
}
