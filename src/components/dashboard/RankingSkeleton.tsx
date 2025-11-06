export default function RankingSkeleton() {
  return (
    <div className="flex h-[240px] flex-col justify-center gap-3">
      {Array.from({ length: 5 }).map((_, idx) => (
        <div key={idx} className="mx-2 flex items-center justify-between gap-3">
          <span className="h-6 w-6 rounded-full bg-neutral-20" />
          <span className="flex-1 h-5 rounded bg-neutral-20" />
          <span className="h-5 w-20 rounded bg-neutral-20" />
        </div>
      ))}
    </div>
  );
}


