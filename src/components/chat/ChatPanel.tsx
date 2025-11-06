"use client";

import dynamic from "next/dynamic";
const ChatView = dynamic(() => import("./ChatView"), { ssr: false });

export default function ChatPanel({ projectId }: { projectId: number }) {
  return (
    <>
      <ChatView projectId={projectId} />
    </>
  );
}


