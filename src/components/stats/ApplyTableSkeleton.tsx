type ApplyTableSkeletonProps = {
  rows: number;
};

export default function ApplyTableSkeleton({ rows }: ApplyTableSkeletonProps) {
  return (
    <div className="space-y-0">
      {Array.from({ length: rows }).map((_, idx) => (
        <div key={idx} className="grid grid-cols-5 px-4 py-3 border-b border-neutral-30">
          {Array.from({ length: 5 }).map((__, colIdx) => (
            <div key={colIdx} className="h-4 w-full rounded bg-neutral-20 animate-pulse" />
          ))}
        </div>
      ))}
    </div>
  );
}

