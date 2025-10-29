import { apiClient } from "@/lib/apiClient";
import {
  CreateTeamInput,
  DeleteTeamInput,
  MemberSubtreeResponse,
  MemberTreeNode,
  MemberTreeResponse,
  MoveTeamInput,
  TeamsResponse,
} from "@/types/membersTree";

export const MembersTreeService = {
  async fetchRoot(projectId: string | number): Promise<MemberTreeNode[]> {
    const res = await apiClient.get<MemberTreeResponse>("/v1/members-tree/tree", {
      headers: { "x-project-id": String(projectId) },
    });
    return res.data.data.rootMembers ?? [];
  },

  async fetchSubtree(memberId: number | string, projectId: string | number): Promise<MemberTreeNode> {
    const res = await apiClient.get<MemberSubtreeResponse>(`/v1/members-tree/${memberId}/subtree`, {
      headers: { "x-project-id": String(projectId) },
    });
    return res.data.data.memberTree;
  },

  async fetchTeams(projectId: string | number) {
    const res = await apiClient.get<TeamsResponse>("/v1/members-tree/teams", {
      headers: { "x-project-id": String(projectId) },
    });
    return res.data.data.teams;
  },

  async createTeam(input: CreateTeamInput) {
    const { projectId, memberId, teamName } = input;
    await apiClient.post("/v1/members-tree/team", { memberId, teamName }, {
      headers: { "x-project-id": String(projectId) },
    });
  },

  async deleteTeam(input: DeleteTeamInput) {
    const { projectId, memberId } = input;
    await apiClient.request("/v1/members-tree/team", {
      method: "DELETE",
      headers: { "x-project-id": String(projectId) },
      body: { memberId },
    });
  },

  async moveTeam(input: MoveTeamInput) {
    const { projectId, memberId, newParentId } = input;
    await apiClient.put("/v1/members-tree/team/move", { memberId, newParentId }, {
      headers: { "x-project-id": String(projectId) },
    });
  },
};
