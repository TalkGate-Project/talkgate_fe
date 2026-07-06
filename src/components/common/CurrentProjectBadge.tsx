"use client";

type CurrentProjectBadgeProps = {
  projectName?: string | null;
  projectLogoUrl?: string | null;
  loading?: boolean;
  className?: string;
};

export default function CurrentProjectBadge({
  projectName,
  projectLogoUrl,
  loading = false,
  className = "",
}: CurrentProjectBadgeProps) {
  const safeProjectName = projectName?.trim() || "-";
  const fallbackInitial = safeProjectName.charAt(0).toUpperCase() || "-";

  return (
    <div className={`flex min-w-0 max-w-full items-center gap-3 overflow-hidden ${className}`.trim()}>
      {loading ? (
        <>
          <div className="w-5 h-5 rounded-full bg-neutral-20 animate-pulse flex-shrink-0" />
          <div className="h-4 w-24 max-w-full flex-1 rounded bg-neutral-20 animate-pulse" />
        </>
      ) : projectLogoUrl ? (
        <>
          <img
            src={projectLogoUrl}
            alt={`${safeProjectName} 로고`}
            width={20}
            height={20}
            className="w-5 h-5 rounded-full object-cover flex-shrink-0"
          />
          <p className="min-w-0 flex-1 truncate text-[14px] text-neutral-60">{safeProjectName}</p>
        </>
      ) : (
        <>
          <div className="w-5 h-5 rounded-full bg-neutral-20 dark:bg-neutral-20 flex-shrink-0 grid place-items-center">
            <span className="text-[10px] font-semibold text-neutral-70">{fallbackInitial}</span>
          </div>
          <p className="min-w-0 flex-1 truncate text-[14px] text-neutral-60">{safeProjectName}</p>
        </>
      )}
    </div>
  );
}
