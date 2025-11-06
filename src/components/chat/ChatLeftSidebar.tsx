"use client";

import { useCallback, useMemo, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Conversation } from "@/lib/realtime";
import ChatFilterModal from "./ChatFilterModal";
import FilterIcon from "./icons/FilterIcon";
import ListViewIcon from "./icons/ListViewIcon";
import AlbumViewIcon from "./icons/AlbumViewIcon";
import PlatformIcon from "./icons/PlatformIcon";

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
    <div className="col-span-3">
      <div className="w-[286px] h-[840px] bg-card dark:bg-neutral-0 rounded-[14px] shadow-[0_13px_61px_rgba(169,169,169,0.12)] overflow-hidden">
        <div className="px-5 pt-5 pb-3 flex items-center justify-between">
          <h2 className="text-[16px] font-bold text-neutral-90">상담 채팅</h2>
          <div className="flex items-center gap-2">
            {/* Filter */}
            <button
              aria-label="filter"
              className="w-[26px] h-[26px] grid place-items-center rounded-[6px] border border-border"
              onClick={() => setFilterOpen(true)}
            >
              <FilterIcon />
            </button>
            {/* Segmented toggle: list | album */}
            <div className="w-[51px] h-[26px] rounded-[6px] border border-border overflow-hidden flex">
              <button
                aria-label="list-view"
                onClick={() => setViewMode("list")}
                className={`flex-1 grid place-items-center ${
                  viewMode === "list" ? "bg-black" : "bg-white"
                }`}
              >
                <ListViewIcon active={viewMode === "list"} />
              </button>
              <button
                aria-label="album-view"
                onClick={() => setViewMode("album")}
                className={`flex-1 grid place-items-center ${
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
          <div className="grid grid-cols-3 gap-2 bg-neutral-10 dark:bg-neutral-20 rounded-[10px] px-3 py-2">
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
            className="mt-4 h-[calc(840px-170px)] overflow-auto"
            ref={convScrollRef}
            onScroll={onConversationsScroll}
          >
            {filteredConversations.length === 0 ? (
              <div className="h-full flex items-center justify-center text-neutral-60 text-[14px]">
                대기중인 상담이 없습니다.
              </div>
            ) : (
              filteredConversations.map((c) => (
                <button
                  key={c.id}
                  className={`w-full text-left px-5 py-3 border-t border-neutral-20 dark:border-neutral-30 hover:bg-neutral-10 dark:hover:bg-neutral-10 ${
                    activeId === c.id ? "bg-neutral-10 dark:bg-neutral-10" : ""
                  }`}
                  onClick={() => handleConversationClick(c)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-primary-10 grid place-items-center text-primary-60 text-[14px] font-semibold">
                        {c.name?.[0] || "?"}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <div className="text-[16px] font-semibold text-ink">
                            {c.name}
                          </div>
                        </div>
                        <div className="text-[14px] text-neutral-70 truncate max-w-[200px]">
                          {c.latestMessage?.content || ""}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[12px] text-neutral-60">
                        {new Date(
                          c.updatedAt || c.lastActivityAt
                        ).toLocaleTimeString()}
                      </div>
                      {c.unreadCount ? (
                        <div className="mt-2 inline-flex items-center justify-center w-5 h-5 rounded-full bg-danger-40 text-white text-[12px]">
                          {c.unreadCount}
                        </div>
                      ) : null}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        ) : (
          <div className="mt-4 h-[calc(840px-170px)] overflow-auto px-4">
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
                    className={`relative h-[72px] rounded-[8px] border flex flex-col ${
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
                    <div className="px-3 pt-2 text-left flex-1">
                      <div className="text-[14px] font-semibold text-ink truncate">
                        {c.name}
                      </div>
                    </div>
                    <div className="px-3 pb-2 flex justify-center">
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

