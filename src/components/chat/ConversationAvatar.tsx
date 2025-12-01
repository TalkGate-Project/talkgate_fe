"use client";

import Image from "next/image";

type AvatarVariant = "primary" | "gray";

type Props = {
  name: string;
  profileUrl?: string | null;
  size?: "sm" | "md" | "lg";
  variant?: AvatarVariant;
  className?: string;
};

// 두 가지 스타일만 지원
const variantClasses: Record<AvatarVariant, string> = {
  primary: "bg-primary-10 text-primary-60 dark:bg-[#D6FAE833]", // #D6FAE8 배경, 녹색 텍스트 (다크모드: #D6FAE833)
  gray: "bg-neutral-20 text-neutral-60",    // 회색 배경, 회색 텍스트
};

// 이름에서 표시할 글자 추출 (한글/영문 첫 글자)
const getInitial = (name: string): string => {
  if (!name) return "?";
  const trimmed = name.trim();
  if (!trimmed) return "?";
  return trimmed[0].toUpperCase();
};

const sizeClasses = {
  sm: "w-8 h-8 text-[14px]",
  md: "w-10 h-10 text-[16px]",
  lg: "w-12 h-12 text-[18px]",
};

export default function ConversationAvatar({
  name,
  profileUrl,
  size = "md",
  variant = "primary",
  className = "",
}: Props) {
  const sizeClass = sizeClasses[size];
  const initial = getInitial(name);
  const variantClass = variantClasses[variant];

  if (profileUrl) {
    return (
      <div
        className={`${sizeClass} rounded-full overflow-hidden flex-shrink-0 ${className}`}
      >
        <Image
          src={profileUrl}
          alt={name}
          width={48}
          height={48}
          className="w-full h-full object-cover"
          unoptimized
        />
      </div>
    );
  }

  return (
    <div
      className={`${sizeClass} rounded-full flex-shrink-0 grid place-items-center font-semibold ${variantClass} ${className}`}
    >
      {initial}
    </div>
  );
}

