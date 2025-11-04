import { TeamMember } from "@/data/mockTeamData";

export type TeamHistoryEntry = {
  id: string;
  date: string;
  from: string;
  to: string;
  role: string;
  action: "팀이동" | "팀삭제" | "배정";
};

export type SpecialNote = {
  id: string;
  author: string;
  timestamp: string;
  text: string;
};

export type MemberDetail = {
  position: string;
  email: string;
  phone: string;
  tags: string[];
  profile: {
    name: string;
    title: string;
    birthDate: string;
    joinDate: string;
    address: string;
  };
  teamHistory: TeamHistoryEntry[];
  notes: SpecialNote[];
};

const PRESET_DETAILS: Record<string, Partial<MemberDetail>> = {
  "1": {
    position: "팀장",
    tags: ["영업1지점", "영업2지점"],
    teamHistory: [
      {
        id: "hist-1",
        date: "2025. 10. 31",
        from: "영업본부",
        to: "영업1지점",
        role: "팀장",
        action: "팀이동",
      },
      {
        id: "hist-2",
        date: "2025. 08. 31",
        from: "영업2지점",
        to: "팀원",
        role: "팀원",
        action: "팀삭제",
      },
    ],
    notes: [
      {
        id: "note-1",
        author: "김직원",
        timestamp: "2025. 08. 31 13:01:41",
        text: "특이사항 있음. 참고부탁",
      },
    ],
  },
};

function buildDefaultDetail(member: TeamMember): MemberDetail {
  const normalized = member.name.replace(/\s+/g, "").toLowerCase();
  const preset = PRESET_DETAILS[member.id] || {};

  const tags = preset.tags ?? [member.department || "영업본부"];

  return {
    position: preset.position ?? (member.isLeader ? "팀장" : "팀원"),
    email: preset.email ?? `${normalized || "member"}@company.com`,
    phone: preset.phone ?? "010-1234-5678",
    tags,
    profile: {
      name: member.name,
      title: preset.position ?? (member.isLeader ? "팀장" : "팀원"),
      birthDate: "1991-01-01",
      joinDate: "2024-01-01",
      address: "서울시 강남구 시험동 123-456, 행복로 77, A빌딩 101호",
    },
    teamHistory:
      preset.teamHistory ?? [
        {
          id: "hist-default-1",
          date: "2025. 10. 31",
          from: member.department || "영업본부",
          to: member.department || "영업본부",
          role: member.isLeader ? "팀장" : "팀원",
          action: "배정",
        },
      ],
    notes:
      preset.notes ?? [
        {
          id: "note-default-1",
          author: "관리자",
          timestamp: "2025. 08. 31 09:00:00",
          text: `${member.name} 관련 특이사항이 없습니다.`,
        },
      ],
  };
}

export function getMemberDetail(member: TeamMember): MemberDetail {
  const detail = buildDefaultDetail(member);
  const preset = PRESET_DETAILS[member.id];
  if (!preset) return detail;

  return {
    ...detail,
    ...preset,
    tags: preset.tags ?? detail.tags,
    profile: {
      ...detail.profile,
      ...(preset.profile ?? {}),
    },
    teamHistory: preset.teamHistory ?? detail.teamHistory,
    notes: preset.notes ?? detail.notes,
  };
}

