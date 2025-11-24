"use client";

import { useEffect, useState } from "react";
import ChatPanel from "@/components/chat/ChatPanel";
import { getSelectedProjectId } from "@/lib/project";

export default function ConsultPage() {
  const [projectId, setProjectId] = useState<number | null>(null);

  useEffect(() => {
    document.title = "TalkGate - 상담";
  }, []);

  useEffect(() => {
    const id = getSelectedProjectId();
    if (id) setProjectId(Number(id));
  }, []);

  if (!projectId) return null;

  return (
    <main className="h-[calc(100vh-54px)] bg-neutral-10 flex flex-col">
      <div className="mx-auto max-w-[1324px] w-full px-0 pt-9 pb-6 flex-1 flex flex-col min-h-0">
        <ChatPanel projectId={projectId} />
      </div>
    </main>
  );
}


