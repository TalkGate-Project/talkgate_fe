"use client";

import { useState } from "react";
import { mockTeamData } from "@/data/mockTeamData";
import TeamManagementHeader from "./teamManagement/TeamManagementHeader";
import TeamListView from "./teamManagement/TeamListView";
import TeamTreeView from "./teamManagement/TeamTreeView";
import { useTeamTree } from "./teamManagement/useTeamTree";

type ViewMode = "list" | "tree";

export default function TeamManagementSettings() {
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const { teamData, dragHandlers, dragState } = useTeamTree(mockTeamData);

  return (
    <div className="w-full h-full bg-white rounded-[14px] p-8">
      <TeamManagementHeader viewMode={viewMode} onChange={setViewMode} />
      <div className="w-full h-px bg-[#E2E2E2] mb-6" />
      {viewMode === "list" ? (
        <TeamListView data={teamData} dragHandlers={dragHandlers} dragState={dragState} />
      ) : (
        <TeamTreeView data={teamData} dragHandlers={dragHandlers} dragState={dragState} />
      )}
    </div>
  );
}