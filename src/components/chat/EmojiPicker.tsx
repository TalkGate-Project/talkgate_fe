"use client";

import { useState, useRef, useEffect, useMemo } from "react";

interface EmojiPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onEmojiSelect: (emoji: string) => void;
  position?: { x: number; y: number };
  mode?: "compact" | "full";
  onToggleMode?: (mode: "compact" | "full") => void;
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

export default function EmojiPicker({
  isOpen,
  onClose,
  onEmojiSelect,
  position,
  mode = "full",
  onToggleMode,
}: EmojiPickerProps) {
  const [selectedCategory, setSelectedCategory] =
    useState<keyof typeof emojiCategories>("smileys");
  const [recent, setRecent] = useState<string[]>(() => {
    try {
      const raw =
        typeof window !== "undefined"
          ? window.localStorage.getItem(RECENT_KEY)
          : null;
      const list = raw ? JSON.parse(raw) : [];
      if (Array.isArray(list) && list.every((e) => typeof e === "string"))
        return list as string[];
    } catch {}
    return defaultFrequent;
  });
  const pickerRef = useRef<HTMLDivElement>(null);

  // 외부 클릭 시 닫기
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        pickerRef.current &&
        !pickerRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen, onClose]);

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
    } catch {}
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
        } catch {}
        return next;
      });
    } catch {}
    onClose();
  };

  const currentEmojis = emojiCategories[selectedCategory];

  // Compact mode UI (pill with up to 5 recent + expand arrow)
  if (mode === "compact") {
    return (
      <div
        ref={pickerRef}
        className="fixed z-50 bg-white border border-gray-200 rounded-full shadow-md px-2 py-1"
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
              className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded-full text-lg"
            >
              {emoji}
            </button>
          ))}
          <button
            onClick={() => onToggleMode?.("full")}
            className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded-full text-gray-500"
            aria-label="expand-emoji"
            title="더보기"
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
                fill="white"
              />
              <rect
                x="0.5"
                y="0.5"
                width="25"
                height="25"
                rx="12.5"
                stroke="#E2E2E2"
              />
              <path
                d="M17.6667 11L13 15.6667L8.33337 11"
                stroke="#B0B0B0"
                stroke-width="1.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </button>
        </div>
      </div>
    );
  }

  // Full picker UI (existing)
  return (
    <div
      ref={pickerRef}
      className="fixed z-50 bg-white border border-gray-200 rounded-lg shadow-lg"
      style={{
        width: "216px",
        height: "282px",
        left: position?.x || 0,
        top: position?.y || 0,
        transform: "translateY(-100%)",
      }}
    >
      {/* 상단 자주 사용되는 이모지 */}
      <div className="p-2 border-b border-gray-100">
        <div className="flex gap-1">
          {recentTop5.map((emoji, index) => (
            <button
              key={index}
              onClick={() => handleEmojiClick(emoji)}
              className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded text-lg"
            >
              {emoji}
            </button>
          ))}
          <button
            onClick={() => onToggleMode?.("compact")}
            className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded text-gray-500"
            aria-label="collapse-emoji"
            title="접기"
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
                fill="white"
              />
              <rect
                x="-0.5"
                y="0.5"
                width="25"
                height="25"
                rx="12.5"
                transform="matrix(1 0 0 -1 1 26)"
                stroke="#E2E2E2"
              />
              <path
                d="M17.6666 15L12.9999 10.3333L8.33325 15"
                stroke="#B0B0B0"
                stroke-width="1.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* 이모지 그리드 */}
      <div className="p-2 h-[216px] overflow-y-auto">
        <div className="grid grid-cols-6 gap-1">
          {currentEmojis.map((emoji, index) => (
            <button
              key={index}
              onClick={() => handleEmojiClick(emoji)}
              className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded text-lg"
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
