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
    <main className="min-h-[calc(100vh-54px)] bg-neutral-10">
      <div className="mx-auto max-w-[1324px] w-full px-0 py-6">
        <ChatPanel projectId={projectId} />
      </div>
    </main>
  );
}


