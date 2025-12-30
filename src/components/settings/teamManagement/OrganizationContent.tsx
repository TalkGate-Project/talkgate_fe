"use client";

import TeamNameBadge from "@/components/common/TeamNameBadge";
import AsyncButton from "@/components/common/AsyncButton";
import { showErrorModal } from "@/providers/ErrorFeedbackModalProvider";
import { HIERARCHY_LIST_TOKENS, getIndent, getConnectorLeft } from "./tokens";
import type { OrgNode } from "./memberInfoUtils";

type Props = {
  memberId: number;
  orgTreeRoot: OrgNode | null;
  canCreateTeam: boolean;
  canDeleteTeam: boolean;
  teamName?: string;
  teamCreateMode: boolean;
  setTeamCreateMode: (mode: boolean) => void;
  teamNameDraft: string;
  setTeamNameDraft: (draft: string) => void;
  onCreateTeam: () => Promise<void>;
  onDeleteTeam: () => void;
  isCreatingTeam: boolean;
  isDeletingTeam: boolean;
};

export default function OrganizationContent({
  memberId,
  orgTreeRoot,
  canCreateTeam,
  canDeleteTeam,
  teamName,
  teamCreateMode,
  setTeamCreateMode,
  teamNameDraft,
  setTeamNameDraft,
  onCreateTeam,
  onDeleteTeam,
  isCreatingTeam,
  isDeletingTeam,
}: Props) {
  const renderOrgNode = (node: OrgNode, index: number = 0) => {
    const isNodeLeader = node.role === "leader" || node.id === memberId;
    const indent = getIndent(node.level);
    const connectorLeft = getConnectorLeft(node.level);
    const hasChildren = node.children && node.children.length > 0;

    return (
      <div key={node.id} className="relative mb-2">
        {node.level > 0 && (
          <>
            <div
              className="absolute left-0 top-0 bottom-0 w-px bg-border"
              style={{
                left: `${connectorLeft}px`,
                top:
                  index === 0
                    ? HIERARCHY_LIST_TOKENS.connector.firstItemTopOffset
                    : 0,
              }}
            />
            <div
              className="absolute h-px bg-border"
              style={{
                left: `${connectorLeft}px`,
                top: HIERARCHY_LIST_TOKENS.connector.horizontalTop,
                width: HIERARCHY_LIST_TOKENS.connector.horizontalWidth,
              }}
            />
          </>
        )}
        <div
          className={`flex items-center gap-3 px-5 py-3 rounded-[12px] ${
            isNodeLeader
              ? "bg-team-leader-highlight"
              : "bg-neutral-10 dark:bg-neutral-25"
          }`}
          style={{ marginLeft: `${indent}px` }}
        >
          <div
            className={`w-8 h-8 rounded-full text-white text-[14px] font-semibold flex items-center justify-center ${
              isNodeLeader ? "bg-primary-80" : "bg-neutral-60"
            }`}
          >
            {node.avatar}
          </div>
          <span className="text-[14px] font-medium text-foreground">
            {node.name}
          </span>
          {isNodeLeader && node.department && (
            <TeamNameBadge label={node.department} />
          )}
        </div>
        {hasChildren && (
          <div className="mt-2">
            {node.children.map((child, childIndex) =>
              renderOrgNode(child, childIndex)
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <section className="border border-border rounded-[12px] p-5 space-y-5 dark:bg-neutral-10">
      {canCreateTeam &&
        (teamCreateMode ? (
          <div className="flex flex-wrap items-center gap-2">
            <input
              value={teamNameDraft}
              onChange={(e) => setTeamNameDraft(e.target.value)}
              placeholder="팀이름을 입력하세요"
              className="h-[34px] w-full max-w-[240px] px-3 border border-border rounded-[5px] text-[14px] text-foreground placeholder:text-neutral-60 bg-card"
            />
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setTeamCreateMode(false);
                  setTeamNameDraft("");
                }}
                className="h-[34px] px-3 rounded-[5px] border border-border text-[14px] font-semibold text-foreground bg-card"
              >
                취소
              </button>
              <AsyncButton
                variant="secondary"
                size="sm"
                onClick={onCreateTeam}
                loading={isCreatingTeam}
                className="bg-neutral-90 dark:bg-neutral-80 text-white dark:text-neutral-0 hover:bg-neutral-80 dark:hover:bg-neutral-70"
              >
                저장
              </AsyncButton>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setTeamCreateMode(true)}
            className="cursor-pointer h-[34px] px-3 rounded-[5px] bg-secondary-60 text-[14px] font-semibold text-white"
          >
            팀 생성
          </button>
        ))}
      {canDeleteTeam && (
        <div className="flex items-center gap-2">
          <span className="text-[14px] text-foreground">{teamName}</span>
          <button
            type="button"
            onClick={onDeleteTeam}
            disabled={isDeletingTeam}
            className={`${
              isDeletingTeam ? "cursor-not-allowed" : "cursor-pointer"
            } h-[34px] px-3 rounded-[5px] border border-border text-[14px] font-semibold text-neutral-60 bg-card disabled:opacity-60`}
          >
            {isDeletingTeam ? "제거 중..." : "팀 제거"}
          </button>
        </div>
      )}

      <div className="space-y-3">
        <span className="block text-[16px] font-semibold text-foreground">
          조직도
        </span>
        <div className="space-y-2">
          {orgTreeRoot ? (
            renderOrgNode(orgTreeRoot)
          ) : (
            <div className="px-4 py-3 bg-neutral-10 dark:bg-neutral-25 rounded-[12px] text-[14px] text-neutral-60">
              조직도 정보가 없습니다.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

