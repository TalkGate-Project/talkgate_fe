"use client";

import dynamic from "next/dynamic";
const ChatView = dynamic(() => import("./ChatView"), { ssr: false });

export default function ChatPanel({ projectId, devMode }: { projectId: number; devMode: boolean }) {
  return (
    <div className="mt-6">
      <ChatView projectId={projectId} devMode={devMode} />
    </div>
  );
}


