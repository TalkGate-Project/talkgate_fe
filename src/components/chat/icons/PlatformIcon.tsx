type Props = {
  platform?: string;
};

export default function PlatformIcon({ platform }: Props) {
  const iconMap: Record<string, string> = {
    telegram: "/icons/platform/telegram.png",
    instagram: "/icons/platform/instagram.png",
    line: "/icons/platform/line.png",
    kakao: "/icons/platform/kakao.png",
    facebook: "/icons/platform/facebook.png",
    x: "/icons/platform/x.png",
  };

  const iconPath = platform ? iconMap[platform] : null;

  if (!iconPath) {
    return (
      <div className="w-5 h-5 rounded-full bg-neutral-20 grid place-items-center text-[12px] text-neutral-70">
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

