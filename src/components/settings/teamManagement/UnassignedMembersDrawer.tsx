"use client";

import { AnimatePresence, motion } from "framer-motion";
import { TeamMember } from "@/types/teams";
import { DragHandlers, DragState } from "@/hooks/useTeamTree";
import UnassignedMembersList from "./UnassignedMembersList";

interface UnassignedMembersDrawerProps {
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
  members: TeamMember[];
  dragHandlers: DragHandlers;
  dragState: DragState;
  onMemberClick: (member: TeamMember) => void;
}

export default function UnassignedMembersDrawer({
  isOpen,
  onOpen,
  onClose,
  members,
  dragHandlers,
  dragState,
  onMemberClick,
}: UnassignedMembersDrawerProps) {
  if (members.length === 0) return null;

  return (
    <>
      {/* 모바일: 미배정 멤버 열기 버튼 */}
      {!isOpen && (
        <button
          type="button"
          onClick={onOpen}
          className="md:hidden fixed bottom-6 right-4 w-12 h-12 rounded-full bg-neutral-90 text-neutral-0 flex items-center justify-center shadow-lg z-40"
          aria-label="미배정 멤버 보기"
        >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M12 5V19M5 12H19"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      )}

      {/* 모바일: 미배정 멤버 드로워 */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Dimmed Background */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="fixed inset-0 bg-black/30 dark:bg-black/50 z-[100] md:hidden"
            />
            {/* Drawer Content */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 bottom-0 w-[280px] bg-card dark:bg-neutral-10 z-[101] shadow-lg overflow-y-auto md:hidden"
            >
              {/* Header */}
              <div className="h-[64px] flex items-center justify-between px-4 border-b border-neutral-30 flex-shrink-0">
                <h3 className="text-[18px] font-semibold text-foreground">미배정 멤버</h3>
                <button
                  type="button"
                  onClick={onClose}
                  className="cursor-pointer w-6 h-6 flex items-center justify-center text-neutral-60"
                  aria-label="닫기"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M6 18L18 6M6 6l12 12"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </div>
              {/* Content */}
              <div className="p-4">
                <UnassignedMembersList
                  data={members}
                  dragHandlers={dragHandlers}
                  dragState={dragState}
                  onMemberClick={(member) => {
                    onMemberClick(member);
                    onClose();
                  }}
                />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
