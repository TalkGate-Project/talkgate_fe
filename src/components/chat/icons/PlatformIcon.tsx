type Props = {
  platform?: string;
};

export default function PlatformIcon({ platform }: Props) {
  const iconMap: Record<string, string> = {
    telegram: "/icons/platform/telegram.webp",
    instagram: "/icons/platform/instagram.webp",
    line: "/icons/platform/line.webp",
    kakao: "/icons/platform/kakao.webp",
    facebook: "/icons/platform/facebook.webp",
    x: "/icons/platform/x.webp",
  };

  const iconPath = platform ? iconMap[platform] : null;

  if (!iconPath) {
    return (
      <div className="w-4 h-4 rounded-full bg-neutral-20 grid place-items-center text-[12px] text-neutral-70">
        {platform?.slice(0, 1)?.toUpperCase() || "?"}
      </div>
    );
  }

  return (
    <div className="w-5 h-5 rounded flex items-center justify-center">
      <img src={iconPath} alt={platform} className="w-full h-full object-contain" />
    </div>
  );
}

