"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { TeamMember } from "@/data/mockTeamData";
import { TOKENS } from "./tokens";
import { MemberDetail, SpecialNote, getMemberDetail } from "./memberDetails";
import { useCreateTeamMutation } from "@/hooks/useMembersTree";

type Props = {
  open: boolean;
  member: TeamMember;
  onClose: () => void;
  projectId: string | number | null;
};

type TabKey = "organization" | "manager";

type OrgNode = {
  id: string;
  name: string;
  avatar: string;
  role: "leader" | "member" | string;
  department?: string;
};

function Badge({ label, variant }: { label: string; variant?: "primary" | "secondary" | "neutral" }) {
  const styles = {
    primary: { background: "#D6FAE8", color: "#00B55B" },
    secondary: { background: "#D3E1FE", color: "#4D82F3" },
    neutral: { background: "#E2E2E2", color: "#595959" },
  } as const;
  const tone = styles[variant ?? "secondary"];
  return (
    <span
      className="px-3 py-1 rounded-[30px] text-[12px] font-medium"
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

export default function TeamMemberInfoModal({ open, member, onClose, projectId }: Props) {
  const [tab, setTab] = useState<TabKey>("organization");
  const [notes, setNotes] = useState<SpecialNote[]>([]);
  const [noteInput, setNoteInput] = useState("");
  const [teamNodes, setTeamNodes] = useState<OrgNode[]>([]);
  const [teamCreateMode, setTeamCreateMode] = useState(false);
  const [teamNameDraft, setTeamNameDraft] = useState("");
  const createTeam = useCreateTeamMutation(projectId);

  const detail: MemberDetail = useMemo(() => getMemberDetail(member), [member]);

  useEffect(() => {
    if (!open) return;
    setTab("organization");
    setNotes(detail.notes);
    setNoteInput("");
    setTeamCreateMode(false);
    setTeamNameDraft("");
  }, [detail, open]);

  useEffect(() => {
    const initialNodes = (member.children ?? []).map((child) => ({
      id: child.id,
      name: child.name,
      avatar: child.avatar,
      role: child.isLeader ? "leader" : "member",
      department: child.department,
    }));
    setTeamNodes(initialNodes);
  }, [member]);

  if (!open || typeof document === "undefined") {
    return null;
  }

  const handleAddNote = () => {
    const trimmed = noteInput.trim();
    if (!trimmed) return;
    const newNote: SpecialNote = {
      id: `note-${Date.now()}`,
      author: "관리자",
      timestamp: new Date().toISOString().replace("T", " ").slice(0, 19),
      text: trimmed,
    };
    setNotes((prev) => [newNote, ...prev]);
    setNoteInput("");
  };

  const handleReset = () => {
    setNotes(detail.notes);
    setNoteInput("");
    setTab("organization");
  };

const isLeader = member.isLeader;
const canCreateTeam = !isLeader;

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
                    await createTeam.mutateAsync({ memberId: Number(member.id), teamName: trimmed });
                    setTeamCreateMode(false);
                    setTeamNameDraft("");
                  } catch (err) {
                    console.error(err);
                    alert((err as Error)?.message ?? "팀 생성에 실패했습니다.");
                  }
                }}
                disabled={createTeam.isPending}
                className="h-[34px] px-3 rounded-[5px] bg-[#252525] text-[14px] font-semibold text-[#D0D0D0] disabled:opacity-60"
              >
                {createTeam.isPending ? "저장 중..." : "저장"}
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setTeamCreateMode(true)}
            className="h-[34px] px-3 rounded-[5px] bg-[#E4F7EF] text-[14px] font-semibold text-[#1F9E68]"
          >
            팀 생성
          </button>
        )
      ) : (
        <button
          type="button"
          disabled
          className="h-[34px] px-3 rounded-[5px] border border-[#E2E2E2] text-[14px] font-semibold text-[#808080] cursor-not-allowed"
        >
          팀 제거
        </button>
      )}

      <div className="space-y-3">
        <span className="block text-[16px] font-semibold text-[#000000]">조직도</span>
        <div className="space-y-2">
          {([{ id: member.id, name: member.name, avatar: member.avatar, role: "leader" as const, department: member.department }, ...teamNodes.filter((node) => node.id !== member.id)] as OrgNode[]).map((node) => {
            const isNodeLeader = node.role === "leader" || node.id === member.id;
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
                <span className="text-[14px] font-medium text-[#252525]">{node.name}</span>
                {isNodeLeader && node.department && (
                  <span className="ml-auto px-3 py-1 rounded-[30px] bg-[#D6FAE8] text-[12px] font-medium text-[#00B55B]">
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

  const managerContent = (
    <div className="space-y-6">
      <section className="border border-[#E2E2E2] rounded-[12px] p-5 space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-[16px] font-semibold text-[#000000]">프로필 정보</span>
          <button className="px-3 py-1 rounded-[5px] border border-[#E2E2E2] text-[14px] text-[#252525]">수정</button>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <InfoRow label="이름" value={detail.profile.name} />
          <InfoRow label="직책" value={detail.profile.title} />
          <InfoRow label="생년월일" value={detail.profile.birthDate} />
          <InfoRow label="입사일" value={detail.profile.joinDate} />
          <div className="col-span-2">
            <InfoRow label="주소" value={detail.profile.address} />
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <span className="text-[16px] font-semibold text-[#000000]">팀 변경 이력</span>
        <div className="space-y-3">
          {detail.teamHistory.map((history) => (
            <div key={history.id} className="bg-[#F8F8F8] rounded-[12px] p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-[14px] text-[#808080]">{history.date}</span>
                <Badge label={history.from} variant="neutral" />
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9 18L15 12L9 6" stroke="#B0B0B0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <Badge label={history.to} variant={history.action === "팀이동" ? "primary" : "secondary"} />
                <span className="text-[14px] text-[#000000]">{history.role}</span>
              </div>
              <span className="text-[14px] text-[#808080]">{history.action}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <span className="text-[16px] font-semibold text-[#000000]">특이사항</span>
        {notes.length > 0 ? (
          <div className="space-y-3">
            {notes.map((note) => (
              <div key={note.id} className="bg-[#F8F8F8] rounded-[12px] p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-[14px] text-[#000000]">
                    <span>{note.author}</span>
                    <span className="text-[#808080]">{note.timestamp}</span>
                  </div>
                  <button
                    className="w-5 h-5 text-[#B0B0B0] hover:text-[#808080]"
                    onClick={() => setNotes((prev) => prev.filter((item) => item.id !== note.id))}
                    aria-label="특이사항 삭제"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M3 6H5H21M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6H19Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                </div>
                <p className="text-[14px] text-[#000000]">{note.text}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="px-4 py-3 bg-[#F8F8F8] rounded-[12px] text-[14px] text-[#808080]">등록된 특이사항이 없습니다.</div>
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
            className="h-[34px] px-3 rounded-[5px] bg-[#252525] text-[#D0D0D0] text-[14px] font-semibold hover:opacity-90"
          >
            저장
          </button>
        </div>
      </section>
    </div>
  );

  return createPortal(
    <div className="fixed inset-0 z-[100]">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div
        className="absolute left-1/2 top-1/2 bg-white rounded-[14px] shadow-[0px_13px_61px_rgba(169,169,169,0.37)] overflow-hidden flex flex-col"
        style={{ width: 904, maxHeight: "90vh", transform: "translate(-50%, -50%)" }}
      >
        <header className="px-6 py-4 border-b border-[#E2E2E2] flex items-center justify-between">
          <h1 className="text-[18px] font-semibold text-[#000000]">직원정보</h1>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="w-6 h-6 grid place-items-center rounded hover:bg-[#F3F3F3]"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M6 18L18 6M6 6L18 18" stroke="#B0B0B0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          <section className="mb-8">
            <h2 className="text-[16px] font-semibold text-[#000000] mb-4">기본 정보</h2>
            <div className="bg-[#F8F8F8] rounded-[12px] p-4">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-[#808080] text-white flex items-center justify-center text-[18px] font-semibold">
                  {member.avatar}
                </div>
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="text-[18px] font-semibold text-[#000000]">{member.name}</span>
                    <Badge label={detail.position} variant={member.isLeader ? "primary" : "neutral"} />
                  </div>
                  <div className="flex flex-wrap items-center gap-6 text-[14px] text-[#808080]">
                    <div className="flex items-center gap-2">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M4 4H20C21.1 4 22 4.9 22 6V18C22 19.1 21.1 20 20 20H4C2.9 20 2 19.1 2 18V6C2 4.9 2.9 4 4 4Z" stroke="#B0B0B0" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M22 6L12 13L2 6" stroke="#B0B0B0" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <span>{detail.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M22 16.92V19.92C22 20.52 21.52 21 20.92 21C10.93 21 3 13.07 3 3.08C3 2.48 3.48 2 4.08 2H7.1C7.65 2 8.1 2.45 8.1 3C8.1 4.28 8.1 5.56 8.64 6.78C8.8 7.31 8.7 7.89 8.35 8.35L6.62 10.08C8.06 13.62 10.38 15.94 13.92 17.38L15.65 15.65C16.11 15.3 16.69 15.2 17.22 15.36C18.44 15.72 19.72 15.9 21 15.9C21.55 15.9 22 16.35 22 16.92Z" stroke="#B0B0B0" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <span>{detail.phone}</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {detail.tags.map((tag) => (
                      <Badge key={`basic-${tag}`} label={tag} variant="secondary" />
                    ))}
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
                className={`relative pb-2 text-[16px] font-semibold transition-colors ${
                  tab === "organization" ? "text-[#000000]" : "text-[#808080]"
                }`}
              >
                조직정보
                <span
                  className={`absolute left-0 right-0 bottom-0 h-[2px] transition-opacity ${
                    tab === "organization" ? "opacity-100 bg-[#000000]" : "opacity-0"
                  }`}
                />
              </button>
              <button
                type="button"
                onClick={() => setTab("manager")}
                className={`relative flex items-center gap-2 pb-2 text-[16px] font-semibold transition-colors ${
                  tab === "manager" ? "text-[#000000]" : "text-[#808080]"
                }`}
              >
                관리자 정보
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M17 8H7C5.89543 8 5 8.89543 5 10V19C5 20.1046 5.89543 21 7 21H17C18.1046 21 19 20.1046 19 19V10C19 8.89543 18.1046 8 17 8Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M8 8V6C8 4.34315 9.34315 3 11 3H13C14.6569 3 16 4.34315 16 6V8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
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

        <footer className="px-6 py-4 border-t border-[#E2E2E2] flex justify-end gap-3">
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

