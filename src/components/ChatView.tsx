"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { talkgateSocket, Conversation, ChatMessage } from "@/lib/realtime";

type Props = { projectId: number };

export default function ChatView({ projectId }: Props) {
  const [connected, setConnected] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const socketRef = useRef<any>(null);

  // Connect on mount
  useEffect(() => {
    const s = talkgateSocket.connect(projectId);
    socketRef.current = s;

    function onReady() { setConnected(true); }
    s.on("Ready", onReady);
    s.on("conversationsList", (payload: any) => {
      setConversations(payload?.conversations || []);
      if (!activeId && payload?.conversations?.[0]?.id) {
        const first = payload.conversations[0].id;
        setActiveId(first);
        s.emit("getMessages", { conversationId: first, limit: 50 });
        s.emit("markMessagesRead", { conversationId: first });
      }
    });
    s.on("messagesList", (payload: any) => {
      if (payload?.conversationId !== activeId) return;
      setMessages(payload?.messages || []);
    });
    s.on("messageResult", (payload: any) => {
      if (!payload?.success) return;
      // Replace temp if needed; for now just refetch
      s.emit("getMessages", { conversationId: payload.conversationId, limit: 50 });
    });
    s.on("newMessage", (payload: any) => {
      const { message, conversation, isNewConversation } = payload || {};
      if (isNewConversation && conversation) {
        setConversations((prev) => [conversation, ...prev]);
      } else if (conversation) {
        setConversations((prev) => {
          const others = prev.filter((c) => c.id !== conversation.id);
          return [conversation, ...others];
        });
      }
      if (message?.conversationId === activeId) {
        setMessages((prev) => [...prev, message]);
        s.emit("markMessagesRead", { conversationId: activeId });
      }
    });

    // initial fetch
    s.emit("getConversations", { limit: 20 });

    return () => {
      s.off("Ready", onReady);
      s.off("conversationsList");
      s.off("messagesList");
      s.off("messageResult");
      s.off("newMessage");
    };
  }, [projectId, activeId]);

  function send() {
    if (!input.trim() || !activeId) return;
    socketRef.current.emit("sendMessage", { conversationId: activeId, content: input, messageType: "text" });
    setInput("");
  }

  return (
    <div className="grid grid-cols-12 gap-6">
      {/* Conversations list */}
      <div className="col-span-3 rounded-[12px] bg-white border border-[#E5E7EB] overflow-hidden">
        <div className="px-4 py-3 border-b border-[#E5E7EB] text-[14px] font-semibold">상담 채팅</div>
        <div className="max-h-[70vh] overflow-auto">
          {conversations.map((c) => (
            <button key={c.id} className={`w-full px-4 py-3 text-left hover:bg-[#F8F8F8] ${activeId === c.id ? 'bg-[#F8F8F8]' : ''}`} onClick={() => {
              setActiveId(c.id);
              socketRef.current.emit("getMessages", { conversationId: c.id, limit: 50 });
              socketRef.current.emit("markMessagesRead", { conversationId: c.id });
            }}>
              <div className="flex items-center justify-between">
                <div className="text-[14px] font-medium">{c.name}</div>
                {c.unreadCount ? <span className="text-xs bg-[#D83232] text-white rounded-full px-2 py-0.5">{c.unreadCount}</span> : null}
              </div>
              <div className="text-[12px] text-[#6B7280] truncate">{c.latestMessage?.content}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Messages */}
      <div className="col-span-9 rounded-[12px] bg-white border border-[#E5E7EB] flex flex-col">
        <div className="px-4 py-3 border-b border-[#E5E7EB] text-[14px] font-semibold flex items-center justify-between">
          <div>{conversations.find((c) => c.id === activeId)?.name || '대화 선택'}</div>
        </div>
        <div className="flex-1 overflow-auto p-4 space-y-3">
          {messages.map((m) => (
            <div key={m.id} className={`max-w-[70%] rounded-[12px] px-4 py-3 ${m.direction === 'outgoing' ? 'ml-auto bg-[#111827] text-white' : 'bg-[#F3F4F6] text-[#111827]'}`}>
              <div className="whitespace-pre-wrap break-words text-[14px]">{m.content}</div>
              <div className={`mt-1 text-[11px] ${m.direction === 'outgoing' ? 'text-white/70' : 'text-[#6B7280]'}`}>{new Date(m.sentAt || m.createdAt).toLocaleString()}</div>
            </div>
          ))}
        </div>
        <div className="p-3 border-t border-[#E5E7EB] flex items-center gap-2">
          <input value={input} onChange={(e) => setInput(e.target.value)} className="flex-1 h-[40px] rounded-[8px] border border-[#E5E7EB] px-3" placeholder="메세지를 입력하세요." />
          <button className="h-[40px] px-4 rounded-[8px] bg-[#252525] text-[#D0D0D0]" onClick={send}>전송하기</button>
        </div>
      </div>
    </div>
  );
}


