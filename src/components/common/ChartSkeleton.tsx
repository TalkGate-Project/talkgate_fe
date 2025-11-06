"use client";

type ChartSkeletonProps = {
  rows?: number;
  className?: string;
};

export default function ChartSkeleton({ rows = 3, className }: ChartSkeletonProps) {
  return (
    <div className={`flex h-full flex-col justify-center gap-3 ${className ?? ""}`}>
      {Array.from({ length: rows }).map((_, idx) => (
        <div key={idx} className="mx-6 h-8 animate-pulse rounded bg-neutral-20" />
      ))}
    </div>
  );
}


