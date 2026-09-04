"use client";

import type { DragEvent } from "react";
import { TeamMember } from "@/types/teams";
import { DragHandlers, DragState } from "@/hooks/useTeamTree";

type Props = {
  data: TeamMember[];
  dragHandlers: DragHandlers;
  dragState: DragState;
  onMemberClick: (member: TeamMember) => void;
};

export default function UnassignedMembersList({
  data,
  dragHandlers,
  dragState,
  onMemberClick,
}: Props) {
  if (data.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center text-neutral-50 text-[14px]">
        미배정 멤버가 없습니다
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 px-6 py-4">
      {data.map((member) => {
        const isDragOver = dragState.dragOverItemId === member.id;
        const isDragging = dragState.draggedItemId === member.id;

        return (
          <div
            key={member.id}
            className={`flex h-[44px] w-[153px] flex-none cursor-move items-center gap-2 rounded-[12px] border border-neutral-30 bg-neutral-10 px-4 shadow-[0px_2px_6px_0px_rgba(0,0,0,0.12)] transition-all hover:shadow-[0_3px_10px_rgba(0,0,0,0.12)] dark:hover:shadow-[0_3px_10px_rgba(0,0,0,0.35)] ${
              isDragOver ? "ring-2 ring-secondary-40 bg-secondary-10" : ""
            } ${isDragging ? "opacity-50" : ""}`}
            draggable
            onDragStart={(e: DragEvent<HTMLDivElement>) => dragHandlers.handleDragStart(e, member)}
            onDragOver={(e: DragEvent<HTMLDivElement>) => dragHandlers.handleDragOver(e, member.id)}
            onDragLeave={dragHandlers.handleDragLeave}
            onDrop={(e: DragEvent<HTMLDivElement>) => dragHandlers.handleDrop(e, member.id)}
            onDragEnd={dragHandlers.handleDragEnd}
          >
            <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-neutral-60 text-[14px] font-semibold leading-[12px] text-white">
              {member.avatar}
            </div>
            <button
              type="button"
              title={member.name}
              onClick={(e) => {
                e.stopPropagation();
                onMemberClick(member);
              }}
              className="min-w-0 flex-1 truncate text-center text-[16px] font-semibold leading-6 text-foreground hover:underline focus:underline"
            >
              {member.name}
            </button>
          </div>
        );
      })}
    </div>
  );
}

