"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Conversation } from "@/lib/realtime";
import ChatFilterModal from "./ChatFilterModal";
import FilterIcon from "./icons/FilterIcon";
import ListViewIcon from "./icons/ListViewIcon";
import AlbumViewIcon from "./icons/AlbumViewIcon";
import PlatformIcon from "./icons/PlatformIcon";
import ConversationAvatar from "./ConversationAvatar";

type Props = {
  statusFilter: "all" | "active" | "closed";
  setStatusFilter: (next: "all" | "active" | "closed") => void;
  viewMode: "list" | "album";
  setViewMode: (mode: "list" | "album") => void;
  filterOpen: boolean;
  setFilterOpen: (open: boolean) => void;
  conversations: Conversation[];
  activeId: number | null;
  onSelectConversation: (id: number) => void;
  loadMoreConversations: () => void;
  hasMoreConversations?: boolean;
};

export default function ChatLeftSidebar({
  statusFilter,
  setStatusFilter,
  viewMode,
  setViewMode,
  filterOpen,
  setFilterOpen,
  conversations,
  activeId,
  onSelectConversation,
  loadMoreConversations,
  hasMoreConversations = true,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const convScrollRef = useRef<HTMLDivElement | null>(null);

  const onConversationsScroll = useCallback(() => {
    const el = convScrollRef.current;
    if (!el) return;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 48) {
      loadMoreConversations();
    }
  }, [loadMoreConversations]);

  // 스크롤이 없을 때 화면에 빈 공간이 남아있으면 추가 대화방 로드
  useEffect(() => {
    const el = convScrollRef.current;
    if (!el || !hasMoreConversations) return;

    // DOM 업데이트 후 체크
    const checkAndLoadMore = () => {
      const el = convScrollRef.current;
      if (!el) return;
      // 스크롤이 필요 없는 상태 (컨텐츠가 컨테이너보다 작음)인데 더 로드할 수 있으면 로드
      if (el.scrollHeight <= el.clientHeight && hasMoreConversations) {
        loadMoreConversations();
      }
    };

    // 초기 체크와 대화 목록 변경 시 체크
    const timeoutId = setTimeout(checkAndLoadMore, 100);
    return () => clearTimeout(timeoutId);
  }, [conversations.length, hasMoreConversations, loadMoreConversations]);

  // Filtered conversations according to status
  const filteredConversations = useMemo(() => {
    if (statusFilter === "all") return conversations;
    return conversations.filter(
      (c) => c.status === (statusFilter === "active" ? "active" : "closed")
    );
  }, [conversations, statusFilter]);

  const handleConversationClick = (c: Conversation) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("conversationId", String(c.id));
    params.delete("customerId");
    router.replace(`?${params.toString()}`, {
      scroll: false,
    });
    onSelectConversation(c.id);
  };

  return (
    <div className="max-w-[286px] h-full">
      <div className="w-[286px] h-full bg-card dark:bg-neutral-0 rounded-[14px] shadow-[0_13px_61px_rgba(169,169,169,0.12)] overflow-hidden flex flex-col">
        <div className="px-7 pt-[26px] pb-[18px] flex items-center justify-between shrink-0">
          <h2 className="text-[16px] font-bold text-neutral-90">상담 채팅</h2>
          <div className="flex items-center gap-2">
            {/* Filter */}
            <button
              aria-label="filter"
              className="cursor-pointer w-[26px] h-[26px] grid place-items-center rounded-[6px] border border-border"
              onClick={() => setFilterOpen(true)}
            >
              <FilterIcon />
            </button>
            {/* Segmented toggle: list | album */}
            <div className="w-[51px] h-[26px] rounded-[6px] border border-border overflow-hidden flex">
              <button
                aria-label="list-view"
                onClick={() => setViewMode("list")}
                className={`cursor-pointer flex-1 grid place-items-center ${
                  viewMode === "list" ? "bg-black" : "bg-white"
                }`}
              >
                <ListViewIcon active={viewMode === "list"} />
              </button>
              <button
                aria-label="album-view"
                onClick={() => setViewMode("album")}
                className={`cursor-pointer flex-1 grid place-items-center ${
                  viewMode === "album" ? "bg-black" : "bg-white"
                }`}
              >
                <AlbumViewIcon active={viewMode === "album"} />
              </button>
            </div>
          </div>
        </div>
        <ChatFilterModal
          open={filterOpen}
          onClose={() => setFilterOpen(false)}
          onApply={() => setFilterOpen(false)}
        />
        {/* Tabs */}
        <div className="px-5">
          <div className="grid grid-cols-3 gap-2 bg-neutral-10 dark:bg-neutral-20 rounded-[12px] px-3 py-2">
            <button
              className={`cursor-pointer h-[34px] rounded-[8px] text-[16px] ${
                statusFilter === "all"
                  ? "bg-card text-neutral-90 font-bold"
                  : "text-neutral-60"
              }`}
              onClick={() => setStatusFilter("all")}
            >
              전체
            </button>
            <button
              className={`cursor-pointer h-[34px] rounded-[8px] text-[16px] ${
                statusFilter === "active"
                  ? "bg-card text-neutral-90 font-bold"
                  : "text-neutral-60"
              }`}
              onClick={() => setStatusFilter("active")}
            >
              상담중
            </button>
            <button
              className={`cursor-pointer h-[34px] rounded-[8px] text-[16px] ${
                statusFilter === "closed"
                  ? "bg-card text-neutral-90 font-bold"
                  : "text-neutral-60"
              }`}
              onClick={() => setStatusFilter("closed")}
            >
              상담완료
            </button>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <span className="inline-flex items-center px-1 h-[18px] rounded-[6px] bg-primary-10 text-primary-80 text-[12px]">
              총 {filteredConversations.length}건
            </span>
            <span className="inline-flex items-center px-1 h-[18px] rounded-[6px] bg-neutral-20 text-neutral-70 text-[12px]">
              미읽음{" "}
              {filteredConversations.reduce(
                (a, c) => a + (c.unreadCount || 0),
                0
              )}
              건
            </span>
          </div>
        </div>
        {/* List/Album */}
        {viewMode === "list" ? (
          <div
            className="mt-3 flex-1 overflow-auto min-h-0"
            ref={convScrollRef}
            onScroll={onConversationsScroll}
          >
            {filteredConversations.length === 0 ? (
              <div className="h-full flex items-center justify-center text-neutral-60 text-[14px]">
                대기중인 상담이 없습니다.
              </div>
            ) : (
              filteredConversations.map((c) => {
                const getLastMessagePreview = () => {
                  const msg = c.lastMessage;
                  if (!msg) return " "; // 공백 문자로 최소 높이 유지
                  
                  const isIncoming = msg.direction === "incoming";
                  
                  if (msg.type === "text") {
                    const content = msg.content?.trim();
                    return content || " "; // 내용이 없어도 공백으로 높이 유지
                  }
                  if (msg.type === "image") return "사진을 보냈습니다";
                  if (msg.type === "video") return "동영상을 보냈습니다";
                  if (msg.type === "audio") return "음성을 보냈습니다";
                  if (msg.type === "file") return "파일을 보냈습니다";
                  if (msg.type === "sticker") return "스티커를 보냈습니다";
                  return " ";
                };

                const formatTime12Hour = (date: Date) => {
                  const hours = date.getHours();
                  const minutes = date.getMinutes();
                  const ampm = hours >= 12 ? "PM" : "AM";
                  const hour12 = hours % 12 || 12;
                  const minuteStr = minutes.toString().padStart(2, "0");
                  const hourStr = hour12.toString().padStart(2, "0");
                  return `${hourStr}:${minuteStr} ${ampm}`;
                };

                const lastMessageText = getLastMessagePreview();

                return (
                  <button
                    key={c.id}
                    className={`cursor-pointer w-full text-left px-4 py-4 h-[72px] border-t border-neutral-20 dark:border-neutral-30 hover:bg-neutral-10 dark:hover:bg-neutral-10 ${
                      activeId === c.id ? "bg-neutral-10 dark:bg-neutral-10" : ""
                    }`}
                    onClick={() => handleConversationClick(c)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <ConversationAvatar
                          name={c.name}
                          profileUrl={c.profileUrl}
                          size="sm"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[16px] font-semibold text-ink truncate leading-[20px]">
                              {c.name}
                            </span>
                            <div className="shrink-0 w-4 h-4">
                              <PlatformIcon platform={c.platform} />
                            </div>
                          </div>
                          <div className="text-[14px] text-neutral-70 truncate mt-0.5 leading-[18px] min-h-[18px]">
                            {lastMessageText}
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end justify-start gap-1.5 shrink-0">
                        <div className="text-[12px] text-neutral-60 leading-[16px]">
                          {formatTime12Hour(new Date(c.updatedAt || c.lastActivityAt))}
                        </div>
                        <div className="w-5 h-5 flex items-center justify-center">
                          {c.unreadCount ? (
                            <div className="inline-flex items-center justify-center min-w-[20px] h-5 px-1 rounded-full bg-danger-40 text-white text-[12px] font-medium">
                              {c.unreadCount}
                            </div>
                          ) : (
                            <div className="w-5 h-5" />
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        ) : (
          <div className="mt-4 flex-1 overflow-auto px-4 min-h-0">
            <div className="grid grid-cols-3 gap-3">
              {filteredConversations.length === 0 ? (
                <div className="col-span-3 h-full flex items-center justify-center text-neutral-60 text-[14px]">
                  대기중인 상담이 없습니다.
                </div>
              ) : (
                filteredConversations.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => handleConversationClick(c)}
                    className={`cursor-pointer relative h-[88px] rounded-[8px] border flex flex-col items-center justify-center gap-1 ${
                      activeId === c.id
                        ? "border-primary-60"
                        : "border-border"
                    } bg-card hover:bg-neutral-10`}
                  >
                    <div className="absolute -top-1 -right-1">
                      {c.unreadCount ? (
                        <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-danger-40 text-white text-[12px]">
                          {c.unreadCount}
                        </span>
                      ) : null}
                    </div>
                    <ConversationAvatar
                      name={c.name}
                      profileUrl={c.profileUrl}
                      size="sm"
                    />
                    <div className="px-2 text-center w-full">
                      <div className="text-[12px] font-semibold text-ink truncate">
                        {c.name}
                      </div>
                    </div>
                    <div className="flex justify-center">
                      <PlatformIcon platform={c.platform} />
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

