"use client";

import { useState, useRef, useEffect, useMemo } from "react";

interface EmojiPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onEmojiSelect: (emoji: string) => void;
  position?: { x: number; y: number };
  mode?: "compact" | "full";
  onToggleMode?: (mode: "compact" | "full") => void;
  /** 이모지 버튼 ref - 외부 클릭 시 버튼 클릭은 무시하기 위해 사용 */
  triggerRef?: React.RefObject<HTMLButtonElement | null>;
}

// 기본 자주 사용되는 이모지들 (fallback)
const defaultFrequent = ["😊", "😢", "😍", "😮", "😰"];
const RECENT_KEY = "tg_recent_emojis";

// 카테고리별 이모지들
const emojiCategories = {
  smileys: [
    "😀",
    "😃",
    "😄",
    "😁",
    "😆",
    "😅",
    "🤣",
    "😂",
    "🙂",
    "🙃",
    "😉",
    "😊",
    "😇",
    "🥰",
    "😍",
    "🤩",
    "😘",
    "😗",
    "😚",
    "😙",
    "😋",
    "😛",
    "😜",
    "🤪",
    "😝",
    "🤑",
    "🤗",
    "🤭",
    "🤫",
    "🤔",
    "🤐",
    "🤨",
    "😐",
    "😑",
    "😶",
    "😏",
    "😒",
    "🙄",
    "😬",
    "🤥",
    "😔",
    "😪",
    "🤤",
    "😴",
    "😷",
    "🤒",
    "🤕",
    "🤢",
    "🤮",
    "🤧",
    "🥵",
    "🥶",
    "🥴",
    "😵",
    "🤯",
    "🤠",
    "🥳",
    "😎",
    "🤓",
    "🧐",
    "😕",
    "😟",
    "🙁",
    "☹️",
    "😮",
    "😯",
    "😲",
    "😳",
    "🥺",
    "😦",
    "😧",
    "😨",
    "😰",
    "😥",
    "😢",
    "😭",
    "😱",
    "😖",
    "😣",
    "😞",
    "😓",
    "😩",
    "😫",
    "🥱",
    "😤",
    "😡",
    "😠",
    "🤬",
    "😈",
    "👿",
    "💀",
    "☠️",
    "💩",
    "🤡",
    "👹",
    "👺",
    "👻",
    "👽",
    "👾",
    "🤖",
    "😺",
    "😸",
    "😹",
    "😻",
    "😼",
    "😽",
    "🙀",
    "😿",
    "😾",
  ],
  gestures: [
    "👋",
    "🤚",
    "🖐️",
    "✋",
    "🖖",
    "👌",
    "🤏",
    "✌️",
    "🤞",
    "🤟",
    "🤘",
    "🤙",
    "👈",
    "👉",
    "👆",
    "🖕",
    "👇",
    "☝️",
    "👍",
    "👎",
    "👊",
    "✊",
    "🤛",
    "🤜",
    "👏",
    "🙌",
    "👐",
    "🤲",
    "🤝",
    "🙏",
    "✍️",
    "💅",
    "🤳",
    "💪",
    "🦾",
    "🦿",
    "🦵",
    "🦶",
    "👂",
    "🦻",
    "👃",
    "🧠",
    "🦷",
    "🦴",
    "👀",
    "👁️",
    "👅",
    "👄",
    "💋",
    "🩸",
  ],
  people: [
    "👶",
    "🧒",
    "👦",
    "👧",
    "🧑",
    "👨",
    "👩",
    "🧓",
    "👴",
    "👵",
    "👤",
    "👥",
    "🫂",
    "👪",
    "👨‍👩‍👧",
    "👨‍👩‍👧‍👦",
    "👨‍👩‍👦‍👦",
    "👨‍👩‍👧‍👧",
    "👨‍👨‍👧",
    "👨‍👨‍👧‍👦",
    "👨‍👨‍👦‍👦",
    "👨‍👨‍👧‍👧",
    "👩‍👩‍👧",
    "👩‍👩‍👧‍👦",
    "👩‍👩‍👦‍👦",
    "👩‍👩‍👧‍👧",
    "👨‍👦",
    "👨‍👦‍👦",
    "👨‍👧",
    "👨‍👧‍👦",
    "👨‍👧‍👧",
    "👩‍👦",
    "👩‍👦‍👦",
    "👩‍👧",
    "👩‍👧‍👦",
    "👩‍👧‍👧",
    "🗣️",
    "👤",
    "👥",
    "🫂",
  ],
  animals: [
    "🐶",
    "🐱",
    "🐭",
    "🐹",
    "🐰",
    "🦊",
    "🐻",
    "🐼",
    "🐨",
    "🐯",
    "🦁",
    "🐮",
    "🐷",
    "🐸",
    "🐵",
    "🙈",
    "🙉",
    "🙊",
    "🐒",
    "🐔",
    "🐧",
    "🐦",
    "🐤",
    "🐣",
    "🐥",
    "🦆",
    "🦅",
    "🦉",
    "🦇",
    "🐺",
    "🐗",
    "🐴",
    "🦄",
    "🐝",
    "🐛",
    "🦋",
    "🐌",
    "🐞",
    "🐜",
    "🦟",
    "🦗",
    "🕷️",
    "🕸️",
    "🦂",
    "🐢",
    "🐍",
    "🦎",
    "🦖",
    "🦕",
    "🐙",
    "🦑",
    "🦐",
    "🦞",
    "🦀",
    "🐡",
    "🐠",
    "🐟",
    "🐬",
    "🐳",
    "🐋",
    "🦈",
    "🐊",
    "🐅",
    "🐆",
    "🦓",
    "🦍",
    "🦧",
    "🐘",
    "🦛",
    "🦏",
    "🐪",
    "🐫",
    "🦒",
    "🦘",
    "🐃",
    "🐂",
    "🐄",
    "🐎",
    "🐖",
    "🐏",
    "🐑",
    "🦙",
    "🐐",
    "🦌",
    "🐕",
    "🐩",
    "🦮",
    "🐕‍🦺",
    "🐈",
    "🐓",
    "🦃",
    "🦚",
    "🦜",
    "🦢",
    "🦩",
    "🕊️",
    "🐇",
    "🦝",
    "🦨",
    "🦡",
    "🦦",
    "🦥",
    "🐁",
    "🐀",
    "🐿️",
    "🦔",
  ],
  food: [
    "🍎",
    "🍐",
    "🍊",
    "🍋",
    "🍌",
    "🍉",
    "🍇",
    "🍓",
    "🫐",
    "🍈",
    "🍒",
    "🍑",
    "🥭",
    "🍍",
    "🥥",
    "🥝",
    "🍅",
    "🍆",
    "🥑",
    "🥦",
    "🥬",
    "🥒",
    "🌶️",
    "🫑",
    "🌽",
    "🥕",
    "🫒",
    "🧄",
    "🧅",
    "🥔",
    "🍠",
    "🥐",
    "🥖",
    "🍞",
    "🥨",
    "🥯",
    "🧀",
    "🥚",
    "🍳",
    "🧈",
    "🥞",
    "🧇",
    "🥓",
    "🥩",
    "🍗",
    "🍖",
    "🦴",
    "🌭",
    "🍔",
    "🍟",
    "🍕",
    "🫓",
    "🥙",
    "🌮",
    "🌯",
    "🫔",
    "🥗",
    "🥘",
    "🫕",
    "🥫",
    "🍝",
    "🍜",
    "🍲",
    "🍛",
    "🍣",
    "🍱",
    "🥟",
    "🦪",
    "🍤",
    "🍙",
    "🍚",
    "🍘",
    "🍥",
    "🥠",
    "🥮",
    "🍢",
    "🍡",
    "🍧",
    "🍨",
    "🍦",
    "🥧",
    "🧁",
    "🍰",
    "🎂",
    "🍮",
    "🍭",
    "🍬",
    "🍫",
    "🍿",
    "🍩",
    "🍪",
    "🌰",
    "🥜",
    "🍯",
  ],
  activities: [
    "⚽",
    "🏀",
    "🏈",
    "⚾",
    "🥎",
    "🎾",
    "🏐",
    "🏉",
    "🎱",
    "🪀",
    "🏓",
    "🏸",
    "🏒",
    "🏑",
    "🥍",
    "🏏",
    "🪃",
    "🥅",
    "⛳",
    "🪁",
    "🏹",
    "🎣",
    "🤿",
    "🥊",
    "🥋",
    "🎽",
    "🛹",
    "🛷",
    "⛸️",
    "🥌",
    "🎿",
    "⛷️",
    "🏂",
    "🪂",
    "🏋️‍♀️",
    "🏋️",
    "🏋️‍♂️",
    "🤼‍♀️",
    "🤼",
    "🤼‍♂️",
    "🤸‍♀️",
    "🤸",
    "🤸‍♂️",
    "⛹️‍♀️",
    "⛹️",
    "⛹️‍♂️",
    "🤺",
    "🤾‍♀️",
    "🤾",
    "🤾‍♂️",
    "🏌️‍♀️",
    "🏌️",
    "🏌️‍♂️",
    "🏇",
    "🧘‍♀️",
    "🧘",
    "🧘‍♂️",
    "🏄‍♀️",
    "🏄",
    "🏄‍♂️",
    "🏊‍♀️",
    "🏊",
    "🏊‍♂️",
    "🤽‍♀️",
    "🤽",
    "🤽‍♂️",
    "🚣‍♀️",
    "🚣",
    "🚣‍♂️",
    "🧗‍♀️",
    "🧗",
    "🧗‍♂️",
    "🚵‍♀️",
    "🚵",
    "🚵‍♂️",
    "🚴‍♀️",
    "🚴",
    "🚴‍♂️",
    "🏆",
    "🥇",
    "🥈",
    "🥉",
    "🏅",
    "🎖️",
    "🏵️",
    "🎗️",
    "🎫",
    "🎟️",
    "🎪",
    "🤹",
    "🤹‍♀️",
    "🤹‍♂️",
    "🎭",
    "🩰",
    "🎨",
    "🎬",
    "🎤",
    "🎧",
    "🎼",
    "🎹",
    "🥁",
    "🪘",
    "🎷",
    "🎺",
    "🎸",
    "🪕",
    "🎻",
    "🎲",
    "♠️",
    "♥️",
    "♦️",
    "♣️",
    "♟️",
    "🃏",
    "🀄",
    "🎴",
    "🎯",
    "🎳",
    "🎮",
    "🕹️",
    "🎰",
    "🧩",
  ],
};

function LocalIconTooltip({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="relative inline-flex group">
      {children}
      <div className="pointer-events-none absolute left-1/2 -translate-x-1/2 -top-9 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="rounded-[8px] bg-card border border-border px-3 py-2 text-[12px] text-foreground shadow-lg whitespace-nowrap">
          {label}
        </div>
      </div>
    </div>
  );
}

export default function EmojiPicker({
  isOpen,
  onClose,
  onEmojiSelect,
  position,
  mode = "full",
  onToggleMode,
  triggerRef,
}: EmojiPickerProps) {
  const [recent, setRecent] = useState<string[]>(() => {
    try {
      const raw =
        typeof window !== "undefined"
          ? window.localStorage.getItem(RECENT_KEY)
          : null;
      const list = raw ? JSON.parse(raw) : [];
      if (Array.isArray(list) && list.every((e) => typeof e === "string"))
        return list as string[];
    } catch {
      // localStorage 접근 불가 또는 JSON 파싱 실패 시 무시
    }
    return defaultFrequent;
  });
  const pickerRef = useRef<HTMLDivElement>(null);

  // 외부 클릭 시 닫기
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      // 피커 내부 클릭은 무시
      if (pickerRef.current?.contains(target)) {
        return;
      }
      // 트리거 버튼 클릭은 무시 (버튼 핸들러에서 토글 처리)
      if (triggerRef?.current?.contains(target)) {
        return;
      }
      onClose();
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen, onClose, triggerRef]);

  // Ensure default recent emojis persist for first-time users or invalid storage
  useEffect(() => {
    try {
      if (typeof window === "undefined") return;
      const raw = window.localStorage.getItem(RECENT_KEY);
      const parsed = raw ? JSON.parse(raw) : null;
      const valid =
        Array.isArray(parsed) &&
        parsed.length > 0 &&
        parsed.every((e: any) => typeof e === "string");
      if (!valid) {
        window.localStorage.setItem(
          RECENT_KEY,
          JSON.stringify(defaultFrequent)
        );
        setRecent(defaultFrequent);
      }
    } catch {
      // localStorage 접근 불가 환경(Private Browsing 등)에서는 무시
    }
  }, []);

  const recentTop5 = useMemo(() => {
    const base = Array.isArray(recent) ? recent : [];
    const fallback = defaultFrequent.filter((e) => !base.includes(e));
    return [...base, ...fallback].slice(0, 5);
  }, [recent]);

  if (!isOpen) return null;

  const handleEmojiClick = (emoji: string) => {
    onEmojiSelect(emoji);
    try {
      setRecent((prev) => {
        const next = [emoji, ...prev.filter((e) => e !== emoji)].slice(0, 10);
        try {
          window.localStorage.setItem(RECENT_KEY, JSON.stringify(next));
        } catch {
          // localStorage 접근 불가 환경(Private Browsing 등)에서는 무시
        }
        return next;
      });
    } catch {
      // 상태 업데이트 실패 시 무시 (이모지 선택에는 영향 없음)
    }
    onClose();
  };

  const currentEmojis = emojiCategories.smileys;

  // Compact mode UI (pill with up to 5 recent + expand arrow)
  if (mode === "compact") {
    return (
      <div
        ref={pickerRef}
        className="fixed z-50 bg-white dark:bg-neutral-20 border border-gray-200 dark:border-neutral-30 rounded-full shadow-md px-2 py-1"
        style={{
          left: position?.x || 0,
          top: position?.y || 0,
          transform: "translateY(-100%)",
        }}
      >
        <div className="flex items-center gap-1">
          {recentTop5.map((emoji, idx) => (
            <button
              key={idx}
              onClick={() => handleEmojiClick(emoji)}
              className="cursor-pointer w-8 h-8 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-neutral-30 rounded text-lg"
            >
              {emoji}
            </button>
          ))}
          <LocalIconTooltip label="더보기">
            <button
              onClick={() => onToggleMode?.("full")}
              className="cursor-pointer w-8 h-8 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-neutral-30 rounded text-gray-500 dark:text-neutral-60"
              aria-label="expand-emoji"
            >
              <svg
                width="26"
                height="26"
                viewBox="0 0 26 26"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <rect
                  x="0.5"
                  y="0.5"
                  width="25"
                  height="25"
                  rx="12.5"
                  className="fill-white dark:fill-neutral-20"
                />
                <rect
                  x="0.5"
                  y="0.5"
                  width="25"
                  height="25"
                  rx="12.5"
                  className="stroke-[#E2E2E2] dark:stroke-neutral-30"
                />
                <path
                  d="M17.6667 11L13 15.6667L8.33337 11"
                  className="stroke-[#B0B0B0] dark:stroke-neutral-60"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </LocalIconTooltip>
        </div>
      </div>
    );
  }

  // Full picker UI (existing)
  return (
    <div
      ref={pickerRef}
      className="fixed z-50 bg-white dark:bg-neutral-20 border border-gray-200 dark:border-neutral-30 rounded-lg shadow-lg"
      style={{
        width: "216px",
        height: "282px",
        left: position?.x || 0,
        top: position?.y || 0,
        transform: "translateY(-100%)",
      }}
    >
      {/* 상단 자주 사용되는 이모지 */}
      <div className="p-2 border-b border-gray-100 dark:border-neutral-30">
        <div className="flex gap-1">
          {recentTop5.map((emoji, index) => (
            <button
              key={index}
              onClick={() => handleEmojiClick(emoji)}
              className="cursor-pointer w-8 h-8 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-neutral-30 rounded text-lg"
            >
              {emoji}
            </button>
          ))}
          <LocalIconTooltip label="접기">
            <button
              onClick={() => onToggleMode?.("compact")}
              className="cursor-pointer w-8 h-8 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-neutral-30 rounded text-gray-500 dark:text-neutral-60"
              aria-label="collapse-emoji"
            >
              <svg
                width="26"
                height="26"
                viewBox="0 0 26 26"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <rect
                  x="-0.5"
                  y="0.5"
                  width="25"
                  height="25"
                  rx="12.5"
                  transform="matrix(1 0 0 -1 1 26)"
                  className="fill-white dark:fill-neutral-20"
                />
                <rect
                  x="-0.5"
                  y="0.5"
                  width="25"
                  height="25"
                  rx="12.5"
                  transform="matrix(1 0 0 -1 1 26)"
                  className="stroke-[#E2E2E2] dark:stroke-neutral-30"
                />
                <path
                  d="M17.6666 15L12.9999 10.3333L8.33325 15"
                  className="stroke-[#B0B0B0] dark:stroke-neutral-60"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </LocalIconTooltip>
        </div>
      </div>

      {/* 이모지 그리드 */}
      <div className="p-2 h-[216px] overflow-y-auto">
        <div className="grid grid-cols-6 gap-1">
          {currentEmojis.map((emoji, index) => (
            <button
              key={index}
              onClick={() => handleEmojiClick(emoji)}
              className="cursor-pointer w-8 h-8 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-neutral-30 rounded text-lg"
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
