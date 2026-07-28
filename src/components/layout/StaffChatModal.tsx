"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent, type DragEvent } from "react";
import BaseModal from "@/components/common/BaseModal";
import EmojiPicker from "@/components/chat/EmojiPicker";
import { useEmojiPicker } from "@/hooks/useEmojiPicker";
import { useDraggableFloatingWindow } from "@/hooks/useDraggableFloatingWindow";
import { useResizableFloatingWindow } from "@/hooks/useResizableFloatingWindow";
import { useTeamChatContextSafe } from "@/providers/TeamChatProvider";
import { useTeamChatWindow } from "@/providers/TeamChatWindowProvider";
import { useSelectedProjectId } from "@/hooks/useSelectedProjectId";
import type { TeamRoom, TeamMessage, TeamRoomParticipant } from "@/types/teamChat";
import { AssetsService } from "@/services/assets";
import TeamMemberInfoModal from "@/components/settings/teamManagement/TeamMemberInfoModal";
import { clampStaffChatWindowBounds, clampStaffChatWindowPosition } from "@/lib/staffChatWindowPosition";
import { isImeComposing } from "@/lib/ime";

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

const MAX_ATTACHMENT_FILE_SIZE = 30 * 1024 * 1024;
const STAFF_CHAT_CONTENT_OPACITY_STORAGE_KEY = "talkgate.staffChatModal.contentOpacity";
const DEFAULT_STAFF_CHAT_CONTENT_OPACITY = 0;
const MIN_STAFF_CHAT_CONTENT_OPACITY = 0;
const MAX_STAFF_CHAT_CONTENT_OPACITY = 80;
const INVALID_DROP_FEEDBACK_MS = 1400;
const BOTTOM_STICK_THRESHOLD = 24;
const MOBILE_BREAKPOINT_PX = 780;

function formatTime(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" });
}

function formatMessageTime(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const seconds = date.getSeconds();
  const ampm = hours >= 12 ? "오후" : "오전";
  const hour12 = hours % 12 || 12;
  return `${month}. ${day}. ${ampm} ${hour12}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function initial(name?: string | null) {
  if (!name) return "?";
  return name.trim().charAt(0) || "?";
}

function formatRoomName(room: TeamRoom) {
  if (room.name.includes("(")) return room.name;
  return `${room.name} (${room.participantCount})`;
}

/** 채팅방 목록에서 마지막 메시지 미리보기 문구 (이미지/파일은 고정 문구) */
function formatRoomLastMessagePreview(
  lastMessage: TeamRoom["lastMessage"],
  participantCount: number
): string {
  if (!lastMessage) return `${participantCount}명 참여 중`;
  if (lastMessage.type === "image") return "이미지가 전송되었습니다.";
  if (lastMessage.type === "file") return "파일이 전송되었습니다.";
  return formatSystemMessageDisplay(lastMessage.content ?? null) || `${participantCount}명 참여 중`;
}

function detectTeamMessageType(file: File): "image" | "file" {
  return file.type.startsWith("image/") ? "image" : "file";
}

/** 업로드 중인 첨부를 메시지 목록에 낙관적으로 표시하기 위한 타입 */
type PendingUpload = {
  tempId: string;
  roomId: number;
  type: "image" | "file";
  fileName: string;
  fileSize: number;
  previewUrl: string | null;
};

type DraftAttachment = {
  draftId: string;
  type: "image" | "file";
  file: File;
  fileName: string;
  fileSize: number;
  previewUrl: string | null;
};

function isSupportedAttachment(file: File): boolean {
  if (file.type.startsWith("image/")) return true;
  const lower = file.name.toLowerCase();
  return lower.endsWith(".pdf") || lower.endsWith(".doc") || lower.endsWith(".docx");
}

/** 팀에서 나감/제외된 시스템 메시지를 "OOO 멤버가 팀 변경으로 채팅방에서 제외되었습니다."로 통일 */
function formatSystemMessageDisplay(content: string | null): string {
  const raw = content?.trim() ?? "";
  if (!raw) return "";

  const isExcluded =
    /제외|나갔|팀에서\s*나가|채팅방에서\s*나가/.test(raw) ||
    (raw.includes("팀") && raw.includes("나가"));

  if (!isExcluded) return raw;

  let name = "";
  const withMember = raw.match(/^(.+?)\s*멤버가/);
  if (withMember) {
    name = withMember[1].trim();
  } else {
    const withGa = raw.match(/^(.+?)가\s/);
    if (withGa) name = withGa[1].trim();
    else name = raw.split(/\s/)[0]?.trim() ?? "";
  }

  if (!name) return raw;
  return `${name} 멤버가 팀 변경으로 채팅방에서 제외되었습니다.`;
}

function formatSystemMessageContent(msg: TeamMessage): string {
  return formatSystemMessageDisplay(msg.content ?? null) || "시스템 메시지";
}

export default function StaffChatModal({ isOpen, onClose }: Props) {
  const ctx = useTeamChatContextSafe();
  const { windowBounds, windowPosition, windowSize, setWindowBounds, setWindowPosition } = useTeamChatWindow();
  const [inputText, setInputText] = useState("");
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [dragOverlayMessage, setDragOverlayMessage] = useState<string | null>(null);
  const [dragOverlayInvalid, setDragOverlayInvalid] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "detail">("list");
  const [showParticipants, setShowParticipants] = useState(false);
  const [contentOpacity, setContentOpacity] = useState(DEFAULT_STAFF_CHAT_CONTENT_OPACITY);
  const [draftAttachments, setDraftAttachments] = useState<DraftAttachment[]>([]);
  const [pendingUploads, setPendingUploads] = useState<PendingUpload[]>([]);
  const [memberInfoModalMemberId, setMemberInfoModalMemberId] = useState<number | null>(null);
  const [isMobileViewport, setIsMobileViewport] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesScrollRef = useRef<HTMLDivElement>(null);
  const dragCounterRef = useRef(0);
  const invalidDropTimerRef = useRef<number | null>(null);
  const uploadErrorTimerRef = useRef<number | null>(null);
  const initialScrollDoneRoomRef = useRef<number | null>(null);
  const isAtBottomRef = useRef(true);
  const isComposingRef = useRef(false);
  const [projectId] = useSelectedProjectId();
  const {
    emojiPickerOpen,
    emojiPickerMode,
    emojiPickerPosition,
    emojiButtonRef,
    handleEmojiButtonClick,
    handleClose: handleCloseEmojiPicker,
    setEmojiPickerMode,
  } = useEmojiPicker();

  const {
    connected,
    socketError,
    rooms,
    activeRoomId,
    setActiveRoomId,
    messagesByRoomId,
    hasMoreByRoomId,
    messagesCursorByRoomId,
    loadTeamMessages,
    sendTeamMessage,
    loadRoomParticipants,
    participantsByRoomId,
    memberId,
  } = ctx ?? {};

  const activeRoom = useMemo(
    () => (activeRoomId != null ? rooms?.find((room) => room.id === activeRoomId) : null),
    [activeRoomId, rooms]
  );
  const rawMessages = activeRoomId != null ? messagesByRoomId?.[activeRoomId] : undefined;
  const messages: TeamMessage[] = Array.isArray(rawMessages) ? rawMessages : [];
  const rawParticipants = activeRoomId != null ? participantsByRoomId?.[activeRoomId] : undefined;
  const participants: TeamRoomParticipant[] = Array.isArray(rawParticipants) ? rawParticipants : [];
  const hasMore = activeRoomId != null ? (hasMoreByRoomId?.[activeRoomId] ?? false) : false;
  const nextCursor = activeRoomId != null ? messagesCursorByRoomId?.[activeRoomId] ?? null : null;

  const isAtBottom = useCallback((el: HTMLDivElement | null) => {
    if (!el) return true;
    return el.scrollHeight - (el.scrollTop + el.clientHeight) <= BOTTOM_STICK_THRESHOLD;
  }, []);

  const scrollMessagesToBottom = useCallback(() => {
    const el = messagesScrollRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
    messagesEndRef.current?.scrollIntoView({ behavior: "auto", block: "end" });
    isAtBottomRef.current = true;
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mediaQuery = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT_PX - 1}px)`);
    const syncViewport = () => {
      setIsMobileViewport(mediaQuery.matches);
    };
    syncViewport();
    mediaQuery.addEventListener("change", syncViewport);
    return () => {
      mediaQuery.removeEventListener("change", syncViewport);
    };
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    setShowParticipants(false);
    if (activeRoomId != null) {
      setViewMode("detail");
    } else {
      setViewMode("list");
    }
  }, [isOpen, activeRoomId]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem(STAFF_CHAT_CONTENT_OPACITY_STORAGE_KEY);
    const parsed = Number(stored);
    if (!Number.isFinite(parsed)) {
      setContentOpacity(DEFAULT_STAFF_CHAT_CONTENT_OPACITY);
      return;
    }
    const next = Math.min(MAX_STAFF_CHAT_CONTENT_OPACITY, Math.max(MIN_STAFF_CHAT_CONTENT_OPACITY, parsed));
    setContentOpacity(next);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STAFF_CHAT_CONTENT_OPACITY_STORAGE_KEY, String(contentOpacity));
  }, [contentOpacity]);

  const removePendingUpload = useCallback((tempId: string) => {
    setPendingUploads((prev) => {
      const next = prev.filter((p) => p.tempId !== tempId);
      const removed = prev.find((p) => p.tempId === tempId);
      if (removed?.previewUrl) URL.revokeObjectURL(removed.previewUrl);
      return next;
    });
  }, []);

  const releaseDraftAttachmentPreview = useCallback((draft: DraftAttachment) => {
    if (draft.previewUrl) URL.revokeObjectURL(draft.previewUrl);
  }, []);

  const removeDraftAttachment = useCallback(
    (draftId: string) => {
      setDraftAttachments((prev) => {
        const target = prev.find((d) => d.draftId === draftId);
        if (target) releaseDraftAttachmentPreview(target);
        return prev.filter((d) => d.draftId !== draftId);
      });
    },
    [releaseDraftAttachmentPreview]
  );

  const clearDraftAttachments = useCallback(
    (options?: { releasePreview?: boolean }) => {
      const releasePreview = options?.releasePreview ?? true;
      setDraftAttachments((prev) => {
        if (releasePreview) {
          prev.forEach(releaseDraftAttachmentPreview);
        }
        return [];
      });
    },
    [releaseDraftAttachmentPreview]
  );

  const showInvalidDropFeedback = useCallback((message: string) => {
    setDragOverlayInvalid(true);
    setDragOverlayMessage(message);
    if (invalidDropTimerRef.current != null) {
      window.clearTimeout(invalidDropTimerRef.current);
      invalidDropTimerRef.current = null;
    }
    invalidDropTimerRef.current = window.setTimeout(() => {
      setDragOverlayMessage(null);
      setDragOverlayInvalid(false);
      invalidDropTimerRef.current = null;
    }, INVALID_DROP_FEEDBACK_MS);
  }, []);

  const validateAttachmentFile = useCallback((file: File): string | null => {
    if (!isSupportedAttachment(file)) {
      return "이미지, PDF, DOC, DOCX 파일만 첨부할 수 있습니다.";
    }
    if (file.size > MAX_ATTACHMENT_FILE_SIZE) {
      return "파일은 30MB 이하만 첨부할 수 있습니다.";
    }
    return null;
  }, []);

  const addDraftAttachment = useCallback(
    (file: File) => {
      const validationError = validateAttachmentFile(file);
      if (validationError) {
        setUploadError(validationError);
        return { ok: false as const, error: validationError };
      }

      const messageType = detectTeamMessageType(file);
      const previewUrl = messageType === "image" ? URL.createObjectURL(file) : null;
      const draft: DraftAttachment = {
        draftId: `draft_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
        type: messageType,
        file,
        fileName: file.name,
        fileSize: file.size,
        previewUrl,
      };
      setUploadError(null);
      setDraftAttachments((prev) => [...prev, draft]);
      return { ok: true as const };
    },
    [validateAttachmentFile]
  );

  useEffect(() => {
    if (!isOpen || activeRoomId == null) {
      setPendingUploads((prev) => {
        prev.forEach((p) => {
          if (p.previewUrl) URL.revokeObjectURL(p.previewUrl);
        });
        return [];
      });
      clearDraftAttachments();
      setDragOverlayMessage(null);
      setDragOverlayInvalid(false);
      dragCounterRef.current = 0;
      if (!isOpen) {
        setActiveRoomId?.(null);
      }
    }
  }, [isOpen, activeRoomId, clearDraftAttachments, setActiveRoomId]);

  useEffect(() => {
    return () => {
      if (invalidDropTimerRef.current != null) {
        window.clearTimeout(invalidDropTimerRef.current);
      }
      if (uploadErrorTimerRef.current != null) {
        window.clearTimeout(uploadErrorTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!isOpen || !activeRoomId || !loadTeamMessages) return;
    loadTeamMessages(activeRoomId);
    loadRoomParticipants?.(activeRoomId);
  }, [isOpen, activeRoomId, loadTeamMessages, loadRoomParticipants]);

  useEffect(() => {
    if (!isOpen || activeRoomId == null || messages.length === 0) return;
    if (initialScrollDoneRoomRef.current === activeRoomId) return;

    // 방 진입 직후 렌더 타이밍 이슈를 피하기 위해 프레임 단위로 하단 고정
    requestAnimationFrame(() => {
      scrollMessagesToBottom();
      requestAnimationFrame(() => {
        scrollMessagesToBottom();
      });
    });
    initialScrollDoneRoomRef.current = activeRoomId;
  }, [isOpen, activeRoomId, messages.length, scrollMessagesToBottom]);

  useEffect(() => {
    if (activeRoomId == null) {
      initialScrollDoneRoomRef.current = null;
      isAtBottomRef.current = true;
    }
  }, [activeRoomId]);

  useEffect(() => {
    if (!isOpen || activeRoomId == null) return;
    if (!isAtBottomRef.current) return;
    scrollMessagesToBottom();
  }, [isOpen, activeRoomId, messages.length, pendingUploads.length, scrollMessagesToBottom]);

  useEffect(() => {
    if (!uploadError) return;
    if (uploadErrorTimerRef.current != null) {
      window.clearTimeout(uploadErrorTimerRef.current);
    }
    uploadErrorTimerRef.current = window.setTimeout(() => {
      setUploadError(null);
      uploadErrorTimerRef.current = null;
    }, 1500);
  }, [uploadError]);

  const handleSelectRoom = useCallback(
    (room: TeamRoom) => {
      isAtBottomRef.current = true;
      initialScrollDoneRoomRef.current = null;
      setActiveRoomId?.(room.id);
      setViewMode("detail");
      setShowParticipants(false);
    },
    [setActiveRoomId]
  );

  const handleBackToList = useCallback(() => {
    setActiveRoomId?.(null);
    setViewMode("list");
    setShowParticipants(false);
  }, [setActiveRoomId]);

  const handleCloseModal = useCallback(() => {
    setActiveRoomId?.(null);
    setViewMode("list");
    setShowParticipants(false);
    onClose();
  }, [setActiveRoomId, onClose]);

  const handleLoadMore = useCallback(() => {
    if (!activeRoomId || !loadTeamMessages || !hasMore) return;
    loadTeamMessages(activeRoomId, nextCursor ?? undefined);
  }, [activeRoomId, loadTeamMessages, hasMore, nextCursor]);

  const handleSend = useCallback(async () => {
    if (!activeRoomId || !sendTeamMessage) return;
    const text = inputText.trim();
    const attachmentsToSend = draftAttachments;
    if (!text && attachmentsToSend.length === 0) return;

    setSending(true);
    setUploadError(null);
    try {
      if (text) {
        sendTeamMessage({
          roomId: activeRoomId,
          type: "text",
          content: text,
        });
        setInputText("");
      }

      if (attachmentsToSend.length > 0) {
        setUploading(true);
        setDraftAttachments([]);
        for (const draft of attachmentsToSend) {
          const tempId = `upload_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
          setPendingUploads((prev) => [
            ...prev,
            {
              tempId,
              roomId: activeRoomId,
              type: draft.type,
              fileName: draft.fileName,
              fileSize: draft.fileSize,
              previewUrl: draft.previewUrl,
            },
          ]);
          try {
            const fileType =
              draft.file.type || (draft.type === "image" ? "image/jpeg" : "application/octet-stream");
            const res = await AssetsService.presignTeamChatAttachment({
              fileName: draft.fileName,
              fileType,
            });
            const uploadUrl = res?.data?.data?.uploadUrl;
            const fileUrl = res?.data?.data?.fileUrl;
            if (!uploadUrl || !fileUrl) throw new Error("Presigned response missing uploadUrl or fileUrl");
            await AssetsService.uploadToS3(uploadUrl, draft.file, fileType);
            sendTeamMessage({
              roomId: activeRoomId,
              type: draft.type,
              fileUrl,
              fileName: draft.fileName,
              fileType,
              fileSize: draft.fileSize,
            });
          } catch (err) {
            console.error("Team chat file upload failed:", err);
            setUploadError(`${draft.fileName} 전송에 실패했습니다. 잠시 후 다시 시도해주세요.`);
            if (draft.previewUrl) URL.revokeObjectURL(draft.previewUrl);
          } finally {
            removePendingUpload(tempId);
          }
        }
      }
    } finally {
      setUploading(false);
      setSending(false);
    }
  }, [activeRoomId, sendTeamMessage, inputText, draftAttachments, removePendingUpload]);

  const handleFileSelect = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      e.target.value = "";
      if (!file) return;
      addDraftAttachment(file);
    },
    [addDraftAttachment]
  );

  const handleDragEnter = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      dragCounterRef.current += 1;
      if (dragOverlayInvalid) return;
      setDragOverlayMessage("파일을 놓아 첨부하세요.");
      setDragOverlayInvalid(false);
    },
    [dragOverlayInvalid]
  );

  const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current = Math.max(0, dragCounterRef.current - 1);
    if (dragCounterRef.current === 0) {
      setDragOverlayMessage(null);
      setDragOverlayInvalid(false);
    }
  }, []);

  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    const validationError = validateAttachmentFile(file);
    if (validationError) {
      setDragOverlayInvalid(true);
      setDragOverlayMessage(validationError);
      e.dataTransfer.dropEffect = "none";
      return;
    }
    setDragOverlayInvalid(false);
    setDragOverlayMessage("파일을 놓아 첨부하세요.");
    e.dataTransfer.dropEffect = "copy";
  }, [validateAttachmentFile]);

  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      dragCounterRef.current = 0;
      const file = e.dataTransfer.files?.[0];
      if (!file) {
        setDragOverlayMessage(null);
        setDragOverlayInvalid(false);
        return;
      }

      const validationError = validateAttachmentFile(file);
      if (validationError) {
        setDragOverlayMessage(null);
        setDragOverlayInvalid(false);
        setUploadError(validationError);
        showInvalidDropFeedback(validationError);
        return;
      }

      setDragOverlayMessage(null);
      setDragOverlayInvalid(false);
      addDraftAttachment(file);
    },
    [addDraftAttachment, showInvalidDropFeedback, validateAttachmentFile]
  );

  const handleScroll = useCallback(() => {
    const el = messagesScrollRef.current;
    if (!el) return;
    isAtBottomRef.current = isAtBottom(el);
    if (!hasMore) return;
    if (el.scrollTop < 100) handleLoadMore();
  }, [hasMore, handleLoadMore, isAtBottom]);

  const handleEmojiSelect = useCallback((emoji: string) => {
    setInputText((prev) => prev + emoji);
  }, []);

  const clampModalPositionToViewport = useCallback(
    (position: { left: number; top: number }) =>
      clampStaffChatWindowPosition(position, windowSize, window.innerWidth, window.innerHeight),
    [windowSize]
  );
  const clampModalBoundsToViewport = useCallback(
    (bounds: typeof windowBounds) =>
      clampStaffChatWindowBounds(bounds, window.innerWidth, window.innerHeight),
    []
  );
  const { handlePointerDown: handleHeaderPointerDown } = useDraggableFloatingWindow({
    position: windowPosition,
    onChangePosition: setWindowPosition,
    clampPosition: clampModalPositionToViewport,
  });
  const { handlePointerDown: handleRightResizePointerDown } = useResizableFloatingWindow({
    mode: "right",
    bounds: windowBounds,
    onChangeBounds: setWindowBounds,
    clampBounds: clampModalBoundsToViewport,
  });
  const { handlePointerDown: handleBottomResizePointerDown } = useResizableFloatingWindow({
    mode: "bottom",
    bounds: windowBounds,
    onChangeBounds: setWindowBounds,
    clampBounds: clampModalBoundsToViewport,
  });
  const { handlePointerDown: handleBottomLeftResizePointerDown } = useResizableFloatingWindow({
    mode: "bottom-left",
    bounds: windowBounds,
    onChangeBounds: setWindowBounds,
    clampBounds: clampModalBoundsToViewport,
  });
  const { handlePointerDown: handleLeftResizePointerDown } = useResizableFloatingWindow({
    mode: "left",
    bounds: windowBounds,
    onChangeBounds: setWindowBounds,
    clampBounds: clampModalBoundsToViewport,
  });
  const { handlePointerDown: handleBottomRightResizePointerDown } = useResizableFloatingWindow({
    mode: "bottom-right",
    bounds: windowBounds,
    onChangeBounds: setWindowBounds,
    clampBounds: clampModalBoundsToViewport,
  });

  if (!isOpen) return null;

  const isDetail = viewMode === "detail" && !!activeRoom;
  const modalOpacity = isMobileViewport ? 1 : 1 - contentOpacity / 100;
  const opacitySliderValue = MAX_STAFF_CHAT_CONTENT_OPACITY - contentOpacity;
  const canDragWindow = !isMobileViewport;
  const canResizeWindow = !isMobileViewport;
  const modalOverlayClassName = "pointer-events-none";
  const modalPositionerClassName = isMobileViewport
    ? "absolute inset-x-0 top-[54px] h-[calc(100dvh-54px)]"
    : "absolute";
  const modalPositionerStyle = isMobileViewport ? undefined : { top: windowPosition.top, left: windowPosition.left };
  const modalContainerClassName = isMobileViewport
    ? "pointer-events-auto flex h-[calc(100dvh-54px)] w-screen flex-col overflow-hidden rounded-none bg-neutral-0 shadow-none"
    : "pointer-events-auto rounded-[20px] shadow-[0px_18px_28px_rgba(9,30,66,0.1)] dark:shadow-[0px_18px_28px_rgba(0,0,0,0.45)] flex flex-col overflow-hidden";
  const modalContentStyle = isMobileViewport
    ? { opacity: modalOpacity }
    : { opacity: modalOpacity, width: windowSize.width, height: windowSize.height };
  const opacityControl = (
    <label
      data-no-drag="true"
      className="flex items-center w-[50px] h-[20px]"
      title="채팅 배경 투명도"
      aria-label="채팅 배경 투명도"
    >
      <input
        type="range"
        min={MIN_STAFF_CHAT_CONTENT_OPACITY}
        max={MAX_STAFF_CHAT_CONTENT_OPACITY}
        value={opacitySliderValue}
        onChange={(e) => {
          const uiValue = Number(e.target.value);
          const nextOpacity = MAX_STAFF_CHAT_CONTENT_OPACITY - uiValue;
          setContentOpacity(nextOpacity);
        }}
        className="w-[50px] h-[20px] cursor-pointer appearance-none bg-transparent accent-[#595959] [&::-webkit-slider-runnable-track]:h-[4px] [&::-webkit-slider-runnable-track]:rounded-full [&::-webkit-slider-runnable-track]:bg-[#E2E2E2] dark:[&::-webkit-slider-runnable-track]:bg-[#4A4A4A] [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:mt-[-4px] [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#595959] dark:[&::-webkit-slider-thumb]:bg-[#DADADA] [&::-moz-range-track]:h-[4px] [&::-moz-range-track]:rounded-full [&::-moz-range-track]:bg-[#E2E2E2] dark:[&::-moz-range-track]:bg-[#4A4A4A] [&::-moz-range-thumb]:h-3 [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-none [&::-moz-range-thumb]:bg-[#595959] dark:[&::-moz-range-thumb]:bg-[#DADADA]"
      />
    </label>
  );

  return (
    <BaseModal
      onClose={handleCloseModal}
      ariaLabel="직원채팅"
      closeOnOverlayClick={false}
      disableScrollLock
      overlayClassName={modalOverlayClassName}
      disableAutoContainerSizing
      positionerClassName={modalPositionerClassName}
      positionerStyle={modalPositionerStyle}
      containerClassName={modalContainerClassName}
    >
      <div className="relative flex flex-col h-full bg-neutral-0 dark:bg-neutral-10" style={modalContentStyle}>
        {uploadError && (
          <div className="absolute left-3 right-3 top-16 z-30 pointer-events-none rounded-[10px] border border-danger-20 bg-danger-10/95 text-danger-60 text-[12px] px-3 py-2 shadow-sm">
            {uploadError}
          </div>
        )}
        {!isDetail ? (
          <>
            <div
              className={`h-[58px] px-4 md:px-5 flex items-center justify-between border-b border-neutral-30/40 bg-neutral-0 dark:bg-neutral-10 ${canDragWindow ? "cursor-move select-none touch-none" : ""}`}
              onPointerDown={canDragWindow ? handleHeaderPointerDown : undefined}
            >
              <div className="flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-full bg-gradient-to-b from-primary-20 to-primary-60 grid place-items-center">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path fillRule="evenodd" clipRule="evenodd" d="M12 0C5.23944 0 0 4.95218 0 11.6404C0 15.139 1.43421 18.162 3.76901 20.2506C3.96459 20.4268 4.0829 20.6707 4.09256 20.9339L4.15775 23.0683C4.17948 23.7492 4.88209 24.191 5.50503 23.9182L7.88571 22.8679C8.08853 22.7786 8.31308 22.7617 8.52555 22.8196C9.61932 23.1214 10.7855 23.2808 12 23.2808C18.7606 23.2808 24 18.3286 24 11.6404C24 4.95218 18.7606 0 12 0Z" fill="url(#paint0_linear_4790_47755)" />
                    <path fillRule="evenodd" clipRule="evenodd" d="M4.75995 15.1041L8.30201 9.40167C8.86486 8.49559 10.073 8.26907 10.9173 8.91169L13.734 11.0562C13.9936 11.2532 14.3478 11.2508 14.6049 11.0538L18.409 8.1238C18.9161 7.73231 19.5808 8.35032 19.2387 8.89692L15.6991 14.5968C15.1363 15.5029 13.9281 15.7294 13.0838 15.0868L10.2671 12.9423C10.0075 12.7453 9.65334 12.7478 9.39617 12.9447L5.58967 15.8772C5.08262 16.2687 4.41787 15.6507 4.75995 15.1041Z" fill="white" />
                    <defs>
                      <linearGradient id="paint0_linear_4790_47755" x1="12" y1="0" x2="12" y2="36.2308" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#ADF6D2" />
                        <stop offset="1" stopColor="#00E272" />
                      </linearGradient>
                    </defs>
                  </svg>
                </span>
                <h2 className="text-[16px] leading-[19px] font-bold text-foreground">팀 대화</h2>
              </div>
              <div data-no-drag="true" className="flex items-center gap-2">
                {!isMobileViewport && opacityControl}
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="cursor-pointer text-neutral-100 hover:opacity-70"
                  aria-label="닫기"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {socketError && (
              <div className="px-4 py-2 bg-destructive/10 text-destructive text-[13px]">{socketError}</div>
            )}
            {!connected && !socketError && (
              <div className="px-4 py-2 text-neutral-60 text-[13px]">연결 중...</div>
            )}

            <div className="relative flex-1 min-h-0">
              <div className="relative h-full min-h-0 overflow-y-auto bg-neutral-0 dark:bg-neutral-10">
                {(rooms ?? []).map((room) => (
                  <button
                    key={room.id}
                    type="button"
                    onClick={() => handleSelectRoom(room)}
                    className="cursor-pointer w-full h-[74px] md:h-[72px] px-4 md:px-5 flex items-center gap-2 border-b border-neutral-30/40 hover:bg-neutral-0 transition-colors text-left"
                  >
                    <div className="w-10 h-10 rounded-full bg-primary-10 text-primary-60 grid place-items-center shrink-0">
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className="text-primary-60">
                        <path
                          d="M3 21H21M5 21V7.8C5 7.07993 5.38608 6.41518 6.01005 6.0572L11.0101 3.18878C11.629 2.83374 12.3918 2.83374 13.0107 3.18878L18.0107 6.0572C18.6347 6.41518 19.0208 7.07993 19.0208 7.8V21M9 21V15.5C9 14.6716 9.67157 14 10.5 14H13.5C14.3284 14 15 14.6716 15 15.5V21M9 10H9.01M15 10H15.01"
                          stroke="currentColor"
                          strokeWidth="1.7"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                    <div className="min-w-0 flex-1 flex items-center justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-[16px] leading-[19px] font-semibold text-foreground truncate">
                          {formatRoomName(room)}
                        </p>
                        <p className="mt-[4px] text-[14px] leading-[17px] font-medium text-neutral-70 truncate">
                          {formatRoomLastMessagePreview(room.lastMessage ?? null, room.participantCount)}
                        </p>
                      </div>
                      <div className="shrink-0 min-w-[84px] h-10 flex flex-col items-end justify-between">
                        <span className="text-[12px] leading-[14px] text-neutral-60 whitespace-nowrap text-right">
                          {formatTime(room.lastMessage?.sentAt)}
                        </span>
                        {room.unreadCount > 0 && (
                          <span className="inline-flex items-center justify-center min-w-[20px] h-[18px] px-[6px] py-[2px] rounded-[20px] bg-[#D83232] text-[#FFFFFF] text-[12px] leading-[14px] font-medium text-center">
                            {room.unreadCount > 99 ? "99+" : room.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
                {(rooms?.length ?? 0) === 0 && connected && (
                  <div className="px-5 py-6 text-[14px] leading-[20px] text-neutral-60">참여 중인 팀 대화가 없습니다.</div>
                )}
              </div>
            </div>
          </>
        ) : (
          <>
            <div
              className={`relative h-[56px] px-3 md:px-4 flex items-center justify-between border-b border-border bg-neutral-0 dark:bg-neutral-10 ${canDragWindow ? "cursor-move select-none touch-none" : ""}`}
              onPointerDown={canDragWindow ? handleHeaderPointerDown : undefined}
            >
              <div className="flex items-center gap-1.5 min-w-0">
                <button
                  type="button"
                  onClick={handleBackToList}
                  className="cursor-pointer text-neutral-70 hover:text-foreground p-1"
                  aria-label="목록으로"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M15 18l-6-6 6-6" />
                  </svg>
                </button>
                <div className="min-w-0">
                  <p className="text-[15px] font-semibold text-foreground truncate">{activeRoom?.name}</p>
                </div>
                <button
                  type="button"
                  className="cursor-pointer ml-1 flex items-center gap-1 text-neutral-60 hover:text-foreground"
                  onClick={() => setShowParticipants((prev) => !prev)}
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M8.00039 7.1999C9.32587 7.1999 10.4004 6.12539 10.4004 4.7999C10.4004 3.47442 9.32587 2.3999 8.00039 2.3999C6.67491 2.3999 5.60039 3.47442 5.60039 4.7999C5.60039 6.12539 6.67491 7.1999 8.00039 7.1999Z" fill="#B0B0B0" />
                    <path d="M2.40039 14.3999C2.40039 11.3071 4.9076 8.7999 8.00039 8.7999C11.0932 8.7999 13.6004 11.3071 13.6004 14.3999H2.40039Z" fill="#B0B0B0" />
                  </svg>
                  <span className="text-[12px]">· {activeRoom?.participantCount ?? 0}</span>
                </button>
              </div>
              <div data-no-drag="true" className="flex items-center gap-2">
                {!isMobileViewport && opacityControl}
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="cursor-pointer text-neutral-70 hover:text-foreground p-1"
                  aria-label="닫기"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {showParticipants && (
                <div
                  data-no-drag="true"
                  className="absolute right-3 top-[46px] z-20 w-[220px] overflow-x-hidden rounded-[10px] bg-card dark:bg-[#252525] text-foreground dark:text-white border border-border dark:border-neutral-30 p-3 shadow-xl"
                >
                  <div className="grid grid-cols-2 gap-2 max-h-[180px] overflow-y-auto overflow-x-hidden">
                    {participants.map((p) => (
                      <button
                        key={p.memberId}
                        type="button"
                        onClick={() => {
                          setShowParticipants(false);
                          setMemberInfoModalMemberId(p.memberId);
                        }}
                        className="cursor-pointer flex items-center gap-1.5 min-w-0 max-w-full text-left hover:bg-neutral-20 dark:hover:bg-neutral-30 rounded-[8px] p-1 -m-1"
                      >
                        <div className="relative dark:text-[#111111] w-7 h-7 rounded-full bg-neutral-20 dark:bg-[#B9B9B9] text-[11px] grid place-items-center shrink-0">
                          {initial(p.name)}
                          <span
                            className={`absolute -right-0.5 -bottom-0.5 w-2 h-2 rounded-full border border-card dark:border-[#252525] ${p.isOnline ? "bg-primary-60" : "bg-[#959595]"
                              }`}
                          />
                        </div>
                        <span className="text-[11px] truncate dark:text-[#F5F5F5]">{p.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div
              className="relative flex-1 min-h-0"
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              {dragOverlayMessage && (
                <div
                  className={`absolute inset-0 z-10 pointer-events-none flex items-center justify-center px-6 ${dragOverlayInvalid
                      ? "bg-danger-10/55 border-2 border-dashed border-danger-40"
                      : "bg-primary-10/35 border-2 border-dashed border-primary-60/60"
                    }`}
                >
                  <div className="rounded-[12px] px-4 py-3 bg-card/85 dark:bg-neutral-10/90 shadow-sm flex items-center gap-2">
                    {dragOverlayInvalid ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#D83232" strokeWidth="2">
                        <path d="M18 6L6 18M6 6l12 12" />
                      </svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-primary-60">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="7 10 12 15 17 10" />
                        <line x1="12" y1="15" x2="12" y2="3" />
                      </svg>
                    )}
                    <span className={`text-[13px] font-medium ${dragOverlayInvalid ? "text-danger-60" : "text-primary-70"}`}>
                      {dragOverlayMessage}
                    </span>
                  </div>
                </div>
              )}
              <div
                ref={messagesScrollRef}
                onScroll={handleScroll}
                className="relative h-full min-h-0 overflow-y-auto bg-neutral-0 dark:bg-neutral-10 px-4 md:px-3 pt-5 md:pt-6 pb-3"
              >
                <div className="flex flex-col gap-5">
                {hasMore && (
                  <div className="flex justify-center py-1">
                    <button
                      type="button"
                      onClick={handleLoadMore}
                      className="cursor-pointer text-[12px] text-primary-60 hover:underline"
                    >
                      이전 메시지 더 보기
                    </button>
                  </div>
                )}
                {messages.map((msg: TeamMessage) => {
                  if (msg.type === "system") {
                    return (
                      <div key={msg.id} className="flex justify-center items-center">
                        <span className="rounded-full bg-primary-10/40 px-3 pt-1 pb-[3px] text-[12px] text-primary-80 font-medium">
                          {formatSystemMessageContent(msg)}
                        </span>
                      </div>
                    );
                  }

                  const isMine = msg.senderMemberId === memberId;
                  const unreadCount = msg.unreadCount ?? 0;
                  const unreadLabel = unreadCount > 0 ? (
                    <span
                      className={`text-[12px] leading-[14px] text-primary-80 font-semibold shrink-0 ${!isMine ? "-translate-y-[30px]" : ""}`}
                    >
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  ) : null;

                  return (
                    <div key={msg.id} className={`w-full flex ${isMine ? "justify-end" : "justify-start"}`}>
                      <div className="max-w-[84%] flex items-end gap-2">
                        {isMine && unreadLabel}
                        {!isMine &&
                          (msg.senderMemberId != null ? (
                            <button
                              type="button"
                              onClick={() => setMemberInfoModalMemberId(msg.senderMemberId)}
                              className="cursor-pointer w-8 h-8 rounded-full bg-neutral-50 text-[14px] grid place-items-center shrink-0 text-neutral-80 hover:ring-2 hover:ring-primary-40 focus:outline-none focus:ring-2 focus:ring-primary-40 rounded-full"
                              aria-label={`${msg.senderName} 프로필 보기`}
                            >
                              {initial(msg.senderName)}
                            </button>
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-neutral-50 text-[14px] grid place-items-center shrink-0 text-neutral-80">
                              {initial(msg.senderName)}
                            </div>
                          ))}
                        <div className={`min-w-0 flex flex-col gap-1.5 md:gap-2 ${!isMine ? "-translate-y-2" : ""}`}>
                          <div
                            className={`rounded-[16px] md:rounded-[18px] px-3.5 md:px-4 py-2.5 md:py-3 text-[14px] md:text-[16px] leading-[22px] md:leading-[23px] break-words ${isMine ? "bg-neutral-90 text-neutral-0 rounded-br-[6px]" : "bg-neutral-20 dark:bg-[#333333] text-foreground rounded-bl-[6px]"
                              }`}
                          >
                            {msg.type === "text" && (msg.content ?? "")}
                            {msg.type === "image" && msg.fileUrl && (
                              <a
                                href={msg.fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="cursor-pointer block"
                              >
                                <img src={msg.fileUrl} alt={msg.fileName ?? "이미지"} className="max-w-full max-h-[220px] rounded-[10px] object-contain" />
                              </a>
                            )}
                            {msg.type === "image" && !msg.fileUrl && (
                              <div className="text-[13px] leading-[18px] text-neutral-60">이미지 준비중...</div>
                            )}
                            {msg.type === "file" && msg.fileUrl && (
                              <a
                                href={msg.fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="cursor-pointer underline"
                              >
                                {msg.fileName ?? "파일"}
                              </a>
                            )}
                            {msg.type === "file" && !msg.fileUrl && (
                              <div className="text-[13px] leading-[18px] text-neutral-60">{msg.fileName ?? "파일"} 업로드 중...</div>
                            )}
                            <div className={`mt-2 text-[12px] leading-[14px] ${isMine ? "text-neutral-40" : "text-neutral-60"}`}>
                              {formatMessageTime(msg.sentAt)}
                            </div>
                          </div>
                          {!isMine &&
                            (msg.senderMemberId != null ? (
                              <button
                                type="button"
                                onClick={() => setMemberInfoModalMemberId(msg.senderMemberId)}
                                className="text-[12px] leading-[14px] text-neutral-60 hover:underline cursor-pointer text-left"
                              >
                                {msg.senderName}
                              </button>
                            ) : (
                              <div className="text-[12px] leading-[14px] text-neutral-60">{msg.senderName}</div>
                            ))}
                        </div>
                        {!isMine && unreadLabel}
                      </div>
                    </div>
                  );
                })}
                {activeRoomId != null &&
                  pendingUploads
                    .filter((p) => p.roomId === activeRoomId)
                    .map((p) => (
                      <div key={p.tempId} className="w-full flex justify-end">
                        <div className="max-w-[84%] flex items-end gap-2">
                          <div className="rounded-[18px] px-4 py-3 rounded-br-[6px] bg-neutral-90 text-neutral-0 flex items-center gap-2 min-h-[52px]">
                            {p.type === "image" && p.previewUrl ? (
                              <img
                                src={p.previewUrl}
                                alt=""
                                className="w-12 h-12 rounded-[8px] object-cover shrink-0 opacity-90"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-[8px] bg-neutral-70 flex items-center justify-center shrink-0">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-neutral-40">
                                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                  <polyline points="14 2 14 8 20 8" />
                                  <line x1="12" y1="18" x2="12" y2="12" />
                                  <line x1="9" y1="15" x2="15" y2="15" />
                                </svg>
                              </div>
                            )}
                            <div className="flex flex-col gap-1">
                              <span className="text-[13px] leading-[18px] text-neutral-20">{p.fileName}</span>
                              <div className="flex items-center gap-1.5 text-[12px] text-neutral-40">
                                <svg
                                  className="animate-spin shrink-0"
                                  width="14"
                                  height="14"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  aria-hidden
                                >
                                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeDasharray="32" strokeDashoffset="12" />
                                </svg>
                                전송 중...
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                <div ref={messagesEndRef} />
                </div>
              </div>
            </div>

            {draftAttachments.length > 0 && (
              <div className="border-t border-border bg-neutral-0 dark:bg-neutral-10 px-3 md:px-2.5 py-2">
                <div className="flex items-center gap-2 overflow-x-auto">
                  {draftAttachments.map((draft) => (
                    <div key={draft.draftId} className="shrink-0 h-14 rounded-[10px] border border-border bg-neutral-0 dark:bg-neutral-20 px-2.5 flex items-center gap-2 max-w-[220px]">
                      {draft.type === "image" && draft.previewUrl ? (
                        <img src={draft.previewUrl} alt="" className="w-10 h-10 rounded-[8px] object-cover shrink-0" />
                      ) : (
                        <div className="w-10 h-10 rounded-[8px] bg-neutral-20 dark:bg-neutral-30 flex items-center justify-center shrink-0">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-neutral-60">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                            <polyline points="14 2 14 8 20 8" />
                          </svg>
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-[12px] leading-[15px] text-foreground truncate">{draft.fileName}</p>
                        <p className="text-[11px] leading-[13px] text-neutral-60">{Math.max(1, Math.round(draft.fileSize / 1024))}KB</p>
                      </div>
                      <button
                        type="button"
                        className="cursor-pointer text-neutral-60 hover:text-neutral-90 p-1"
                        onClick={() => removeDraftAttachment(draft.draftId)}
                        aria-label={`${draft.fileName} 첨부 제거`}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M18 6L6 18M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="h-[64px] md:h-[56px] px-3 md:px-2.5 border-t border-border bg-neutral-0 dark:bg-neutral-10 flex items-center gap-2 pb-[env(safe-area-inset-bottom)]">
              <label className={`w-8 h-8 rounded-full bg-neutral-20 text-neutral-60 grid place-items-center shrink-0 ${(uploading || sending) ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:bg-neutral-30"}`}>
                <input
                  type="file"
                  className="hidden"
                  accept="image/*,.pdf,.doc,.docx"
                  onChange={handleFileSelect}
                  disabled={uploading || sending}
                />
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 5V19M5 12H19" />
                </svg>
              </label>
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onCompositionStart={() => {
                  isComposingRef.current = true;
                }}
                onCompositionEnd={() => {
                  isComposingRef.current = false;
                }}
                onBlur={() => {
                  isComposingRef.current = false;
                }}
                onKeyDown={(e) => {
                  if (
                    e.key === "Enter" &&
                    !e.shiftKey &&
                    !isImeComposing(e.nativeEvent, isComposingRef.current)
                  ) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="메세지를 입력하세요."
                className="flex-1 min-w-0 h-9 rounded-[18px] bg-neutral-10 px-3 text-[13px] text-foreground placeholder:text-neutral-50 outline-none"
                disabled={sending}
              />
              <button
                ref={emojiButtonRef}
                type="button"
                className="cursor-pointer w-8 h-8 text-neutral-50 grid place-items-center"
                aria-label="이모지"
                onClick={handleEmojiButtonClick}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14.8284 14.8284C13.2663 16.3905 10.7337 16.3905 9.17157 14.8284M9 10H9.01M15 10H15.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" />
                </svg>
              </button>
              <button
                type="button"
                onClick={handleSend}
                disabled={sending || (!inputText.trim() && draftAttachments.length === 0)}
                className="cursor-pointer w-8 h-8 rounded-full bg-[#252525] text-white dark:bg-[#F5F5F5] dark:text-neutral-50 grid place-items-center disabled:opacity-40 disabled:cursor-not-allowed"
                aria-label="전송"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 2L11 13" />
                  <path d="M22 2L15 22L11 13L2 9L22 2Z" />
                </svg>
              </button>
            </div>
            <EmojiPicker
              isOpen={emojiPickerOpen}
              onClose={handleCloseEmojiPicker}
              onEmojiSelect={handleEmojiSelect}
              position={emojiPickerPosition}
              mode={emojiPickerMode}
              onToggleMode={setEmojiPickerMode}
              triggerRef={emojiButtonRef}
            />
          </>
        )}
        {canResizeWindow && (
          <>
            <div
              data-no-drag="true"
              aria-hidden="true"
              className="absolute left-0 top-0 z-40 h-[calc(100%-14px)] w-2 cursor-ew-resize touch-none"
              onPointerDown={(e) => {
                handleCloseEmojiPicker();
                handleLeftResizePointerDown(e);
              }}
            />
            <div
              data-no-drag="true"
              aria-hidden="true"
              className="absolute right-0 top-0 z-40 h-[calc(100%-14px)] w-2 cursor-ew-resize touch-none"
              onPointerDown={(e) => {
                handleCloseEmojiPicker();
                handleRightResizePointerDown(e);
              }}
            />
            <div
              data-no-drag="true"
              aria-hidden="true"
              className="absolute bottom-0 left-[14px] z-40 h-2 w-[calc(100%-28px)] cursor-ns-resize touch-none"
              onPointerDown={(e) => {
                handleCloseEmojiPicker();
                handleBottomResizePointerDown(e);
              }}
            />
            <div
              data-no-drag="true"
              aria-hidden="true"
              className="absolute bottom-0 left-0 z-50 h-4 w-4 cursor-nesw-resize touch-none"
              onPointerDown={(e) => {
                handleCloseEmojiPicker();
                handleBottomLeftResizePointerDown(e);
              }}
            />
            <div
              data-no-drag="true"
              aria-hidden="true"
              className="absolute bottom-0 right-0 z-50 h-4 w-4 cursor-nwse-resize touch-none"
              onPointerDown={(e) => {
                handleCloseEmojiPicker();
                handleBottomRightResizePointerDown(e);
              }}
            />
          </>
        )}
      </div>
      <TeamMemberInfoModal
        open={memberInfoModalMemberId != null}
        memberId={memberInfoModalMemberId ?? 0}
        onClose={() => setMemberInfoModalMemberId(null)}
        projectId={projectId ?? null}
      />
    </BaseModal>
  );
}
