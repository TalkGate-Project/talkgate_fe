"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { talkgateSocket, Conversation, ChatMessage } from "@/lib/realtime";

type Props = { projectId: number; devMode: boolean };

export default function ChatView({ projectId, devMode }: Props) {
  const [connected, setConnected] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const socketRef = useRef<any>(null);
  const [viewMode, setViewMode] = useState<"list" | "album">("list");

  // Connect on mount (skip if devMode)
  useEffect(() => {
    if (devMode) return; // use dummy data
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
  }, [projectId, activeId, devMode]);

  // Dev mode: seed dummy data
  useEffect(() => {
    if (!devMode) return;
    const dummyConvs = [
      { id: 1, memberId: 1, platform: 'instagram', platformConversationId: 'younghee_kim', name: '김영희', status: 'active', lastActivityAt: new Date().toISOString(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), unreadCount: 0, latestMessage: { id: 1, conversationId: 1, type: 'text', direction: 'incoming', status: 'done', content: '안녕하세요. 문의드릴게 있습니다.', sentAt: new Date().toISOString(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() } as any } as any,
      { id: 2, memberId: 1, platform: 'line', platformConversationId: 'line_user', name: '김직원', status: 'active', lastActivityAt: new Date().toISOString(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), unreadCount: 0, latestMessage: { id: 2, conversationId: 2, type: 'text', direction: 'incoming', status: 'done', content: '상담 예약하고 싶습니다.', sentAt: new Date().toISOString(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() } as any } as any,
      { id: 3, memberId: 1, platform: 'kakao', platformConversationId: 'kakao_user', name: '이영민', status: 'active', lastActivityAt: new Date().toISOString(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), unreadCount: 5, latestMessage: { id: 3, conversationId: 3, type: 'text', direction: 'incoming', status: 'done', content: '앞으로의 결과는 어떤가요?', sentAt: new Date().toISOString(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() } as any } as any,
      { id: 4, memberId: 1, platform: 'telegram', platformConversationId: 'tg_user', name: '박영훈', status: 'active', lastActivityAt: new Date().toISOString(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), unreadCount: 5, latestMessage: { id: 4, conversationId: 4, type: 'text', direction: 'incoming', status: 'done', content: '문의드릴게 있습니다.', sentAt: new Date().toISOString(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() } as any } as any,
      { id: 5, memberId: 1, platform: 'x', platformConversationId: 'x_user', name: '오민지', status: 'active', lastActivityAt: new Date().toISOString(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), unreadCount: 5, latestMessage: { id: 5, conversationId: 5, type: 'text', direction: 'incoming', status: 'done', content: '문의드릴게 있습니다.', sentAt: new Date().toISOString(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() } as any } as any,
      { id: 6, memberId: 1, platform: 'facebook', platformConversationId: 'fb_user', name: '김민지', status: 'active', lastActivityAt: new Date().toISOString(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), unreadCount: 5, latestMessage: { id: 6, conversationId: 6, type: 'text', direction: 'incoming', status: 'done', content: '문의드릴게 있습니다.', sentAt: new Date().toISOString(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() } as any } as any,
    ] as Conversation[];
    setConversations(dummyConvs);
    setActiveId(1);
    setMessages([
      { id: 1, conversationId: 1, type: 'text', direction: 'incoming', status: 'done', content: '안녕하세요, OOO 상품 관련해서 문의드립니다. 광고를 보고 관심이 생겼는데, 가장 핵심적인 혜택과 다른 상품과의 큰 차이점이 뭔지 자세히 알고 싶습니다. 지금 바로 상담 가능한가요?', sentAt: new Date().toISOString(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() } as any,
      { id: 2, conversationId: 1, type: 'text', direction: 'outgoing', status: 'done', content: '안녕하세요, [Talkgate] 상담사 김민지입니다. 무엇을 도와드릴까요?', sentAt: new Date().toISOString(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() } as any,
      { id: 3, conversationId: 1, type: 'text', direction: 'incoming', status: 'done', content: '위의 질문과 동일합니다. 확인바랍니다.', sentAt: new Date().toISOString(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() } as any,
    ] as any);
  }, [devMode]);

  function send() {
    if (!input.trim() || !activeId) return;
    socketRef.current.emit("sendMessage", { conversationId: activeId, content: input, messageType: "text" });
    setInput("");
  }

  return (
    <div className="grid grid-cols-12 gap-6">
      {/* Left Side: 상담 채팅 목록 (Figma 스타일 반영) */}
      <div className="col-span-3">
        <div className="w-[286px] h-[840px] bg-white rounded-[14px] shadow-[0_13px_61px_rgba(169,169,169,0.12)] overflow-hidden">
        <div className="px-5 pt-5 pb-3 flex items-center justify-between">
          <h2 className="text-[18px] font-bold text-[#252525]">상담 채팅</h2>
          <div className="flex items-center gap-2">
            {/* Filter */}
            <button aria-label="filter" className="w-[26px] h-[26px] grid place-items-center rounded-[6px] border border-[#E2E2E2]">
              {/* funnel icon */}
              <svg width="18" height="18" viewBox="0 0 26 26" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M7 8C7 7.45 7.45 7 8 7H18C18.55 7 19 7.45 19 8V9.25C19 9.52 18.89 9.77 18.71 9.96L14.63 14.04C14.44 14.23 14.33 14.48 14.33 14.75V16.33L11.67 19V14.75C11.67 14.48 11.56 14.23 11.37 14.04L7.29 9.96C7.11 9.77 7 9.52 7 9.25V8Z" stroke="#B0B0B0" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            {/* Segmented toggle: list | album */}
            <div className="w-[51px] h-[26px] rounded-[6px] border border-[#E2E2E2] overflow-hidden flex">
              <button aria-label="list-view" onClick={() => setViewMode('list')} className={`flex-1 grid place-items-center ${viewMode==='list' ? 'bg-black' : 'bg-white'}`}>
                {/* list icon */}
                <svg width="18" height="18" viewBox="0 0 26 26" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M7.66675 9H18.3334M7.66675 13H18.3334M7.66675 17H18.3334" stroke={viewMode==='list' ? 'white' : '#B0B0B0'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              <button aria-label="album-view" onClick={() => setViewMode('album')} className={`flex-1 grid place-items-center ${viewMode==='album' ? 'bg-black' : 'bg-white'}`}>
                {/* dots 3x3 icon */}
                <svg width="18" height="18" viewBox="0 0 26 26" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <g stroke={viewMode==='album' ? 'white' : '#B0B0B0'} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M13 8.333L13 8.34M13 13L13 13.007M13 17.667L13 17.673"/>
                    <path d="M13 9C12.6319 9 12.3334 8.7015 12.3334 8.33331C12.3334 7.96512 12.6319 7.66665 13 7.66665C13.3682 7.66665 13.6667 7.96512 13.6667 8.33331C13.6667 8.7015 13.3682 9 13 9Z"/>
                    <path d="M13 13.667C12.6319 13.667 12.3334 13.3686 12.3334 13C12.3334 12.6318 12.6319 12.3333 13 12.3333C13.3682 12.3333 13.6667 12.6318 13.6667 13C13.6667 13.3686 13.3682 13.667 13 13.667Z"/>
                    <path d="M13 18.333C12.6319 18.333 12.3334 18.0346 12.3334 17.6666C12.3334 17.2984 12.6319 17 13 17C13.3682 17 13.6667 17.2984 13.6667 17.6666C13.6667 18.0346 13.3682 18.333 13 18.333Z"/>
                    <path d="M7.66659 8.33332L7.66659 8.33999M7.66659 13L7.66659 13.0067M7.66658 17.6667L7.66658 17.6733"/>
                    <path d="M7.66659 9C7.2984 9 6.99992 8.7015 6.99992 8.33331C6.99992 7.96512 7.2984 7.66665 7.66659 7.66665C8.03478 7.66665 8.33325 7.96512 8.33325 8.33331C8.33325 8.7015 8.03478 9 7.66659 9Z"/>
                    <path d="M7.66659 13.667C7.2984 13.667 6.99992 13.3686 6.99992 13C6.99992 12.6318 7.2984 12.3333 7.66659 12.3333C8.03477 12.3333 8.33325 12.6318 8.33325 13C8.33325 13.3686 8.03477 13.667 7.66659 13.667Z"/>
                    <path d="M7.66658 18.333C7.29839 18.333 6.99992 18.0346 6.99992 17.6666C6.99992 17.2984 7.29839 17 7.66658 17C8.03477 17 8.33325 17.2984 8.33325 17.6666C8.33325 18.0346 8.03477 18.333 7.66658 18.333Z"/>
                    <path d="M18.3333 8.33332L18.3333 8.33999M18.3333 13L18.3333 13.0067M18.3333 17.6667L18.3333 17.6733"/>
                    <path d="M18.3333 9C17.9651 9 17.6667 8.7015 17.6667 8.33331C17.6667 7.96512 17.9651 7.66665 18.3333 7.66665C18.7015 7.66665 19 7.96512 19 8.33331C19 8.7015 18.7015 9 18.3333 9Z"/>
                    <path d="M18.3333 13.667C17.9651 13.667 17.6667 13.3686 17.6667 13C17.6667 12.6318 17.9651 12.3333 18.3333 12.3333C18.7015 12.3333 19 12.6318 19 13C19 13.3686 18.7015 13.667 18.3333 13.667Z"/>
                    <path d="M18.3333 18.333C17.9651 18.333 17.6667 18.0346 17.6667 17.6666C17.6667 17.2984 17.9651 17 18.3333 17C18.7015 17 19 17.2984 19 17.6666C19 18.0346 18.7015 18.333 18.3333 18.333Z"/>
                  </g>
                </svg>
              </button>
            </div>
          </div>
        </div>
        {/* Tabs */}
        <div className="px-5">
          <div className="grid grid-cols-3 gap-2 bg-[#F3F3F3] rounded-[10px] p-1">
            {['전체','상담중','상담완료'].map((t,i)=> (
              <button key={t} className={`h-[34px] rounded-[8px] text-[16px] ${i===0?'bg-white text-[#252525] font-bold':'text-[#808080]'} `}>{t}</button>
            ))}
          </div>
          <div className="mt-3 flex items-center gap-2">
            <span className="inline-flex items-center px-3 h-[28px] rounded-[6px] bg-[#D6FAE8] text-[#00B55B] text-[14px]">총 {conversations.length}건</span>
            <span className="inline-flex items-center px-3 h-[28px] rounded-[6px] bg-[#EDEDED] text-[#595959] text-[14px]">미읽음 {conversations.reduce((a,c)=>a+(c.unreadCount||0),0)}건</span>
          </div>
        </div>
        {/* List/Album */}
        {viewMode === 'list' ? (
          <div className="mt-4 h-[calc(840px-170px)] overflow-auto">
            {conversations.map((c) => (
              <button
                key={c.id}
                className={`w-full text-left px-5 py-3 border-t border-[#F0F0F0] hover:bg-[#F8F8F8] ${activeId===c.id?'bg-[#F8F8F8]':''}`}
                onClick={() => {
                  setActiveId(c.id);
                  socketRef.current?.emit('getMessages', { conversationId: c.id, limit: 50 });
                  socketRef.current?.emit('markMessagesRead', { conversationId: c.id });
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-[#D6FAE8] grid place-items-center text-[#00E272] text-[14px] font-semibold">{c.name?.[0] || '?'}</div>
                    <div>
                      <div className="flex items-center gap-2">
                        <div className="text-[16px] font-semibold text-[#000]">{c.name}</div>
                      </div>
                      <div className="text-[14px] text-[#595959] truncate max-w-[200px]">{c.latestMessage?.content || ''}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[12px] text-[#808080]">{new Date(c.updatedAt || c.lastActivityAt).toLocaleTimeString()}</div>
                    {c.unreadCount ? (
                      <div className="mt-2 inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#D83232] text-white text-[12px]">{c.unreadCount}</div>
                    ) : null}
                  </div>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="mt-4 h-[calc(840px-170px)] overflow-auto px-4">
            <div className="grid grid-cols-3 gap-3">
              {conversations.map((c) => (
                <button key={c.id} onClick={() => { setActiveId(c.id); socketRef.current?.emit('getMessages',{ conversationId:c.id, limit:50}); socketRef.current?.emit('markMessagesRead',{ conversationId:c.id}); }} className={`relative h-[72px] rounded-[8px] border ${activeId===c.id?'border-[#00E272]':'border-[#E2E2E2]'} bg-white hover:bg-[#F8F8F8]` }>
                  <div className="absolute top-1 right-1">
                    {c.unreadCount ? <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#D83232] text-white text-[12px]">{c.unreadCount}</span> : null}
                  </div>
                  <div className="px-3 pt-2 text-left">
                    <div className="text-[14px] font-semibold text-[#000] truncate">{c.name}</div>
                  </div>
                  <div className="px-3 pt-1">
                    {/* platform icon placeholder by platform */}
                    <div className="w-5 h-5 rounded-full bg-[#EDEDED] grid place-items-center text-[12px] text-[#595959]">
                      {c.platform?.slice(0,1)?.toUpperCase()}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
        </div>
      </div>

      {/* Main Contents: 메시지 뷰 (688x840 카드) */}
      <div className="col-span-6 flex justify-center">
        <div className="w-[688px] h-[840px] rounded-[14px] bg-white border border-[#E2E2E2] flex flex-col">
        {/* Header */}
        <div className="px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#F2F2F2]" />
            <div>
              <div className="text-[20px] font-bold text-[#000]">{conversations.find((c)=>c.id===activeId)?.name || '대화 선택'}</div>
              <div className="text-[14px] text-[#808080]">ID : {conversations.find((c)=>c.id===activeId)?.platformConversationId || '-'}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="h-[34px] px-4 rounded-[5px] bg-white border border-[#E2E2E2] text-[14px]">고객정보</button>
            <button className="h-[34px] px-4 rounded-[5px] bg-[#252525] text-[#D0D0D0] text-[14px]">상담완료</button>
          </div>
        </div>
        {/* Messages area */}
         <div className="flex-1 overflow-auto p-6 space-y-6">
          {messages.map((m) => (
            <div key={m.id} className={`flex ${m.direction==='outgoing'?'justify-end':''}`}>
              <div className={`max-w-[75%] rounded-[16px] px-5 py-4 ${m.direction==='outgoing'?'bg-[#252525] text-white rounded-tr-none':'bg-[#EDEDED] text-[#000] rounded-tl-none'}`}>
                <div className="text-[14px] leading-[26px] whitespace-pre-wrap break-words">{m.content}</div>
                <div className={`mt-2 text-[12px] ${m.direction==='outgoing'?'text-[#B0B0B0]':'text-[#808080]'}`}>{new Date(m.sentAt || m.createdAt).toLocaleString()}</div>
              </div>
            </div>
          ))}
        </div>
        {/* Input bar */}
        <div className="px-6 py-4 border-t border-[#E2E2E2]">
          <div className="flex items-center gap-1">
            <input value={input} onChange={(e)=>setInput(e.target.value)} className="flex-1 h-[48px] rounded-[8px] px-4 text-[14px] outline-none" placeholder="메세지를 입력하세요." />
            {/* 이미지 첨부 */}
            <button aria-label="attach image" className="w-9 h-9 grid place-items-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M4 16L8.58579 11.4142C9.36683 10.6332 10.6332 10.6332 11.4142 11.4142L16 16M14 14L15.5858 12.4142C16.3668 11.6332 17.6332 11.6332 18.4142 12.4142L20 14M14 8H14.01M6 20H18C19.1046 20 20 19.1046 20 18V6C20 4.89543 19.1046 4 18 4H6C4.89543 4 4 4.89543 4 6V18C4 19.1046 4.89543 20 6 20Z" stroke="#B0B0B0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            {/* 파일 첨부 */}
            <button aria-label="attach file" className="w-9 h-9 grid place-items-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M15.1716 7L8.58579 13.5858C7.80474 14.3668 7.80474 15.6332 8.58579 16.4142C9.36684 17.1953 10.6332 17.1953 11.4142 16.4142L17.8284 9.82843C19.3905 8.26633 19.3905 5.73367 17.8284 4.17157C16.2663 2.60948 13.7337 2.60948 12.1716 4.17157L5.75736 10.7574C3.41421 13.1005 3.41421 16.8995 5.75736 19.2426C8.1005 21.5858 11.8995 21.5858 14.2426 19.2426L20.5 13" stroke="#B0B0B0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            {/* 이모지 */}
            <button aria-label="emoji" className="w-9 h-9 grid place-items-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M14.8284 14.8284C13.2663 16.3905 10.7337 16.3905 9.17157 14.8284M9 10H9.01M15 10H15.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="#B0B0B0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <button className="h-[48px] px-4 rounded-[8px] bg-[#252525] text-[#D0D0D0]" onClick={send}>전송하기</button>
          </div>
        </div>
        </div>
      </div>

      {/* Right Side: AI 상담도우미 */}
      <div className="col-span-3 rounded-[14px] bg-white border border-[#E2E2E2] flex flex-col">
        <div className="px-5 py-5 flex items-center justify-between border-b border-[#E2E2E2]">
          <div className="flex items-center gap-2">
            <h3 className="text-[24px] font-bold">AI상담도우미</h3>
            <span className="inline-block w-2 h-2 rounded-full bg-[#00E272]" />
          </div>
          <button className="h-[34px] px-4 rounded-[5px] bg-[#252525] text-[#D0D0D0] text-[14px]">완료</button>
        </div>
        <div className="flex-1 overflow-auto p-5 space-y-4">
          {/* 샘플 가이드/에코 영역 - 실제 연동 시 별도 소켓/REST로 교체 가능 */}
          <div className="max-w-[85%] bg-[#EDEDED] text-[#000] rounded-[16px] rounded-tl-none px-5 py-4">
            <div className="text-[20px] leading-[30px]">AI 상담 도우미 연결되었습니다. 무엇을 도와드릴까요?</div>
            <div className="mt-3 text-[14px] text-[#808080]">{new Date().toLocaleString()}</div>
          </div>
        </div>
        <div className="px-5 py-4 border-t border-[#E2E2E2]">
          <div className="flex items-center gap-3">
            <input className="flex-1 h-[48px] rounded-[8px] border border-[#E2E2E2] px-4 text-[14px]" placeholder="메세지를 입력하세요." />
            <button className="w-[48px] h-[48px] rounded-[20px] bg-[#252525] text-white grid place-items-center">▶</button>
          </div>
        </div>
      </div>
    </div>
  );
}


