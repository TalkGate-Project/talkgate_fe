"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import BaseModal from "@/components/common/BaseModal";
import { useMe } from "@/hooks/useMe";
import { useMembersTree, useTeams } from "@/hooks/useMembersTree";
import { MemberTreeNode } from "@/types/membersTree";
import { TeamMember } from "@/data/mockTeamData";

export type AssignCustomersModalProps = {
  open: boolean;
  onClose: () => void;
  selectedCustomerIds: number[];
  onAssign: (targetMemberId: number) => Promise<void>;
  projectId: string;
};

const ROLE_LABEL: Record<string, string> = {
  leader: "리더",
  member: "팀원",
};

function initialFromName(name: string): string {
  if (!name) return "?";
  const trimmed = name.trim();
  return trimmed.charAt(0);
}

function transformMembers(
  nodes: MemberTreeNode[] | undefined,
  teamNameByLeader: Map<number, string>,
  parentId?: string,
  level: number = 0
): TeamMember[] {
  if (!nodes) return [];
  return nodes.map((node) => {
    const id = String(node.id);
    const teamName = teamNameByLeader.get(node.id) ?? "";
    const department = teamName || ROLE_LABEL[node.role] || node.role;
    const isLeader = teamNameByLeader.has(node.id) || node.role === "leader";
    const children = transformMembers(node.descendants, teamNameByLeader, id, level + 1);
    return {
      id,
      name: node.name,
      avatar: initialFromName(node.name),
      role: department,
      department,
      isLeader,
      level,
      parentId,
      children,
      isExpanded: true,
    };
  });
}

// Internal component for rendering the hierarchical list
function HierarchicalTeamList({
  items,
  selectedId,
  onSelect,
}: {
  items: TeamMember[];
  selectedId: number | null;
  onSelect: (id: number) => void;
}) {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  // Initialize all items as expanded by default as seen in TeamManagementSettings
  useEffect(() => {
    const allIds = new Set<string>();
    function traverse(nodes: TeamMember[]) {
      nodes.forEach((node) => {
        allIds.add(node.id);
        if (node.children) traverse(node.children);
      });
    }
    traverse(items);
    setExpandedItems(allIds);
  }, [items]);

  const toggleExpand = (id: string) => {
    setExpandedItems((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const renderItems = (nodes: TeamMember[]) => {
    return nodes.map((item, index) => {
      const hasChildren = Boolean(item.children && item.children.length);
      const isExpanded = expandedItems.has(item.id);
      const indent = (item.level ?? 0) * 24;
      const isSelected = selectedId === Number(item.id);

      return (
        <div key={item.id} className="relative mb-2">
          {item.level > 0 && (
            <>
              <div
                className="absolute left-0 top-0 bottom-0 w-px bg-border"
                style={{
                  left: `${indent - 12}px`,
                  // Match the visual style from TeamListView
                  top: index === 0 ? -8 : 0,
                }}
              />
              <div
                className="absolute h-px bg-border"
                style={{ left: `${indent - 12}px`, top: 34, width: 12 }}
              />
            </>
          )}
          <div
            className={`h-[60px] flex items-center px-6 gap-4 border rounded-[12px] cursor-pointer transition-all ${
              item.isLeader ? "bg-primary-10/30" : "bg-white"
            } ${
              isSelected
                ? "border-[#51F8A5] border-2"
                : "border-neutral-30 hover:border-primary-60"
            }`}
            style={{ marginLeft: `${indent}px` }}
            onClick={() => onSelect(Number(item.id))}
          >
            {hasChildren ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleExpand(item.id);
                }}
                className={`w-6 h-6 flex items-center justify-center border border-border rounded-[5px] hover:bg-neutral-10 transition-colors ${
                  isExpanded ? "" : "rotate-[-90deg]"
                }`}
              >
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M9 18L15 12L9 6"
                    stroke="var(--neutral-60)"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            ) : (
              <div className="w-6 h-6" /> /* Placeholder for alignment */
            )}
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-neutral-0 text-[14px] font-semibold ${
                item.isLeader ? "bg-primary-80" : "bg-neutral-60"
              }`}
            >
              {item.avatar}
            </div>
            <div className="text-left text-[16px] font-semibold text-foreground">
              {item.name}
            </div>
            {item.department && item.department !== "팀원" && (
              <div className="px-3 bg-secondary-10 rounded-[30px] max-h-[22px] flex items-center justify-center">
                <span className="text-[12px] font-medium text-secondary-40 leading-[22px]">
                  {item.department}
                </span>
              </div>
            )}
          </div>
          {hasChildren && isExpanded && item.children && (
            <div className="mt-2">{renderItems(item.children)}</div>
          )}
        </div>
      );
    });
  };

  return <div>{renderItems(items)}</div>;
}

export default function AssignCustomersModal(props: AssignCustomersModalProps) {
  const { open, onClose, selectedCustomerIds, onAssign, projectId } = props;
  const [loading, setLoading] = useState(false);
  const [targetId, setTargetId] = useState<number | null>(null);
  const { user } = useMe();

  const { data: treeData, isLoading: treeLoading } = useMembersTree(projectId);
  const { data: teamsData } = useTeams(projectId);

  const teamNameByLeader = useMemo(() => {
    const map = new Map<number, string>();
    (teamsData ?? []).forEach((team) => {
      map.set(team.leaderMemberId, team.name);
    });
    return map;
  }, [teamsData]);

  const teamMembers = useMemo(
    () => transformMembers(treeData, teamNameByLeader),
    [treeData, teamNameByLeader]
  );

  // Ensure self is in the list if not present (though tree usually contains all members)
  // The tree API might return all members. If the user is not in the tree, we might want to add them.
  // However, for now, let's assume the tree covers the organization.
  // Note: The original implementation added self if missing. We can keep that logic if needed,
  // but adding to a hierarchical tree is complex without knowing where to put them.
  // We'll stick to what the tree returns for consistency with Settings page.

  useEffect(() => {
    if (open) {
      setTargetId(null);
    }
  }, [open]);

  if (!open) return null;

  const isLoading = loading || treeLoading;

  return (
    <BaseModal
      onClose={() => !loading && onClose()}
      overlayClassName="bg-black/50"
      containerClassName="relative w-[848px] max-w-[92vw] max-h-[90vh] rounded-[14px] bg-white shadow-[0_13px_61px_rgba(169,169,169,0.37)] p-6 flex flex-col"
      ariaLabel="고객 배정"
    >
      {/* Header row */}
      <div className="flex items-center justify-between flex-shrink-0">
        <div className="text-[18px] font-bold text-neutral-90">고객 배정</div>
        <div onClick={onClose} className="cursor-pointer">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M6 18L18 6M6 6L18 18"
              stroke="#B0B0B0"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>
      <div className="mt-3 flex items-center gap-3 flex-shrink-0">
        <div className="text-[14px] text-neutral-60">
          그룹 혹은 팀원에게 고객을 배정할 수 있습니다.
        </div>
        <span className="inline-flex items-center h-[22px] rounded-[30px] bg-primary-10 px-3 text-[12px] text-primary-80 opacity-80">
          선택된 고객 {selectedCustomerIds.length}
        </span>
      </div>

      <hr className="mt-3 border-neutral-30 flex-shrink-0" />

      <div className="mt-[30px] flex-1 overflow-hidden flex flex-col">
        <div className="text-[16px] font-semibold text-neutral-90 mb-3 flex-shrink-0">
          팀원 배정
        </div>
        <div className="flex-1 overflow-auto pr-2">
          {isLoading ? (
            <div className="text-center text-neutral-60 py-10">
              불러오는 중...
            </div>
          ) : (
            <HierarchicalTeamList
              items={teamMembers}
              selectedId={targetId}
              onSelect={setTargetId}
            />
          )}
        </div>
      </div>

      <hr className="mt-6 border-neutral-30 flex-shrink-0" />

      <div className="mt-4 flex items-center justify-between gap-2 flex-shrink-0">
        <div className="text-[13px] text-neutral-70">
          {/* {targetId ? (
            <>
              배정 대상 ID: <b>{targetId}</b>
            </>
          ) : (
            <>배정 대상을 선택하세요</>
          )} */}
        </div>
        <div className="flex gap-2">
          <button
            className="cursor-pointer h-[34px] px-3 rounded-[5px] border border-neutral-30 text-[14px] text-neutral-90 bg-neutral-0"
            onClick={onClose}
            disabled={loading}
          >
            취소
          </button>
          <button
            className="cursor-pointer h-[34px] px-3 rounded-[5px] bg-neutral-90 text-neutral-40 text-[14px] font-semibold disabled:opacity-50"
            disabled={loading || !targetId}
            onClick={async () => {
              if (!targetId) return;
              setLoading(true);
              try {
                await onAssign(targetId);
                onClose();
              } catch (e) {
                alert("배정에 실패했습니다");
              } finally {
                setLoading(false);
              }
            }}
          >
            배정하기
          </button>
        </div>
      </div>
    </BaseModal>
  );
}
