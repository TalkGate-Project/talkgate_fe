"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useMemberDetail } from "@/hooks/useMemberDetail";
import { useCreateTeamMutation } from "@/hooks/useMembersTree";
import type {
  MemberDetail,
  HrNote,
  TeamChangeLog,
  OrganizationTreeNode,
} from "@/types/members";

type Props = {
  open: boolean;
  memberId: number;
  onClose: () => void;
  projectId: string | number | null;
};

type TabKey = "organization" | "manager";

type OrgNode = {
  id: number;
  name: string;
  avatar: string;
  role: "leader" | "member" | string;
  department?: string;
};

function Badge({
  label,
  variant,
}: {
  label: string;
  variant?: "primary" | "secondary" | "neutral";
}) {
  const styles = {
    primary: { background: "#D6FAE8", color: "#00B55B" },
    secondary: { background: "#D3E1FE", color: "#4D82F3" },
    neutral: { background: "#E2E2E2", color: "#595959" },
  } as const;
  const tone = styles[variant ?? "secondary"];
  return (
    <span
      className="px-3 py-1 rounded-[30px] text-[12px] font-medium leading-[1]"
      style={{ background: tone.background, color: tone.color, opacity: 0.8 }}
    >
      {label}
    </span>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-2">
      <span className="text-[14px] text-[#808080]">{label}</span>
      <span className="text-[14px] font-medium text-[#252525]">{value}</span>
    </div>
  );
}

function initialFromName(name: string): string {
  if (!name) return "?";
  const trimmed = name.trim();
  if (!trimmed) return "?";
  return trimmed.charAt(0);
}

function formatDate(dateString: string): string {
  if (!dateString) return "-";
  const date = new Date(dateString);
  return date
    .toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })
    .replace(/\. /g, ". ");
}

function formatDateTime(dateString: string): string {
  if (!dateString) return "-";
  const date = new Date(dateString);
  return date
    .toLocaleString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
    .replace(/\. /g, ". ");
}

function flattenOrgTree(node: OrganizationTreeNode | undefined): OrgNode[] {
  if (!node) return [];
  const result: OrgNode[] = [];

  // 본인 추가
  result.push({
    id: node.id,
    name: node.name,
    avatar: initialFromName(node.name),
    role: node.role,
    department: node.teamName,
  });

  // descendants 추가
  (node.descendants ?? []).forEach((child) => {
    result.push({
      id: child.id,
      name: child.name,
      avatar: initialFromName(child.name),
      role: child.role,
      department: child.teamName,
    });
  });

  return result;
}

export default function TeamMemberInfoModal({
  open,
  memberId,
  onClose,
  projectId,
}: Props) {
  const [tab, setTab] = useState<TabKey>("organization");
  const [localNotes, setLocalNotes] = useState<HrNote[]>([]);
  const [noteInput, setNoteInput] = useState("");
  const [teamCreateMode, setTeamCreateMode] = useState(false);
  const [teamNameDraft, setTeamNameDraft] = useState("");
  const [profileEditMode, setProfileEditMode] = useState(false);
  const createTeam = useCreateTeamMutation(projectId);

  // API로 멤버 상세 정보 가져오기
  const { member, isLoading, isError } = useMemberDetail(
    open ? memberId : null
  );

  useEffect(() => {
    if (!open || !member) return;
    setTab("organization");
    setLocalNotes(member.hrNotes ?? []);
    setNoteInput("");
    setTeamCreateMode(false);
    setTeamNameDraft("");
    setProfileEditMode(false);
  }, [member, open]);

  if (!open || typeof document === "undefined") {
    return null;
  }

  const handleAddNote = () => {
    const trimmed = noteInput.trim();
    if (!trimmed) return;
    // TODO: API 호출로 특이사항 추가
    const newNote: HrNote = {
      id: Date.now(),
      memberId: memberId,
      note: trimmed,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setLocalNotes((prev) => [newNote, ...prev]);
    setNoteInput("");
  };

  const handleReset = () => {
    setLocalNotes(member?.hrNotes ?? []);
    setNoteInput("");
    setTab("organization");
    setProfileEditMode(false);
  };

  const isLeader =
    member?.role === "leader" ||
    member?.role === "admin" ||
    member?.role === "subAdmin";
  const canCreateTeam = !isLeader;

  // 조직도 노드 계산
  const teamNodes = flattenOrgTree(member?.organizationTree);

  const organizationContent = (
    <section className="border border-[#E2E2E2] rounded-[12px] p-5 space-y-5">
      {canCreateTeam ? (
        teamCreateMode ? (
          <div className="flex flex-wrap items-center gap-2">
            <input
              value={teamNameDraft}
              onChange={(e) => setTeamNameDraft(e.target.value)}
              placeholder="팀이름을 입력하세요"
              className="h-[34px] w-full max-w-[240px] px-3 border border-[#E2E2E2] rounded-[5px] text-[14px] text-[#252525] placeholder:text-[#808080]"
            />
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setTeamCreateMode(false);
                  setTeamNameDraft("");
                }}
                className="h-[34px] px-3 rounded-[5px] border border-[#E2E2E2] text-[14px] font-semibold text-[#252525]"
              >
                취소
              </button>
              <button
                type="button"
                onClick={async () => {
                  const trimmed = teamNameDraft.trim();
                  if (!trimmed || createTeam.isPending) return;
                  try {
                    await createTeam.mutateAsync({
                      memberId: memberId,
                      teamName: trimmed,
                    });
                    setTeamCreateMode(false);
                    setTeamNameDraft("");
                  } catch (err) {
                    console.error(err);
                    alert((err as Error)?.message ?? "팀 생성에 실패했습니다.");
                  }
                }}
                disabled={createTeam.isPending}
                className={`${
                  createTeam.isPending ? "cursor-not-allowed" : "cursor-pointer"
                } h-[34px] px-3 rounded-[5px] bg-[#252525] text-[14px] font-semibold text-[#D0D0D0] disabled:opacity-60`}
              >
                {createTeam.isPending ? "저장 중..." : "저장"}
              </button>
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
        )
      ) : (
        <button
          type="button"
          disabled
          className="cursor-pointer h-[34px] px-3 rounded-[5px] border border-[#E2E2E2] text-[14px] font-semibold text-[#808080] cursor-not-allowed"
        >
          팀 제거
        </button>
      )}

      <div className="space-y-3">
        <span className="block text-[16px] font-semibold text-[#000000]">
          조직도
        </span>
        <div className="space-y-2">
          {teamNodes.map((node) => {
            const isNodeLeader = node.role === "leader" || node.id === memberId;
            return (
              <div
                key={node.id}
                className={`flex items-center gap-3 px-5 py-3 rounded-[12px] ${
                  isNodeLeader ? "bg-[#E9F8EF]" : "bg-[#F8F8F8]"
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full text-white text-[14px] font-semibold flex items-center justify-center ${
                    isNodeLeader ? "bg-[#00B55B]" : "bg-[#808080]"
                  }`}
                >
                  {node.avatar}
                </div>
                <span className="text-[14px] font-medium text-[#252525]">
                  {node.name}
                </span>
                {isNodeLeader && node.department && (
                  <span className="px-3 py-1 rounded-[30px] bg-[#D6FAE8] text-[12px] font-medium text-[#00B55B]">
                    {node.department}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );

  const roleLabel = (role: string) => {
    switch (role) {
      case "admin":
        return "관리자";
      case "subAdmin":
        return "부관리자";
      case "leader":
        return "팀장";
      case "member":
        return "팀원";
      default:
        return role;
    }
  };

  const managerContent = (
    <div className="border border-[#E2E2E2] rounded-[12px] p-7">
      {/* 프로필 정보 Section */}
      <section className="pb-6">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[16px] font-semibold text-[#000000]">
            프로필 정보
          </span>
          {profileEditMode ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setProfileEditMode(false)}
                className="cursor-pointer h-[34px] px-3 rounded-[5px] border border-[#E2E2E2] text-[14px] font-semibold text-[#000000]"
              >
                취소
              </button>
              <button
                type="button"
                onClick={() => {
                  // TODO: 저장 로직 구현
                  setProfileEditMode(false);
                }}
                className="cursor-pointer h-[34px] px-3 rounded-[5px] bg-[#252525] text-[14px] font-semibold text-[#EDEDED]"
              >
                저장
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setProfileEditMode(true)}
              className="cursor-pointer h-[34px] px-3 rounded-[5px] border border-[#E2E2E2] text-[14px] font-semibold text-[#000000]"
            >
              수정
            </button>
          )}
        </div>
        <div className="h-[1px] bg-[#E2E2E2] opacity-50 mb-4" />
        <div className="bg-[#F8F8F8] rounded-[12px] p-4">
          <div className="grid grid-cols-2 gap-x-4 gap-y-2">
            <div className="flex items-center">
              <span className="w-[100px] text-[14px] text-[#808080] leading-6">
                이름
              </span>
              <span className="text-[14px] font-medium text-[#252525] leading-6">
                {member?.hrData?.realName || member?.name || "-"}
              </span>
            </div>
            <div className="flex items-center">
              <span className="w-[100px] text-[14px] text-[#808080] leading-6">
                직책
              </span>
              <span className="text-[14px] font-medium text-[#252525] leading-6">
                {roleLabel(member?.role ?? "")}
              </span>
            </div>
            <div className="flex items-center">
              <span className="w-[100px] text-[14px] text-[#808080] leading-6">
                생년월일
              </span>
              <span className="text-[14px] font-medium text-[#252525] leading-6">
                {member?.hrData?.birth || "-"}
              </span>
            </div>
            <div className="flex items-center">
              <span className="w-[100px] text-[14px] text-[#808080] leading-6">
                입사일
              </span>
              <span className="text-[14px] font-medium text-[#252525] leading-6">
                {member?.createdAt ? formatDate(member.createdAt) : "-"}
              </span>
            </div>
            <div className="col-span-2 flex items-center">
              <span className="w-[100px] text-[14px] text-[#808080] leading-6">
                주소
              </span>
              <span className="flex-1 text-[14px] font-medium text-[#252525] leading-6">
                {member?.hrData?.address || "-"}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 팀 변경 이력 Section */}
      <section className="pb-6">
        <div className="mb-3">
          <span className="text-[16px] font-semibold text-[#000000]">
            팀 변경 이력
          </span>
        </div>
        <div className="h-[1px] bg-[#E2E2E2] opacity-50 mb-4" />
        <div className="space-y-3">
          {(member?.teamChangeLogs ?? []).length > 0 ? (
            member?.teamChangeLogs.map((history) => (
              <div
                key={history.id}
                className="bg-[#F8F8F8] rounded-[12px] p-4 flex items-center gap-4"
              >
                <span className="text-[14px] text-[#808080] whitespace-nowrap">
                  {formatDate(history.createdAt)}
                </span>
                <Badge
                  label={history.previousTeamName || "미배정"}
                  variant="neutral"
                />
                {history.newTeamName && (
                  <>
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M9 18L15 12L9 6"
                        stroke="#B0B0B0"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <Badge label={history.newTeamName} variant="primary" />
                  </>
                )}
                <span className="ml-auto text-[14px] text-[#808080]">
                  {history.type === "teamMove" ? "팀이동" : history.type}
                </span>
              </div>
            ))
          ) : (
            <div className="px-4 py-3 bg-[#F8F8F8] rounded-[12px] text-[14px] text-[#808080]">
              팀 변경 이력이 없습니다.
            </div>
          )}
        </div>
      </section>

      {/* 특이사항 Section */}
      <section>
        <div className="mb-3">
          <span className="text-[16px] font-semibold text-[#000000]">
            특이사항
          </span>
        </div>
        <div className="h-[1px] bg-[#E2E2E2] opacity-50 mb-4" />
        {localNotes.length > 0 ? (
          <div className="space-y-3 mb-4">
            {localNotes.map((note) => (
              <div key={note.id} className="bg-[#F8F8F8] rounded-[12px] p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-[14px] text-[#000000]">
                    <span className="text-[#808080]">
                      {formatDateTime(note.createdAt)}
                    </span>
                  </div>
                  <button
                    className="cursor-pointer w-5 h-5 text-[#B0B0B0] hover:text-[#808080]"
                    onClick={() =>
                      setLocalNotes((prev) =>
                        prev.filter((item) => item.id !== note.id)
                      )
                    }
                    aria-label="특이사항 삭제"
                  >
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 20 20"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M15.832 5.83333L15.1093 15.9521C15.047 16.8243 14.3212 17.5 13.4468 17.5H6.55056C5.67616 17.5 4.95043 16.8243 4.88813 15.9521L4.16536 5.83333M8.33203 9.16667V14.1667M11.6654 9.16667V14.1667M12.4987 5.83333V3.33333C12.4987 2.8731 12.1256 2.5 11.6654 2.5H8.33203C7.87179 2.5 7.4987 2.8731 7.4987 3.33333V5.83333M3.33203 5.83333H16.6654"
                        stroke="#B0B0B0"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                </div>
                <p className="text-[14px] text-[#000000]">{note.note}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="px-4 py-3 bg-[#F8F8F8] rounded-[12px] text-[14px] text-[#808080] mb-4">
            등록된 특이사항이 없습니다.
          </div>
        )}
        <div className="flex gap-2">
          <input
            type="text"
            value={noteInput}
            onChange={(e) => setNoteInput(e.target.value)}
            placeholder="특이사항을 입력하세요"
            className="flex-1 h-[34px] px-3 border border-[#E2E2E2] rounded-[5px] text-[14px] text-[#252525] placeholder:text-[#808080]"
          />
          <button
            type="button"
            onClick={handleAddNote}
            className="h-[34px] px-3 rounded-[5px] bg-[#252525] text-[#EDEDED] text-[14px] font-semibold hover:opacity-90"
          >
            저장
          </button>
        </div>
      </section>
    </div>
  );

  // 로딩 상태
  if (isLoading) {
    return createPortal(
      <div className="fixed inset-0 z-[100]">
        <div className="absolute inset-0 bg-black/50" onClick={onClose} />
        <div
          className="absolute left-1/2 top-1/2 bg-white rounded-[14px] shadow-[0px_13px_61px_rgba(169,169,169,0.37)] overflow-hidden flex flex-col items-center justify-center"
          style={{
            width: 904,
            height: 400,
            transform: "translate(-50%, -50%)",
          }}
        >
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-neutral-20 border-t-primary-60" />
          <p className="mt-4 text-[14px] text-[#808080]">
            직원 정보를 불러오는 중...
          </p>
        </div>
      </div>,
      document.body
    );
  }

  // 에러 상태
  if (isError || !member) {
    return createPortal(
      <div className="fixed inset-0 z-[100]">
        <div className="absolute inset-0 bg-black/50" onClick={onClose} />
        <div
          className="absolute left-1/2 top-1/2 bg-white rounded-[14px] shadow-[0px_13px_61px_rgba(169,169,169,0.37)] overflow-hidden flex flex-col items-center justify-center"
          style={{
            width: 904,
            height: 400,
            transform: "translate(-50%, -50%)",
          }}
        >
          <p className="text-[14px] text-[#808080]">
            직원 정보를 불러오는 중 오류가 발생했습니다.
          </p>
          <button
            type="button"
            onClick={onClose}
            className="mt-4 h-[34px] px-4 rounded-[5px] bg-[#252525] text-[14px] font-semibold text-[#D0D0D0]"
          >
            닫기
          </button>
        </div>
      </div>,
      document.body
    );
  }

  return createPortal(
    <div className="fixed inset-0 z-[100]">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div
        className="absolute left-1/2 top-1/2 bg-white rounded-[14px] shadow-[0px_13px_61px_rgba(169,169,169,0.37)] overflow-hidden flex flex-col"
        style={{
          width: 904,
          maxHeight: "90vh",
          transform: "translate(-50%, -50%)",
        }}
      >
        <header className="px-6 pt-4 pb-[10px] flex items-center justify-between">
          <h1 className="text-[18px] font-semibold leading-[1] text-[#000000]">
            직원정보
          </h1>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="cursor-pointer w-6 h-6 grid place-items-center rounded hover:bg-[#F3F3F3]"
          >
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
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          <section className="mb-8">
            <h2 className="text-[16px] font-semibold leading-[1] text-[#000000] mb-3">
              기본 정보
            </h2>
            <div className="h-[1px] bg-[#E2E2E2] opacity-50 mb-4" />
            <div className="bg-[#F8F8F8] rounded-[12px] p-4 h-full min-h-[72px]">
              <div className="flex items-start gap-4 h-full">
                <div className={`h-full ${member.teamInfo && member.teamInfo.name ? "min-h-[84px]" : "min-h-[72px]"} flex items-center justify-center`}>
                  <div className="w-12 h-12 rounded-full bg-[#00B55B] text-white flex items-center justify-center text-[18px] font-semibold">
                    {initialFromName(member.name)}
                  </div>
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-3">
                    <span className="text-[18px] font-semibold text-[#000000]">
                      {member.name}
                    </span>
                    <Badge
                      label={roleLabel(member.role)}
                      variant={isLeader ? "primary" : "neutral"}
                    />
                  </div>
                  <div className="flex flex-wrap items-center gap-6 text-[14px] text-[#808080]">
                    <div className="flex items-center gap-2">
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M4 4H20C21.1 4 22 4.9 22 6V18C22 19.1 21.1 20 20 20H4C2.9 20 2 19.1 2 18V6C2 4.9 2.9 4 4 4Z"
                          stroke="#B0B0B0"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M22 6L12 13L2 6"
                          stroke="#B0B0B0"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      <span>{member.email || "-"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 20 20"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M2.5 4.16667C2.5 3.24619 3.24619 2.5 4.16667 2.5H6.89937C7.25806 2.5 7.57651 2.72953 7.68994 3.06981L8.93811 6.81434C9.06926 7.20777 8.89115 7.63776 8.52022 7.82322L6.63917 8.76375C7.55771 10.801 9.19898 12.4423 11.2363 13.3608L12.1768 11.4798C12.3622 11.1088 12.7922 10.9307 13.1857 11.0619L16.9302 12.3101C17.2705 12.4235 17.5 12.7419 17.5 13.1006V15.8333C17.5 16.7538 16.7538 17.5 15.8333 17.5H15C8.09644 17.5 2.5 11.9036 2.5 5V4.16667Z"
                          stroke="#B0B0B0"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      <span>{member.phone || "-"}</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {member.teamInfo && (
                      <Badge label={member.teamInfo.name} variant="secondary" />
                    )}
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section>
            <div className="flex gap-6 mb-6">
              <button
                type="button"
                onClick={() => setTab("organization")}
                className={`cursor-pointer relative pb-2 text-[16px] font-semibold transition-colors ${
                  tab === "organization" ? "text-[#000000]" : "text-[#808080]"
                }`}
              >
                조직정보
                <span
                  className={`absolute left-0 right-0 bottom-0 h-[2px] transition-opacity ${
                    tab === "organization"
                      ? "opacity-100 bg-[#000000]"
                      : "opacity-0"
                  }`}
                />
              </button>
              <button
                type="button"
                onClick={() => setTab("manager")}
                className={`cursor-pointer relative flex items-center gap-2 pb-2 text-[16px] font-semibold transition-colors ${
                  tab === "manager" ? "text-[#000000]" : "text-[#808080]"
                }`}
              >
                관리자 정보
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M17 8H7C5.89543 8 5 8.89543 5 10V19C5 20.1046 5.89543 21 7 21H17C18.1046 21 19 20.1046 19 19V10C19 8.89543 18.1046 8 17 8Z"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M8 8V6C8 4.34315 9.34315 3 11 3H13C14.6569 3 16 4.34315 16 6V8"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span
                  className={`absolute left-0 right-0 bottom-0 h-[2px] transition-opacity ${
                    tab === "manager" ? "opacity-100 bg-[#000000]" : "opacity-0"
                  }`}
                />
              </button>
            </div>
            {tab === "organization" ? organizationContent : managerContent}
          </section>
        </div>

        <footer className="px-6 py-4 border-t border-[#E2E2E266] flex justify-end gap-3">
          <button
            type="button"
            onClick={handleReset}
            className="h-[34px] px-4 rounded-[5px] border border-[#E2E2E2] text-[14px] font-semibold text-[#000000]"
          >
            초기화
          </button>
          <button
            type="button"
            onClick={onClose}
            className="h-[34px] px-4 rounded-[5px] bg-[#252525] text-[14px] font-semibold text-[#D0D0D0]"
          >
            적용완료
          </button>
        </footer>
      </div>
    </div>,
    document.body
  );
}
