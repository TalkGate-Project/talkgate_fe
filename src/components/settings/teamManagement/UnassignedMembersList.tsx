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

export default function UnassignedMembersList({ data, dragHandlers, dragState, onMemberClick }: Props) {
  if (data.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center text-neutral-50 text-[14px]">
        미배정 멤버가 없습니다
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      {data.map((member) => {
        const isDragOver = dragState.dragOverItemId === member.id;
        const isDragging = dragState.draggedItemId === member.id;

        return (
          <div
            key={member.id}
            className={`max-w-[148px] h-[40px] flex items-center gap-3 px-4 border border-neutral-30 rounded-[10px] bg-neutral-10 cursor-move transition-all hover:shadow-[0_3px_10px_rgba(0,0,0,0.12)] dark:hover:shadow-[0_3px_10px_rgba(0,0,0,0.35)] ${
              isDragOver ? "ring-2 ring-secondary-40 bg-secondary-10" : ""
            } ${isDragging ? "opacity-50" : ""}`}
            draggable
            onDragStart={(e: DragEvent<HTMLDivElement>) => dragHandlers.handleDragStart(e, member)}
            onDragOver={(e: DragEvent<HTMLDivElement>) => dragHandlers.handleDragOver(e, member.id)}
            onDragLeave={dragHandlers.handleDragLeave}
            onDrop={(e: DragEvent<HTMLDivElement>) => dragHandlers.handleDrop(e, member.id)}
            onDragEnd={dragHandlers.handleDragEnd}
          >
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[14px] font-semibold bg-neutral-60 flex-shrink-0">
              {member.avatar}
            </div>
            <button
              type="button"
              title={member.name}
              onClick={(e) => {
                e.stopPropagation();
                onMemberClick(member);
              }}
              className="text-left text-[16px] font-medium text-foreground hover:underline focus:underline truncate"
            >
              {member.name}
            </button>
          </div>
        );
      })}
    </div>
  );
}

