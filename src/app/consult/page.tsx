"use client";

import { useEffect, useState } from "react";
import ChatPanel from "@/components/chat/ChatPanel";
import { getSelectedProjectId } from "@/lib/project";

export default function ConsultPage() {
  const [projectId, setProjectId] = useState<number | null>(null);
  const [devMode, setDevMode] = useState<boolean>(true);

  useEffect(() => {
    const id = getSelectedProjectId();
    if (id) setProjectId(Number(id));
  }, []);

  if (!projectId) return null;

  return (
    <main className="min-h-[calc(100vh-54px)] bg-[#F8F8F8]">
      {/* Dev toggle fixed on top-right */}
      <div className="fixed top-[62px] right-[24px] z-50 bg-white border border-[#E2E2E2] rounded-[8px] shadow-sm px-3 h-[36px] flex items-center gap-2">
        <span className="text-[12px] text-[#808080]">Dev Mode</span>
        <button
          className={`w-[44px] h-[22px] rounded-full relative ${devMode ? 'bg-[#252525]' : 'bg-[#E5E7EB]'}`}
          onClick={() => setDevMode((v) => !v)}
          aria-label="toggle dev mode"
        >
          <span className={`absolute top-1 left-1 w-[18px] h-[18px] rounded-full bg-white transition-all ${devMode ? 'translate-x-[22px]' : ''}`} />
        </button>
      </div>

      <div className="mx-auto max-w-[1324px] w-full px-0 py-6">
        <ChatPanel projectId={projectId} devMode={devMode} />
      </div>
    </main>
  );
}


