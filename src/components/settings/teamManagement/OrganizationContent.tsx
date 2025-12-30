"use client";

import { useState, useEffect } from "react";
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
  teamEditMode: boolean;
  setTeamEditMode: (mode: boolean) => void;
  teamEditDraft: string;
  setTeamEditDraft: (draft: string) => void;
  onUpdateTeam: () => Promise<void>;
  isUpdatingTeam: boolean;
};

// 모든 노드 ID를 수집하는 헬퍼 함수
function collectAllNodeIds(node: OrgNode | null): Set<number> {
  const ids = new Set<number>();
  if (!node) return ids;
  
  const traverse = (n: OrgNode) => {
    ids.add(n.id);
    n.children.forEach((child) => traverse(child));
  };
  
  traverse(node);
  return ids;
}

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
  teamEditMode,
  setTeamEditMode,
  teamEditDraft,
  setTeamEditDraft,
  onUpdateTeam,
  isUpdatingTeam,
}: Props) {
  // 모든 노드를 기본적으로 열린 상태로 초기화
  const [expandedNodes, setExpandedNodes] = useState<Set<number>>(() => {
    if (orgTreeRoot) {
      return collectAllNodeIds(orgTreeRoot);
    }
    return new Set();
  });

  // orgTreeRoot가 변경되면 모든 노드를 다시 열린 상태로 초기화
  useEffect(() => {
    if (orgTreeRoot) {
      const allNodeIds = collectAllNodeIds(orgTreeRoot);
      // 모든 노드 ID를 확장 상태로 설정
      setExpandedNodes(allNodeIds);
    } else {
      setExpandedNodes(new Set());
    }
  }, [orgTreeRoot]);

  const toggleNode = (nodeId: number) => {
    setExpandedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  };

  const renderOrgNode = (node: OrgNode, index: number = 0) => {
    // role이 "leader"인 경우에만 팀장으로 표시 (팀원은 회색 배경)
    const isNodeLeader = node.role === "leader";
    const indent = getIndent(node.level);
    const connectorLeft = getConnectorLeft(node.level);
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = expandedNodes.has(node.id);

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
          {hasChildren && (
            <button
              onClick={() => toggleNode(node.id)}
              className="w-[26px] h-[26px] flex items-center justify-center flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
              aria-label={isExpanded ? "접기" : "펼치기"}
            >
              {isExpanded ? (
                // 열렸을 때: 아래쪽 화살표 (v)
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 26 26"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <rect
                    x="25.5"
                    y="0.5"
                    width="25"
                    height="25"
                    rx="5.5"
                    transform="rotate(90 25.5 0.5)"
                    stroke="#E2E2E2"
                  />
                  <path
                    d="M7.16536 10.5L12.9987 16.3333L18.832 10.5"
                    stroke="#B0B0B0"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              ) : (
                // 닫혔을 때: 오른쪽 화살표 (>)
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 26 26"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <rect
                    x="0.5"
                    y="0.5"
                    width="25"
                    height="25"
                    rx="5.5"
                    transform="matrix(0 -1 -1 0 26 26)"
                    stroke="#E2E2E2"
                  />
                  <path
                    d="M10.5 18.8332L16.3333 12.9998L10.5 7.1665"
                    stroke="#B0B0B0"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </button>
          )}
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
        {hasChildren && isExpanded && (
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
          {teamEditMode ? (
            <>
              <input
                value={teamEditDraft}
                onChange={(e) => setTeamEditDraft(e.target.value)}
                placeholder="팀이름을 입력하세요"
                className="h-[34px] flex-1 max-w-[240px] px-3 border border-border rounded-[5px] text-[14px] text-foreground placeholder:text-neutral-60 bg-card"
              />
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setTeamEditMode(false);
                    setTeamEditDraft(teamName || "");
                  }}
                  className="cursor-pointer h-[34px] px-3 rounded-[5px] border border-border text-[14px] font-semibold text-foreground bg-card"
                >
                  취소
                </button>
                <AsyncButton
                  variant="secondary"
                  size="sm"
                  onClick={onUpdateTeam}
                  loading={isUpdatingTeam}
                  className="bg-neutral-90 dark:bg-neutral-80 text-white dark:text-neutral-0 hover:bg-neutral-80 dark:hover:bg-neutral-70"
                >
                  저장
                </AsyncButton>
              </div>
            </>
          ) : (
            <>
              <span className="text-[14px] text-foreground">{teamName}</span>
              <button
                type="button"
                onClick={() => {
                  setTeamEditMode(true);
                  setTeamEditDraft(teamName || "");
                }}
                className="cursor-pointer w-6 h-6 grid place-items-center hover:opacity-80 transition-opacity"
                aria-label="팀 이름 수정"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M20.2677 3.73223L20.9748 3.02513V3.02513L20.2677 3.73223ZM6.5 21.0355V22.0355C6.76522 22.0355 7.01957 21.9301 7.20711 21.7426L6.5 21.0355ZM3 21.0355H2C2 21.5878 2.44772 22.0355 3 22.0355V21.0355ZM3 17.4644L2.29289 16.7573C2.10536 16.9448 2 17.1992 2 17.4644H3ZM16.7322 3.73223L17.4393 4.43934C18.0251 3.85355 18.9748 3.85355 19.5606 4.43934L20.2677 3.73223L20.9748 3.02513C19.608 1.65829 17.3919 1.65829 16.0251 3.02513L16.7322 3.73223ZM20.2677 3.73223L19.5606 4.43934C20.1464 5.02513 20.1464 5.97487 19.5606 6.56066L20.2677 7.26777L20.9748 7.97487C22.3417 6.60804 22.3417 4.39196 20.9748 3.02513L20.2677 3.73223ZM20.2677 7.26777L19.5606 6.56066L5.79289 20.3284L6.5 21.0355L7.20711 21.7426L20.9748 7.97487L20.2677 7.26777ZM6.5 21.0355V20.0355H3V21.0355V22.0355H6.5V21.0355ZM16.7322 3.73223L16.0251 3.02513L2.29289 16.7573L3 17.4644L3.70711 18.1715L17.4393 4.43934L16.7322 3.73223ZM3 17.4644H2V21.0355H3H4V17.4644H3ZM15.2322 5.23223L14.5251 5.93934L18.0606 9.47487L18.7677 8.76777L19.4748 8.06066L15.9393 4.52513L15.2322 5.23223Z" fill="#B0B0B0"/>
                </svg>
              </button>
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
            </>
          )}
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
