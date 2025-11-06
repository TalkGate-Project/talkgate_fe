"use client";

export default function ScheduleSkeleton() {
  return (
    <div className="flex h-[240px] flex-col justify-center gap-3">
      {Array.from({ length: 4 }).map((_, idx) => (
        <div key={idx} className="flex items-center gap-4">
          <span className="h-4 w-4 rounded-full bg-neutral-20" />
          <span className="h-5 w-16 rounded bg-neutral-20" />
          <span className="h-5 flex-1 rounded bg-neutral-20" />
        </div>
      ))}
    </div>
  );
}


